# Phase 7B products module implementation evidence

This unpublished implementation supports #26. It does not close the Phase 7A observation or hosted rollback gates documented in [release reconciliation](phase-7a-release-reconciliation.md). Merge and production release remain gated.

## Boundaries and compatibility

Product screens, query options, URL filter encoding, display helpers, and contracts now live in `src/features/products`. Routes consume the browser-safe `products.ts` entrypoint. `products.server.ts` owns upstream configuration behind TanStack's server-only boundary. A typed catalog-source interface supports the HTTP adapter and a deterministic in-memory test adapter.

Successful upstream payloads are validated and internal fields are stripped. Invalid payloads return 502; transport failures remain distinguishable from missing configuration, upstream HTTP failures, and programming errors. Nullable legacy release dates remain supported. This intentionally changes invalid payload handling while preserving valid catalog presentation.

The legacy sitemap still returns partial results after a later upstream HTTP failure and retains its 50-page limit. This change does not claim complete sitemap enumeration. Existing detail error presentation is also retained.

## Verification

- 51 tests across six files pass, including navigation, URL encoding, HTTP proxy behavior, source contracts, malformed payloads, pagination, and detail SSR/hydration.
- TypeScript, Biome lint, and production build pass. CI now runs tests and type checking alongside lint and build.
- Live local API pagination validated 5,017 records: SevenEleven 2,307, Lawson 839, FamilyMart 1,871. Missing or null release dates occurred in the first two stores and are covered by a regression test. These are observed response counts, not inventory claims.
- Catalog SSR/API responses for all three stores, detail responses, sitemap XML, and the three existing locale document languages were checked locally.
- Browser checks covered product navigation and back navigation, mobile filter focus and Escape restoration, and light/dark controls.
- Normalized catalog DOM matches the pre-refactor baseline. The stylesheet hash remains `styles-CWNMFBzn.css`. No CSS, localization, shared header, StyleX, or Shiori Editorial redesign changes are included.
- Main client bundle is 528.49 kB (174.58 kB gzip), compared with 527.56 kB (174.40 kB gzip) at baseline. Runtime validation and upstream configuration are absent from browser bundles; the configured API credential was checked without printing it.

## Remaining observation

One recoverable React 418 text hydration warning appeared on the first local candidate load. Reloads and a fresh tab did not reproduce it; isolated card/detail hydration tests pass. Its cause has not been established. Hosted preview hydration remains a follow-up check and this document does not classify the warning as pre-existing or resolved.

The build reports the existing large-client-chunk warning and a Vite 7 / builder ^8 compatibility warning. Neither blocks the build; dependency migration is outside this refactor.
