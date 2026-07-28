# $0 execution host for the Takonbini scraper

**Status:** Decision research  
**Researched:** 2026-07-29  
**Question:** Which scraper-permitted host can run Takonbini's private-repository, weekly three-store Playwright discovery-and-chunk pipeline at a recurring infrastructure cost of `$0`?

## Decision

**Use Google Cloud Run Jobs in `us-central1` as the primary execution host, subject to the deployment gates below. Use Apify Free as the fallback. Do not use GitHub-hosted Actions as the production scraper runtime.**

Cloud Run is the strongest managed fit because Google explicitly documents headless Chrome and Playwright for “large-scale web scraping and data extraction,” its general acceptable-use policy contains no scraper category ban, and Jobs provide container execution, scheduling, secrets, retries, parallel tasks, and execution logs.[^cloud-run-browser][^gcp-aup][^cloud-run-jobs] The private GitHub repository can remain private: Cloud Build supports GitHub repository connections and stores the connection token in Secret Manager.[^cloud-build-github]

This is a **conditional `$0` decision**, not a claim that unmeasured usage is free forever. Before production scheduling, a representative three-store run must prove all of the following:

1. At `1 vCPU / 2 GiB`, projected normal runs plus a failure reserve stay below **120,000 vCPU-seconds and 225,000 GiB-seconds per month** (50% of Cloud Run's included compute).
2. The one retained, optimized Chromium-only image stays at or below **0.5 GiB-month** in Artifact Registry; old tags and layers are removed.
3. Monthly outbound internet data stays below **0.5 GiB** (50% of the 1 GiB North America free allowance) and logs stay below **25 GiB** (50% of the 50 GiB project allowance).
4. The MongoDB Atlas connection works without paid static-egress infrastructure and without weakening the project's approved network-security posture.
5. Cloud billing is protected with quotas, a Cloud Run spend cap where available, and alerts. Spend caps are a useful last line of defence, not a guarantee of exactly zero: enforcement is not instantaneous and in-flight work can accrue charges.[^gcp-spend-cap]

At 4.35 weekly runs per month, the 50% compute gate at `1 vCPU / 2 GiB` is approximately **7.18 aggregate task-hours per weekly run**. Memory is the binding meter: `225,000 GiB-seconds / 2 GiB / 3,600 / 4.35 = 7.18 hours`. This is enough to justify a benchmark, but repository observations alone do not prove the pipeline fits.

If any hard gate fails, do not silently accept a paid overage. Test Apify Free next. If Apify's `$5` monthly hard cap cannot hold the representative workload, the strict `$0` managed-host constraint is infeasible; the remaining operational fallback is an already-owned machine/self-hosted runner, which has no hosting invoice but does have reliability, maintenance, and electricity costs.

## Current workload facts

These are read-only observations from the private API repository at commit `30ed125` on 2026-07-29. They are **not** production runtime projections:

- The scraper uses Node.js, Playwright `1.57.0`, and the official `mcr.microsoft.com/playwright:v1.57.0-jammy` base image.
- Docker Compose defines one container each for Lawson, FamilyMart, and Seven-Eleven, with limits of `1 CPU / 4 GiB` per container.
- All three scrapers default to detail-page concurrency `5`; the shared page timeout is 60 seconds.
- Local historical result files contained 742 Lawson, 1,668 FamilyMart, and 2,120 Seven-Eleven products. An untracked Seven-Eleven discovery manifest contained 2,159 entries. Counts show workload shape only; they do not establish duration, transfer, or memory.
- Seven-Eleven already has `discovery` and `process` modes with `skip` and `limit`; Lawson and FamilyMart still combine discovery and detail processing.
- Translation uses the OpenAI API and persistence uses MongoDB Atlas. The public architecture note documents translation reuse, MongoDB upserts, three store-specific containers, and a 14-day catalog TTL.[^architecture]

The benchmark therefore needs the **actual current private repository**, not a synthetic hello-world browser. It must record per-store discovery count, detail count, wall time, allocated CPU/memory time, peak RSS, external transfer, retries, image size, log volume, translation calls, and database writes.

## Candidate comparison

| Candidate | Scraping / browser policy | Private source | Runtime and orchestration | `$0` position | Decision |
| --- | --- | --- | --- | --- | --- |
| **Google Cloud Run Jobs** | Affirmative first-party guide for Chrome/Playwright scraping; general AUP still requires lawful, authorized use.[^cloud-run-browser][^gcp-aup] | Cloud Build connects GitHub repositories, including private access via the GitHub App/token.[^cloud-build-github] | Up to 10,000 tasks, configurable parallelism, 0–10 retries, and task timeouts up to 168 hours; Cloud Scheduler triggers jobs.[^cloud-run-jobs][^cloud-run-schedule] | 240k vCPU-s, 450k GiB-s, 1 GiB North America egress monthly; 3 Scheduler jobs, 6 active secret versions/10k accesses, 2,500 build-minutes, 0.5 GiB-month artifacts, and 50 GiB logs have free allowances.[^cloud-run-pricing][^scheduler-pricing][^secret-pricing][^cloud-build-pricing][^artifact-pricing][^logging-pricing] | **Primary, conditional on gates.** |
| **Apify Free** | Actors are explicitly for web scraping and browser automation; its AUP governs legality/authorization.[^apify-actors][^apify-aup] | Native GitHub integration supports private repositories via deployment key and custom Actor Dockerfiles.[^apify-github] | Scheduled Docker Actors, configurable memory/timeout, secret inputs, logs/storage, 16 GiB per run/combined, and 25 concurrent runs.[^apify-schedule][^apify-limits][^apify-secrets] | `$5` monthly usage, no card required, and free users are blocked until the next cycle when exhausted. At `$0.20/CU`, 4 GiB costs `$0.80/hour` before transfer/storage, giving at most 6.25 hours/month; 2 GiB gives 12.5 hours/month.[^apify-pricing][^apify-usage] | **Fallback: safer hard cost ceiling, much tighter capacity.** |
| **GitHub-hosted Actions** | No scraper-specific ban, but current terms prohibit using Actions as part of a serverless application and restrict hosted-runner work to production/testing/deployment/publication associated with the repository. Treat a recurring production ingestion runtime as too ambiguous without written GitHub approval.[^github-terms] | Native and strongest private-repository access. | Private `ubuntu-latest` has 2 CPU, 8 GiB RAM, 14 GiB disk; jobs max at 6 hours; schedules are best-effort and may be delayed or dropped.[^github-runners][^github-limits][^github-schedule] | GitHub Free includes 2,000 Linux minutes and 500 MB artifacts monthly; with no valid payment method, execution blocks at quota.[^github-billing] | **Reject for production execution; retain for CI/deployment only.** |
| Render / Railway / Fly.io | Technically capable of containers or scheduled work, but cost decides them. | All can connect source or deploy images. | Render cron supports up to 12-hour runs; the others provide metered compute. | Render cron has a `$1` monthly minimum; Railway's durable plans/usage are billed after limited free trial/credit; Fly states there is no current free tier for new accounts.[^render-cron][^railway-pricing][^fly-pricing] | **Reject under strict recurring `$0`.** |

## Why Cloud Run is the primary

### Browser compatibility and execution envelope

Cloud Run's own browser-automation documentation names Playwright and web scraping, eliminating the policy mismatch that rejected Vercel Hobby.[^cloud-run-browser] Jobs run arbitrary Linux x86-64 container images to completion. A task defaults to 10 minutes but can be configured up to 168 hours; failed tasks support 0–10 retries, and a job can divide work into as many as 10,000 indexed tasks with bounded parallelism.[^cloud-run-jobs][^cloud-run-contract]

The first benchmark should start at `1 vCPU / 2 GiB`, not copy the local 4 GiB ceiling without measurement. Cloud Run allows up to 4 GiB with one vCPU, but every allocated GiB-second is metered and browser memory must include Chromium plus the in-memory filesystem.[^cloud-run-memory] If 2 GiB is unstable, test 4 GiB and recompute the envelope: the 50% memory gate then falls to about **3.59 aggregate hours/week**.

### Schedule, retries, and logs

Use at most three Cloud Scheduler jobs—one per store or one orchestrator plus bounded continuations—because each billing account gets three scheduler jobs free.[^scheduler-pricing] Scheduler provides at-least-once delivery and configurable retry backoff, so every run needs an idempotency key derived from store plus scheduled time. Duplicate delivery must not refresh TTL twice, publish a partial catalog, or overlap the same discovery generation.[^scheduler-delivery]

Cloud Run retry counts apply per failed task, and logs include execution name, task index, and task attempt. Container output and platform logs flow automatically to Cloud Logging; the most recent 1,000 executions remain visible in the Jobs execution pane, while older logs follow Logging retention.[^cloud-run-logging][^cloud-run-executions] Keep structured, bounded summary logs and default 30-day retention; the first 50 GiB/project/month are included.[^logging-pricing]

### Secrets and outbound services

Store `MONGODB_URI` and `OPENAI_API_KEY` in Secret Manager and expose pinned secret versions as environment variables (or mount files for rotation). The free allowance covers six active versions and 10,000 access operations per billing account each month.[^cloud-run-secrets][^secret-pricing]

OpenAI and retailer requests use ordinary outbound internet access. MongoDB Atlas is the hard networking gate: Atlas only accepts clients on its project IP access list and recommends the smallest possible network segments.[^atlas-access][^atlas-security] Cloud Run uses a dynamic egress pool by default. A fixed outbound address requires VPC egress plus Cloud NAT and a reserved IP, introducing paid resources.[^cloud-run-static-ip]

Therefore:

- If the approved Atlas posture already supports dynamic public clients, use a least-privilege scraper database user, TLS, credential rotation, and audit logs.
- Do **not** add `0.0.0.0/0` merely to satisfy this host choice; MongoDB recommends more restrictive controls and warns on wildcard access.[^atlas-public]
- If a narrow `/32` allowlist is mandatory, plain Cloud Run and standard GitHub-hosted runners both fail strict `$0`. Use an already-owned static-egress runner or relax the cost constraint for managed static egress.

### Private repository and image lifecycle

Cloud Build can connect the private GitHub API repository, invoke builds on pushes, and publish the scraper image. Its default pool includes 2,500 build-minutes per billing account per month, but that allowance is promotional and subject to change.[^cloud-build-github][^cloud-build-pricing]

Artifact Registry is the most fragile non-compute allowance: only 0.5 GiB-month is free across the billing account.[^artifact-pricing] The existing full Playwright base image is not evidence that the stored production image fits. Build a pinned, Chromium-only, multi-stage image, retain one deployable version, enable lifecycle cleanup, and record the **stored compressed image plus layers**. If one required image remains above 0.5 GiB-month, Cloud Run fails the strict `$0` gate even when runtime is free.

## Apify fallback envelope

Apify is the clearest policy fallback because its product definition explicitly includes web scraping, browser automation, schedules, private Actors, Dockerfiles, and storage.[^apify-actors] The Free plan requires no credit card, supplies `$5` monthly usage, and blocks further access after the credit is exhausted, so it provides a stronger practical zero-dollar ceiling than a general pay-as-you-go cloud.[^apify-pricing]

Its capacity is much tighter:

- `4 GiB × 1 hour = 4 CU = $0.80`, so `$5` buys 6.25 compute-hours/month before storage, proxy, or external transfer.
- `2 GiB × 1 hour = 2 CU = $0.40`, so `$5` buys 12.5 compute-hours/month before those other meters.
- External transfer is `$0.20/GB`; datasets, key-value stores, and request queues consume the same `$5` credit.[^apify-pricing]
- Free users have 16 GiB maximum run memory and maximum combined memory, 25 concurrent runs, a 30-minute build timeout, and log-size limits.[^apify-limits]

At the conservative 50% gate, only `$2.50` may be projected: **3.125 hours/month at 4 GiB** or **6.25 hours/month at 2 GiB**, less transfer and storage. Apify should be tested only if Cloud Run fails a non-policy gate; it is likely to require smaller chunks and aggressive reuse of translations.

## GitHub Actions disposition

GitHub Actions is technically attractive: the private repository is native, standard Ubuntu runners have enough nominal memory for Playwright, secrets and logs are built in, and GitHub Free provides 2,000 private-repository minutes monthly.[^github-runners][^github-secrets][^github-billing] But the current additional terms say Actions must not be used as part of a serverless application and limit hosted-runner work to the associated repository's software lifecycle.[^github-terms]

A weekly catalog ingestion run could plausibly be described as producing or publishing the API project's data, but it also closely resembles using Actions as free scheduled production compute. That ambiguity is avoidable because Cloud Run affirmatively documents this exact workload. Use Actions for tests, image checks, and deployment; do not schedule the scraper there unless GitHub Support gives written approval for this specific production ingestion pattern.

Even with approval, its free envelope is not yet proven: 2,000 minutes/month is about 459 aggregate Linux minutes per weekly run at 4.35 runs/month before other private workflows or retries, and every hosted job has a six-hour ceiling.[^github-billing][^github-limits]

## Deployment gates for the next task

Issue #14 chooses a host; it does not authorize deployment. The workflow-design task should not proceed past implementation-ready design until these gates are recorded from a representative run:

1. **Legality:** confirm each retailer's terms/robots and access pattern separately. A host permitting scraping does not grant rights to scrape a target.
2. **Compute:** project monthly vCPU-seconds and GiB-seconds using `normal run × 4.35 + one bounded retry reserve`; remain below the 50% gates.
3. **Image:** stored Artifact Registry usage at or below 0.5 GiB-month with cleanup enabled.
4. **Transfer:** Cloud Run external transfer below 0.5 GiB/month; OpenAI and MongoDB traffic included.
5. **Network:** approved Atlas access without wildcard expansion or paid VPC/NAT.
6. **Correctness:** deterministic discovery generation and chunk IDs, idempotent upserts, a run lock, store-isolated publication, and no TTL refresh from empty/suspicious discovery.
7. **Observability:** structured per-store summaries and bounded logs; no raw secrets, descriptions, or full page bodies.
8. **Cost response:** automated stop/alert behavior documented for every metered service, including Artifact Registry and networking—not Cloud Run compute alone.

Failure of gates 2–5 sends the benchmark to Apify. Failure of Apify's `$2.50` conservative gate means the strict `$0` managed-host requirement is infeasible and must be renegotiated rather than hidden in an overage.

## Sources

All external sources are first-party provider documentation, pricing, or terms accessed 2026-07-29.

[^architecture]: Takonbini, [Architecture Notes](../../architecture.md#scraping-service-mvp-local-execution).
[^cloud-run-browser]: Google Cloud, [Browser and OS automation in Cloud Run](https://docs.cloud.google.com/run/docs/browser-automation).
[^gcp-aup]: Google Cloud, [Acceptable Use Policy](https://cloud.google.com/terms/aup).
[^cloud-run-jobs]: Google Cloud, [Create jobs](https://cloud.google.com/run/docs/create-jobs).
[^cloud-run-contract]: Google Cloud, [Container runtime contract](https://docs.cloud.google.com/run/docs/container-contract).
[^cloud-run-memory]: Google Cloud, [Configure memory limits for jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/memory-limits).
[^cloud-run-schedule]: Google Cloud, [Execute jobs on a schedule](https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule).
[^scheduler-delivery]: Google Cloud, [About Cloud Scheduler](https://docs.cloud.google.com/scheduler/docs/overview).
[^cloud-run-pricing]: Google Cloud, [Cloud Run pricing](https://cloud.google.com/run/pricing).
[^scheduler-pricing]: Google Cloud, [Cloud Scheduler pricing](https://cloud.google.com/scheduler/pricing).
[^cloud-run-secrets]: Google Cloud, [Configure secrets for jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/secrets).
[^secret-pricing]: Google Cloud, [Secret Manager pricing](https://cloud.google.com/secret-manager/pricing).
[^cloud-build-github]: Google Cloud, [Connect to a GitHub repository](https://docs.cloud.google.com/build/docs/automating-builds/github/connect-repo-github).
[^cloud-build-pricing]: Google Cloud, [Cloud Build pricing](https://cloud.google.com/build/pricing).
[^artifact-pricing]: Google Cloud, [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing).
[^cloud-run-logging]: Google Cloud, [Logging and viewing logs in Cloud Run](https://docs.cloud.google.com/run/docs/logging).
[^cloud-run-executions]: Google Cloud, [Manage job executions](https://docs.cloud.google.com/run/docs/managing/job-executions).
[^logging-pricing]: Google Cloud, [Observability pricing](https://cloud.google.com/products/observability/pricing).
[^gcp-spend-cap]: Google Cloud, [Manage spend cap budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).
[^cloud-run-static-ip]: Google Cloud, [Static outbound IP address](https://docs.cloud.google.com/run/docs/configuring/static-outbound-ip).
[^atlas-access]: MongoDB, [Manage the IP access list](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/).
[^atlas-security]: MongoDB, [Guidance for Atlas network security](https://www.mongodb.com/docs/atlas/architecture/current/network-security/).
[^atlas-public]: MongoDB, [Atlas Network Protection Layer](https://www.mongodb.com/docs/atlas/security/network-protection-layer/).
[^apify-actors]: Apify, [Actors](https://docs.apify.com/actors).
[^apify-pricing]: Apify, [Pricing](https://apify.com/pricing).
[^apify-usage]: Apify, [Usage and resources](https://docs.apify.com/actors/running/usage-and-resources).
[^apify-github]: Apify, [GitHub integration](https://docs.apify.com/integrations/github).
[^apify-schedule]: Apify, [Schedules](https://docs.apify.com/actors/running/schedules).
[^apify-limits]: Apify, [Limits](https://docs.apify.com/account/limits).
[^apify-secrets]: Apify, [Secret input](https://docs.apify.com/actors/development/actor-definition/input-schema/secret-input).
[^apify-aup]: Apify, [Acceptable Use Policy](https://docs.apify.com/legal/acceptable-use-policy).
[^github-terms]: GitHub, [Terms for Additional Products and Features — Actions](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features#actions).
[^github-runners]: GitHub, [GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
[^github-limits]: GitHub, [Actions limits](https://docs.github.com/en/actions/reference/limits).
[^github-schedule]: GitHub, [Events that trigger workflows — schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
[^github-billing]: GitHub, [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
[^github-secrets]: GitHub, [Secrets reference](https://docs.github.com/en/actions/reference/security/secrets).
[^render-cron]: Render, [Cron jobs](https://render.com/docs/cronjobs).
[^railway-pricing]: Railway, [Pricing](https://docs.railway.com/pricing).
[^fly-pricing]: Fly.io, [Cost management](https://fly.io/docs/about/cost-management/).
