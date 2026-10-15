---
title: AWS Infrastructure Setup
description: Provision the AWS EKS cluster, database and storage for a Blue Dots deployment with OpenTofu/Terragrunt, and set which domain it runs.
sidebar:
  attrs:
    class: bd-changed
  order: 1
changed_sections:
  - _top
  - 2-fill-in-global-valuesyaml
  - choose-the-domain
  - 3-fill-in-secretsyaml
  - managed-postgres-rds-vs-in-cluster
  - what-goes-in-secretsyaml
---

First of two steps to run Blue Dots in the cloud: standing up the infrastructure. Then [AWS Deployment](/deploy/cloud/aws-deployment/) installs the application charts onto it.

## Prerequisites

| Tool | Minimum | Purpose |
| --- | --- | --- |
| `bash`, `git` | 4.x / 2.x | run `install.sh`, clone |
| `aws` CLI | 2.x | AWS auth/STS, EKS kubeconfig |
| `tofu` (OpenTofu) | ≥ 1.10 | provision cloud resources; S3 state locking needs 1.10+ |
| `terragrunt` | ≥ 0.90 | wraps tofu; per-module state |
| `kubectl` | ≥ 1.24 | talk to EKS |
| `helm` | ≥ 3.12 | install the charts |
| `yq` | v4 | `create_tf_backend` reads `global-values.yaml`'s anchors |
| `jq` | ≥ 1.6 | validates fetched config JSON during deploy |

Also required: **AWS credentials** that can create VPC/EKS/IAM/S3/RDS resources, **DNS control** for the public hostnames you plan to serve, a **GHCR token** (`read:packages`) if any image is private, and **SMTP credentials** for outbound email.

## 1. Get the code and pick your environment

```bash
git clone https://github.com/Blue-Dots-Economy/bluedots-automation.git
cd bluedots-automation
```

Every deployment gets its **own directory** under `opentofu/aws/`, created by copying the template:

```bash
cp -R opentofu/aws/template opentofu/aws/<env>
cd opentofu/aws/<env>
```

The directory name is **not** the same thing as the `_environment` anchor you set next — the directory can be named anything (e.g. `purple-dots-prod`), while `_environment` is the short value (`dev`/`stg`/`prod`) that actually appears in AWS resource names.

:::caution
Run every command in this guide from inside that directory — `install.sh` reads the files next to it, so running it from anywhere else will not work.
:::

## 2. Fill in `global-values.yaml`

This one file holds all non-secret settings — cluster size, hostnames, email, feature toggles. **Only edit the block of anchors at the very top of the file**; everything further down references them:

```yaml
_building_block: &building_block "acme"          # your org/product slug
_environment:    &environment    "prod"          # dev | stg | prod
_cloud_storage_region: &cloud_storage_region "ap-south-1"
```

The three above decide every AWS resource name, so set them first and don't change them later. Then work down the anchor block for hostnames, SMTP, domain and brand — each anchor has a comment above it.

### Choose the domain

A deployment runs one domain (the code calls a domain a *network*). Three anchors in the same top block set it:

```yaml
_signals_served_domains: &signals_served_domains "blue_dot/provider,blue_dot/seeker"
_network: &network "blue_dot"
_brand:   &brand   ""
```

- `_network` is the domain folder name under `examples/schemas/` in the Signals DPG repository (and under `config/` in the Aggregator). The default `blue_dot` is the jobs domain; `purple_dot` and `orange_dot` are set the same way. The list of domains is on [Domains, Participant Types & Instances](/about/key-concepts/networks-domains-instances/).
- `_signals_served_domains` lists `<network-id>/<domain>` pairs, where each `<domain>` is a participant type. The domain id is the `id` in that folder's `network.json`. It matches the folder name for every domain except the Yellow Dot (education) domain, so read Yellow's id from its `network.json`.
- `_brand` is an optional brand sub-folder of the domain (its own logo and copy). Leave it `""` for none. A brand does not change the domain.

The Signals API, the Signals UI, the consent text and the Aggregator all read these anchors, so set them once here.

