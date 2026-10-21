# Recovery, dialog focus and accessibility checks — 21 October 2026

## Scope and method

Inspected application revision: `57b9c74343a2388b3df7a92e534ee104fd2fb931`
(PR #92 merge). Its tree is identical to the previously tested PR head
`c61e16a9ebef85708b3c3dd8908a3882c3277a32`; checked with `git diff`.
This is a **local development-build acceptance session**, not a new production
measurement, implementation, deployment or full WCAG certification.

The Codex in-app browser used a measured 1280 × 720 CSS-pixel viewport. Browser
engine/version, real-device and assistive-technology equivalence were not
established. Existing product/API reads were used without catalog mutations.
A temporary loopback-only proxy forwarded to the existing local frontend and
intercepted browser requests before they could reach the API/image handlers.
It injected local axe-core 4.10.3 and a QA-only keyboard audit action, excluded
its own panel from scans, and retained results locally. No production failure
was injected; no production configuration or dependencies changed. The local
harness is outside production routes and the repository dependency graph.
Raw responses, sample identifiers and screenshots remain local.

## Controlled request results

| Scenario | Observed result | Verdict |
| --- | --- | --- |
| Catalog request delayed 12 seconds | Loading products status, busy results, disabled Search; normal results and controls return after response | Pass |
| Catalog HTTP 503 | Useful error and Try again appear after retries; restore transport and click Try again to reach successful empty results; Clear filters restores catalog | Pass |
| Pagination HTTP 503 | First 20 results retained; error and Try again offered; restoring transport and retrying reaches 40 results and clears error | Pass |
| Detail request delayed 12 seconds | Close receives focus and visual skeleton renders; settled response renders detail | Visual pass; announcement gap below |
| Detail HTTP 503 | Product unavailable and Back to products shown; Escape returns to originating card; restoring transport and reopening that same product renders detail | Recovery passes; direct retry absent |
| Image HTTP 503 | Image unavailable fallback appears; title, description, price and other product controls remain readable | Pass |

Proxy telemetry confirmed interception of one delayed catalog request, one
delayed detail request, nine failed catalog/pagination requests, five failed
detail requests and twelve failed image requests. Counts include automatic
retries and catalog images brought into view, not twelve distinct scenarios.
No offline, timeout/abort, rapid-navigation, translation-fixture or server-side
initial-render failure matrix is implied by these browser-response probes.

## Keyboard focus

- Product, filter and nested sharing dialogs put initial focus on their Close
  control. Forward Tab cycles did not reach background application controls.
- Escape from filters restores its trigger. Escape from product restores the
  originating product link. Escape from nested sharing leaves one product
  dialog open and focuses Share product; another Escape restores the card.
- The earlier BODY observation was reproduced and distinguished using a local
  instrumentation probe of actual `document.hasFocus()`. In the product cycle,
  Share button and source link report document focus true and modal membership;
  the BODY boundary reports **document focus false**, followed by focused dialog
  and Close. This is the browser-chrome tab boundary, not a focused background
  application element. No custom trap is justified by that observation.
- Filter forward cycling covered 43 Tab steps and sharing 12 steps, each with one
  BODY browser-boundary observation. Broader browser/OS keyboard behavior,
  reverse-cycle completeness, browser Back restoration and real VoiceOver are
  not established by this scoped session.

## Automated accessibility and contrast

[Sanitized 24-scan results](recovery-accessibility-2026-10-21/axe-summary.json)
cover catalog, filter dialog, product modal and nested Share dialog in English,
Japanese and Traditional Chinese, each in light and dark themes. All **24 scans
have zero axe violations** under WCAG 2 A/AA, WCAG 2.1 AA and best-practice tags.
Five additional exploratory scans also had zero violations; they are not counted
as additional matrix coverage.

Contrast pass counts per scan:

- Catalog: 157 English, 137 Japanese and 157 Traditional Chinese text elements,
  for each theme. Catalog scans retain manual-review results: one
  aria-valid-attr-value, one form-field-multiple-labels and eleven color-contrast
  nodes. These are not passing measurements or asserted application defects.
- Filters: 41 English/Japanese or 43 Chinese contrast nodes per theme.
- Product modal: 16 contrast nodes per locale/theme.
- Nested Share: nine contrast nodes per locale/theme.

All 18 dialog scans have no incomplete/manual-review results. This fills the
previous dark-theme probe's coverage gap for these sampled surfaces; it does
not prove every hover/focus/error state, photograph, icon, placeholder, device,
long-label configuration or WCAG criterion. Catalog manual-review items remain
explicitly open. Automated scans do not replace assistive-technology acceptance.

## Findings and next task

1. **Slow detail loading has no accessible loading announcement.** During the
   controlled delay, the open modal contained only Close in the accessibility
   tree. Its skeleton has no text, status/live region or aria-busy state.
   `ProductDetailPending.tsx` confirms the skeleton-only markup. Add localized
   status feedback without announcing decorative skeleton blocks.
2. **A failed detail has no direct retry action.** Back to products and reopening
   recover after transport restoration, but users cannot retry in place.
   `ProductDetailError.tsx` and its modal/route callers currently supply only
   filters. Design a retry that resets the relevant query and error boundary,
   including standalone route failures; do not just add a button that remounts
   the same cached error. Distinguish transport failure from actual unavailability
   before promising a particular error message.

Next task: address those detail loading/retry gaps with regression coverage,
then rerun the controlled detail checks and relevant accessibility scans.
Complete catalog manual-review items and the remaining device/VoiceOver,
recovery/resource/cost/rollback/observation gates afterward. Keep #27/#17 and
shared #26/#29 open; historical maps #5/#36 stay closed. This session does not
complete an observation interval, change #24's accepted scheduling delay or
start #23's stable 30-day window. Production sharing acceptance remains recorded
separately; no application fix is claimed in this evidence-only change.
