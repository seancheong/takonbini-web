# Publish complete store generations atomically

Takonbini will run one resumable Store Refresh per store and ISO week, persist its immutable Discovery Manifest and deterministic Processing Chunks in MongoDB, and change one per-store publication pointer only after every chunk succeeds. This preserves the previous Catalog Generation through partial failures, makes retries idempotent, and keeps orchestration portable: Cloud Run Jobs and the local CLI are adapters around one deep Store Refresh module rather than owners of workflow behavior.

## Consequences

- A store publishes independently from the other stores, but never partially.
- Active Catalog Products expire 28 days after their Store Publication; failed refreshes do not extend freshness.
- Product Translations are reusable, non-blocking records with an independent lifetime.
- Candidate generations temporarily duplicate catalog data, bounded by a 35-day retention policy.
- MongoDB becomes both the catalog store and the durable workflow-state dependency.
