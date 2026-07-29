# Takonbini Catalog

Takonbini helps people discover current products offered by Japanese convenience stores across supported regions and languages.

## Language

**Catalog Visitor**:
A person using localized information to discover Japanese convenience-store products, especially an international visitor or enthusiast who cannot comfortably browse the original Japanese store sites.
_Avoid_: Customer, shopper, buyer

**Active Catalog Product**:
A store product currently considered available for discovery in Takonbini.
_Avoid_: Product record, scraped item

**Catalog Observation**:
Evidence that a supported store listed a product at a particular time; it does not guarantee real-time inventory or availability at a specific location.
_Avoid_: Stock status, inventory status

**Product Translation**:
A reusable English and Chinese rendering of a product's Japanese source title and description, independent of whether the product is currently active in the catalog.
_Avoid_: Translated product, localized record

**Store Refresh**:
One weekly attempt to discover, process, and publish the current catalog for a single supported store.
_Avoid_: Scrape job, cron run

**Discovery Manifest**:
The immutable, validated set of Catalog Observations found during one Store Refresh.
_Avoid_: Scrape output, URL list

**Processing Chunk**:
A deterministic subset of a Discovery Manifest that can be processed and retried independently.
_Avoid_: Batch, page

**Catalog Generation**:
A complete processed store catalog derived from one Discovery Manifest and eligible to become active as a whole.
_Avoid_: Snapshot, scrape result

**Store Publication**:
The atomic act that makes one complete Catalog Generation active for a store.
_Avoid_: Database write, heartbeat
