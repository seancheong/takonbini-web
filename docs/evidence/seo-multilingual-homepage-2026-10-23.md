# Homepage multilingual indexing — 23 October 2026

Implements the homepage portion of #111 / SEO map #108 phase3. Existing explicit ?lang=en / ja / zh URLs become their own canonical and OG URL. Bare adaptive homepage canonicalizes to the resolved locale while retaining preference behavior; all homepage versions expose the same reciprocal en, ja, zh-Hant and x-default (bare root) links. WebSite.url remains the site root. Filters/search/pagination are excluded from these URLs.

The sitemap replaces the bare homepage entry with three locale URLs and adjusts its URL-count guard to reserve three slots. HTML head owns hreflang; duplicate XML annotations are unnecessary. Product sitemap entries, canonical/sharing behavior and404 handling are unchanged. No URL-path migration, redirects or browser-preference/hydration changes.

Public production baseline: all three explicit locales return200 with correct document language despite a conflicting Japanese cookie/header, but share a bare canonical and lack hreflang. Three spread product samples across all three locales return200 with three distinct descriptions per product. This small sample does not establish catalog-wide coverage: product model explicitly supports missing translations and per-field fallback. Product alternate/canonical rollout remains a separate phase3 gate pending a coverage/duplicate policy; no per-product sitemap fetch fanout added.

Validation:236 tests, lint, types, production build; compiled crawler tests verify localized homepage title/JSON-LD and new canonical/alternate URLs, URL precedence with conflicting saved language, bare preference canonicals/filter stripping, and unique sitemap locale entries. Existing product sharing/status/recovery and image isolation pass. Hosted checks/preview and exact production remain separate gates. Local bounded-catalog checker baseline issue#109 is not changed here.

Homepage recrawl after PR#110 deployment was attempted through Search Console but failed: UI reported a reCAPTCHA service connection failure and indexing request submission error, including after reload. No successful indexing request or new Google crawl is claimed. Private UI screenshots/account data remain local.

References: https://developers.google.com/search/docs/specialty/international/localized-versions and https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites . These support explicit variant URLs, self/reciprocal language annotations and avoiding cookie-only discovery. Retaining existing query URLs is this project's compatibility choice.
