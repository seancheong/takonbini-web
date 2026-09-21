# Takonbini Catalog

Takonbini helps people discover current products offered by Japanese convenience stores across supported regions and languages.

## Language

**Catalog Visitor**:
A person using localized information to discover Japanese convenience-store products, especially an international visitor or enthusiast who cannot comfortably browse the original Japanese store sites.
_Avoid_: Customer, shopper, buyer

**Active Catalog Product**:
A store product currently considered available for discovery in Takonbini.
_Avoid_: Product record, scraped item

**Catalog Generation**:
An immutable, verified set of Active Catalog Products for one supported store after one successful refresh. It includes newly observed products and any lifecycle-approved carry-forwards; it is not publicly visible until selected for publication.
_Avoid_: Product batch, catalog version

**Browse Projection**:
A rebuildable, generation-scoped representation of catalog products organized for structured filtering and ordering. It is derived from a Catalog Generation and is not authoritative product data.
_Avoid_: Browse index, product copy

**Publication Snapshot**:
The exact set of store Catalog Generations visible to Catalog Visitors at one point in time. Browse, detail, and search results must remain bound to the same snapshot while paginating.
_Avoid_: Active version, current database state

**Catalog Observation**:
Evidence that a supported store listed a product at a particular time; it does not guarantee real-time inventory or availability at a specific location.
_Avoid_: Stock status, inventory status

**Product Translation**:
A reusable English and Chinese rendering of a product's Japanese source title and description, independent of whether the product is currently active in the catalog.
_Avoid_: Translated product, localized record

**Search Projection**:
A rebuildable, Publication-Snapshot-scoped search representation derived from authoritative Catalog Generations. It becomes discoverable only with the exact matching Publication Snapshot.
_Avoid_: Search database, search catalog
