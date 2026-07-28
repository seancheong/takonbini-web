# Vercel Hobby feasibility envelope for the Takonbini scraper

**Status:** Decision research  
**Researched:** 2026-07-28  
**Question:** Can a weekly, three-store discovery-and-chunk pipeline run as Vercel Workflow on Hobby while staying at strict `$0` and below 50% of every relevant included allowance?

## Decision

**Reject Vercel Hobby as the execution host for the Takonbini scraper.**

This is a policy decision, not a capacity estimate. Vercel's current Fair Use Guidelines put **“Scrapers” under “Never fair use.”** Those guidelines apply across plans and usage-based resources; Hobby is additionally restricted to non-commercial personal use. A benchmark below every numerical allowance would therefore still not make a Vercel-hosted scraper compliant.[^fair-use]

The agreed combination—Vercel-hosted Workflow, strict `$0`, and scraper execution—has no feasible envelope. The next architecture decision should compare policy-compliant `$0` execution hosts. Vercel may continue to host the web app, but its Hobby Functions or Workflow steps should not launch browsers or scrape the retailer sites.

## Current workload facts

The current scraper is materially different from a lightweight scheduled HTTP call:

- It is a Node.js service using Playwright 1.57 and full Chromium.
- Local execution uses the official Playwright container image. Each store service is currently budgeted for 1 CPU and up to 4 GB of memory in Docker Compose.
- Lawson and FamilyMart each perform discovery and product-detail browsing in a single scraper invocation.
- Seven-Eleven already supports separate `discovery` and `process` modes. Discovery writes a JSON manifest; process mode takes `skip` and `limit`, then browses detail pages with configurable concurrency.
- Translation and MongoDB upserts happen after scraping. Existing translations are reused when the stable product ID and Japanese source text still match.
- The current operational path is manual, with three store-specific containers. The planned target is a weekly schedule and consistent discovery → deterministic chunks for all three stores.

The public architecture note records the current manual Docker/Playwright flow, OpenAI translation, MongoDB writes, and 14-day product TTL.[^architecture] The implementation facts above were verified read-only against the private API repository's `main` branch on 2026-07-28; no source, data, or credentials were changed or copied into this repository.

## The numerical 50% envelope

These figures do **not** reverse the policy rejection. They define the benchmark that would have applied if scraper use were permitted, and remain useful if a future Vercel policy explicitly allows this workload.

| Meter or limit | Hobby allowance / limit | Agreed 50% gate | Consequence |
| --- | ---: | ---: | --- |
| Active CPU | 4 CPU-hours/month | **2 CPU-hours/month** | Browser rendering and page processing consume this meter; network and database wait time does not.[^function-pricing] |
| Provisioned memory | 360 GB-hours/month | **180 GB-hours/month** | Hobby Functions are fixed at 2 GB / 1 vCPU, so this is at most **90 aggregate instance-wall-hours/month** at the gate. Memory continues accruing during I/O.[^function-pricing][^function-limits] |
| Function invocations | 1,000,000/month | **500,000/month** | All attempts count, including failed and retried work.[^function-pricing] |
| Workflow events | 50,000/month | **25,000/month** | A normal step creates three events; every retry adds at least a retry event.[^workflow-pricing] |
| Workflow data written | 1 GB/month | **0.5 GB/month** | Includes persisted workflow state, event logs, and stream data.[^workflow-pricing] |
| Workflow retained data | No Hobby allowance listed | **No computable 50% gate** | Hobby retains managed persistence for one day, but the pricing table says retained-data usage is not available on Hobby. Do not assume an allowance without Vercel confirmation.[^workflow-pricing] |
| Edge requests | 1,000,000/month | **500,000/month** | Relevant to the Cron trigger and any public/control endpoints; it is not a measure of requests from Chromium to retailer sites.[^limits] |
| Fast Data Transfer | 100 GB/month | **50 GB/month** | Relevant to bytes delivered out through Vercel's network.[^limits] |
| Fast Origin Transfer | Up to 10 GB/month | **5 GB/month** | Relevant to transfer between Vercel's CDN and Functions, not arbitrary browser downloads from retailer origins.[^limits] |
| Cron jobs | 100/project; minimum interval once/day | N/A | A weekly expression is allowed, but Hobby timing is only precise to the hour (±59 minutes).[^cron-pricing] |

Workflow uses Vercel Queues for orchestration, and Vercel says Queue API operations are separately metered in 4 KiB units.[^workflow-pricing][^queue-pricing] The current public pricing material does not state a Hobby Queue allowance clearly enough to derive a 50% gate. That is another unresolved entitlement, though the fair-use prohibition already decides this ticket.

Included Function usage is shared at the Hobby team level. A hypothetical benchmark would need to subtract the existing web application's monthly usage from each gate, not assume all included capacity belongs to the scraper.[^hobby]

## Execution constraints even before usage

Each Workflow step runs as a Vercel Function. A Workflow run may suspend and resume without an overall duration limit, but on Hobby each individual Node.js step is limited to **300 seconds**, **2 GB memory**, and **1 vCPU**. The standard uncompressed Function bundle limit is **250 MB**, request and response bodies are limited to **4.5 MB**, and 1,024 file descriptors are shared with the runtime.[^workflow-pricing][^function-limits]

