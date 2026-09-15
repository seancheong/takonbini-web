# Phase 0 production baseline and rollback record

**Observation date:** 2026-09-15 (Asia/Kuala_Lumpur)

**Measurement window:** 2026-08-16 00:00 UTC through 2026-09-15 00:00 UTC unless stated otherwise

**Status:** Complete; the Phase 0 exit gate is satisfied

This is the publication-safe evidence record for
[Phase 0](https://github.com/seancheong/takonbini-web/issues/20). It records
measured production behavior, security posture, current limitations, and
rollback ownership without credentials, private database identifiers, account
numbers, or private operational URLs. Current vendor pricing and limit sources
are recorded separately in
[`phase-0-platform-baseline-sources.md`](../research/phase-0-platform-baseline-sources.md).

## Executive result

The credential-remediation work succeeded: credential-bearing Actions
artifacts are absent, the database application credential was rotated, API
deployment uses GitHub OIDC instead of stored AWS access keys, the human AWS
administrator has MFA and no access keys, and a deployment using temporary
credentials completed successfully. The unused legacy scraper access key was
deleted on 2026-09-15 after AWS continued to report no recorded use; its
Terraform resource, secret-bearing outputs, and remote state record were also
removed in the reviewed private API change.

The remaining closeout work was completed on 2026-09-15. Authenticated Vercel
and Atlas measurements establish plan and quota headroom, the database
credential pointer was exercised from green to blue and restored to green, and
the web rollback drill was explicitly deferred because exercising it would
replace a healthy production release solely for the drill. The API Lambda log
group now has a 30-day retention policy managed by Terraform.

Atlas network access from `0.0.0.0/0` is recorded as a temporary accepted
exception for the current serverless topology: Lambda does not have fixed
egress, while TLS, rotated database credentials, a database-scoped `readWrite`
role, and Parameter Store protect access. Restrict the allowlist when a fixed
egress or private-network path is introduced. This exception does not block
Phase 0.

## Immutable release references

| Surface | Production reference | Evidence |
| --- | --- | --- |
| Web | `bcf53f4` (`feat: Add sitemap.xml`) | GitHub reports a successful Vercel production deployment on 2026-01-18. Public `/`, `/api/products`, `/sitemap.xml`, and `/robots.txt` returned HTTP 200 on 2026-09-15. |
| API and current scraper | `4342782` (`security: deploy lambda through github oidc`) | The OIDC deployment completed on 2026-09-11 local time. Scheduled scraper smoke CI also ran this reference on 2026-09-12 through 2026-09-15 local time. |
| API rollback snapshot | Lambda version `2` | Published from the healthy production `$LATEST` on 2026-09-15. A direct version-qualified invocation completed without a function error and returned the expected unauthenticated HTTP 401 response. |

The API repository is private. Its full commit, run, resource, and deployment
identifiers remain in the private task record; only shortened commit references
and redacted outcomes appear here.

## Security and identity baseline

### GitHub deployment

- The deployment workflow grants only `id-token: write` and `contents: read`.
- Its AWS trust policy requires audience `sts.amazonaws.com` and a subject for
  the private API repository's `main` branch.
- The maximum role session is one hour.
- Its permission policy permits only `lambda:GetFunction`,
  `lambda:GetFunctionConfiguration`, and `lambda:UpdateFunctionCode` against
  the single API Lambda function.
- The latest measured OIDC deployment job succeeded in 26 seconds, including
  dependency installation, build, upload, Lambda wait, and an authenticated
  production smoke request.
- Repository secret metadata contains the application API key and Atlas
  Terraform provider credentials. It contains no AWS access-key secret.
- The Actions artifact inventory is empty: zero retained artifacts and zero
  unexpired artifacts.

Conclusion: the automated API deployment identity is least-privilege for its
current code-only deployment job. Terraform remains a separate human-admin
operation and is not silently available to CI.

### Human AWS administrator

- Effective access is `AdministratorAccess` through an administrator group.
- The user has no AWS access keys and no inline policy.
- MFA was enabled on 2026-09-11.
- Temporary local CLI authentication is enabled through AWS's local sign-in
  policy.

Conclusion: this is a high-privilege break-glass/bootstrap identity, not a
least-privilege routine runtime identity. Its compensating controls are MFA,
the absence of static access keys, and temporary CLI sessions. Routine
production deployment does not use it.

### API runtime

- Runtime: Node.js 22 on Arm64, 256 MiB, 10-second timeout.
- Runtime role has basic Lambda logging, read-only access to the legacy
  DynamoDB product table, and `ssm:GetParameter` for one MongoDB connection
  parameter.
- The process environment contains only the API authentication key and the
  Parameter Store name. It does not contain a MongoDB connection string.
- The MongoDB parameter is a Standard `SecureString`; paid high-throughput mode
  is disabled.
- The active database application role is scoped to `readWrite` on one
  application database.

Conclusion: the runtime AWS permissions are resource-scoped. DynamoDB access
appears dormant because current API data access is MongoDB-backed; remove it
only after characterization confirms no rollback or hidden path still depends
on it.

### Legacy scraper identity

- The static AWS access key created on 2026-01-01 was deleted on 2026-09-15.
- Immediately before deletion, AWS last-used metadata was still `N/A`; no use
  was recorded. The IAM user had zero access keys immediately afterward.
- The Terraform access-key resource and both credential outputs were removed
  in private API PR #19. Its stale resource was also removed from remote
  Terraform state so the secret is no longer retained there.
- Its policy is restricted to read/write operations on the Takonbini DynamoDB
  table and its indexes.
- Current scraper source uses MongoDB directly. It imports no AWS SDK and makes
  no AWS service call; it only logs whether AWS credential variables exist.

Conclusion: the unnecessary long-lived credential is retired. The dormant IAM
user and policy have no access key and can be removed with the retained
DynamoDB surface after its rollback value is resolved.

## Production behavior baseline

Three `curl 8.7.1` requests per route were made from Kuala Lumpur on
2026-09-15. These are small-sample synthetic timings, not field performance or
an SLA.

| Route | Result | Median TTFB | Median total | Response bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | HTTP 200 | 433 ms | 732 ms | 24,862 |
| `/api/products?limit=24` | HTTP 200 | 812 ms | 812 ms | 15 |
| `/sitemap.xml` | HTTP 200 | 789 ms | 789 ms | 228 |
| `/robots.txt` | HTTP 200 | 67 ms | 67 ms | 110 |

The catalog API response was structurally valid but contained zero products.
The sitemap was likewise reachable but contained no product inventory. This
confirms the known operational baseline: the site is available while the
catalog is empty because no production refresh currently maintains the
TTL-backed observations.

## AWS API baseline

CloudWatch aggregate for the 30-day measurement window:

| Metric | Observed value |
| --- | ---: |
| Lambda invocations | 3,483 |
| Lambda errors | 0 |
| Lambda throttles | 0 |
| Lambda duration average | 866 ms |
| Lambda duration p95 | 1,320 ms |
| Lambda duration maximum | 1,595 ms |
| HTTP API requests | 3,483 |
| HTTP API 4xx responses | 2,245 (64.46%) |
| HTTP API 5xx responses | 3 (0.086%) |
| HTTP API latency average | 1,266 ms |
| HTTP API latency p95 | 1,941 ms |
| HTTP API latency maximum | 2,347 ms |

The high 4xx share is consistent with a publicly addressable API Gateway whose
application routes require an API key, but this baseline does not attribute
individual requests. The three API 5xx responses did not register as Lambda
runtime errors, indicating handled 5xx responses rather than failed Lambda
invocations. Alerting and shorter-window analysis are still required before
using the rollout threshold of more than 1% 5xx for five minutes.

The Lambda log group stored 15,732,168 bytes when measured. A 30-day retention
policy was applied on 2026-09-15, added to Terraform in private API PR #20, and
the pre-existing log group was imported into remote Terraform state.

## Data and dormant-resource baseline

- The legacy DynamoDB table is active, uses on-demand billing, reports 4,942
  items, and occupies 7,490,434 bytes. Current API and scraper code use MongoDB,
  so this table is a retained rollback/legacy surface rather than the active
  catalog source.
- The Atlas cluster is `M0`/Free. The authenticated dashboard reported 116 KB
  of 512 MB in use, approximately 0.023% of the storage allowance.
- For the dashboard's 2026-08-16 through 2026-09-15 window at one-hour
  granularity, active connections were normally one or two and peaked around
  four; operation counters were generally below 0.01 operations/second with
  brief peaks near 0.08; network throughput was generally near zero with brief
  peaks at or below roughly 200 bytes/second. M0 exposes charted rates rather
  than an aggregate transfer total.
- Atlas billing showed no invoiceable amount or payment method. Together with
  the active M0 tier, no paid Atlas usage was observed.
- Terraform state bucket versioning is enabled. The measured state bucket has
  24 object versions totalling 893,337 bytes and no delete markers.
- One legacy ECR repository retains two mutable images totalling 792,296,408
  bytes; the newest image dates to 2021.
- One legacy ECS cluster remains active but has zero services, tasks, pending
  tasks, or registered instances.

The ECR images and idle ECS cluster are not part of the accepted Cloud Run
destination. Their deletion is not implied by this report; inventory and
recoverability should be confirmed before any cleanup.

## Web build and performance baseline

The production web commit was exported into an isolated temporary directory
and built with Node.js 22.16.0 and pnpm 10.20.0.

| Check | Result |
| --- | --- |
| Biome lint | Passed; 36 files; 0.78 s wall time |
| Vite/Nitro production build | Passed; 8.10 s wall time |
| Client modules transformed | 2,003 |
| Largest client JavaScript chunk | 522,582 bytes raw; 169.99 kB gzip |
| Client CSS | 41,183 bytes raw; 7.94 kB gzip |
| Complete Vercel output | 5,340 KiB |
| Static output | 1,024 KiB |
| Server functions | 4,308 KiB |

The build emits the existing warning that a client chunk exceeds 500 kB.

One Lighthouse 13.4.1 mobile run measured the production home page with
simulated throttling, a 412 × 823 viewport, device scale factor 1.75, and
Headless Chrome 152. This is a synthetic single run and not Core Web Vitals
field data.

| Category/metric | Result |
| --- | ---: |
| Performance | 94 |
| Accessibility | 100 |
| Best Practices | 96 |
| SEO | 92 |
| First Contentful Paint | 2.1 s |
| Largest Contentful Paint | 2.1 s |
| Speed Index | 4.8 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| Transfer | 208,313 bytes across 11 requests |

Recorded defects from the run:

- `/site.webmanifest` and `/favicon.ico` return 404 and create console errors.
- The document emits conflicting canonical URLs for production and localhost.
- The large first-party client JavaScript file has no source map.

These are baseline defects for later web phases, not Phase 0 fixes.

## CI and scraper baseline

- API unit tests pass: 30 tests across five files in 488 ms Vitest time and
  1.23 s wall time.
- API production bundle passes in 0.47 s wall time and produces a 1,472,795-byte
  bundle.
- Scraper TypeScript build passes in 1.28 s wall time and produces 104 KiB of
  JavaScript.
- The four latest scheduled scraper smoke runs all passed. Jobs took 71–94
  seconds; the retailer smoke step took 30–38 seconds.
- The scheduled job is a daily CI smoke test. It does not run a full catalog
  refresh and must not be presented as production automation.
- The current web CI runs lint and build, but the latest production `main`
  commit does not have a recent Web CI run in the retrieved history. The latest
  observed Web CI success was for a dependency pull request.

## Cost and usage baseline

AWS Cost Explorer reported approximately **USD 0.367 account-wide** for the
30-day window, including tax. Nonzero service totals were:

| Service | Account-wide unblended cost |
| --- | ---: |
| Amazon S3 | $0.2969 |
| Amazon ECR | $0.0408 |
| Tax | $0.0100 |
| Amazon ECS | $0.0078 |
| API Gateway | $0.0048 |
| Route 53 | $0.0040 |
| Amazon VPC | $0.0026 |
| DynamoDB | $0.000007 |

The `Project=Takonbini` cost-allocation-tag query returned no attributed cost.
This means cost-allocation tags were not usable for this historical window; it
does not mean Takonbini cost zero. The totals above are account-wide and cannot
be claimed as project-only charges.

Parameter Store is Standard tier with standard throughput, so it has no
additional Parameter Store storage or interaction charge under the dated AWS
pricing conditions. KMS request eligibility and count were not separately
available. See the linked platform-source note before making any cost claim.

Authenticated vendor dashboards completed the remaining usage baseline:

| Vercel metric | Takonbini, last 30 days | Hobby allocation shown by Vercel |
| --- | ---: | ---: |
| Fast data transfer | 72.88 MB | 100 GB |
| Fast origin transfer | 28.74 MB | 10 GB |
| Edge requests | 9.5K | 1M |
| Edge request CPU | 1 second | 1 hour |
| Function invocations | 8.3K | 1M |
| Fluid provisioned memory | 8.2 GB-hours | 360 GB-hours |
| Fluid active CPU | 48 minutes 37 seconds | 4 hours |
| Web Analytics events | 16 | Dashboard count only |
| Build CPU | 14 minutes | Dashboard count only |
| Function duration | 0 GB-hours | 100 GB-hours |

The Vercel billing page identified the team as **Hobby Plan — Active**. The
displayed team-wide values also remained within the Hobby allocations; the
highest percentage shown was Fluid Active CPU at about 20.7%. Takonbini is
therefore eligible to remain on Hobby under the measured usage conditions.

Atlas reported the M0/Free storage and activity headroom recorded above. No
invoiceable Atlas amount was shown. AWS remains the only measured nonzero
account cost, and its approximately USD 0.367 total is account-wide rather than
Takonbini-attributable.

## Rollback ownership and procedures

The owner for every Phase 0 rollback is the Takonbini maintainer. AWS and Atlas
changes require the MFA-protected human administrator; ordinary API code
deployment uses GitHub OIDC.

### API code

**Target:** Lambda version `2`, created from the healthy OIDC/Parameter Store
deployment.

**Procedure:**

1. Confirm version `2` still exists and its code hash matches this evidence
   record's private execution record.
2. Obtain that version's temporary code-download URL with
   `aws lambda get-function --qualifier 2` without logging the URL.
3. Download the package into a temporary directory.
4. Update `$LATEST` with `aws lambda update-function-code`, wait with
   `aws lambda wait function-updated-v2`, then run the authenticated production
   products smoke request.
5. If source history must also reflect the rollback, revert the offending
   change through a pull request to `main` and rerun the OIDC deployment.

The prior version `1` is not a valid rollback target: it predates Parameter
Store and refers to a database credential that has since been rotated.

### Database credential pointer

**Target:** the inactive blue/green credential slot retained by Terraform.

**Procedure:**

1. Confirm the inactive database user is enabled and can authenticate in a
   controlled probe.
2. Run a reviewed Terraform plan setting
   `mongodb_active_credential_slot` to the inactive slot.
3. Apply only after the plan shows the Parameter Store value changing without
   deleting either database user or cluster.
4. Recycle the Lambda through the normal OIDC code deployment so warm
   environments cannot retain the previous cached connection.
5. Verify authenticated API list/detail requests and the public web proxy.
6. Retain both slots until the observation window passes.

The procedure was drilled on 2026-09-15. The Parameter Store pointer was moved
from green to the inactive blue credential and the Lambda environment was
recycled. An authenticated `GET /products?limit=1` returned HTTP 200 with a
valid products array. The pointer was then restored to green, the Lambda was
recycled again, and the same request returned HTTP 200. The empty array on both
requests matches the catalog baseline. The original Lambda description and
green production pointer were restored; the drill performed no data mutation.

### Scraper

There is no scheduled production catalog-refresh workload to roll back. The
daily GitHub schedule is a smoke test only.

For a scraper code regression, revert the offending private-repository commit,
run lint/build/smoke CI, and keep production refresh disabled. Do not mutate or
extend catalog freshness based on a failed or partial manual run.

### Web

**Target:** production commit `bcf53f4` and its successful Vercel deployment.

For a future web regression, restore the last verified commit through a revert
pull request to `main`, allow the Vercel Git integration to build it, then
verify `/`, catalog search parameters, detail routing, `/api/products`, images,
sitemap, robots, SSR, and hydration before declaring recovery. An old Vercel
deployment alone is not a durable rollback artifact; the Git commit and
reproducible build remain authoritative.

The live web rollback was explicitly deferred for Phase 0. Replacing a healthy
production release solely to test rollback would introduce avoidable user
impact. The immutable Git target, reproducible build, Vercel Git integration,
preview deployment, and public production routes were all independently
verified. A live rollback remains mandatory when a real web regression or a
planned maintenance window supplies an appropriate trigger.

### Terraform and AWS identity

Infrastructure rollback is plan-first and human-owned. Revert the reviewed
Terraform change in source, initialize the existing remote backend, inspect a
saved plan, and apply only the intended resource changes. Never restore the
deleted long-lived GitHub AWS keys. OIDC remains the deployment path; the
MFA-protected human administrator is the break-glass/bootstrap path.

## Phase 0 exit checklist

| Gate | Status | Evidence or blocker |
| --- | --- | --- |
| Credential artifacts absent and affected database credential rotated | Pass | Zero retained Actions artifacts; production uses the rotated application credential through Parameter Store. |
| Deployment succeeds with temporary credentials | Pass | OIDC deployment completed successfully, including authenticated smoke verification. |
| Long-lived deployment keys removed or accepted exception recorded | Pass | GitHub has no AWS deployment secrets, and the unused legacy scraper key was deleted with its Terraform resource, outputs, and state record. |
| Dated baseline records commits and conditions | Pass | This report records production references, dates, tools, windows, and measurement conditions, including authenticated Vercel and Atlas usage. |
| Rollback owners and commands documented | Pass | API, database pointer, scraper, web, and infrastructure procedures are recorded. API version `2` was invoked directly, the database pointer drill passed, and the live web drill has a documented risk-based deferral. |

## Closeout record

- Vercel plan, eligibility, and project-specific 30-day usage captured.
- Atlas M0 storage and 30-day operational headroom captured; broad network
  access recorded as a temporary accepted exception with compensating controls.
- Database credential-pointer rollback drilled and green restored; live web
  rollback explicitly deferred with rationale.
- CloudWatch log retention bounded at 30 days and brought under Terraform.

No Phase 0 closeout actions remain. Issue #20 can be closed and Phase 1 may
begin.
