# Product multilingual indexing — 23 October 2026

Completes the implementation portion of the product-language gate in #111 / SEO map#108 phase3. Existing homepage locale policy from merged#112 remains intact.

## Policy

A product locale qualifies for language alternates when its title and (if a description exists anywhere) description are nonempty in that locale. Whitespace counts as missing. Descriptionless products need only their actual title. Availability is not a claim about translation quality.

Qualified variants use explicit lang self-canonicals and a complete reciprocal en/ja/zh-Hant set for qualified counterparts only. Product x-default targets qualified Japanese when available, otherwise the first qualified locale. Query-free visits resolve preferences as before and declare the resulting canonical locale. Arbitrary browsing parameters are stripped.

Fallback pages consolidate only to a version with the exact same resolved title/description pair. A unique mixed translation keeps a self-canonical and no language alternates; it is not redirected or noindexed. When no complete locale exists, one representative canonical remains in the sitemap without pretending there is a translated cluster. Visitor-facing selected-language share links, actual product text, fallback labels, modal/hydration/scroll and404 behavior remain unchanged. OG URL follows canonical; titles/descriptions/images still reflect the viewed content.

## Sitemap boundary

`listIndexableProducts` replaces ID-only enumeration with compact id/eligible-language entries derived from the existing paginated list response. It validates id/title/description fields; it does not fetch individual details, retain whole catalog translations, change the backend or add dependencies. Existing cursor-cycle,500-page and45-second bounds remain. The route checks the actual expanded count against50,000, retains52,428,800-byte checking, and returns uncached503 on incomplete/invalid/oversized input instead of publishing a partial sitemap.

## Validation

-243 unit/component tests across35 files; lint, types and production build pass.
-Policy cases cover complete translations, identical Japanese fallback, unique mixed content, no complete locale, missing/whitespace descriptions, reciprocal targets and canonical idempotence.
-Compiled sharing crawler checks cover15 product/locale cases plus homepage variants, canonical/social agreement, complete/partial/no alternate sets, no homepage JSON-LD on products, matching sitemap membership, no per-detail sitemap fanout, and expanded-limit503. Existing15 detail status/recovery cases and native image/sharing isolation pass.
-Hosted CI/preview and production are separate gates. Local catalog SSR checker issue#109 remains unchanged; hosted bounded SSR must pass.

Homepage recrawl retried in Search Console after#112 production deployment. It again explicitly failed indexing submission with a reCAPTCHA-service connection error. No CAPTCHA solved, security settings changed, successful submission/new crawl or ranking outcome claimed. Private account screenshots stay local.

Primary references: https://developers.google.com/search/docs/specialty/international/localized-versions and https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls . The eligibility threshold, exact-text fallback grouping and representative sitemap behavior are conservative project policy, not additional Google requirements.
