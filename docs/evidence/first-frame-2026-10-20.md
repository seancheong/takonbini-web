# First-frame diagnosis — 20 October 2026

PR #88 and issue #86 remain open and the PR stays draft. This follow-up investigates the failed Tokyo light-detail median from the original eighteen-run regional experiment. It changes no application code and does not replace the original release measurement method.

## Controlled applied-throttling matrix

Twenty-one fresh-profile Lighthouse 13.4.1 / Chrome 155 / Node 24.16 runs: eighteen in a three-case × two-launcher-state × three-repeat matrix, plus three supporting default-feature live-page runs. Runs are sequential, arm order alternates by repeat, and every result is retained. Mobile viewport is 412×823 / DPR 1.75. Network throttling is applied through DevTools: requested latency 150 ms, download 1638.4 Kbps, upload 750 Kbps, CPU slowdown 4×. The retained `configSettings` record all effective Lighthouse settings. This applied method differs from the original simulated series and cannot be substituted silently.

The isolated pair copies the complete installed chrome-launcher default flags. Both arms ignore automatically appended defaults and use the same common headless/GPU flags. The variant removes only RenderDocument from the disabled-feature list and adds an explicit enable. Actual child-process spawn arguments were recorded (temporary profile/port redacted); all nine pairs have exactly the intended three argument differences and identical Lighthouse settings. This is launch-argument verification, not independent introspection of Chrome's resolved feature state.

Cases:

- Live: unchanged immutable Tokyo preview 5775679, standalone light product `0d41fc1137e1762b66b05d4539990c2b`.
- Script-free SSR: captured HTML and stylesheet from that preview, all scripts/module preloads removed, images served as one fixed local WebP, and CSP blocks scripts/connections. A local server imposes a fixed 250 ms document delay and 50 ms CSS/image delay. The captured page has zero script tags or iframes; network logs show only local HTML/CSS/image plus a favicon 404. This isolates hydration and remote network variability, not byte-identical live content.
- Minimal: a small local heading/image page with inline CSS and no JavaScript, using the same local image and delay rules. This reduction tests whether every static page is affected.

| Case | Existing launcher LCP runs (s) | RenderDocument enabled LCP runs (s) | Median existing → enabled |
| --- | --- | --- | --- |
| Live | 1.274, 2.571, 2.543 | 1.513, 1.115, 1.107 | 2.543 → 1.115 s |
| Script-free SSR | 2.508, 2.511, 2.479 | 0.907, 0.895, 0.901 | 2.508 → 0.901 s |
| Minimal | 0.621, 0.621, 0.621 | 0.634, 0.626, 0.636 | 0.621 → 0.634 s |

The script-free result reproduces the failure without application hydration; the minimal fixture does not. This is evidence of a rendering/configuration interaction on this page shape, not a claim that every static page stalls. It does not justify removing application features or adding an animation/audit-detection workaround.

The three supporting live controls omit all launcher default flags and pass only headless/disable-gpu/no-first-run; their actual spawn arguments contain no feature overrides. LCP is **1.096, 1.086, 1.238 s**, median **1.096 s**. This is Chrome default-feature coverage under headless Lighthouse/applied throttling, not stock headed Chrome, physical-phone, INP or field acceptance. Other defaults differ, so these three controls are not the single-feature causal comparison above.

## Trace evidence and interpretation

In the first script-free baseline trace, the target renderer paints the 330px image around 1,497 ms and first contentful presentation occurs around 2,508 ms, a further ~1,012 ms later. With RenderDocument enabled, target-image paint occurs around 882 ms and presentation around 907 ms, about 25 ms later. Summaries omit raw process/frame IDs; full traces remain local. We do not assign individual Viz throttling decisions to a particular frame sink or assert Chrome's exact internal cause.

An [open Lighthouse issue](https://github.com/GoogleChrome/lighthouse/issues/17148) reports related presentation delays. It is a hypothesis source, not maintainer confirmation for Takonbini. Our repeated, single-feature, script-free comparison establishes a browser/launcher contribution in this environment; it does not prove that all previous slow runs are artificial, every real device passes, or production has no other performance cost.

## Severity and release decision

The remaining failed gate is performance: some original lab LCP values exceed 2.5 s, including Tokyo's 2.730 s light-detail median. No broken catalog/image, crash, security defect or layout shift was identified by this investigation; earlier correctness checks remain passing. This matters to release acceptance but is not evidence of an urgent production outage. Diagnostic success does not erase those failures.

The maintainer asked what remains failing and whether it is serious; this was a clarification, **not approval to change acceptance criteria or merge**. Retain PR #88 as draft and #86 open under the original gate. The regional cache-MISS/response benefits, higher published Tokyo per-unit pricing and resource/cost/global-device limitations remain as recorded in the regional evidence.

Next release task is an explicit measurement-method decision: retain the simulated gate and investigate the launcher/upstream behavior further, or agree a documented applied-throttling gate while preserving all original results. If a new method is agreed, measure the full representative catalog/heavy-detail/light-detail set under it before deciding release readiness; the light-detail-only diagnostic here is insufficient. No original gate is marked passed by this document.

Sanitized samples, settings, launch arguments, fixture hashes and trace summaries are in [the evidence directory](./first-frame-2026-10-20/). The fixture generator takes an output directory and the existing public light-product JSON as arguments; it uses no credentials. Raw traces/reports and fixtures remain local, outside the product runtime. No permanent debug instrumentation or dependencies were added.
