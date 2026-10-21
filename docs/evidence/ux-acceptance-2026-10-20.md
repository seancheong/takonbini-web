# Current catalog UX acceptance — 20 October 2026

## Scope and release

This is the first #27 acceptance pass after PR #88. The inspected main revision
is `e60f310cb28924625755b4602dabd0182be61172`. Live checks targeted
`https://takonbini.com` on 20 October, around 22:30–22:45 Malaysia time.
The existing production verification checkpoint identifies #88 as deployed;
this pass did not independently re-query the deployment-to-commit mapping.
No application code, production configuration, catalog data or schedule changed.
No new merge or deployment occurred.

## Maintainer acceptance

When asked about real-device and VoiceOver coverage, the maintainer replied:
“I already tested it myself, it works expectedly”. Record this as
maintainer-reported acceptance of expected behavior. Device/browser versions,
individual VoiceOver scenarios and exact coverage were not supplied. This does
not establish a measured browser/device matrix or a complete accessibility audit.
The earlier maintainer checklist acceptance remains valid historical evidence.

## Independently observed production behavior

The Codex in-app browser tested a 608 × 1566 CSS-pixel viewport. Engine/version
and real-device equivalence were not established. The following checks passed:

- Opening a catalog card shows full product detail in the route-backed modal.
  Initial focus reaches Close; Escape restores focus to the originating card.
- Forward reopens a closed modal. Reload renders standalone detail, whose Back
  to products link returns to the catalog.
- Staging Lawson + Noodles + Kanto leaves the URL unchanged until Apply. Apply
  commits all three filters and chips. Load more changes 20 shown products to
  28 and then reports all matching products shown.
- Opening a second-page product and returning preserves all 28 results and the
  three filters. Escape after settled detail loading restores card focus.
  Sticky filter access reopens the dialog with the applied selection.
- Adding a store to the dialog draft and pressing Escape discards the draft;
  the original three filters remain applied. Focus returns to the filter trigger.
- Typing an unmatched search leaves the current URL/results unchanged until
  Enter. Submission shows zero results and useful empty-state copy. The empty
  state's Clear filters action restores the 20-product catalog.
- A deliberately nonexistent product renders Product unavailable and a Back to
  products link; following it recovers to the loaded catalog.
- Client language selection updates URL, interface, page title, document language
  and the polite language-change message across en/ja/zh. Both themes were
  selected for each locale. The six DOM samples each have one h1, no horizontal
  document overflow and no images missing alt attributes at this viewport.
  This simple DOM check is not a complete accessible-name or contrast audit.

[Six locale/theme DOM samples](ux-acceptance-2026-10-20/browser-dom.json).
Screenshots and raw browser observations remain local; retailer content is not
included in this evidence commit.

Keyboard wrap was explored but is not accepted from this pass: Shift+Tab from
Close produced body as the DOM active element; subsequent Tab returned to Close.
Browser chrome focus and an application defect were not distinguished. No
application failure is asserted from this observation. A dedicated keyboard
containment test remains required. One Back observation also had body focus;
Escape restoration was independently verified after settled loading.

## Repeatable checks

- `vitest run`: **22 test files, 146 tests pass** on the inspected revision.
  jsdom emits two existing “Window's scrollTo()” not-implemented messages;
  passing component tests do not prove real-browser scrolling behavior.
- `python3 scripts/check-ssr-locales.py https://takonbini.com`: **6 sequential
  and 12 concurrent cases pass**, exit 0. URL/cookie/header precedence retains
  the expected document language. [Results](ux-acceptance-2026-10-20/production-locales.json).
- `scripts/check-seo.py`: **7 HTML cases pass**, exit 0, across catalog and two
  standalone products in three locales. Each has exactly one expected canonical
  and Open Graph URL. Sitemap returns 200 with **5,313 unique URLs**, both sampled
  products present. Enumeration is not a transactional snapshot or indexing proof.
  [Sanitized results](ux-acceptance-2026-10-20/seo-sanitized.json) replace product
  identifiers with sample-a/sample-b; the original local probe used actual IDs.
- Each sampled hydrated catalog references the extracted StyleX CSS asset.
  This verifies linkage, not all computed-style parity or CSS performance.

## Scoped text-contrast probe

A read-only DOM probe computes WCAG luminance ratios for direct text nodes,
compositing RGB/RGBA ancestor backgrounds. It checks 4.5:1 for normal text and
3:1 for large text. It skips gradients, non-RGB colors and opacity below one,
and does not inspect placeholders, icons, focus rings or every control state.
Light catalog: 115 text elements checked, no failures, minimum 5.33:1;
50 elements skipped. Dark catalog: only one checked (8.56:1), 164 skipped,
so **dark-theme contrast remains unverified**. Repeating after the theme settled
produced the same coverage. This is a limited probe, not axe or WCAG conformance.
[Coverage and results](ux-acceptance-2026-10-20/text-contrast.json).

## Remaining gates and next task

Keep #27 open. These broad acceptance items remain unchecked:

1. Controlled slow/failing catalog, pagination, detail and image requests, retry
   recovery, rapid navigation, and missing-translation fixtures in a browser.
2. Dedicated automated accessibility/contrast checks, keyboard containment and
   browser-specific focus investigation; reduced motion/transparency evidence.
   Maintainer acceptance is recorded separately from measured coverage.
3. Mobile/tablet/desktop browser coverage beyond the single viewport above,
   including long labels. No full matrix is inferred from the six samples.
4. Field INP and the existing controlled resource/cost, rollback/recovery and
   observation gates shared with #26/#29. No new performance pass is claimed.
5. A recorded production observation interval and review after 24 hours; this
   short test session does not complete that interval or start #23's 30-day window.

**Next task:** continue #27 with controlled slow/failure browser scenarios and
an automated accessibility/contrast pass, then resolve any reproducible findings.
#24 still needs its next qualifying scheduled cycle and reliability evidence;
#23's stable 30-day window remains unstarted. Historical #86 cold-state limits
and prior failing samples remain preserved.
