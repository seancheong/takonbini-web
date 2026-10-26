# Homepage rendering checkpoint — 26 October 2026

## Implementation

PR #118 removes the homepage's blocking stylesheet round trip using the installed TanStack Start `server.build.inlineCss` option and a normal root stylesheet import. Generated global and StyleX CSS is emitted in the first-response head. The framework owns style hydration; there is no second hand-maintained CSS subset or dependency change. This framework option is experimental, so the compiled HTML regression check and browser checks are required.

The same verification reproduced #109: a catalog prefetch with `gcTime: 0` could be collected before the lazy SSR route renders. A failing regression test confirmed the lost seed. Server catalog queries now retain their seed for their request-scoped query-client lifetime. Browser inactive catalog queries still collect immediately, and the one-query-page/five-resident-page bounds are unchanged. The original compiled catalog checker now passes without modification: three locales, 20 SSR cards and one upstream read per request.

## Controlled rendering measurements

A local GET-only mirror serves frozen public production HTML/assets as the baseline and actual compiled candidate HTML/assets. Both contain the same ordered 20 product IDs. The mirror freezes catalog data and SSR output, sends text with Brotli quality 5 and `Cache-Control: no-store`, and excludes API/platform latency from the comparison. It is a browser-delivery experiment, not a cold-server or production benchmark.

Native Chrome Incognito, iPhone SE emulation (375 × 667), CPU 4× slowdown, Slow 4G and disabled network cache were used. Exported trace metadata confirms CPU/network settings and each measured navigation URL. Runs alternate baseline/candidate:

| Run | LCP | CLS |
| --- | ---: | ---: |
| Baseline 1 | 1505.259 ms | 0 |
| Candidate 1 | 704.823 ms | 0 |
| Baseline 2 | 1506.216 ms | 0 |
| Candidate 2 | 706.451 ms | 0 |

An intervening attempted candidate navigation dropped its URL prefix during native address entry and loaded a browser file-error document. Its 198.891 ms reading is invalid and excluded; the corrected candidate navigation was exported and checked. No application failure is inferred from that navigation error.

The baseline has a separate blocking CSS request; the candidate has none. Compressed HTML increases from 16,903 to 26,861 bytes (+9,958 bytes). Both use the same complete ~43.9 KB uncompressed CSS. Raw traces, frozen retailer payloads and local browser artifacts remain private temporary files; this document contains the sanitized measurements only.

Earlier 25 October exploratory controls suggested CSS delivery dominated the heading's render delay; the fresh paired series above is the recorded comparison. These local results do not establish a hosted LCP guarantee, field INP, global performance, or completion of the broader #27/#102 acceptance gate. The prior remote PageSpeed method and accepted #86 applied-throttling method remain separate.

## Verification

- 256 tests in 37 files, lint, TypeScript, production build and diff whitespace checks pass locally.
- All existing compiled image isolation, sharing/indexing (17 sharing and 42 indexing cases), detail recovery/status (15 cases), bounded catalog and Browse traversal checks pass.
- New compiled styles check passes 12 route/locale cases: home, Browse, detail and missing product in en/ja/zh; exact emitted/inlined CSS agreement, one inline stylesheet, no blocking CSS link and a 64 KiB uncompressed budget.
- [Web CI 40329263685](https://github.com/seancheong/takonbini-web/actions/runs/40329263685) passes on implementation commit `f892e988a6f98cafeb7ed36f50a1aaefe69e5ed7`; Vercel and both Socket checks pass.
- [Immutable preview](https://takonbini-90pndhp5j-sean-cheong-zhen-xiongs-projects.vercel.app/?lang=zh), deployment 7332813141, succeeds on that implementation commit. All 12 real preview HTTP cases pass expected 200/404 status, complete inline CSS and no blocking CSS link; homepages retain 20 SSR cards.
- Native Chrome and Safari: preview homepage styling, dark-theme selection, loaded product modal and dismissal pass. Safari restores product-link focus after dismissal and retains dark styling on reload. These are scoped desktop smoke checks, not renewed full device acceptance.
- In-app Chromium: dark theme, loaded product modal, dismissal with focus returned to its product link, Browse navigation and Japanese locale transition pass; no captured warning/error logs.

Implementation and preview verification are distinct from merge and production verification. PR #118 remains unmerged pending explicit approval. Next: approve the specific PR, then verify the exact production deployment and rerun scoped live rendering/SSR checks. #109 remains open until that release is verified; maps #5/#36 stay closed and #17/#27/#26/#29/#102 remain open for their separate remaining gates. SEO observation #108/#111 and the unstarted #23 stability window are unchanged.
