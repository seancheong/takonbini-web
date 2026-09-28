---
status: accepted
---

# Use three index-free DynamoDB tables

The clean-sheet catalog architecture uses separate Catalog, Refresh, and Translations tables with explicit base-table key families and no local or global secondary indexes. This accepts deterministic materialized browse entries and bounded multi-partition merging in exchange for isolating public reads, workflow churn, and independently retained translations while keeping Publication Snapshot reads strongly consistent.

## Consequences

Catalog Generations and their Browse Projections are immutable; Search Projections are immutable for one complete Publication Snapshot. A small conditional transaction advances one store publication pointer. Public request paths use keyed reads and queries only; they never scan. Superseded generations are removed by a resumable cleanup worker because DynamoDB TTL does not cascade from a generation header. Any future secondary index requires a new measured access pattern and a superseding decision.

The complete key model and access-pattern proof are recorded in [Clean-sheet DynamoDB table and index model](../research/clean-sheet-dynamodb-table-and-index-model.md).