The runtime filesystem is read-only except for up to **500 MB** in `/tmp`.[^runtimes] A manifest therefore must live in durable external storage rather than a local JSON file between steps.

Browser packaging is not proven. Vercel's own Puppeteer guide says the standard Puppeteer package is too large for the 250 MB bundle and uses `puppeteer-core` plus the community-maintained `@sparticuz/chromium-min` instead.[^puppeteer] That is evidence that the current full Playwright container cannot simply be moved into a Function. A deployed proof would still need to establish:

- compressed and uncompressed bundle size;
- Chromium extraction size and `/tmp` use;
- cold-start overhead;
- peak memory under the fixed 2 GB allocation;
- retailer compatibility of the serverless Chromium build;
- reliable completion of every discovery and chunk within five minutes.

The existing Docker limit of up to 4 GB per store makes the fixed 2 GB Hobby ceiling a concrete risk, not proof of incompatibility. Only measurement can establish actual peak resident memory.

## Scheduling and failure semantics

A weekly Vercel Cron expression is technically allowed and runs in UTC, but Hobby may trigger at any time within the selected hour.[^cron][^cron-pricing] Cron delivery is best effort: Vercel does not retry failed invocations, a scheduled request may be missed, and the same schedule may occasionally be delivered more than once. Overlap is also possible. Vercel therefore recommends a distributed lock plus idempotent, reconciliation-based processing.[^cron-management]

Workflow improves step-level recovery: an unhandled step error retries three times by default (four total attempts), retry limits are configurable, and a stable `stepId` can be used as an idempotency key.[^workflow-errors] Those retries amplify Function and Workflow usage and do not remove the need for:

- a run-level lock;
- deterministic manifest and chunk identities;
- idempotent database writes;
- store-isolated publication;
- validation that prevents an empty or suspicious discovery from refreshing availability;
- durable run state outside ephemeral Function storage.

## Benchmark that would still be required elsewhere

The policy answer means **do not deploy this scraper to Vercel merely to benchmark it**. A representative benchmark should instead run on the selected policy-compliant candidate using the same proposed step boundaries.

For one complete three-store weekly run, record:

1. Discovered products, chunk size/count, detail successes/failures, reused translations, new translations, and MongoDB upserts per store.
2. Wall time, active CPU, peak resident memory, browser launches/restarts, temporary disk, and outbound/inbound bytes for each discovery and chunk.
3. Retry count and the resource amplification from a controlled transient failure.
4. Artifact/container size and cold-start/startup time.
5. Completion under the candidate host's per-task duration and memory limits.
6. Store-isolated publication and preservation of the previous catalog when discovery is empty or a store fails.

For comparison with the historical Vercel gate, extrapolate each measured meter as:

```text
projected monthly usage
  = normal complete-run usage × 4.35 weekly runs/month
  + explicit retry/failure reserve
  + existing team/project baseline usage
```

Every applicable meter would need to remain below its gate independently; spare invocation capacity cannot offset excess CPU, memory, Workflow data, or transfer. The strict `$0` requirement also means an unlisted or ambiguous entitlement is a blocker until the provider confirms it.

## Implications for the Wayfinder map

- Close the Vercel Hobby feasibility branch of the architecture decision as **not policy-compliant**.
- Add a research decision comparing `$0`, scraper-permitted execution hosts that can run a Playwright container weekly with durable discovery manifests and bounded chunk jobs.
- Preserve the discovery/chunk refactor as host-neutral application code. Scheduling and orchestration should remain adapters.
- Treat Vercel Workflow as out of scope for scraper execution unless Vercel changes its published policy or grants explicit written permission; resource benchmarking alone cannot reopen it.

## Sources

All external sources below are first-party Vercel materials, accessed 2026-07-28.

[^fair-use]: Vercel, [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines). The rendered “Never fair use” list includes “Scrapers”; the page also limits Hobby to non-commercial personal use.
[^architecture]: Takonbini, [Architecture Notes](../../architecture.md#scraping-service-mvp-local-execution).
[^hobby]: Vercel, [Hobby Plan](https://vercel.com/docs/plans/hobby).
[^limits]: Vercel, [Limits](https://vercel.com/docs/limits).
[^function-pricing]: Vercel, [Fluid compute pricing](https://vercel.com/docs/functions/usage-and-pricing).
[^function-limits]: Vercel, [Vercel Functions Limits](https://vercel.com/docs/functions/limitations).
[^runtimes]: Vercel, [Runtimes](https://vercel.com/docs/functions/runtimes#file-system-support).
[^workflow-pricing]: Vercel, [Workflow Pricing and Limits](https://vercel.com/docs/workflows/pricing).
[^queue-pricing]: Vercel, [Queues Pricing and Limits](https://vercel.com/docs/queues/pricing).
[^cron]: Vercel, [Cron Jobs](https://vercel.com/docs/cron-jobs).
[^cron-pricing]: Vercel, [Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing).
[^cron-management]: Vercel, [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
[^workflow-errors]: Vercel Academy, [Workflow Error Handling](https://vercel.com/academy/svelte-on-vercel/workflow-error-handling).
[^puppeteer]: Vercel, [Deploying Puppeteer with Next.js on Vercel](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel).
