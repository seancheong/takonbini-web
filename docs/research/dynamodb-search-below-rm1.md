# Multilingual product search below RM1 per month

_Research date: 2026-09-21. Primary sources only. Pricing and exchange rates can change; the production design needs a billing alarm and a measured prototype before commitment._

## Decision

Use **DynamoDB as both the authoritative catalog store and the durable store for a versioned, serialized search projection**, while running full-text search in memory inside the existing API runtime with [MiniSearch](https://github.com/lucaong/minisearch). Do not provision Amazon OpenSearch, Algolia, or another hosted search service for the first release.

This is the only investigated shape that can credibly satisfy all of the following at once:

- Japanese, English, and Chinese search;
- prefix and partial-term matching;
- typo tolerance;
- store and category filters;
- relevance, price, and recency ordering;
- cursor pagination;
- generation-safe publication;
- DynamoDB browse during search failure; and
- combined DynamoDB and search billing below RM1 per month.

The recommendation is deliberately not “DynamoDB full-text search.” DynamoDB `Query` requires equality on one partition-key value and can only narrow through a sort-key condition; a `FilterExpression` is applied after the read and does not reduce read capacity. Those semantics fit known browse access patterns, not arbitrary multilingual relevance search. [DynamoDB Query API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)

## Proposed architecture

### 1. Authoritative catalog and browse paths

Store each fresh catalog generation in DynamoDB. Design table and GSI keys only for exact, known access patterns such as:

- product by stable identifier;
- active generation pointer;
- products for one generation and store/category, ordered by price or recency; and
- refresh workflow state, leases, translations, and telemetry.

Do not add token-per-product GSIs or LSIs for text search. A GSI is a separately maintained index with its own write and storage cost, and GSI reads are eventually consistent. Additional GSIs therefore multiply writes without providing typo-tolerant relevance ranking. [Using global secondary indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)

Store/category browse remains a direct DynamoDB path. It must not load or depend on the search projection, so it remains available if projection loading or query execution fails.

### 2. Generation-scoped search projection

At the end of each successful three-store refresh:

1. Normalize the searchable product fields for Japanese, English, and Chinese.
2. Add language-aware tokens plus normalized character n-grams for partial matching in scripts that do not normally use spaces.
3. Build a MiniSearch index with title/name fields boosted above description fields. MiniSearch provides exact, prefix, fuzzy, ranked, field-boosted, filtered search; it supports non-Latin scripts and custom token processing. [MiniSearch project documentation](https://github.com/lucaong/minisearch), [MiniSearch API documentation](https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html)
4. Serialize the index. MiniSearch explicitly supports JSON serialization and deserialization. [MiniSearch serialization API](https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html#toJSON)
5. Compress and split the serialized bytes into immutable projection chunks comfortably below DynamoDB's 400 KB item limit. Record a manifest containing generation ID, format/library version, chunk count, compressed-byte count, checksum, document count, and build timestamp. [DynamoDB constraints](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html)
6. Read the chunks back, verify checksum and document count, deserialize the index, and pass the multilingual search acceptance suite.
7. Advance the strongly read active-generation pointer only after the authoritative product generation and its search projection have both validated.

Never overwrite an active projection. Old generation chunks can receive TTL only after the rollback window. DynamoDB TTL removes expired records without consuming write capacity in the source Region, although deletion timing is asynchronous. [DynamoDB TTL building block](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling-blocks.html#data-modeling-blocks-ttl)

### 3. Query execution

On the first free-text request for a generation, the API reads its manifest and chunks, verifies the checksum, deserializes the index, and caches it by generation ID in process memory. Warm searches use no DynamoDB operations. A bounded single-flight loader prevents simultaneous cold requests from loading duplicate copies.

The API then:

- searches exact terms first and combines lower-weight prefix and fuzzy matches;
- filters on stored `store` and `category` fields;
- uses MiniSearch score for relevance ordering;
- uses normalized numeric price or timestamp for explicit price/recency ordering;
- applies a deterministic product-ID tie-breaker; and
- returns an opaque cursor containing generation ID, ordering mode, the last ordering tuple, and a query fingerprint.

A cursor from an inactive generation must be rejected as stale rather than silently mixing generations. Limit the maximum result window and page size; do not retain an unbounded result set in the cursor.

## Multilingual behavior

MiniSearch's default tokenization separates text on Unicode spaces, punctuation, and symbols. Japanese and Chinese text therefore need explicit preprocessing rather than an assumption that the default tokenizer provides word segmentation. The prototype should compare at least:

- Unicode normalization and case folding for Latin text;
- native full tokens and 2–3 character n-grams for Japanese/Chinese partial matching;
- Japanese script variants where product users demonstrably need them; and
- conservative edit-distance thresholds, especially for short CJK tokens.

Typo tolerance should be strongest for Latin transliterations and longer terms. One-character fuzzy matching should be disabled because it produces noisy results. Prefix matching and n-grams cover the partial-product-name requirement; arbitrary substring matching through a DynamoDB scan is explicitly prohibited.

## Cost finding

There is **no separate search-service bill** in this design. Search storage and cold-load reads are ordinary DynamoDB storage and requests; search CPU runs in the existing API runtime, which the agreed cost boundary excludes.

AWS documents an always-free DynamoDB allowance of 25 GB of storage plus 25 provisioned read and 25 provisioned write capacity units. It describes that allowance as enough for up to 200 million requests per month, subject to request shape and account usage. [DynamoDB developer guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)

The existing production baseline measured 4,942 legacy items occupying 7,490,434 bytes, so the catalog is orders of magnitude below the 25 GB storage allowance. That observation is evidence of scale only; the new clean-sheet design must measure its own products, GSIs, workflow items, and compressed projection. [Phase 0 baseline](../evidence/phase-0-baseline-and-rollback.md#dynamodb)

Use a single-Region Standard table in `ap-northeast-1`, no global tables, no point-in-time recovery unless separately budgeted, and provisioned capacity allocated from the account's unused always-free allowance. The allowance is account-wide, so Terraform cannot guarantee a zero bill if other tables consume it. If the account cannot use the allowance, compare on-demand request cost from measured prototype traffic before deployment; AWS bills on-demand reads in 4 KB increments and writes in 1 KB increments. [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/)

Treat RM1 as a hard monthly alarm threshold, not a forecast slogan:

- create an AWS Budget at RM0.80 equivalent and a hard review at RM1 equivalent;
- measure table, GSI, and projection bytes after every successful refresh;
- record consumed read/write capacity for refresh, cold load, browse, and rollback tests;
- include the search projection in those measurements; and
- fail the architecture review if the prototype cannot demonstrate sufficient headroom under the account's actual Tokyo-region rates and current MYR exchange rate.

Do not use DynamoDB Streams, replicated global tables, OpenSearch, hosted Algolia, or another recurring search dependency in the initial design. They add cost or a second operational limit without being necessary at this catalog size.

## Requirement coverage

| Requirement | Mechanism |
| --- | --- |
| Japanese, English, Chinese | Explicit normalized fields and language-aware token/n-gram generation |
| Prefix and partial term | MiniSearch prefix matching plus CJK character n-grams |
| Typo tolerance | Bounded MiniSearch fuzzy matching, tuned per token length/script |
| Store/category filters | Stored index fields; direct DynamoDB browse when there is no text query |
| Relevance | MiniSearch ranking and field boosts |
| Price/recency ordering | Application sort over matched IDs with deterministic tie-breakers |
| Pagination | Generation-bound opaque cursor over a bounded result window |
| Versioned projection | Immutable chunks and manifest keyed by generation ID |
| Publication isolation | Validate authoritative generation and projection before pointer advance |
| Degraded browse | DynamoDB key queries independent of projection loading |
| Below RM1 | No separately billed search service; DynamoDB kept within measured allowance/budget |

## Required prototype before locking the design

The architecture should be accepted only if a representative prototype proves all of these:

1. At least the measured catalog scale (~5,000 products), with representative Japanese, English, and Chinese product names and descriptions.
2. A reviewed query corpus covering exact terms, prefixes, mid-token partials, Latin typos, CJK variants, mixed-language queries, filters, and empty/noisy inputs.
3. Relevance judgments for the top 10 results, including exact-title precedence and false-positive limits.
4. Correct price/recency ordering and stable pagination without duplicates or omissions.
5. Successful serialize/compress/chunk/write/read/checksum/deserialize round-trip below the 400 KB per-item limit.
6. Projection build failure leaves the old generation active; pointer advancement exposes matching product and search generation IDs.
7. Search projection failure returns a controlled free-text error while direct store/category browse still works.
8. Measured projection bytes, peak API memory, build duration, cold-load latency, warm latency, and consumed DynamoDB capacity.
9. A cost worksheet using current `ap-northeast-1` prices and the account's remaining free-tier allocation that stays comfortably below RM1, including four weekly full refreshes and realistic cold starts.

If the serialized projection or API memory is too large, the next experiment should shard the projection by store and/or language and merge bounded top-K results. A hosted search service is not the automatic fallback because it would violate the cost boundary unless its production billing is demonstrably zero and its service limits meet the full acceptance suite.

## Rejected alternatives

- **DynamoDB GSIs/LSIs as a full-text engine:** suitable for exact partition/sort-key access, not typo-tolerant multilingual ranking; token indexes amplify writes and storage.
- **DynamoDB scans with filters:** filters run after DynamoDB reads up to 1 MB per page, so this is inefficient and cannot supply relevance ranking. [DynamoDB Scan documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html)
- **Amazon OpenSearch Service:** an always-on search deployment is incompatible with a sub-RM1 hobby budget.
- **External free hosted search tier:** introduces a second data copy, availability boundary, privacy surface, and vendor quota whose future price is outside the application's control. It is unnecessary before the in-process prototype fails.
- **Client-download of the entire product catalog:** reduces server work but transfers index size and memory cost to every visitor, performs poorly on first use, and makes publication/cache behavior harder to control.

## Consequence for the wider migration map

The DynamoDB table-design ticket should model exact product, browse, workflow, translation, and generation-pointer access patterns only. It should reserve an entity namespace for immutable search manifests/chunks, but it should not invent LSIs or GSIs for free-text search. The search prototype ticket should validate this note's projection format, multilingual preprocessing, relevance, runtime envelope, and cost worksheet before the database architecture is locked.
