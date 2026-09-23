# Phase 2 amendment: local Store Refresh execution

> The local Mac execution choice and workstation-impact gate remain in force.
> The MongoDB-backed shadow, publication, API cutover, and schedule timing below
> are superseded by the [fresh-start DynamoDB cutover plan](./fresh-start-dynamodb-cutover-and-mongodb-retirement.md).

**Status:** Accepted

**Decided:** 2026-09-19

**Replaces:** The Cloud Run and Apify host choice in the original Wayfinder plan

**Tracking:** [#28 — hosted benchmark](https://github.com/seancheong/takonbini-web/issues/28), [#34 — local runner](https://github.com/seancheong/takonbini-web/issues/34)

## Decision

Run the weekly Lawson, FamilyMart, and Seven-Eleven Store Refresh on the owner's
Mac. Use the local sequential runner from the private API repository, keep
publication disabled, and do not install its optional macOS schedule until one
complete manual three-store shadow refresh and the required recovery checks
succeed.

The project remains a personal project without funding. Paying for a hosted
Chromium service that runs for close to an hour per store each week does not
provide enough operational value to justify its cost or setup burden. Local
execution preserves the hard parts already built for reliability: immutable
manifests, deterministic chunks, leases, resumability, candidate generations,
translation reuse, and publication isolation.

## What was tried

The experiments used shadow data and kept scheduling and publication disabled.
Private run identifiers, credentials, retailer content, and database details
remain in the private operational record.

| Trial | Result | Decision evidence |
| --- | --- | --- |
| Cloud Run container and dormant three-task job | The Chromium image and guarded job were deployed. The first three-store execution exposed discovery and resume failures. After fixes, the second execution exhausted retries; FamilyMart repeatedly reached the 30-minute task limit and no store produced a ready result. | The workload was not shown to complete reliably on the proposed job shape. Retained registry storage also measured about 569 MB at one snapshot, above the 0.5 GiB gate. |
| Apify read-only diagnostics and one-product probe | Credentials, database reads, Chromium launch, and resumable state were verified without publication. | The platform could run the code, so later failures were workload feasibility problems rather than an unknown integration problem. |
| Two-minute Lawson trials | Two bounded runs each cost about USD 0.014 and timed out before completing a 100-product chunk. Four workers improved progress, but completed translations averaged about 12.5 seconds of provider wait each. | Translation and detail processing made short serverless-style limits impractical. |
| Translation batching and a 15-minute Lawson restart | Four-product batching worked, but the run cost USD 0.103 and timed out after completing only two chunks and part of a third. | Batching alone did not make the end-to-end workload fast enough. |
| Browser reuse and resource blocking | Local Lawson discovery fell from about 244 seconds to 114 seconds. The final bounded Apify trial ran for 676 seconds, cost USD 0.075, and staged 159 additional products, about 14.1 products per minute. | The optimized rate projected a fresh Lawson run at roughly 56 minutes and USD 0.37. |
| Conservative monthly projection | A weekly Lawson run projected near USD 1.50 per month. Three stores with similar workload projected about USD 4.50 per month before OpenAI and database costs. | This exceeded the accepted USD 2.50 monthly fallback gate. Running the other stores could only add cost and could not make that gate pass. |

The Cloud Billing overview later reported RM0.01 net for the Cloud Run work at
the recorded check. That small billed amount does not reverse the decision:
Cloud Run still failed the completion, retry, time, and registry gates, while
the fallback that made measurable progress exceeded the accepted recurring
budget.

## Accepted local shape

```text
manual command
  -> overlap lock
  -> Lawson
  -> FamilyMart
  -> Seven-Eleven
  -> aggregate result

optional launchd schedule
  -> enabled only after the manual shadow gate passes
```

- Secrets are read from a user-only file outside the repository.
- Stores run sequentially to keep CPU and memory use predictable.
- The runner always forces shadow mode and disables publication during Phase 2B.
- A stopped run resumes from persisted manifests and completed chunks.
- A nonzero store result stops acceptance but does not expose partial candidate
  data to catalog readers.

## Revised rollout sequence

```text
0. Security and baselines
   -> 1. Scraper module and additive data model
   -> 2B. Local manual shadow refresh and recovery verification
   -> 3. Store publication canaries
   -> 4. Reversible API generation-read cutover
   -> 5. Two successful weekly local cycles
   -> remaining web releases and evidence work
```

The original shadow, recovery, publication, API cutover, and evidence gates
still apply. Only the execution host and scheduling mechanism changed.

## Phase 2B exit gate

- One complete manual three-store shadow refresh succeeds locally.
- Every frozen manifest reconciles with its candidate generation.
- The legacy catalog and publication pointers remain unchanged.
- A stopped process resumes without losing completed chunks.
- The private environment file remains outside the repository with user-only
  permissions.
- A workstation impact drill sets the allowed run window, power and sleep
  requirements, local resource limits, and stop/resume behavior.
- The optional weekly schedule remains disabled until these checks pass.

## Workstation impact drill before scheduling

The first successful manual run must record per-store wall time and the Mac's
peak CPU and memory use. Before installing the weekly schedule, decide:

- the hours when a long Chromium run will not interrupt normal work;
- whether a run may start only while the Mac is on AC power and awake;
- how many browser workers the Mac can sustain without affecting interactive
  use;
- whether the runner should use a lower process priority;
- the maximum run duration and network usage that remain acceptable;
- how the owner stops a run immediately and later resumes completed chunks.

Use the lowest worker count that meets the weekly freshness goal. Prefer an
idle overnight window, but keep a manual command as the reliable fallback when
the Mac was asleep or unavailable.

## When to revisit hosted execution

Re-evaluate a hosted runner only when at least one of these changes:

- the project has a recurring infrastructure budget;
- the catalog needs an unattended availability target that a personal machine
  cannot meet;
- retailer and translation latency fall enough to change the measured runtime;
- a provider offers an enforceable spending cap and a measured monthly cost
  inside the project's accepted budget.

Until then, Cloud Run and Apify are closed experiments rather than fallback
deployment targets.
