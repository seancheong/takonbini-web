# Phase 7B products-module migration

Status: preparation complete; implementation waits for the
[Phase 7A reconciliation](../evidence/phase-7a-release-reconciliation.md).

Implement [#26](https://github.com/seancheong/takonbini-web/issues/26) from the
patched merged baseline `cb39d06`. Preserve the catalog shipped in PR #63:
markup, styling, route URLs, filter behavior, language selection, image handling,
query timing, pagination, and navigation. The StyleX migration (#29) and Shiori
Editorial UX (#27/#16) follow as separate verified releases.

## Module interface

Use the accepted local products-module ADR as the design input; it is currently
an untracked planning artifact in the original checkout, not an ADR merged to
main. Review its interface alongside this plan before treating it as a published
architecture decision.

- `features/products/products.ts`: browser-safe catalog/detail screens,
  catalog search codec, and `productQueries.catalog(filters)` /
  `productQueries.detail(id)`.
- `features/products/products.contracts.ts`: runtime-validated
  `ActiveCatalogProduct`, filters, catalog pages, and result types. API-internal
  translation bookkeeping, search fields, and expiry fields are excluded.
- `features/products/products.server.ts`: server-only `ProductCatalogSource`
  interface and composition. The remote HTTP adapter owns API key/environment
  access; the in-memory adapter supplies a second implementation for tests.

The source interface lists catalog pages, finds one product, and enumerates
indexable product IDs. Expected failures are explicit `not-found`, `unavailable`,
`invalid-upstream-data`, and `misconfigured` results. Unexpected programming
faults throw. Route adapters continue to own TanStack configuration, HTTP status
and response translation, and XML serialization.

## File mapping

| Current owner | Target owner |
| --- | --- |
| `features/product/components/ProductPanel.tsx` | `features/products/catalog/CatalogScreen.tsx` |
| `features/product/components/CatalogControls.tsx` | `features/products/catalog/CatalogControls.tsx` |
| `features/product/components/ProductFilterDrawer.tsx` | `features/products/catalog/CatalogFilters.tsx` |
| `features/product/components/ProductCard.tsx`, `ProductGrid.tsx` | `features/products/catalog/` |
| Product detail, pending, and error bodies in `routes/products.$id.tsx` | `features/products/detail/` |
| `services/productService.ts` | `features/products/data/product-queries.ts` and `products-http-client.ts` |
| `features/product/utils/catalogSearch.ts`, catalog normalization and URL encoding in `routes/index.tsx` | `features/products/catalog/catalog-search.ts` |
| `features/product/utils/productLabels.ts`, `productUtils.ts` | `features/products/model/product-labels.ts`, `product-display.ts` |
| `@types/product.ts` | `features/products/products.contracts.ts` plus internal legacy types only if a real caller requires them |
| `utils/queryParsers.ts` | Catalog search implementation; currently product-owned |
| `utils/imageProxy.ts` | Product image implementation; retain same `/api/image` URL |
| `utils/browser.ts` | Product navigation implementation; currently only product card/detail callers |
| Upstream request construction in both product API routes | `features/products/server/takonbini-api-product-catalog.server.ts` |
| Product enumeration in `routes/sitemap[.]xml.tsx` | `ProductCatalogSource` server implementation; XML remains in route |

Keep shared header, language/theme controls, the theme provider, generic UI
primitives, and the image proxy HTTP route outside the products module. Evaluate
`ScrollTopButton` as part of the catalog-screen move; keep it generic unless
its callers and semantics establish product ownership. Generate the route tree
through the TanStack plugin; retain the existing flat route paths.

## Commit sequence and completion criteria

1. **Characterize the patched baseline.** Add black-box coverage for initial
   catalog and detail SSR, hydration, filtered return navigation, metadata,
   translated fields, image fallbacks, pagination and current HTTP failures.
   Save mobile/desktop comparisons using the same fixtures, theme, locale,
   viewport and injected date. Done when these tests exercise current callers
   and pass before moving files.
2. **Move files mechanically.** Pluralize the feature folder and extract detail
   UI; preserve JSX and class strings. Update all production and test imports
   together, with no compatibility re-export wrappers. Done when the complete
   suite and import inventory pass and visual comparisons show parity.
3. **Introduce shared contracts.** Validate upstream catalog/detail payloads
   at the remote seam, with honest valid fixtures for all three stores.
   Document missing translations, optional fields, unknown values, and expected
   failures. Done when valid fixtures pass, malformed payloads fail explicitly,
   and browser bundle inspection excludes server credentials.
4. **Deepen browser behavior.** Put normalization, URL encoding and query/cache
   behavior behind `products.ts`. Leave loaders, navigation configuration and
   head declarations in routes. Done when the unchanged public route/search
   tests pass and routes consume only the intended feature interface.
5. **Add the source interface and adapters.** Test HTTP and in-memory adapters
   against the same contract. Migrate catalog and detail proxies one at a time,
   preserving characterized status, query forwarding and relevant headers.
   Done when adapter tests and original route tests pass for each migration.
6. **Move sitemap enumeration.** Keep XML escaping, site-origin choice and
   endpoint ownership in the route. Done when page/cursor and XML tests pass
   and the failure-policy questions below have explicit resolutions.
7. **Verify and release.** Run tests, type checking, lint, production build,
   SSR/hydration, same-origin route probes, visual/accessibility parity and
   browser/server bundle inspection. Open a reviewable PR with the patched
   rollback source and evidence. Merge requires specific user approval.
   Production validation and the #26 24-hour observation gate precede #29.

## Compatibility questions to settle before contract migration

- Existing proxy tests preserve upstream status/headers and unmodified payloads,
  including synthetic payloads that are not full products. Retain forwarding
  assertions but use valid contract fixtures for successful product responses.
  Add separate malformed-payload tests rather than weakening the originals.
- The current detail error view labels all fetch failures as not-found. Preserve
  its presentation in the mechanical move; independently review HTTP mapping
  when introducing typed failures. A visual error redesign belongs to #27.
- Sitemap enumeration currently returns accumulated IDs after an upstream failure
  and stops after 50 pages. A complete XML document does not prove a complete
  catalog. Characterize this before extraction; obtain an explicit failure-policy
  decision before introducing a behavior change. Do not silently fix it within
  a file move or claim complete enumeration from the readiness smoke check.
- Search input normalization and sorted cache keys are distinct from transport
  encoding. Preserve existing defaults, status selection, cursor handling,
  30-minute stale time and one-hour garbage collection unless a reviewed
  contract change requires otherwise.
- Fixture data and the in-memory adapter stay outside `routes` and `public` and
  outside production entrypoint exports. Prototype files from old branches
  are not part of the production baseline or this mechanical migration.
