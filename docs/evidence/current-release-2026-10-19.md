# Release verification follow-up — 19 October 2026

## Maintainer manual verification

After PR #80 merged, the maintainer reported language and navigation behavior
working and then reported that all items in the supplied manual checklist passed:
combined filters/pagination and detail return state; direct product links;
keyboard/dialog focus; responsive language/theme layouts; and reduced motion.
The only reported console issue was the webmanifest 404. Exact browser/device
versions, viewport dimensions, and screen-reader results were not supplied, so
this is maintainer-reported checklist evidence rather than an independently
recorded Safari/VoiceOver or complete accessibility audit.

## PR #80 production verification

The read-only URL/cookie/header precedence script was run against
`https://takonbini.com` after the merge. Results are retained in
[production locale checks](current-release-2026-10-19/production-locales.json).
The script checks six sequential and twelve concurrent requests and exits
nonzero for any incorrect document language. This complements the manual
verification of the original locale race.

## Webmanifest correction

Production returned HTTP 404 for `/site.webmanifest` and HTTP 200 with JSON for
`/manifest.json`. The root head linked the missing path. Change that link to
the existing manifest; retain its current icons and metadata. TypeScript, scoped lint, and the production build pass. The local production
server renders the corrected head link, and the manifest and all three referenced
icons return HTTP 200. The production 404 remains until this fix is released.

## Dependency security assessment

The new production dependency audit still reports 2 critical, 19 high, and 5
moderate findings. The [package/path summary](current-release-2026-10-19/dependency-assessment.json)
retains advisory links and patched version ranges. These are dependency-graph
findings; runtime reachability has not been established for every advisory.

Existing open Dependabot PRs cover baseline-browser-mapping (#64), js-yaml (#65),
browserslist (#66), nanoid (#67), source-map-js (#68), and postcss (#69).
Additional remediation is needed for Seroval 1.3.2, Rollup 4.55.1, and ws 8.19.0.
Seroval and ws currently trace through developer tools; the other paths trace
through Start's Vite/plugin tooling. Build-time dependencies can appear under
`--prod` because their parent package is a production dependency. That does not
by itself prove either remote exploitability or exemption.

Next: review the existing update PRs, resolve compatible versions for the three
remaining packages (Seroval at least 1.6.3, Rollup at least 4.59.0, ws at least
8.21.0 according to this audit), inspect the resulting dependency graph/artifact,
and rerun security, SSR, navigation, and build checks in a separate dependency
change. No dependency versions were changed for the manifest correction.

## Gates retained

Manual checklist evidence and locale HTTP results do not close #16/#27/#74's
remaining accessibility/browser/observation requirements or #26/#29's recovery
and observation requirements. #24 still requires its scheduled-cycle evidence;
#23 still requires the stable 30-day measured window. Security remediation
remains a hard gate under #17.
