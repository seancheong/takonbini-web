---
status: accepted
---

# Model product lifecycle as fenced episodes

Each `(store, product ID)` has a compact canonical Product Lifecycle record with a fenced Lifecycle Episode, while immutable generation-scoped deltas record proposed transitions. A publication pointer makes a lifecycle-filtered generation visible first; replay-safe reconciliation then advances canonical state and blocks the next refresh until it is proven complete. This separates immediate visitor visibility from DynamoDB's asynchronous TTL cleanup, prevents delayed writes from reviving expired state, and preserves the rule that only successful weekly observations advance absence.

## Consequences

The first successful absence carries a product into the next generation and the second makes it inactive immediately. Inactive records become logically expired after 30 days and TTL-eligible for physical deletion, but neither delayed TTL deletion nor failed refreshes change visibility or lifecycle meaning. A returning product resumes its episode only before logical expiry; afterward it starts a new one. Translation retention remains independent of product lifecycle.

The complete transition, fencing, and recovery protocol is recorded in [Clean-sheet DynamoDB table and index model](../research/clean-sheet-dynamodb-table-and-index-model.md).
