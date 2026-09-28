# Sub-RM1 Terraform and operations envelope

_Decision date: 2026-09-23. Pricing is a dated Tokyo Region snapshot and must be rechecked at every review trigger below._

## Decision

Run the clean-sheet catalog and its versioned MiniSearch projection in three
Amazon DynamoDB Standard tables in `ap-northeast-1`: Catalog, Refresh, and
Translations. All three tables use on-demand capacity, AWS-owned encryption,
deletion protection, and base-table keys only. They have no local or global
secondary indexes, Streams, global replication, point-in-time recovery, or
managed backups.

The envelope is evaluated before free-tier allowances. DynamoDB and the search
projection together must project below a US$0.13 monthly warning threshold and
must not proceed past a US$0.16 hard-review threshold. These deliberately
conservative USD thresholds implement the RM0.80 warning and RM1 review policy
with exchange-rate and Malaysian tax headroom; they are not claims about the
invoice exchange rate.

The search projection is stored as immutable, snapshot-scoped DynamoDB chunks
and loaded into MiniSearch in the API process. There is no separately billed
search service.

## Dated cost model

The 2026-09-11 AWS Tokyo price list gives these DynamoDB Standard rates:

| Dimension | Price |
| --- | ---: |
| On-demand reads | US$0.1425 per million RRUs |
| On-demand writes | US$0.715 per million WRUs |
| Table storage | US$0.285 per GB-month |
| PITR, not enabled | US$0.228 per GB-month |
| On-demand backup storage, not enabled | US$0.114 per GB-month |
| Restore, not used by this recovery model | US$0.171 per GB |

The admission calculation is:

```text
monthly USD =
  0.1425 * million RRUs
  + 0.715 * million WRUs
  + 0.285 * retained table GB-month
  + directly attributable transfer
```

The calculation includes Catalog, Refresh, Translations, immutable search
chunks, TTL-pending items, cleanup, public browse, cold search loads, failed
attempts, one rollback, and four weekly three-store refreshes. It ignores free
tier and promotional credits. Existing API compute, the local refresh machine,
future hosted compute, translation calls, and general logging remain outside
the Wayfinder cost boundary.

Provisioned capacity is rejected. Its minimum one RCU plus one WCU costs about
US$0.65 for a 730-hour month before storage, so it cannot meet the pre-free-tier
RM1 envelope. DynamoDB maximum-throughput settings are also not a monthly
spend cap and can reject valid large item operations; no maximum is configured
until production measurements establish a safe value.

Sources:

- [Amazon DynamoDB Tokyo price list](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonDynamoDB/current/ap-northeast-1/index.json)
- [DynamoDB pricing mechanics](https://aws.amazon.com/dynamodb/pricing/)
- [DynamoDB provisioned-capacity quotas](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html)
- [AWS Malaysia billing terms](https://aws.amazon.com/legal/awsmy/)

## Terraform boundary

Use one dedicated catalog-storage module in the existing production Terraform
state, AWS account, and Tokyo Region. Keep the three tables, runtime policy,
budget, notification topic, and module outputs logically separate from legacy
resources. A reviewed plan remains a human-admin operation; GitHub deployment
OIDC and the refresh runtime receive no Terraform or infrastructure-management
authority.

Apply these tags to every supported resource and activate the first three as
AWS cost-allocation tags:

| Tag | Value |
| --- | --- |
| `Project` | `Takonbini` |
| `Environment` | `production` |
| `Component` | `catalog-storage` |
| `ManagedBy` | `Terraform` |

Enable deletion protection on every table. Disabling it must be a separate,
reviewed Terraform plan and apply; it cannot be bundled with deletion. Restored
or recreated tables must explicitly re-enable protection.

Use an AWS-owned encryption key. A customer-managed KMS key is unnecessary for
this public-derived catalog and its fixed monthly key charge would violate the
cost envelope.

## Runtime authority

The local refresh runner assumes the approved short-lived
`takonbini-refresh-runtime` role. Its customer-managed policy is resource-scoped
to the three tables and permits only table description, TTL description, keyed
reads and queries, writes and batch writes, and transactions needed by the
approved protocol. It does not permit `Scan`, table creation/update/deletion,
backup or restore management, IAM, Budgets, billing, or Terraform operations.

## Retention and recovery

- Active catalog pointers and their current and immediate-predecessor
  generations never receive TTL while referenced.
- An inactive product expires after the approved 30-day inactive interval.
  TTL is physical cleanup only; reads must treat logical expiry as authoritative
  because DynamoDB deletion is asynchronous.
- Product Translations are reusable and never receive TTL.
- Terminal manifests, chunks, leases, and diagnostic workflow records receive
  TTL 30 days after explicit completion or abandonment. Resumable work never
  receives TTL.
- Superseded generations and search snapshots become eligible for resumable
  cleanup only after all active-candidate, publication, repair, and rollback
  references are absent and the approved 24-hour grace period has elapsed.
- Cleanup uses keyed queries only, processes one cleanup operation at a time,
  writes batches of at most 25 items, rechecks references before deletion, and
  stops when its projected requests would cross the monthly envelope.

Paid PITR and managed backups are not enabled. Ordinary refresh failure retains
the current published generation; a publication defect can restore the
immediate predecessor. Catastrophic table or account loss has no promised RTO
or RPO: service resumes only after an empty-table rebuild creates and validates
a fresh three-store catalog and search snapshot. Durable redacted decision and
verification summaries live outside DynamoDB. Raw account evidence remains
private.

## Cost and failure controls

Before a refresh or cleanup starts, the runner calculates worst-case additional
RRUs, WRUs, retained storage, and directly attributable transfer. It combines
those with measured month-to-date usage and the remaining four-refresh workload
projection. The runner refuses to start or publish when projected spend reaches
the hard-review threshold.

At US$0.13 projected or actual attributable monthly spend, the sole maintainer
reviews the envelope before the next refresh. At US$0.16, the maintainer pauses
refresh and publication writes while preserving public reads and direct browse.
No cost control deletes data or automatically disables reads.

Create one notification-only AWS Budget with a verified maintainer email. Do
not create action-enabled budgets or CloudWatch operational alarms for this
hobby project. AWS Budget data is delayed and is not the enforcement mechanism;
the runner's synchronous admission and publication checks are authoritative.

Sources:

- [AWS Budgets pricing](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/)
- [AWS Budgets behavior](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html)
- [DynamoDB deletion protection](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.Basics.html)
- [DynamoDB TTL behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

## Operational limits

- Run Lawson, FamilyMart, and Seven-Eleven sequentially.
- Use two detail/translation workers by default and one serialized DynamoDB
  persistence queue. Raising the worker count, up to a hard maximum of four,
  requires a measured run that passes the cost and workstation-impact gates.
- Retain three jittered detail-fetch attempts and three chunk lease acquisitions.
  Use DynamoDB SDK standard retry mode with three attempts.
- Use renewable 30-second store and chunk leases, renewed every 10 seconds.
- A run blocks after exhausting its bounded attempts. Restarting it requires an
  explicit maintainer action; there is no automatic blocked-run restart.
- Search chunks remain at most 350 KiB decoded so every item stays below the
  DynamoDB item limit with representation headroom.
- Production request paths and maintenance paths never use table scans.

## Implementation verification matrix

The decision is complete, but implementation and rollout cannot advance past
each applicable stage until its gate is proven:

| Gate | Required evidence |
| --- | --- |
| Terraform | A reviewed plan shows exactly three Standard on-demand tables, approved TTL settings, deletion protection, AWS-owned encryption, no indexes, no Streams, no backups/PITR, required tags, and least-privilege IAM. |
| Three-store shadow | Frozen manifests reconcile with products, translations, candidates, generations, and search chunks without changing a production pointer. |
| Cost | Measured bytes, RRUs, WRUs, and attributable transfer project four weekly refreshes, public reads, cold search loads, cleanup, and one rollback below US$0.13 with explicit headroom below US$0.16. Estimates require a documented worst-case bound. |
| Interruption | Injected throttling, process interruption, stale leases, duplicate writes, conditional conflicts, search-build failure, and cleanup interruption resume safely or block publication. |
| Rebuild | Empty tables can produce one fresh, complete, validated three-store generation and versioned search snapshot. |
| Degraded search | Missing or corrupt search data produces controlled search unavailability while direct store/category browse remains available. |
| Rollback | The immediate predecessor generation can be restored without exposing a mixed catalog/search snapshot. |
| Runtime | A production-shaped cold API load stays within the approved 205 MiB memory gate and records cold/warm latency. |

Publish only redacted formulas, thresholds, decisions, and pass/fail summaries
in the public repository. Keep account identifiers, raw AWS output, credentials,
detailed retailer data, and private API internals in private evidence storage.

## Review triggers

Recalculate this envelope:

- before changing capacity mode, tables, keys or indexes, backups, search
  provider, Region, refresh frequency, or retention;
- after an AWS price, Malaysian tax, or material billing-policy change;
- after observed retained storage or request volume grows by 25%; and
- at least quarterly while the production catalog is active.

The sole maintainer owns Terraform plans, cost review, cleanup, recovery, and
the decision to resume writes after a threshold breach.