Infrastructure sizing (node type, VPC CIDR, Pritunl/bastion access, database size) lives further down in this same file, not in the top anchor block. See [Configuration reference](#configuration-reference-sizing-zones-and-access) below.

:::caution
`_environment` must be **1–9 lowercase letters/digits**, no hyphens. `prod` and `dev2` are fine; `production` and `pre-prod` are rejected.
:::

## 3. Fill in `secrets.yaml`

Credentials that cannot be generated (a mail password, a maps API key) live in a separate file that is **never committed**:

```bash
cp secrets.example.yaml secrets.yaml
```

Open it and replace each `UPDATE_THIS_VALUE` you actually need — the comments say which service uses each one. Leave the ones you don't use as `UPDATE_THIS_VALUE`; they render through harmlessly and only matter to the service that reads them. See [What goes in `secrets.yaml`](#what-goes-in-secretsyaml) below for the full list.

:::note[Golden rule]
You only ever edit **two** files by hand — `global-values.yaml` (settings, step 2) and `secrets.yaml` (credentials, this step). Everything else from here on is generated; editing a generated file wastes your time, since the next deploy overwrites it.
:::

## 4. Authenticate and provision

Get a live AWS session first, either way:

```bash
aws configure                    # static access keys, or
aws sso login                    # SSO, if your org uses it

aws sts get-caller-identity      # must succeed before continuing
```

Then provision:

```bash
# 1. create the remote-state bucket
bash install.sh create_tf_backend

# 2. create the AWS resources — VPC, EKS, IAM, storage, RDS (20-30 minutes)
bash install.sh create_tf_resources
```

Before step 2 finishes, read the summary step 1 printed and confirm the building block, environment, region and account are what you expect.

Step 2 also **generates the two files the deploy needs**, `global-cloud-values.yaml` (bucket name, database endpoint, IAM role ARNs) and `global-secrets.yaml` (every password and API key). Never hand-edit either — they're rebuilt from `global-values.yaml` + `secrets.yaml` every time you run `bash install.sh apply_tf_output_file`.

`apply_default_sc` (next) makes a StorageClass the cluster default — it defaults to `gp3` (AWS). **If you want a different class**, set `STORAGE_CLASS_TYPE` at the top of `install.sh` before running this; leave it as-is on AWS.

```bash
# 3. make a StorageClass the cluster default
bash install.sh apply_default_sc
```

:::note[Not on AWS?]
`apply_default_sc` can only *create* `gp3` (AWS-specific). On another platform, `STORAGE_CLASS_TYPE` must name a class that platform already provides.
:::

### Managed Postgres (RDS) vs in-cluster

Step 2 also provisions a managed **RDS PostgreSQL** instance, and once it exists every chart's database connection is pointed at it automatically. That is what makes `global-cloud-values.yaml`'s generated `postgres.host` values matter. An in-cluster Postgres pod is also deployed alongside it (`postgresql.enabled: true` in `global-images.yaml`), kept for reference/rollback, but with RDS present it sits unused — there is no supported `global-values.yaml` toggle today to skip RDS and run on the in-cluster pod only. RDS sizing (`rds_instance_class`, `rds_allocated_storage`, `rds_multi_az`, …) is in the [Configuration reference](#configuration-reference-sizing-zones-and-access) below.

### Cluster backups (AWS Backup)

Step 2 also applies the **`backup`** module, turning on AWS Backup for the cluster — Kubernetes objects plus every disk the pods use (via the EBS/EFS/S3 CSI driver), captured together on a schedule. It's on by default (`backup_enabled: true`) and the template ships these settings:

| Setting | Template default |
|---|---|
| `backup_schedule` | daily, `cron(30 18 ? * * *)` (00:00 IST) |
| `backup_retention_days` | 30 |
| Vault lock | governance mode, bounded by `backup_min_retention_days` (7) / `backup_max_retention_days` (35) |

To apply or re-apply just this module: `bash install.sh plan_tf_backup` → `bash install.sh apply_tf_backup`.

:::note
This does not cover the managed RDS database — RDS keeps its own backups (`rds_backup_retention_days`). Only disks through the EBS/EFS/S3 CSI driver are captured.
:::

**Restoring is always a manual step**, done with the scripts in `opentofu/aws/<env>/aws-backup-scripts/`. The basic flow:

```bash
cd opentofu/aws/<env>/aws-backup-scripts

./trigger-backup.sh                  # on-demand backup, if you don't want to wait for the schedule
./list-recovery-points.sh --latest   # find the recovery point to restore

# EBS volumes are AZ-locked — get the target cluster's AZ first
kubectl get nodes -o jsonpath='{.items[0].metadata.labels.topology\.kubernetes\.io/zone}'

./trigger-restore.sh --target-cluster <name> --az <az>   # asks you to type `yes`; refuses to run non-interactively
./restore-status.sh <RestoreJobId> --watch

export KUBECONFIG=/path/to/target-cluster-kubeconfig.yaml
./verify-restore.sh                  # pod/PVC health on whatever cluster KUBECONFIG points at
```

That's enough for a first restore, but **read [`aws-backup-scripts/README.md`](https://github.com/Blue-Dots-Economy/bluedots-automation/blob/main/opentofu/aws/template/aws-backup-scripts/README.md) before you run one for real** — it covers restoring specific namespaces, verifying the data (not just the pods) actually came back, the cleanup needed after a restore test, and a troubleshooting table for the common failure modes.

## 5. Connect and validate

```bash
aws eks update-kubeconfig --name <building_block>-<environment>-cluster --region <region>
./grant-cluster-admin.sh          # give your own AWS identity admin rights on the cluster

kubectl config current-context    # the new cluster, not minikube or another account's
kubectl get nodes                 # Ready
kubectl get sc                    # your default StorageClass
bash install.sh preflight         # tooling + cluster + generated files, all in one
```

Infrastructure is up once `preflight` passes. Continue to [AWS Deployment](/deploy/cloud/aws-deployment/) to install the application charts.

## Changing infrastructure later

This class of change touches real AWS resources, so always preview before applying:

```bash
bash install.sh plan_tf_<module>     # shows what would change; changes nothing
```

If the plan says **destroy** or **replace** on a database, node group or bucket, stop and get a second pair of eyes.

| Change | Edit in `global-values.yaml` | Then run |
|---|---|---|
| Who can reach the VPN port | `pritunl_vpn_ingress_cidrs` | `plan_tf_pritunl` → `apply_tf_pritunl` |
| Who can reach SSH / the Pritunl admin UI | `pritunl_admin_ingress_cidrs` | `plan_tf_pritunl` → `apply_tf_pritunl` |
| Who can SSH the bastion | `bastion_authorized_keys` | `plan_tf_bastion` → `apply_tf_bastion` |
| S3 buckets / CORS | `buckets`, `cors_*` | `plan_tf_storage` → `apply_tf_storage` → `apply_tf_output_file` → `deploy_aggregator` |
| Database size | `rds_instance_class`, `rds_allocated_storage` | `plan_tf_rds` → `apply_tf_rds` |
| Node count / size | `eks_node_*` | `plan_tf_eks` → `apply_tf_eks` |
| Cluster backup schedule / retention / on-off | `backup_*` (e.g. `backup_enabled`, `backup_schedule`, `backup_retention_days`) | `plan_tf_backup` → `apply_tf_backup` |

:::caution
Changing the node instance type or disk size replaces the whole node group — pods reschedule onto new machines. Do it in a maintenance window.

Infrastructure changes have **no** one-command undo, unlike a Helm release — that's why previewing with `plan_tf_*` matters.
:::

## Configuration reference: sizing, zones and access

Where the common day-1 sizing and access decisions live in `global-values.yaml`. Node/version settings are in the top anchor block (step 2); everything else here is set directly further down in the same file, under `global:` — search for the key name.

**Compute (EKS nodes)**

| Setting | Key | Default |
|---|---|---|
| Kubernetes version | `_eks_cluster_version` | `1.35` |
| Node instance type | `_eks_node_instance_type` | `m6a.xlarge` |
| Node count (min / max) | `_eks_node_count_min` / `_eks_node_count_max` | `2` / `6` |
| Capacity type | `_eks_node_capacity_type` | `ON_DEMAND` |

**Network and availability zones**

| Setting | Key | Default |
|---|---|---|
| VPC address range | `vpc_cidr` | `10.0.0.0/22` (must be `/16`–`/22`) |
| Subnets and their AZ | `subnet_config` — each entry sets `availability_zone` | 6 subnets across 2 AZs |
| Outbound internet for private subnets | `nat_gateway_enabled` | `true` |

**Pritunl VPN and bastion (private-cluster access)**

| Setting | Key | Default |
|---|---|---|
| Enable/disable each | `pritunl_enabled`, `bastion_enabled` | both `true` |
| Pritunl instance size | `pritunl_instance_type` | `t3.small` (minimum) |
| Bastion SSH keys | `bastion_authorized_keys` | — (add one line per developer) |
| Bastion instance size | `bastion_instance_type` | `t3.medium` (minimum) |

Pritunl's VPN port is open by design (`pritunl_vpn_ingress_cidrs`, default `0.0.0.0/0`) — Pritunl issues each user a client certificate, so the certificate is what keeps strangers out, not the source IP. Its SSH/admin-UI access (`pritunl_admin_ingress_cidrs`) defaults to empty; the VPC CIDR is always allowed on top of that list, so anyone already connected to the VPN reaches it regardless.

**Cluster API endpoint**

| Setting | Key | Default |
|---|---|---|
| Reachable from the public internet | `eks_endpoint_public_access` | `false` |
| Reachable from inside the VPC (VPN/bastion) | `eks_endpoint_private_access` | `true` |

The default is **private-only** — `kubectl` only works from the bastion (or over the VPN), not directly from your laptop. Set `eks_endpoint_public_access: true` if you need direct `kubectl` access without connecting to the VPN first.

**Database (RDS)**

| Setting | Key | Default |
|---|---|---|
| Instance class | `rds_instance_class` | `db.t4g.micro` |
| Storage (start / autoscale cap) | `rds_allocated_storage` / `rds_max_allocated_storage` | `20` / `50` GB |
| Multi-AZ (standby + failover) | `rds_multi_az` | `false` |
| Engine version | `rds_engine_version` | `17` |

## What goes in `secrets.yaml`

Every key, what it feeds, and whether it's safe to leave as `UPDATE_THIS_VALUE`:

| Key(s) | Feeds | Leave unused? |
|---|---|---|
| `smtp_password` | outbound email — notification service, aggregator, keycloak, monitoring alerts | only if you have no working SMTP account |
| `msg91_auth_key`, `msg91_template_id` | SMS OTP via MSG91 | yes, if `SMS_PROVIDER` isn't `msg91` |
| `pinnacle_api_key`, `pinnacle_sender_id`, `pinnacle_dlt_entity_id`, `pinnacle_login_otp_template_id`, `sms_login_otp_body` | SMS OTP via Pinnacle (the alternative vendor) | yes, if `SMS_PROVIDER` isn't `pinnacle` |
| `raya_api_key` | aggregator's outbound key to the Raya voice channel | yes, if you don't use voice campaigns |
| `google_maps_api_key` | Signals UI map (browser) | no, if the map is used |
| `aggregator_google_maps_api_key` | Aggregator's address autocomplete (browser) | yes — falls back to the public Photon geocoder (see [Prerequisites](/deploy/local/prerequisites/)) |
| `google_geocoding_api_key` | Signals API server-side geocoding | no, if location features are used |
| `discord_critical_webhook`, `discord_warning_webhook`, `discord_info_webhook` | monitoring alerts to Discord | yes, if alerting is email-only |

Everything left as `UPDATE_THIS_VALUE` renders through harmlessly — it only matters to the feature that reads it.
