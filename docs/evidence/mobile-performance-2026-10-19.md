# Mobile performance measurement — 19–20 October 2026

## Initial production baseline — 19 October

Production revision `a69d2829beccb27167d783f546cee32ccd21dd5b`, deployment
`7173213574`, was measured with Lighthouse 13.4.1, Node 24.16.0, and isolated
Headless Chrome 155 profiles. Three sequential, interleaved browser-cold
navigations each covered the English catalog and an English standalone product
(Chiikawa Shooting Star Gummies). Browser storage starts fresh for each run;
backend/CDN/image caches were not forced cold. Results are synthetic navigation
measurements, not field Core Web Vitals or a real-device/browser matrix.

[Per-run results and settings](mobile-performance-2026-10-19/production-baseline.json)
retain the mobile viewport, simulated throttling (150 ms RTT, 1,638.4 Kbps,
4× CPU slowdown), host user agent, and benchmark index. One bootstrap audit ran
on Node 22.16, below this Lighthouse release's engine requirement; it is excluded
from all reported three-run medians. All six included runs use Node 24.16.

| Page | Median performance | Median LCP | Median TBT | Median CLS |
| --- | ---: | ---: | ---: | ---: |
| Catalog | 96 | 2.43 s | 0 ms | 0 |
| Standalone detail | 96 | 2.57 s | 0 ms | 0 |

The [rollout plan's recorded targets](https://github.com/seancheong/takonbini-web/blob/6302b70/docs/plans/production-rollout-verification-and-evidence.md)
are LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1, all Lighthouse categories ≥90, and no
unexplained bundle/route-response regression above 10%. These are gates under
recorded conditions. This audit selected only Lighthouse's performance category;
it does not establish the other category scores or measure INP. Zero TBT is not
an INP result. Catalog meets the sampled LCP/score/CLS targets; detail narrowly
misses the sampled LCP target. Do not mark complete mobile acceptance.

The older preview performance score of 91 (16 October) and September baseline
used different code, browser/environment, or sample conditions. They are context,
not matched controls or proof of a regression/improvement. Historical release
observation windows cannot be reconstructed by these current measurements.

## Diagnosis and focused candidate

The catalog LCP element is the first product image. Its observed trace identifies
`loading="lazy"` with no high fetch-priority hint, despite being discoverable in
the document. Load-delay diagnostics support prioritizing that one image. The
standalone detail image is already eager/high priority. The diagnostics also
flag oversized/legacy-format catalog images and unused JavaScript, but zero
measured TBT does not justify a broad bundle rewrite, nor does this candidate
claim to solve image delivery or detail LCP.

ProductGrid now sets `imagePriority` on its first card only. ProductCard defaults
to lazy loading and uses eager/high priority when requested. Subsequent cards,
including appended Load more results, remain lazy. The regression test failed
before the change and passes afterward. The component contract is updated in
`docs/design/catalog.md`. Styling and geometry are unchanged.

All 110 tests, TypeScript, lint/scoped formatting, and the production build pass.
Summed emitted client-asset bytes (same gzip settings) are retained for
[baseline](mobile-performance-2026-10-19/baseline-bundle.json) and
[candidate](mobile-performance-2026-10-19/candidate-bundle.json): JavaScript gzip
185,879 → 185,897 bytes (+18 bytes); CSS 10,279 → 10,279 bytes. These are all
emitted client assets, not initial-route transfer. They do not exceed the 10%
regression threshold against this unchanged-source build control, but cannot
retroactively establish the historical isolated-release gate. Lighthouse TTFB
samples are not a controlled route-response regression test.

## Reproduction and remaining gates

With Node ≥22.19, installed Chrome, and Lighthouse 13.4.1, repeat each page three
times sequentially, alternating catalog and detail, with a fresh Chrome session:

```sh
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx --yes --package lighthouse@13.4.1 lighthouse \
  'https://takonbini.com/?lang=en' \
  --chrome-flags='--headless --disable-gpu --no-first-run' \
  --only-categories=performance --output=json --output=html --save-assets
```

Detail path: `/products/0d41fc1137e1762b66b05d4539990c2b?lang=en`. Keep the
foreground workload low; do not run audits in parallel. Raw reports, HTML, and
traces are retained locally for inspection rather than publishing trace/page
payloads. Hosted comparison and a current-content production repeat are recorded below. Candidate code is not merged or deployed to production.

LCP detail headroom, interaction/INP measurement, representative cache/error/
locale/device conditions, other Lighthouse categories, accessibility/browser
coverage, and observation remain open under #27/#29/#26. #24's unattended
refresh cycles and #23's stable cost/stability window are unaffected. No ranking,
field-performance, complete accessibility, or real-mobile-device claim is made.

## 20 October follow-up: current content fails the load target

The catalog changed between the initial baseline and this follow-up. The first
LCP product is now `01e1c84bc70c04a2c7eb082ee879d20c`, rather than the earlier
lightweight image. Same web revision, different live content: the earlier 96 /
2.43 s catalog median is **not current performance acceptance**. Raw reports'
UTC timestamps are retained as emitted; the follow-up is dated to the client's
20 October session.

[Three fresh production runs](mobile-performance-2026-10-19/production-current-2026-10-20.json)
now give a median performance score of **74**, **6.77 s LCP**, **0 ms TBT**, and
**0 CLS**, with about **1.57 MB transferred** during navigation. The critical
product image alone transfers roughly **593 KB**. The existing proxy forwards
original retailer images, so their changing size is a concrete content-sensitive
bottleneck. Lighthouse flags image delivery; this is not evidence that changing
JavaScript priority alone solves it.

### Paired hosted preview experiment

[Per-run comparison](mobile-performance-2026-10-19/preview-comparison-2026-10-20.json):
Lighthouse 13.4.1 / Node 24.16 / Headless Chrome 155, identical simulated mobile
settings, three fresh profiles per arm. Run order was control/candidate,
candidate/control, control/candidate. The same LCP product ID appears in all six
runs. The control's source/build inputs match main; only the candidate adds the
first-image priority behavior and its regression test/documentation.

| Arm | Median score | Median LCP | Median TBT | Median CLS |
| --- | ---: | ---: | ---: | ---: |
| Unchanged preview control | 76 | 6.13 s | 4 ms | 0 |
| First-image-priority preview | 78 | 5.34 s | 1 ms | 0 |

Observed median LCP is approximately 13% lower in this small sample. This is
**not an isolated causal speedup or acceptance pass**: immutable preview hosts,
mutable catalog data, and uncontrolled CDN/upstream caches still differ. Control
LCP ranges 5.37–7.17 s; candidate ranges 5.32–7.68 s. Both arms fail the ≥90
performance score and ≤2.5 s LCP targets. The candidate's reports confirm
`loading="eager"` and `fetchpriority="high"` for the LCP image, while the control
remains lazy, so the intended hint change is active.

PR #85 passes Web CI, Vercel, and both Socket checks; software checks do not mean
the product's performance gate passed. Keep the PR as a draft pending image
payload work. No merge or production deployment of the candidate occurred.
The next fix is bounded responsive/compressed image delivery, including source/
resource validation and cache behavior, then repeated live mobile measurements
with representative image sizes. INP/interaction measurement, detail headroom,
other Lighthouse categories, browser/accessibility, controlled response timing,
and observation remain open. Do not replace INP with TBT or extrapolate the old
light-image baseline to a changed catalog.
