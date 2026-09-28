---
status: accepted
---

# Cut over refresh writes before public reads, then retire MongoDB

Takonbini will build its first complete three-store DynamoDB Publication
Snapshot from a fresh local shadow run, make DynamoDB the sole refresh writer,
and move public API reads through a versioned Lambda alias only after the
snapshot and web contract pass verification. MongoDB remains frozen and
read-only for one 60-minute validation window, then is retired in the same
controlled change with explicit authorization for physical deletion. This
accepts a brief, possibly empty or stale Mongo read escape in exchange for a
bounded cutover without dual writes, data migration, or prolonged database
coexistence.

## Consequences

The first DynamoDB bootstrap has no predecessor for pointer rollback. After
MongoDB retirement, recovery uses a known-good DynamoDB-reading API version,
projection repair, an eligible later predecessor, or a fresh rebuild. The
complete stage gates, failure response, and retirement boundary are recorded
in [Fresh-start DynamoDB cutover and MongoDB retirement](../plans/fresh-start-dynamodb-cutover-and-mongodb-retirement.md).
