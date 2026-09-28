# Phase 0 platform baseline sources

_Research date: 2026-09-15. Primary, first-party sources only. Prices and limits are a dated snapshot, not a substitute for the account's Billing/Usage pages, selected Region, contract, or current service configuration. No private identifiers or operational values are recorded here._

## Scope

This note captures external facts needed to interpret Takonbini's Phase 0 cost, usage, reliability, security, evidence-retention, and rollback baselines. It does not claim that any allowance applies to the project's accounts. Verified vendor facts and project-specific inferences are deliberately separated.

## Verified platform facts

### AWS Lambda

- Lambda Functions are metered by request count and execution duration in GB-seconds. The ongoing Lambda free tier includes 1,000,000 requests and 400,000 GB-seconds per month. AWS's x86 example lists $0.20 per million requests after the allowance and $0.0000166667 per GB-second in the first duration tier; architecture, Region, and usage tier affect the actual price. [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)
- Duration tiers aggregate monthly usage separately by architecture and Region; consolidated-billing aggregation can also affect the applicable tier. [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)

### Amazon API Gateway

- API Gateway has no minimum or upfront commitment. HTTP and REST APIs charge for calls received and data transfer out. Private APIs do not incur API Gateway data-transfer-out charges, but AWS PrivateLink charges apply; optional REST API caching is billed hourly. [Amazon API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)
- API Gateway's service-specific free tier is time-limited to 12 months for new AWS customers: 1 million REST API calls, 1 million HTTP API calls, 1 million WebSocket messages, and 750,000 WebSocket connection minutes per month. AWS also documents different credit/free-plan terms for accounts created after 2025-07-15, so these allowances must not be assumed for an established account. [Amazon API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)
- AWS's published examples price HTTP APIs at $1.00 per million requests for the first 300 million and $0.90 thereafter, while a Regional/edge-optimized REST example starts at $3.50 per million for the first 333 million. These are examples, not a project quote; API type, Region, transfer, Lambda, caching, and CloudWatch can change total cost. [Amazon API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)

### AWS Systems Manager Parameter Store

