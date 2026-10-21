# Detail loading and retry fixes — 21 October 2026

## Implementation

Implementation commit `f3746ef` addresses both gaps recorded in
[the initial acceptance pass](recovery-accessibility-2026-10-21.md).
Those historical findings remain valid for the earlier production revision;
this follow-up supersedes them only for the unmerged candidate.

- ProductDetailPending now exposes localized Loading product details text in a
  polite native output; decorative skeletons are hidden from assistive technology.
- ProductDetailError takes the product id and an onRecovered callback. Its neutral
  44px Try again action requests fresh data for that product with staleTime zero.
  It disables duplicate submissions and exposes polite loading/repeated-error
  feedback. Failure leaves Retry and Back available. It does not clear unrelated
  cached queries or reset the error boundary before fresh data succeeds.
- On success the modal resets its CatchBoundary and focuses its existing Close
  button. Standalone recovery invalidates the route, whose loader consumes the
  successful query, and focuses the loaded h1 (programmatically focusable but
  excluded from ordinary Tab order).
- A mounted guard prevents a pending retry's success callback from running after
  its error screen is removed, so leaving the product does not later invalidate
  another route or steal its focus. The explanatory recovery copy and new status
  strings exist in English, Japanese and Traditional Chinese.

No production data, configuration, dependency, schedule or infrastructure changed.
No merge or production deployment is implied by this implementation.

## Regression and build evidence

`vitest run tests/product-preview.test.tsx` was first run with new assertions
against the old implementation: **three failures**, specifically missing loading
status in modal/page presentations and no retry button at the real modal error
boundary. After implementation those regressions pass.

Final candidate checks:

- **26 test files, 198 tests pass**, including actual modal query/CatchBoundary
  failure → repeated failure → delayed success and standalone router error
  recovery, retained return filters, successful heading focus and unrelated cache
  preservation. A deferred retry/unmount test verifies no late recovery callback.
- TypeScript `tsc --noEmit`, Biome lint and `vite build` pass; `git diff --check`
  passes. Existing jsdom Window.scrollTo not-implemented notices remain warnings,
  not a claim of browser scrolling coverage.
- The final compiled build includes the mounted guard and copy refinement.
  Browser testing used Vite preview, not merely the development server.

## Controlled compiled-browser checks

Codex in-app browser, 1280 × 720 CSS pixels; engine/version and real-device
or assistive-technology equivalence were not established. Temporary loopback-only
proxies injected HTTP 503 and 12-second delays before the local API handler.
This includes initial **server-rendered standalone failures**, not just browser
API interceptions. Ordinary local read-only product requests still used the
existing API. Credentials, response bodies, sample ids and screenshots stay local;
no production failure was injected. Temporary proxies were removed from service
at the end of the checks.

Observed passing scenarios:

1. A delayed modal detail request exposes Loading product details in the
   accessibility tree while Close keeps focus. Its resolved response renders detail.
2. Modal HTTP503 produces Product unavailable with Try again. Retrying another
   failure keeps the error screen and exposes repeated-failure copy. A delayed
   retry disables the action and shows loading status. Restoring transport then
   renders detail in the same modal and puts focus on Close.
3. Direct standalone navigation under API HTTP503 renders the error route with
   Retry. Another failed retry keeps recovery controls usable. A delayed successful
   retry renders the same product without a reload, leaves zero dialogs and
   focuses H1. This recovery was observed in all three locales. The final build
   repeated English recovery and the six-locale/theme error-state matrix.
4. On the final build, Back to products remains available during a delayed retry.
   Leaving it and focusing Search keeps the catalog URL and input focus after
   the response opportunity (checked 44 seconds after the injected request,
   exceeding its 12-second delay). The late callback does not move focus to H1.

## Accessibility scope

[Sanitized new-state axe results](recovery-accessibility-2026-10-21/detail-fixes-axe.json)
record **27 scans**, all with zero violations and zero incomplete/manual-review
results, using axe-core 4.10.3 WCAG2 A/AA, WCAG2.1 AA and best-practice tags.

The first compiled implementation contributed 15 scans: English modal initial
loading/error/retry-loading, plus standalone error and retry-loading in all three
locales × both themes. The final build contributed 12 scans: the complete six-case
standalone error matrix, three initial error duplicates, plus English error,
retry-loading and a second product's error. The result JSON distinguishes builds;
those duplicate scans are not extra matrix coverage. Contrast counts are one
modal initial-loading node, four modal error/retry nodes, and seven standalone
nodes per scan. Original catalog manual-review limits from the initial pass remain
open; they are not cleared by these new-state checks.

This verifies status semantics, accessible DOM exposure and automated rules;
actual audible VoiceOver delivery remains unmeasured. Full browser/device,
reverse-cycle/Back focus, rapid navigation, all error/translation fixtures,
resource/cost/rollback and observation gates remain open.

## Release and next step

PR #93 now contains implementation as well as the initial evidence. Review the
final diff and hosted checks, obtain explicit approval to merge **PR #93**, then
verify its exact production deployment and scoped detail recovery/loading states.
Do not mark these fixes deployed or user-accepted from local checks. #27/#17 and
shared #26/#29 stay open; historical maps #5/#36 stay closed. Existing dependency
PR #91/security findings, #24's accepted delay and remaining reliability gates,
#23's unstarted stable window and MongoDB-only decisions remain unchanged.
