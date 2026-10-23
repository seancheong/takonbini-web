# Bounded crawlable catalog discovery — 23 October2026

Implements web issue#114 with API dependency seancheong/takonbini-api#94. The API returns at most20 public products in ascending immutable-ID order, one lookahead,5s database deadline, existing key authentication and no anchor lookup. Current ranked browsing/DB schema/dependencies stay unchanged.

The web adds a visible Browse entry below the homepage introduction and a dedicated `/browse` SSR route. Each request loads one validated batch; ordinary Next links traverse all inventory. First page, language switching, browser history and standalone product links remain available. Current slice only is rendered; inactive route data is collected immediately. Homepage infinite browsing, modal/restoration and five-page bounds are unchanged. Next-page commits focus the heading without overriding router top-of-page scroll.

Canonicals/OG and reciprocal en/ja/zh-Hant/x-default URLs preserve normalized lang/after only. Malformed/empty continuation404, duplicate-query normalization terminates, and upstream failure500 is not disguised as an empty or first page. No new arbitrary filter combinations, offset paging or full-catalog browser payload. No hidden crawler-only links.

## Validation and release gates

-247 web tests/36 files pass, plus types, lint and production build. New contract tests reject oversized/duplicate/out-of-order/before-boundary data and inconsistent continuation, validate server-function boundaries and preserve upstream failures.
-Compiled HTML-only traversal visits45 products exactly once over3 pages in each of3 languages, one upstream read per page, correct self/reciprocal slice URLs, terminal link removal, deleted-anchor continuation, invalid/exhausted404 and service failure500. Existing17 sharing HTML cases,15 detail recovery/status cases and native image/sharing isolation pass. Web CI runs the traversal.
-Local compiled browser verifies first/next slices each20 mounted cards, distinct content, normalized canonical/alternates and locale switching; no captured hydration errors. Synthetic fixtures prove UI/contract behavior, not live MongoDB performance or deployed API availability.
-API#94 has40 passing tests, types/build/targeted Biome and hosted API CI. It remains unmerged/undeployed until specifically approved. Web PR stays draft: the existing production API does not yet provide discovery, so a successful live Browse preview is a retained dependency gate. Verify exact API deployment and real first/next pages before web approval/readiness; verify exact web production after its own approval.

No Google indexing request, account/security change, automatic monitor or deployment was performed for this implementation. The user's earlier homepage indexing request remains accepted. Fresh Google crawl/index/canonical/site-name outcomes and broader SEO measurement/rich-markup evaluation remain separate.
