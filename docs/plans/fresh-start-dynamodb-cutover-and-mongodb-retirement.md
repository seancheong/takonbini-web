# Fresh-start DynamoDB cutover and MongoDB retirement

_Decision date: 2026-09-23. This is a sequenced implementation specification, not authorization to provision infrastructure, switch traffic, or delete MongoDB._

## Outcome and governing decisions

Build a fresh three-store catalog in the approved Tokyo DynamoDB tables, make
DynamoDB the sole refresh writer, switch public API reads after a complete
validated bootstrap, and retire MongoDB in the same controlled change window.
No MongoDB products, translations, candidates, workflow history, or absence
counts are copied or exported. The first successful observation starts every
verified product as active with absence count zero.

This plan implements the [Wayfinder map](https://github.com/seancheong/takonbini-web/issues/36)
using the approved [table and lifecycle model](../research/clean-sheet-dynamodb-table-and-index-model.md),
[catalog and search publication protocol](../research/catalog-search-publication-protocol.md),
and [sub-RM1 operations envelope](../research/sub-rm1-terraform-and-operations-envelope.md).
Those decisions govern keys, immutable data, lifecycle reconciliation, search
versioning, leases, cleanup, cost admission, and runtime authority. The local
Mac remains the initial writer; hosted refresh compute is a later decision.

The two cutovers are distinct. **Refresh-write cutover** makes DynamoDB the
only workflow and publication write destination. **Public-read cutover** moves
the API's public reads to the exact DynamoDB Publication Snapshot. A public
request never combines data from the two stores or silently falls back to an
older search projection.

## Ordered delivery

Each numbered increment is separately reviewable. A later increment cannot
advance past its gate because an earlier increment merely deployed.

| Increment | Change | Gate before advancing | Recovery while gated |
| --- | --- | --- | --- |
| 1. Additive infrastructure and release seam | In the private API repository, add the three protected, index-free Standard on-demand tables, scoped short-lived writer role, API read role, free budget notification, tags, and cost accounting in the existing Terraform state. Add a production Lambda alias in a separate compatibility release and point API Gateway at the verified legacy version. | Review Terraform plan and role allow/deny probes, confirm Tokyo Region and deletion protection, verify existing Mongo reads through the alias, and rehearse alias reversal. | Keep the alias on the known-good legacy version; revert the reviewed additive Terraform change if necessary. |
| 2. DynamoDB refresh foundation | Add base-key repositories, immutable manifests and candidates, leases, translated-product reuse, lifecycle deltas, Browse Projections, bounded cleanup, and local cost admission behind a default-off path. Make the local runner sequential and use the approved assumed role. | Characterization, DynamoDB integration, least-privilege, interruption, resumability, lifecycle, and cost tests pass. Existing public reads remain on Mongo. | Disable the new writer path; keep incomplete candidates invisible. |
| 3. Snapshot publication and search | Add snapshot-scoped MiniSearch chunk construction, content/digest verification, the global fenced publication lease, normal six-action publication, eight-action empty bootstrap, rollback, repair, projection maintenance, and cleanup safety. | Prove search and catalog publish as one snapshot, 350 KiB decoded chunk bound, unknown-transaction recovery, race safety, and direct browse when search fails. | Leave pointers unchanged; resume verified immutable work under a new fence. |
| 4. DynamoDB API read mode | Add a default-off DynamoDB mode to the API and preserve the existing public product contract. Read the three pointers atomically, use strong base-key reads, bind cursors and cache to the snapshot, and return explicit stale-cursor and search-unavailable outcomes. Publish an immutable candidate Lambda version and test it without moving the production alias. | Cross-repository fixtures, public-contract tests, full sitemap enumeration, cold/warm latency, and the 205 MiB complete-API cold-load gate pass. A mid-pagination error must not produce a successful incomplete sitemap. | Keep the alias on legacy and redeploy the prior verified API version for a code regression. |
| 5. Web compatibility | In a separate web release, handle explicit stale/invalid cursors, exhausted pagination, and search unavailable while keeping store/category browse usable. Preserve existing route, localization, SSR, and accessibility behavior. | CI, preview, contract fixtures, keyboard and responsive checks, production verification, and the web release observation gate pass against the still-legacy API. | Revert only the web release using its recorded commit and reproducible deployment. |
| 6. Three-store shadow and bootstrap | Use the final production DynamoDB tables with public DynamoDB reads disabled. Run one fresh, manual, sequential Lawson, FamilyMart, then Seven-Eleven shadow refresh. Reuse only the exact frozen, complete, verified candidates for one atomic three-store bootstrap and one matching Search Projection. Reconcile each store's lifecycle after the pointer transaction. | Every manifest, chunk, product, translation, lifecycle delta, Browse Projection, and search chunk reconciles by count and digest. All three stores are nonempty and pass discovery safety checks. Shadow recovery drills, empty-table rebuild drill, cost and memory gates, and the workstation-impact drill pass. Three pointers commit together and all lifecycle reconciliations finish before DynamoDB public reads can be enabled. | With public reads still on frozen Mongo, repair or discard unpublished work under the approved cleanup rules. A partial or changed candidate requires a new verified attempt. |
| 7. Refresh-write cutover | Disable every legacy Mongo writer, including scheduled and manual legacy commands. Make the local runner's future workflow, translation, candidate, and publication writes DynamoDB-only. Keep the Mongo API on read-only credentials. | Prove no Mongo writes or hidden writer remain, the DynamoDB runner resumes safely, cost admission is active, and a blocked run cannot automatically restart. Keep weekly scheduling disabled. | Pause DynamoDB publication and correct or resume its work; do not restart Mongo writes. |
| 8. Public-read cutover | Freeze DynamoDB pointer advancement, recheck all gates, and move the production API alias to the verified DynamoDB-reading version. Keep the Mongo catalog read-only for one 60-minute validation window. | Run the complete smoke matrix at the start and end of the window using fresh sessions; require no failed gate. The maintainer records acceptance and the exact version and snapshot IDs in private evidence. | During the window only, move the alias back to the verified Mongo-reading version, pause DynamoDB publication, retain all candidates and evidence, and schedule a new window after repair. |
| 9. MongoDB retirement | After the accepted 60-minute window, in the same controlled change, revoke routine Mongo access and verify zero active connections. Separately review removal of Mongo runtime configuration, SSM parameter and IAM access, users, and Atlas cluster. Obtain the maintainer's explicit authorization immediately before physical deletion. No Mongo data export is part of the plan. | Prove API, runner, web, and sitemap no longer access Mongo and that the DynamoDB recovery runbook is ready. Record the irreversible boundary and redacted result. | Stop before physical deletion if a dependency remains. After deletion, use DynamoDB-only recovery; the former Mongo-reading Lambda version is no longer a valid rollback target. |

The DynamoDB writer foundation and API reader can be implemented incrementally,
but the first public read waits for all gates. Web compatibility may be built in
parallel with API work but ships in its own production window. Scraper
publication and web releases never share a production change window.

## Shadow, bootstrap, and publication rules

The shadow run writes only to the final three DynamoDB tables. Missing public
pointers keep the candidate invisible. It is not a MongoDB backfill or a copy
from disposable staging tables. All three initial candidates and one shared
Search Projection must be immutable and content-complete before the global
publication lease is acquired. The approved eight-action transaction creates
the three absent pointers together; no per-store initial canary is allowed.

Every initial product begins a new Lifecycle Episode with zero successful
absences. An empty, partial, unsafe, or unreconciled store blocks bootstrap.
Pointer commit alone does not enable public DynamoDB reads: all three
post-commit lifecycle reconciliations must complete and pass count-and-digest
checks first. A retry resolves unknown transaction outcomes through strong
state reads rather than blindly repeating the pointer write.

The first bootstrap has no DynamoDB predecessor. Later normal store
publications retain each store's immediate predecessor and use the approved
operator-triggered fenced rollback and inverse lifecycle reconciliation.
During the 60-minute public-read window, staged refresh work may remain
resumable, but no pointer may advance. The local weekly schedule stays disabled
until bootstrap, workstation impact, public-read validation, and Mongo
retirement all pass. The existing two-unattended-weekly-cycle gate follows.

## Public-read validation and failure response

The API Gateway production integration points at a Lambda alias. Establish
alias routing while the legacy API still serves public traffic, and test a
published DynamoDB-reading candidate version before moving that alias. Record
the immutable version, code hash, configuration, and inverse alias operation;
an old deployment URL by itself is not a rollback artifact.

Run the same matrix at the beginning and end of the 60-minute window:

- Lawson, FamilyMart, and Seven-Eleven browse, store/category filters, price
  and recency sorting, bounded pagination, and product detail;
- Japanese, English, and Traditional Chinese search, prefix/partial matching,
  typo tolerance, relevance ordering, filters, and pagination;
- explicit stale/invalid cursor handling, current-snapshot cache binding, and
  search-unavailable behavior with direct browse intact;
- complete sitemap enumeration, SSR and web proxy behavior, and upstream errors
  without a successful partial sitemap;
- fixed three-pointer Publication Snapshot identity on every path, no mixed
  generation or search response, and no DynamoDB pointer advancement;
- production-shaped cold API memory at or below 205 MiB, cold/warm latency,
  read capacity, storage, and cost admission inside the approved envelope; and
- fresh browser sessions or cache invalidation, because older web list/detail
  responses can remain cached for 30 minutes.

Sparse real traffic cannot replace synthetics. Any required failure, mixed
snapshot, loss of direct browse, or memory-gate breach stops acceptance. The
maintainer moves the alias back to Mongo during the window, leaves Mongo
read-only, pauses DynamoDB publication, and diagnoses the retained candidate
and evidence. The next attempt receives a new complete validation window.
The frozen Mongo catalog may be empty or stale; this escape restores the old
read path, not a guaranteed populated catalog.

## Recovery after Mongo retirement

| Failure | Approved response |
| --- | --- |
| API code regression | Return the production alias to a recorded, verified DynamoDB-reading Lambda version. |
| Search Projection missing, corrupt, or incompatible | Keep direct browse available and perform the approved projection-maintenance publication; never serve an older snapshot's search data. |
| Defective later Store Publication | If the immediate predecessor is still eligible, the maintainer authorizes fenced pointer rollback and inverse lifecycle reconciliation. |
| Defective initial bootstrap generation | No predecessor exists, so same-period Publication Repair and pointer rollback are unavailable. Rebuild a fresh validated three-store catalog; projection-only defects use projection maintenance. |
| Whole-table or account loss | Rebuild a fresh validated three-store catalog from empty tables. No RTO or RPO is promised. |

The former Mongo-reading Lambda version, Mongo credential-pointer drill, and
Atlas cluster cease to be recovery paths after retirement.

## Verification and evidence ownership

The maintainer owns each go/no-go decision, manual writer run, cost review,
alias move, rollback, and final physical retirement authorization. Each
increment links a redacted pass/fail record and the exact immutable release
references. Keep credentials, AWS account identifiers, raw provider output,
retailer payloads, and private API internals outside the public repository.

The measured monthly model includes four weekly three-store refreshes,
public reads, cold search loads, cleanup, one rollback, retained bytes,
failed attempts, and directly attributable transfer. It must project below
US$0.13 with headroom below the US$0.16 hard-review threshold without relying
on free tier. The writer refuses work that breaches its synchronous admission
guard. The free budget email is a delayed notice, not the enforcement path;
no CloudWatch operational alarms are required for this hobby project.

## Effect on the earlier rollout plan

This sequence supersedes the Mongo-backed execution path in the earlier
implementation tickets: Mongo generation shadow drills, per-store initial
publication canaries, the legacy/generation Mongo read switch, and a prolonged
Mongo rollback window. The local Mac, resumable refresh principles, independent
web releases, accessibility and performance gates, two unattended weekly
cycles, and final evidence window remain in force. The implementation tracker
must point to the replacement tickets rather than treating the old Mongo
phases as additional prerequisites.
