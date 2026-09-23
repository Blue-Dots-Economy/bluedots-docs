---
title: AWS Deployment
description: Deploy the Blue Dots Helm charts onto a provisioned AWS EKS cluster, in the required order, and validate the result.
sidebar:
  order: 2
---

This is the second of two steps to run Blue Dots in the cloud. It assumes [AWS Infrastructure Setup](/guides/installation/cloud-setup/aws/infrastructure/) is already done and `bash install.sh preflight` passes — this page installs the application charts onto that infrastructure.

For the architecture behind this flow, see [Infrastructure & Deployment Architecture](/core-concepts/architecture/infrastructure/); for how images get built and pinned, see [CI/CD & Build Pipeline](/guides/cicd-and-builds/).

## 1. Deploy everything except the Aggregator

```bash
cd opentofu/aws/<env>

# if any image is private:
export IMAGES_PUBLIC=false
export GHCR_PAT=ghp_xxxxxxxxxxxx     # read:packages

bash install.sh create_namespaces_and_secrets
bash install.sh deploy_monitoring
bash install.sh deploy_common_services    # Kong + cert-manager + Postgres + Redis
bash install.sh deploy_keycloak
bash install.sh deploy_signals
```

Do not reorder these. `keycloak` needs the database `common-services` creates; `signals` needs `keycloak`. Each `deploy_*` runs `helm upgrade --install … --wait`, so it blocks until that release's own pods are Ready — it does **not** check cross-namespace dependencies, so confirm common-services Postgres/Redis are Ready before continuing:

```bash
kubectl -n common-services get pods,pvc
```

The Aggregator deploys last on purpose — it needs one value that only exists once Signals is up.

## 2. Set `actingOrgId`, then deploy the Aggregator

Aggregator will not let anyone log in until this is set — it fails with `SIGNALSTACK_ORG_NOT_REGISTERED`.

```bash
ORG_ID=$(./get-signalstack-org-id.sh)
echo "$ORG_ID"          # e.g. org_59102d50-...
```

Set the result in `global-values.yaml`:

```yaml
global:
  signalstack:
    actingOrgId: "<ORG_ID>"
```

Then deploy the Aggregator:

```bash
bash install.sh deploy_aggregator
```

Keycloak serves **both** verticals from the shared realm, so Signals logins depend on it too — realm import and admin bootstrap are covered in [Keycloak Setup](/guides/keycloak-setup/).

:::tip[One command instead]
`bash install.sh deploy_all_services` runs all five releases in order, including the Aggregator, with no pause for `actingOrgId`. It comes up healthy, but Aggregator logins fail until you complete step 2 and re-run `bash install.sh deploy_aggregator`.
:::

## 3. Point DNS

```bash
kubectl -n common-services get svc common-services-kong-proxy \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Create a CNAME for each public hostname in `global-values.yaml` pointing at that address. TLS certificates issue automatically once DNS resolves — Let's Encrypt has to reach your hostname to verify it, so certificates stay pending until DNS is live.

## 4. Validate

```bash
helm list -A                          # all five releases deployed
kubectl get pods -A                   # everything Running/Ready
kubectl get certificate -A            # READY=True once ACME completes
curl -sI https://<your-signals-host>/ | head -1

# aggregator login works — fails with SIGNALSTACK_ORG_NOT_REGISTERED if step 2 was skipped
```

## Changing configuration later

Two more change classes, alongside [infrastructure changes](/guides/installation/cloud-setup/aws/infrastructure/#changing-infrastructure-later):

| | 1. App setting | 2. Secret |
|---|---|---|
| **Examples** | SMTP host/port, rate limits, support email, feature toggles | mail password, MSG91 key, Google Maps key, Discord webhook |
| **Edit** | `global-values.yaml` | `secrets.yaml` |
| **Then run** | `deploy_<release>` | `apply_tf_output_file` → `deploy_<release>` |

`deploy_*` only ever reads the generated `global-secrets.yaml`, never `secrets.yaml` directly — editing a secret without running `apply_tf_output_file` first changes nothing.

### Worked example: change the SMTP mailbox

A good first example, because it spans both classes: the mailbox host/user is plain config, the password is a secret.

```yaml
# global-values.yaml — plain config
_smtp_host:         &smtp_host         "smtp.gmail.com"
_smtp_port:         &smtp_port         587
_smtp_user:         &smtp_user         "noreply@yourdomain.org"
_smtp_from_display: &smtp_from_display "Blue Dots"
```

```yaml
# secrets.yaml — the password
smtp_password: "your-app-password-here"
```

```bash
bash install.sh apply_tf_output_file       # regenerates global-secrets.yaml, touches no AWS resources
```

One mailbox, **four** consumers — redeploy all of them:

```bash
bash install.sh deploy_signals deploy_aggregator deploy_keycloak deploy_monitoring
```

Don't assume it worked — confirm the new value actually arrived, then confirm a real send:

```bash
# the new address reached the cluster
SEC=$(kubectl -n signals get secret -o name | grep notification | head -1)
kubectl -n signals get "$SEC" -o jsonpath='{.data.SMTP_USER}' | base64 -d; echo

# nothing crashed on the new config
kubectl -n signals get pods

# watch the logs while you trigger a real email (e.g. request a login OTP)
kubectl -n signals logs -l app.kubernetes.io/component=notification-service -f --tail=50
```

An accepted/queued message means it worked. An SMTP `535` or `Invalid login` means the password, not the host.

### More changes

**Class 1 — app settings:**

| Change | Edit in `global-values.yaml` | Then run |
|---|---|---|
| Support email | `support_email` | `deploy_signals deploy_aggregator` |
| Admin emails | `_aggregator_admin_emails` | `deploy_aggregator` |
| API rate limits | `_api_rate_limit_*` | `deploy_signals deploy_aggregator` |
| OTP rate limits | `_otp_rate_limit_*`, `_signals_otp_per_minute` | `deploy_signals deploy_keycloak` |
| Public hostnames | `_signals_public_hosts`, `_aggregator_host` | `apply_tf_output_file` then `deploy_signals deploy_aggregator` |
| Image tags | the service's key in `global-images.yaml` (per-environment) | the matching `deploy_*` |
| Replica count / CPU / memory / autoscaling | the service's key in `helm/global-resources.yaml` | the matching `deploy_*` |


**Class 2 — secrets** (all follow edit `secrets.yaml` → `apply_tf_output_file` → redeploy):

| Secret | Redeploy |
|---|---|
| `smtp_password` | `deploy_signals deploy_aggregator deploy_keycloak deploy_monitoring` |
| `msg91_auth_key`, `msg91_template_id` | `deploy_signals deploy_aggregator` |
| `google_maps_api_key`, `google_geocoding_api_key` | `deploy_signals` |
| `discord_*_webhook` | `deploy_monitoring` |

### Roll back

```bash
helm -n signals history signals          # find the last good REVISION
helm -n signals rollback signals <N>
```

Then revert the source edit in `global-values.yaml` / `secrets.yaml` — otherwise the next deploy reapplies the change you just rolled back.

## Teardown

```bash
bash install.sh cleanup_all_services       # helm releases + namespaces, reverse order
bash install.sh destroy_tf_resources       # terragrunt run --all destroy (needs AWS creds)
```

:::danger
Deleting the `common-services` namespace deletes its Postgres + Redis PVCs — the underlying EBS volumes and all data are destroyed. Back up first.
:::
