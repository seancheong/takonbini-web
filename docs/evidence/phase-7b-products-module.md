# Phase 7B products module implementation evidence

This unpublished implementation supports #26. It does not close the Phase 7A observation or hosted rollback gates documented in [release reconciliation](phase-7a-release-reconciliation.md). Merge and production release remain gated.

## Boundaries and compatibility

Product screens, query options, URL filter encoding, display helpers, and contracts now live in `src/features/products`. Routes consume the browser-safe `products.ts` entrypoint. `products.server.ts` owns upstream configuration behind TanStack's server-only boundary. A typed catalog-source interface supports the HTTP adapter and a deterministic in-memory test adapter.

Successful upstream payloads are validated and internal fields are stripped. Invalid payloads return 502; transport failures remain distinguishable from missing configuration, upstream HTTP failures, and programming errors. Nullable legacy release dates remain supported. This intentionally changes invalid payload handling while preserving valid catalog presentation.

The legacy sitemap still returns partial results after a later upstream HTTP failure and retains its 50-page limit. This change does not claim complete sitemap enumeration. Existing detail error presentation is also retained.

## Verification

- 54 tests across seven files pass, including navigation, URL encoding, HTTP proxy behavior, source contracts, malformed payloads, pagination, and detail SSR/hydration.
- TypeScript, Biome lint, and production build pass. CI now runs tests and type checking alongside lint and build.
- Live local API pagination validated 5,017 records: SevenEleven 2,307, Lawson 839, FamilyMart 1,871. Missing or null release dates occurred in the first two stores and are covered by a regression test. These are observed response counts, not inventory claims.
- Catalog SSR/API responses for all three stores, detail responses, sitemap XML, and the three existing locale document languages were checked locally.
- Browser checks covered product navigation and back navigation, mobile filter focus and Escape restoration, and light/dark controls.
- Initial normalized catalog DOM matched the pre-refactor baseline. No JSX or class strings were changed by the follow-up fixes. The final stylesheet is `styles-CX8hfflF.css`; comparison with `styles-CWNMFBzn.css` shows only removal of the unused `!transition` utility that Tailwind inferred from the deleted JavaScript variable expression. No CSS, localization, shared header, StyleX, or Shiori Editorial redesign changes are included.
- Main client bundle is 528.49 kB (174.58 kB gzip), compared with 527.56 kB (174.40 kB gzip) at baseline. Runtime validation and upstream configuration are absent from browser bundles; the configured API credential was checked without printing it.

## Initial observations (subsequently diagnosed)

One recoverable React 418 text hydration warning appeared on the first local candidate load. Reloads and a fresh tab did not reproduce it; isolated card/detail hydration tests pass. Its cause has not been established. The follow-up below records the later reproduction and fixes.

The build reports the existing large-client-chunk warning and a Vite 7 / builder ^8 compatibility warning. Neither blocks the build; dependency migration is outside this refactor.

## Hosted preview follow-up

Draft PR #71 passed GitHub Web CI, Socket checks, and Vercel deployment on 15 October 2026. Hosted catalog loading, product detail navigation, direct detail reload, and return-link filter preservation were verified. No React hydration warning appeared in those checks. One client navigation logged `Transition was aborted because of timeout in DOM update`; detail content subsequently rendered successfully. Both observations were retained for investigation; the follow-up below supersedes their open status.


## Browser defect follow-up — 15 October 2026

Two deterministic reproductions established the causes:

- A synthetic loopback API delayed detail by seven seconds. The original card started a native view transition before navigation and waited for `onResolved`, holding its DOM-update callback open across the request. Chromium reported the exact DOM-update timeout while detail eventually rendered. Card navigation now requests the router's built-in view transition, which begins at the loaded-route commit. The same delayed navigation renders detail without console errors. Safari, modifier clicks, unsupported browsers, and reduced motion retain their non-transition paths.
- Repeated catalog reloads reproduced React 418. Development diagnostics identified server `Loading products` versus client `1 product loaded` in the result count, with the same locale. The route started a prefetch but returned before it settled, allowing server markup and dehydrated query data to diverge. Returning the prefetch promise keeps the initial snapshot consistent. Four production-build reloads plus English/Japanese/Chinese locale reloads and the development reproduction pass without the warning after the fix.

Both regression tests failed before their corresponding fixes. The final suite has 54 passing tests; type checking, lint, and production build pass. The loader test holds the real query fetch pending and verifies the actual registered route loader waits and fills the expected cache. The card tests verify router-managed transitions and the reduced-motion path; the native-browser delayed-response check covers the timeout that a DOM mock cannot reproduce.

These fixes intentionally change navigation timing and initial SSR data readiness. They do not change product presentation, translations, filters, query keys, or upstream contracts. An initial catalog response now waits for its first prefetch to settle; upstream latency therefore contributes to initial response time.

## Release readiness still pending

At approximately 15 October 2026, 20:26 MYT, production and the retained `cb39d06` immutable deployment passed read-only catalog, all three store APIs, filtered detail return, and sitemap checks. This is an additional checkpoint, not a continuous-availability or incident-log claim.

The conservative Phase 7A window still ends no earlier than **16 October 2026, 06:35:45 MYT**, followed by route rechecks and incident review. Vercel CLI 64.1.0 reports logged out. No production rollback or alias change was performed. The concrete retained target remains deployment `7078753180`, source `cb39d06d5f26499c38320af5a612b08e79a1ffc2`, independently rebuildable and publicly reachable. Hosted rollback execution needs authenticated access and explicit approval for that target under the existing recovery procedure.
