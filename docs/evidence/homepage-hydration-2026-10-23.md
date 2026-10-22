# Bare-homepage hydration correction — 23 October 2026

Base: production/main69dd92a19f9602ac5db5bcb9b67cb90bdc42566f. User reports React error418 on homepage reload. Reproduced the exact minified error on the public bare homepage and a local compiled build. Explicit-language requests did not produce that error in the initial comparison.

The development diagnostic identified a premature locale normalization navigation: server links lacked lang while the first client hydration attempted links with lang=en, and the client inserted pending/inert results and refresh UI. RootDocument's effect could run while the lazy route's SSR subtree still awaited hydration. React regenerated that subtree. [React error418](https://react.dev/errors/418) describes this server/client HTML mismatch; it is not a missing-product or dependency audit finding.

Automatic locale URL normalization now runs from loaded catalog, detail and detail-error page components through useLocaleUrl, after that page subtree commits. The root shell no longer initiates navigation during lazy page hydration. Explicit locale selection, cookie/header precedence, replace-history semantics, query retention and scroll behavior remain unchanged. No hydration warning is suppressed and no timeout is used to hide the race.

## Validation

- Regression test hydrates real SSR markup behind a deliberately delayed React.lazy boundary: no normalization until the page hydrates, then exactly one normalization with no recoverable hydration error. Explicit-locale hydration does not navigate.
- 236 tests across34 files pass; types, lint and production build pass.
- Compiled catalog SSR for three locales,15 product status/recovery cases,14 sharing HTML cases and image/sharing JPEG isolation/fallback pass.
- Local compiled bare-home reload, then explicit-to-bare visits with saved en/ja/zh preferences: no new error/warning logs captured after the fix. The unfixed compiled build reproduced418 with the same synthetic catalog setup.

Hosted checks and immutable preview evidence are recorded in the PR. This checkpoint does not claim production is fixed: a specific PR merge requires explicit user approval, followed by exact production verification. Prior security remediation remains complete and unrelated acceptance/observation gates remain separate.
