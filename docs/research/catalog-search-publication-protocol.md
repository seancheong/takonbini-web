# Catalog and search publication protocol

_Decision date: 2026-09-22. This is a decision-complete coordination specification, not a production implementation._

## Decision

A Store Publication selects one immutable Catalog Generation and one immutable, three-store Search Projection in a single fenced transaction. Store refreshes and candidate construction remain independent; only snapshot binding, search construction, and pointer mutation are serialized by a short-lived global publication lease. Public browse, detail, sitemap, and search therefore resolve from one Publication Snapshot without making one store's refresh success depend on another store's current run.

This protocol covers normal publication, empty-system bootstrap, rollback, same-period repair, projection maintenance, interruption recovery, retention, and cleanup. DynamoDB remains authoritative. Search remains a rebuildable representation and never supplies catalog data from a different Publication Snapshot.

## Inputs and fixed invariants

- [Choose the catalog and search publication protocol](https://github.com/seancheong/takonbini-web/issues/44)
- [Clean-sheet DynamoDB table and index model](./clean-sheet-dynamodb-table-and-index-model.md)
- [Model product lifecycle as fenced episodes](../adr/0003-model-product-lifecycle-as-fenced-episodes.md)
- [AWS TransactWriteItems](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html)

The protocol preserves these fixed invariants:

- generation products, Browse Projections, lifecycle deltas, Search Projection manifests, and search chunks are immutable;
- one normal publication changes one store pointer;
- the pointer transaction is the public-visibility linearization point;
- lifecycle state advances only after a successful observation publication and reconciles forward before the next store refresh;
- direct browse remains available if free-text search cannot load; and
- no artifact that is cleanup-eligible may become selectable again.

## Identities and bindings

A Publication Snapshot is the ordered set of three `(store, pointer version, generation ID)` tuples plus the projection-format and search-library versions. Its `snapshotId` is the SHA-256 digest of that canonical identity. Search metadata, manifest, and chunks use `SNAPSHOT#<snapshotId>` and include aggregate content digests.

Candidate generation content does not depend on peer pointer versions. Its products, lifecycle deltas, and Browse Projection become immutable when content verification completes. While the generation remains unpublished, its mutable metadata may be conditionally rebound under the global publication lease to a different target `snapshotId`; the content digest does not change. Publication makes the binding immutable.

The Refresh table holds one `LEASE#PUBLICATION / HEAD` item with owner, fencing revision, and expiry. Store scraping and candidate construction do not hold it. Snapshot completion, generation rebinding, and every pointer-changing transaction condition-check its current fence. An expired owner may have written valid immutable chunks, but it cannot complete a snapshot or change public state.

## Resumable Search Projection build

After acquiring the global lease, the publisher strongly reads all three store pointers. It substitutes the target candidate's next pointer tuple for its store, chooses the supported projection/search versions, and derives `snapshotId`.

The builder creates or resumes immutable chunks and a manifest. Existing items count as successful retries only when identity and digest match exactly. It writes missing chunks, then strongly reads the complete artifact set and verifies:

- exact coverage of the three target generations;
- product ID and document counts;
- format and library versions;
- decoded byte and chunk counts; and
- aggregate SHA-256 digest.

Snapshot completion is a transaction containing the snapshot metadata update plus a condition check on the global lease fence. A later lease holder may resume the same identity. Unequal content at an existing immutable key is an integrity failure, not an overwrite.

If a peer pointer changed before binding or publication, the publisher retains the candidate's immutable generation content, conditionally rebinds its unpublished metadata to the newly derived snapshot, and rebuilds or resumes that projection. The stale unreferenced snapshot follows normal cleanup rules.

## Normal Store Publication

The completed candidate generation is published with one six-action `TransactWriteItems` request:

1. condition-check the global publication lease owner, fence, and unexpired deadline;
2. update the target store pointer only from the exact expected version/generation, increment its version, select the candidate, and record the former current generation as `previousGenerationId`;
3. condition-check the first peer store's exact pointer version/generation;
4. condition-check the second peer store's exact pointer version/generation;
5. condition-check that the target Search Projection is complete, digest-valid, covers the exact resulting tuple, and is not cleanup-eligible; and
6. update target generation metadata from complete/unpublished to published only at the expected revision and bound snapshot identity.

The target pointer update carries its own expected-state conditions because DynamoDB cannot separately condition-check and update the same item in one transaction. The request uses a deterministic `ClientRequestToken`; the token supplements rather than replaces state-based recovery because DynamoDB's idempotency window is ten minutes.

Pointer commit makes the Catalog Generation, Browse Projection, and matching Search Projection visible together. Lifecycle reconciliation, run finalization, and predecessor bookkeeping then proceed idempotently. That store cannot start its next refresh until lifecycle count-and-digest reconciliation completes.

Up to three full Search Projections may be built during one weekly three-store cycle. This bounded work is deliberate: it isolates store failures instead of making normal publication all-or-nothing.

## Empty-system bootstrap

The empty system is the only multi-store publication exception. All three initial Catalog Generations and their one shared Search Projection must be content-complete first. Under the global lease, one eight-action transaction:

1. condition-checks the publication lease fence;
2. conditionally creates all three previously absent store pointers;
3. condition-checks the exact complete Search Projection; and
4. updates all three generation metadata items to published.

Lifecycle reconciliation then runs independently for each store. DynamoDB public reads remain disabled until all three reconciliations pass; issue #41 owns the later read-cutover sequence.

## Unknown transaction outcomes

After a timeout or lost response, the publisher strongly reads the affected pointer and generation metadata before retrying:

- exact intended target state means the transaction committed, so post-commit reconciliation resumes;
- exact original base state permits an identical retry only while the same global lease fence remains valid; and
- any other state is a publication conflict that stops and alerts.

The same rule applies to bootstrap, rollback, Publication Repair, and projection-maintenance transactions. No path blindly retries a pointer mutation.

## Rollback and Publication Repair

Rollback is explicit and operator-triggered; alerts never flip pointers automatically. Only the target store's current immediate predecessor is eligible. Under the global lease, rollback builds and verifies the Search Projection for that predecessor plus the peers' current generations, then uses the normal fenced transaction shape to move the store pointer. It fails if any peer moved, the predecessor became cleanup-eligible, or lifecycle state advanced beyond the publication being reversed.

After the pointer commits, the rolled-back generation's immutable lifecycle deltas are applied in reverse with their episode, revision, and publication-identity fences. The store remains refresh-blocked until inverse count-and-digest reconciliation completes.

A corrected candidate for the same JST observation period is allowed only as an operator-authorized Publication Repair. Its identity contains the original observation identity and a correction ordinal. It starts from the restored predecessor lifecycle state, follows the full build and publication protocol, and produces one replacement lifecycle transition. The original publication remains recorded as rolled back; the period contributes at most one net observation.

## Projection maintenance

A projection-format or search-library upgrade, or repair of an irreparably corrupt published projection, uses a projection-maintenance publication. Generation IDs and lifecycle state do not change. Under the global lease, the publisher predicts one target store pointer's next version, builds the new Search Projection for that exact tuple and new contract version, and validates product identities/counts/digests against all three authoritative generations.

The six-action publication shape then increments that pointer's version while retaining its generation and `previousGenerationId`; the target-generation action becomes a condition check rather than a state update. This creates an atomic new Publication Snapshot, deliberately invalidates old cursors, and does not create a Catalog Observation.

## Public reads and caches

Each request obtains the three publication pointers with one `TransactGetItems`. Product detail, browse, sitemap, and search use only the resulting Publication Snapshot. Search caches are keyed by the complete `snapshotId`; a cached projection is usable only when its embedded identity matches the request snapshot.

An in-flight request may finish against the snapshot it already loaded. A later request or cursor presented after the pointers change is stale and cannot select the old cache entry. Old entries may remain in memory until ordinary eviction.

If the current Search Projection is missing, corrupt, or cannot deserialize, free-text search returns a controlled unavailable result. Direct DynamoDB browse continues. The API never falls back to search data from an older snapshot.

## Retention and cleanup

Each store's current generation and immediate predecessor are protected. Candidate bindings, active repairs, active rollbacks, and building/complete unpublished snapshots are also explicit references. A generation or Search Projection that loses every reference records `unreferencedAt` and receives a 24-hour grace.

After the grace, a conditional transition may mark the artifact `cleanup-eligible` only while proving it is not:

- a current or immediate-predecessor generation;
- selected by the current Publication Snapshot;
- bound by an unpublished candidate;
- required by an active Publication Repair or rollback; or
- already being restored as a publication target.

Cleanup eligibility is irreversible. Every publication form rejects cleanup-eligible targets. Resumable workers enumerate known generation/Browse partitions or Search Projection items, delete in bounded batches, retry all unprocessed writes, and strongly verify emptiness before marking cleanup complete. Product-lifecycle TTL remains independent and is never used to delete whole generations.

## Failure behavior

- Lease loss permits immutable chunk reuse but prevents snapshot completion, rebinding, or pointer mutation by the stale owner.
- A peer-pointer race fails the transaction; unpublished generation content remains reusable against a new target snapshot.
- A missing or unequal immutable artifact blocks publication.
- A post-commit lifecycle failure leaves the valid published snapshot visible, blocks the next store refresh, and resumes forward; it does not trigger automatic rollback.
- A rollback or repair conflict freezes the operation and alerts instead of overwriting newer state.
- Cleanup interruption resumes from its recorded collection and continuation key.

## Rejected alternatives

### Mutate products in place

Rejected because thousands of product and browse writes could become visible at different times, search could cover a different corpus, and rollback would require reconstructing overwritten values. The approved model merges observations by product ID while building a new immutable Catalog Generation, then switches the whole generation at the pointer boundary.

### Publish all three stores together every week

Rejected for normal operation because one slow or failed store would block fresh catalog data from both healthy stores. The initial empty-system bootstrap remains the only all-store publication exception.

### Select search through an independent mutable pointer

Rejected because catalog and search could then advance separately. Projection upgrades and repairs instead create a new Publication Snapshot through the same fenced pointer protocol while leaving generation IDs unchanged.

### Automatic rollback on an alert

Rejected because an alert does not prove that the immediate predecessor is safe or that lifecycle state can still be reversed. Rollback requires an explicit operator decision and the complete fenced validation protocol.

## Verification gates

Before implementation acceptance:

1. interrupt search construction before and after every chunk and prove a new fenced owner resumes identical content;
2. race all three stores for the global lease and prove pointer changes serialize while candidate construction remains independent;
3. change a peer pointer before binding and before transaction commit, proving safe rebind or clean transaction failure;
4. inject unknown transaction outcomes for normal publication, bootstrap, rollback, repair, and projection maintenance, proving state-based recovery;
5. prove browse/detail/search/sitemap resolve from one tuple and reject stale cursors after each publication form;
6. corrupt or remove the active search manifest/chunks and prove controlled search unavailability with direct browse intact;
7. bootstrap three absent pointers atomically and keep public DynamoDB reads disabled until all lifecycle reconciliations pass;
8. roll back the immediate predecessor, reconcile lifecycle inverses, then publish one corrected same-period repair without double observation;
9. backfill and activate a new projection contract without changing generation IDs or lifecycle state;
10. race publication, repair, and rollback against cleanup eligibility, proving no artifact becomes both selectable and deletable; and
11. interrupt every cleanup batch and prove exact resumption, unprocessed-write retry, and final emptiness verification.