- Standard parameters have no additional parameter-storage charge. Advanced parameters cost $0.05 per parameter-month, prorated hourly. Standard-throughput interactions with Standard parameters have no additional charge; higher-throughput Standard interactions and all Advanced interactions cost $0.05 per 10,000 interactions. A request returning 10 parameters counts as 10 interactions. [AWS Systems Manager pricing](https://aws.amazon.com/systems-manager/pricing/)
- Standard parameters allow 10,000 parameters per account per Region, values up to 4 KB, and no parameter policies. Advanced parameters allow 100,000, values up to 8 KB, and parameter policies. An Advanced parameter cannot be downgraded in place; it must be deleted and recreated. [Managing parameter tiers](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html)
- `SecureString` values use AWS KMS. Parameter Store does not add a creation charge for `SecureString`, but KMS charges can apply. AWS recommends Secrets Manager for database credentials, API keys, and tokens that need automated rotation, cross-account access, or fine-grained auditing. [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-a-parameter.html)

### AWS Key Management Service

- A customer-managed KMS key costs $1 per key-month, prorated hourly. The first and second automatic or on-demand rotations each add $1 per month; later rotations add no further key-storage charge. AWS-managed and AWS-owned keys have no key-storage charge. [AWS KMS pricing](https://aws.amazon.com/kms/pricing/)
- The KMS free tier includes 20,000 requests per month aggregated across supported Regions. Asymmetric operations and `GenerateDataKeyPair` operations are excluded. AWS's symmetric-operation example prices usage over the allowance at $0.03 per 10,000 requests. [AWS KMS pricing](https://aws.amazon.com/kms/pricing/)
- AWS-managed keys can still incur API-usage charges beyond the free tier; AWS-owned keys do not incur charges to the customer. [AWS KMS key concepts](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)

### GitHub Actions OIDC and evidence artifacts

- GitHub Actions OIDC lets an AWS workflow exchange a GitHub JWT for short-lived AWS credentials rather than store long-lived AWS credentials as GitHub secrets. A job needs `permissions: id-token: write`; that permission only permits requesting an OIDC token and does not itself grant writes to AWS resources. [GitHub: OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws), [GitHub OIDC reference](https://docs.github.com/en/actions/reference/security/oidc)
- For AWS, GitHub documents `sts.amazonaws.com` as the audience used by the official credentials action and recommends constraining the IAM trust policy with the `token.actions.githubusercontent.com:sub` claim. Environment-bound jobs use a subject shaped like `repo:ORG/REPO:environment:ENVIRONMENT`; GitHub also recommends environment protection rules. Repositories created after 2026-07-15, or repositories that opt in, can use immutable owner/repository IDs in the subject, so the actual claim format must be verified. [GitHub: OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- Actions artifacts and logs default to 90-day retention. Public repositories can configure 1–90 days; private repositories can configure 1–400 days, subject to organization or enterprise policy. A changed repository setting applies only to newly created artifacts and logs. A workflow can set a shorter per-artifact `retention-days`, but not beyond the applicable maximum. [GitHub repository Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), [GitHub: store and share data](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- Deleting a workflow run deletes its artifacts, and deleting an artifact is irreversible. GitHub's artifact API exposes scheduled expiration as `expires_at`. [GitHub: remove workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts)
- The official `actions/upload-artifact` action returns a SHA-256 digest. Hidden files are excluded by default to reduce accidental upload of sensitive files; if hidden files are enabled, GitHub recommends explicitly excluding sensitive files. [Official `upload-artifact` action](https://github.com/actions/upload-artifact)
- Artifact attestations record signed provenance such as workflow, repository, environment, commit SHA, and triggering event. GitHub explicitly says an attestation does not prove that an artifact is secure; its security value depends on verification. [GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)

### Vercel Hobby hosting and Web Analytics

- Vercel states that Hobby is for personal, non-commercial use. It is $0/month, capped at included usage, and cannot buy additional usage. Eligibility is therefore a separate question from whether a workload fits within the quotas. [Vercel pricing](https://vercel.com/pricing), [Vercel Terms of Service](https://vercel.com/legal/terms)
- Current Hobby allowances include 100 GB/month Fast Data Transfer, 1 million Edge Requests/month, 4 active CPU-hours/month, 360 GB-hours provisioned memory/month, and 1 million Function invocations/month. The Hobby plan is paused or the affected feature becomes unavailable when its applicable included usage is exhausted; Vercel says that in most cases the user waits until the rolling 30-day reset. [Vercel pricing](https://vercel.com/pricing), [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel account plans](https://vercel.com/docs/plans)
- Hobby Web Analytics includes 50,000 events per month across unlimited projects and a one-month reporting window. It excludes custom events and UTM reporting. After the limit is exceeded, Vercel gives a three-day grace period before event capture stops; capture can resume after seven days or after upgrading. The client-side analytics script also contributes to transfer and Edge Request usage. [Vercel Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing)
- Hobby platform limits include 100 deployments per day, 32 builds per hour, one concurrent build, 45 minutes per build, 100 MB static-file uploads, and one hour of runtime-log retention. Build logs are retained with their deployments. [Vercel limits](https://vercel.com/docs/limits)
- Starting 2026-04-29, Hobby deployment-retention policies are capped at 30 days. Vercel preserves the 10 most recent production deployments and aliased deployments regardless of that policy. Successfully built deployments deleted by a policy have a 30-day recovery period, while unsuccessful deployments can be collected sooner. [Vercel Hobby retention change](https://vercel.com/changelog/hobby-projects-now-default-to-30-day-deployment-retention), [Vercel deployment retention](https://vercel.com/docs/deployment-retention)

### MongoDB Atlas Free clusters

- MongoDB describes Atlas Free (formerly `M0`) as a $0/hour shared tier with 0.5 GB/512 MB of storage, 32 MB sort memory, and up to 100 operations per second. Only one Free cluster can be deployed per Atlas project. [MongoDB pricing](https://www.mongodb.com/pricing), [Atlas Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- A Free cluster has three replica-set nodes but does not support configurable backups, customer-managed encryption keys, private endpoints, network peering, database auditing, log downloads, Performance Advisor, maintenance-window control, sharding, or regional-outage/failover tests. Manual `mongodump`/`mongorestore` is the documented backup alternative, with some options unavailable on Free clusters. [Atlas Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- Operational limits include 500 connections, 100 databases, 500 collections, 10 GB inbound and 10 GB outbound transfer per rolling seven-day period, and 100 read/write operations per second. Atlas throttles workloads that exceed transfer or operations limits. [Atlas Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- Atlas automatically pauses a Free cluster after 30 days with zero connections and advises exporting data before an extended inactive period. The Free tier exposes only limited monitoring metrics and alert types. [Atlas Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)

## Project-specific inferences and checks

The following are conclusions to validate against Takonbini's private account state and dated measurements. They are not vendor facts about the project.

1. **Record actual cost eligibility, not just published allowances.** Capture the AWS account creation/free-plan status, selected Region, API type, Lambda architecture/memory/duration, request counts, transfer, CloudWatch, Parameter Store tier/throughput, and KMS key ownership from Billing/Cost Explorer. In particular, do not record API Gateway's 12-month new-customer allowance as ongoing without account evidence.
2. **Treat the KMS path as part of the secret-read baseline.** If a Lambda reads a Parameter Store `SecureString`, record both Parameter Store interactions and KMS decrypt requests. Record whether the key is AWS-managed or customer-managed because the monthly key charge differs. If automated database-secret rotation is a requirement, evaluate Secrets Manager or document and test the manual rotation procedure; a `SecureString` alone does not establish rotation.
3. **Prove OIDC least privilege with trust and permission evidence.** Redacted evidence should show the workflow's `id-token: write`, the actual OIDC subject/audience format, a trust-policy restriction to the intended repository/ref or protected environment, short session duration, and an AWS permission policy limited to the deployment actions/resources. Successful role assumption alone does not demonstrate least privilege.
4. **Make CI evidence retention explicit.** The current repository workflow builds but does not upload a baseline report or build artifact. If Phase 0 adds evidence artifacts, set `retention-days`, record the returned digest and `expires_at`, and keep the durable redacted summary outside the artifact because deleting a run also deletes its artifacts. Never upload raw environment dumps, credentials, connection strings, or private operational identifiers.
5. **Confirm Vercel plan eligibility before relying on Hobby.** The repository directly loads Vercel Web Analytics, so analytics events, reporting-window limits, Edge Requests, and transfer are relevant if the deployment is on Hobby. Confirm the actual plan and whether the deployment is personal/non-commercial; measured quota fit does not establish Hobby eligibility. Export dated usage and performance measurements because Hobby runtime logs last only one hour.
6. **Do not make Vercel's retained deployment the only rollback artifact.** If the project is on Hobby, a rollback target can age outside the 30-day policy. Record the immutable Git commit and reproducible build/deployment command, and test rollback independently of an old preview URL.
7. **Confirm the Atlas tier before applying Free-cluster limits.** If the database is Free, the absence of managed backups, detailed logs, private networking, and failover testing materially constrains production and rollback evidence. A manual export plus a successfully tested restore is needed before claiming database rollback readiness. If the tier is paid, replace these assumptions with that tier's actual backup, retention, monitoring, and networking configuration.
8. **Measure headroom, not only pass/fail.** For every service, record timestamp, observation window, workload/traffic conditions, immutable commit, observed value, applicable quota, and remaining margin. Published maximums are not performance or reliability guarantees.

## Minimum evidence fields for the Phase 0 issue

| Area | Redacted evidence to record |
| --- | --- |
| AWS compute/API | Date and window; Region; API type; Lambda architecture, memory, duration, request/error/throttle counts; transfer and observed cost; allowance eligibility |
| Secrets/KMS | Parameter tier and throughput; interaction/decrypt counts; key ownership class; rotation owner/date/test result; no secret values |
| GitHub deployment | Workflow/run URL; commit SHA; protected ref/environment; redacted OIDC subject/audience constraints; assumed-role session duration; least-privilege review result |
| CI artifacts | Artifact purpose; file allowlist; digest; retention days; `expires_at`; durable summary location |
| Vercel | Confirmed plan and eligibility; 30-day usage; analytics events; Edge Requests; transfer; compute; runtime-log window; rollback target and tested command |
| Atlas | Confirmed tier; storage/connections/ops/transfer headroom; backup/export timestamp; restore test and owner; monitoring/alert coverage |

Re-check every linked pricing and limits page when closing Phase 0 or whenever a plan, Region, architecture, API type, or service tier changes.
