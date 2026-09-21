---
status: accepted
---

# Publish catalog and search as one snapshot

Each Store Publication atomically selects one immutable Catalog Generation and a Search Projection covering the exact resulting three-store pointer tuple. A short-lived global fenced lease serializes snapshot binding, search construction, and pointer mutation while store refresh work remains independent. This accepts up to three bounded search rebuilds per weekly cycle in exchange for preventing browse, detail, sitemap, and search from exposing different catalog states.

## Consequences

Search cannot publish a different product corpus from DynamoDB or silently fall back to an older snapshot. Interrupted projection builds resume from verified immutable chunks; rollback and same-period repair use the same coordinated protocol and reconcile lifecycle changes explicitly. Current and immediate-predecessor generations remain protected, while unreferenced generations and Search Projections receive a 24-hour grace before irrevocable bounded cleanup.

The complete protocol is recorded in [Catalog and search publication protocol](../research/catalog-search-publication-protocol.md).
