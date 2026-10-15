---
title: Cost & Sizing
description: What it costs to run Blue Dots, and how much infrastructure a deployment needs.
---

This page covers the basic infrastructure a Blue Dots instance needs, what changes for high availability, and what each setup can handle in practice.

:::note[Scope]
This scope covers only the infrastructure required to deploy Blue Dots. The configuration and implementation of firewalls, security controls, and other security layers are explicitly out of scope.
:::

## Basic setup

The basic setup requires 1 compute node (4 vCPU / 16 GB RAM), at an approximate cost of ₹50,000 per month:

| Component | Type / sizing |
|---|---|
| Virtual network | private network, 2 availability zones |
| Managed Kubernetes cluster | control plane, private API access |
| Compute node | 1 node, 4 vCPU / 16 GB RAM, 40 GB boot disk |
| Egress gateway | 1 per availability zone, for outbound internet access |
| Operator access | VPN gateway and bastion host |
| Managed database | PostgreSQL, Multi-AZ disabled, 20 GB storage (autoscales to 50 GB) |
| Object Storage (only Private) | application data and infra state, 2 buckets |
| Key management | 1 encryption key, automatic rotation |

## High availability

The basic setup has 1 compute node and the database's Multi-AZ option off. To make it highly available, these changes are needed:

- Compute node: scale from 1 node to 3 nodes of the same size (4 vCPU / 16 GB RAM each), spread across availability zones.
- Managed database: enable Multi-AZ.

The network, Kubernetes control plane, egress gateways, VPN and bastion, object storage, and key management stay the same in both setups.

## Capacity

The basic setup can handle a total of 1 lakh job posts with 1,000 active users per day.
