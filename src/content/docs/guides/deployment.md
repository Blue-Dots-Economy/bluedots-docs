---
title: Deployment
description: Provision AWS infrastructure and deploy the Blue Dots stack with OpenTofu/Terragrunt + Helm, plus deploying this docs site.
sidebar:
  order: 10
---

Deployment has two scopes that should not be confused:

- **Local app development** — running an app repo (Signals or Aggregator) on your machine for development. Covered in the [Installation](/guides/installation/local-stack/) guides.
- **Cloud deployment** — standing up the full stack on **AWS EKS** from the `bluedots-automation` repository. That is what this page covers.

For the architecture behind this flow, see [Infrastructure & Deployment Architecture](/core-concepts/architecture/infrastructure/); for how images get built and pinned, see [CI/CD & Build Pipeline](/guides/cicd-and-builds/).

## Prerequisites

| Tool | Minimum | Purpose |
| --- | --- | --- |
| `aws` CLI | 2.x | AWS auth/STS, EKS kubeconfig |
| `tofu` (OpenTofu) | ≥ 1.6 | provision cloud resources |
| `terragrunt` | ≥ 0.90 | wraps tofu; per-module state |
| `kubectl` | ≥ 1.24 | talk to EKS |
| `helm` | ≥ 3.12 | install the charts |
| `bash`, `git` | 4.x / 2.x | run `install.sh`, clone |

Also required: an **AWS account** that can create VPC/EKS/IAM/S3 (plus an S3 bucket for OpenTofu remote state), a **GitHub PAT** with `read:packages` (`GHCR_PAT`) to pull images from GHCR, and **DNS control** for the public hostnames.

`yq` and a Makefile are **not** used — `opentofu/aws/<env>/install.sh` is the single entrypoint for both infrastructure and Helm.

## 1. Provision infrastructure

```bash
# pick / create an environment (template/ is the reference)
cp -R opentofu/aws/template opentofu/aws/<env>
cd opentofu/aws/<env>

# authenticate and confirm identity
aws sso login                  # or export static keys
aws sts get-caller-identity    # must succeed

# review environment inputs (region, EKS sizing, hosts, network, SMTP/SMS)
$EDITOR global-values.yaml

# one-shot infra bootstrap:
#   create_tf_backend → backup_configs → create_tf_resources → apply_gp3_default_sc
bash install.sh
```

This creates the remote-state bucket, runs `terragrunt run --all apply` (network → eks → iam → storage → random_passwords → output-file), writes the EKS kubeconfig, makes `gp3` the default StorageClass, and generates the three per-chart values files into the env directory.

Validate:

```bash
kubectl config current-context     # the new cluster
kubectl get nodes                  # Ready
kubectl get sc                     # gp3 (default)
ls common-services-values.yaml signals-values.yaml aggregator-values.yaml
bash install.sh preflight          # tooling + cluster + values files
```

## 2. Set required values

Some values are not auto-generated. Edit `global-values.yaml` **before** the final `terragrunt apply` (hosts, network), and the generated `signals-values.yaml` / `aggregator-values.yaml` **after** they're written but before deploy (Google Maps key, SMTP user/app-password, MSG91 keys, OpenAI key, admin emails).

:::caution
Re-running `terragrunt apply` on the `output-file` unit **overwrites** the generated values files. Set manual values after your final apply, or bake them into the module `.tfpl` templates.
:::

The aggregator's `global.signalstack.actingOrgId` is a **post-Signals** step — see step 4.

## 3. Deploy the stack

Deploy in strict dependency order. Either run the whole stack at once, or step through it gating on health.

```bash
export GHCR_PAT=ghp_xxxxxxxxxxxx     # read:packages

# optional static checks (install nothing)
bash install.sh lint
bash install.sh dry_run

# full ordered deploy
bash install.sh deploy_all_services
```

`deploy_all_services` chains: `preflight → create_namespaces_and_secrets → deploy_monitoring → deploy_common_services → deploy_signals → deploy_aggregator → fix_acme_issuer_uri`.

Step-by-step equivalent (inspect health between releases):

```bash
bash install.sh create_namespaces_and_secrets
bash install.sh deploy_common_services    # Kong + cert-manager + Postgres + Redis
kubectl -n common-services get pods,pvc    # confirm Ready + bound BEFORE continuing
bash install.sh deploy_signals
bash install.sh deploy_aggregator          # Keycloak init runs after Postgres — slowest
```

Each `deploy_*` runs `helm upgrade --install … --wait`, so it blocks until that release's pods are Ready. It does **not** check cross-namespace dependencies — confirm common-services Postgres/Redis are Ready yourself before deploying Signals/Aggregator.

## 4. Set actingOrgId (after Signals)

```bash
cd opentofu/aws/<env>
ORG_ID=$(./get-signalstack-org-id.sh)      # network_service org id from the seeded DB
# set in aggregator-values.yaml:
#   global:
#     signalstack:
#       actingOrgId: "<ORG_ID>"
bash install.sh deploy_aggregator          # redeploy with the value set
```

Without it, aggregator login fails with `SIGNALSTACK_ORG_NOT_REGISTERED`.

## 5. Validate & point DNS

```bash
helm list -A                               # monitoring, common-services, signals, aggregator = deployed
kubectl get ingress -A                     # hosts match global-values.yaml
kubectl get clusterissuer letsencrypt-prod
kubectl get certificate -A                 # READY=True once ACME completes

# the Kong proxy LoadBalancer hostname to point DNS at:
kubectl -n common-services get svc common-services-kong-proxy
```

Point A/CNAME records for the signals API, signals UI and aggregator hosts at the **Kong proxy** LoadBalancer. Once DNS resolves and certs are `READY=True`, the public URLs are live.

## 6. Teardown

```bash
bash install.sh cleanup_all_services       # helm releases + namespaces, reverse order
bash install.sh destroy_tf_resources       # terragrunt run --all destroy (needs AWS creds)
```

:::danger
Deleting the `common-services` namespace deletes its Postgres + Redis PVCs (gp3 `reclaimPolicy: Delete`) — the EBS volumes and all data are destroyed. Back up first.
:::

## Deploying this documentation site

This site is **Astro + Starlight**, deployed to **GitHub Pages** via GitHub Actions.

### One-time GitHub setup

1. Push the `bluedots-docs` project to a repository.
2. In **Settings → Pages**, set **Source = GitHub Actions**.
3. Confirm `astro.config.mjs` has the right `site` (no `base` needed for a custom domain):
   ```js
   site: 'https://docs.bluedotseconomy.org',
   ```
   A `public/CNAME` file pins the custom domain across deploys. If instead deploying to a GitHub Pages project URL (`<org>.github.io/<repo>`), set `site` to that origin and add `base: '/<repo>'`.

### Domains and the legacy redirect

The canonical host is **`docs.bluedotseconomy.org`**. The earlier host `docs-signals-dpg.bluedotseconomy.org` still resolves and redirects to the same path on the canonical host, so old links keep working.

GitHub Pages allows only one custom domain per repository and cannot issue redirects for extra hostnames, so the legacy host is served by a small separate Pages repository containing nothing but a path-preserving redirect page. Both hostnames are GoDaddy `CNAME` records pointing at `blue-dots-economy.github.io`; Pages routes each one to the repository that claims it.

### The workflow

The bundled workflow at `.github/workflows/deploy.yml` builds with the official `withastro/action` and publishes on every push to `main`. After the first successful run, the site is live at the configured URL.

### Local preview

```bash
pnpm install
pnpm dev        # local dev server (under /)
pnpm build      # production build to dist/
pnpm preview    # preview the production build
```
