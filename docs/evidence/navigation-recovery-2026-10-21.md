# Navigation startup recovery (#94) — 21 October 2026

## Problem and diagnosis

Production verification of PR #93 recorded two broad-disconnection observations:
a cold navigation included a failed route JavaScript chunk, and a warmed-code
navigation exposed Failed to fetch plus a failed navigation server-function
request. Neither reached a useful recovery action. Product-only failure handling
from #93 passed separately. See [#94](https://github.com/seancheong/takonbini-web/issues/94)
and [the production record](https://github.com/seancheong/takonbini-web/issues/27#issuecomment-6312977327).

The deterministic regression command was:

```text
node node_modules/vitest/vitest.mjs run tests/navigation-recovery.test.tsx
```

With the harness configured, both initial cases failed against the released
implementation because Try again was absent: a throwing root loader and a
rejected lazy route-options importer. They exercise the real router boundary,
not a shallow snapshot of an invented error panel. Startup data reuse was also
checked with the real router: a stale load cycle reissues the unconfigured
loader under the control case; the candidate's infinite stale time reuses the
successful result. This does not claim every ordinary navigation refetched it.

The first compiled candidate demonstrated that branding alone was insufficient:
clearing a local route-chunk fault and invalidating the router left the same
failed-import screen. The browser retains the failed ES-module import. The fix
therefore distinguishes that case from retryable startup requests.

## Implementation

Implementation commit **7fc4b16**:

- RootDocument is the root **shellComponent**, outside the route error boundary.
  HTML/head/styles, theme provider and Header survive root errors. Its loader
  data lookup tolerates the failed/unavailable-data case.
- Theme/origin/site startup data is cached for the router lifetime; explicit
  invalidation still refreshes it and a new server request reads current data.
- The root eagerly imports NavigationError and NavigationPending. They follow
  the URL locale, use semantic StyleX tokens, and expose neutral 44px actions.
  Raw error/stack details are not rendered.
- Startup-request and transient route-options failures use router invalidation
  for in-place retry. Repeated failure leaves the error screen usable. A slow
  retry exposes a polite, focusable Opening page status inside a named h1 and
  keeps the catalog escape available.
- Known Chrome/Firefox/Safari dynamic-import failure prefixes use **one
  user-triggered document reload**, with explanatory copy. No automatic reload
  loop is added. Known offline state announces reconnect instructions instead
  of issuing that reload. The URL/query remains; a masked product URL reloads
  as standalone detail, rather than preserving the in-memory modal/pages.
- In-place recovery focuses an open dialog's Close before the loaded h1 and
  avoids moving focus after navigation to a different URL. Full reload uses
  normal browser new-document focus. The catalog title now supports programmatic
  focus without joining ordinary Tab order.
- Back to products is a native anchor retaining the query/locale and dropping
  modal history state; it does not depend on the failed client route code.

No dependency, database, scraper, schedule or production configuration changed.

## Validation

### Automated checks

- **27 files, 209 tests pass** on the final implementation, including 11 focused
  navigation cases: repeated request/options failure then recovery, stale startup
  data control/candidate, three localized error panels, slow retry status/escape,
  three browser import-error prefixes, and the known-offline reload guard.
- TypeScript, Biome lint, production build and `git diff --check` pass. Existing
  jsdom Window.scrollTo notices remain warnings, not browser scrolling evidence.
- [SSR locale checks](navigation-recovery-2026-10-21/ssr-locales.json): **six
  sequential and twelve concurrent cases pass**, including URL/cookie/header
  precedence and document language. Source/head regression tests remain in the
  full suite; this is not a new production SEO/indexing measurement.

### Compiled browser checks

Codex in-app browser, measured 1280×720 CSS pixels. Engine/version and real-device
or assistive-technology equivalence were not established. A loopback-only HTTP
proxy intercepted selected local requests. The API fault proxy still forwarded
ordinary local reads to the existing API; no production failure was injected.
Raw retailer responses, sample ids and screenshots remain local.

Observed passes:

1. A required standalone route chunk returned HTTP503. The eager recovery UI
   kept Header/theme/document styling and focused its error heading. Repeating
   Try again while blocked rendered useful recovery again. Clearing the fault
   and clicking Try again performed one document reload, loaded the selected
   detail and retained its search/limit/language query. New-document focus was
   BODY, as normal for that full reload; no in-place focus claim is made here.
2. A controlled initial product failure prepared #93's standalone error. Restoring
   the product API but blocking only the root server-function request during its
   recovery reached the new root error screen. Another failed startup retry kept
   it usable. Delaying the restored startup response 15 seconds exposed Opening
   page; recovery rendered the same product and focused H1 with the query intact.
3. Switching locale while startup requests failed kept usable localized recovery.
   All en/ja/zh × light/dark samples had one h1, the expected document language,
   matching light/dark body background and no horizontal overflow.
4. On the final pending build, the named Opening page h1 is discoverable through
   the browser accessibility API. Back to products during the delayed request
   loaded the catalog with search text, limit and language retained.

[Seven retained axe scans](navigation-recovery-2026-10-21/axe-summary.json): six
startup-error locale/theme combinations plus final English dark pending, all
**zero violations and zero incomplete results**, axe-core 4.10.3 WCAG2 A/AA,
WCAG2.1 AA and best-practice tags. The error matrix was captured before the final
pending-only accessible-name adjustment; the pending scan used the rebuilt
adjustment. Initial chunk-error and exploratory scans are not additional matrix
coverage. A preliminary pending scan caught page-has-heading-one; its correction
also required an explicit h1 name because the native browser did not name a
heading from the nested live output alone. Both failures are retained here,
not relabeled as earlier passing checks.

The final test tab closed, fault files cleared and local QA proxies/preview
stopped. The ordinary local frontend/API remain available. No test controls or
harness code are part of production routes or the dependency graph.

## Remaining gates and next task

Implementation/local verification is complete; this candidate is not merged or
deployed. Review the PR and final hosted checks, obtain explicit approval for
that specific PR, then verify its exact production deployment and scoped startup
recovery. Do not close #94 from local checks alone.

Full native-offline device/browser coverage, audible VoiceOver, broader Back/
reverse-cycle/rapid-navigation, catalog manual-review, resource/cost/rollback and
observation gates remain. The recovery UI is not a service worker and cannot
serve a new document when the whole site is unreachable. No full WCAG or offline
application guarantee is claimed. Shared #27/#17/#26/#29 stay open; historical
maps #5/#36 stay closed. Existing dependency PR #91/security findings, #24's
accepted delay and remaining reliability gates, #23's unstarted stable window,
and MongoDB-only decisions remain unchanged.
