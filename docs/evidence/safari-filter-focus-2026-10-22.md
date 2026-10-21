# Safari Filters focus — 22 October 2026

Issue: #98. Baseline: main `9646f7f` (PR #97). This report describes local implementation and compiled-browser verification, not a production release or user acceptance.

## Reproduction and cause

Native Safari 26.6.2 (21624.5.1.11.3), macOS 26.6.2:

- Production English catalog, pointer-open Filters: Close filters receives focus. Escape closes the dialog; accessibility reports HTML content. A read-only Web Inspector expression reports `document.activeElement.tagName` as `BODY`.
- Option+Tab then reaches All stores. Shift+Option+Tab returns to Filters; Enter opens the dialog and Escape correctly returns to Filters. No browser or OS keyboard preferences were changed.
- The component captures `document.activeElement` immediately before `showModal()`. Safari pointer activation does not supply the focused trigger that this restoration strategy assumes. The old cancellation test explicitly focused the trigger before clicking, masking the pointer path.

Each launcher now focuses `event.currentTarget` with `preventScroll` before opening: the original trigger, sticky Filters, and the compact sticky summary action. Existing native modal opening/containment, scroll locking, dismissal timing, staged filters and return-focus cleanup remain in place. No new timeout, focus trap, visual style or public prop is introduced.

## Regression signal

`npm test -- tests/catalog-controls.test.tsx tests/sticky-filters.test.tsx`:

- Before implementation: 2 failures / 13 passes. The original cancellation scenario now starts without pre-focusing; both sticky callbacks observe the actual focus target.
- After implementation: 15 passes. Full suite: 27 files / 214 tests pass. Type checking, lint, build and whitespace checks pass.

JSDOM does not emulate Safari's native dialog behavior. The tests guard launcher ownership; the compiled-browser checks below verify actual focus restoration.

## Compiled local verification

Local compiled preview, English, System theme resolving dark:

| Browser / path | Result |
| --- | --- |
| Safari 26.6.2, original pointer-open → Escape | Filters focused |
| Safari, original keyboard Enter → Escape | Filters focused |
| Safari, Option+Tab after return | All stores focused; reverse traversal returns to Filters |
| Safari, sticky Filters pointer-open → Escape | Sticky Filters focused, visible focus ring |
| Safari, sticky Filters pointer-open → pointer Close | Sticky Filters focused |
| Safari, sticky Filters pointer-open → pointer Apply without changing draft | Sticky Filters focused |
| Safari DOM inspection after Apply | `BUTTON`, text `Filters` |
| Chrome 156.0.8078.47, pointer-open → Escape | Filters focused |
| Chrome, keyboard Enter → Escape | Filters focused |

The compact summary launcher is covered at its callback seam, not claimed as native compact-browser acceptance. No new full locale/theme, reduced-motion/OS-preference, real-device or audible VoiceOver matrix is claimed. Existing broader #27 gates remain.

Temporary native tabs and inspector were closed; compiled preview stopped after verification. Screenshots and raw retailer/browser data remain local. No diagnostic instrumentation was added to application source. Local API credential startup was unavailable; the compiled preview's existing configured catalog source loaded successfully, so the filter checks did not require a new AWS sign-in or configuration change.
