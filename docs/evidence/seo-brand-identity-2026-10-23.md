# Branded homepage metadata — 23 October 2026

Implements phase 2 of #108. The homepage has descriptive localized en/ja/zh titles and catalog descriptions naming the three supported stores. Root head owns title, description and social metadata; the catalog route no longer overrides the title. Existing product-specific title/description behavior remains; missing descriptions inherit the improved localized site copy.

Homepage-only WebSite JSON-LD identifies Takonbini with the existing Japanese name タコンビニ as alternateName and the configured canonical root URL. JSON serialization escapes less-than characters. No offers, business details, reviews, SearchAction or invented social profiles are supplied. The visible header already uses these names, and the manifest describes the catalog. Existing public SVG/ICO, touch and manifest icon links remain available. No external brand posting was performed.

References: https://developers.google.com/search/docs/appearance/site-names

## Validation

- 236 unit/component tests pass, including delayed-route hydration regression coverage; typecheck, lint and production build pass.
- Compiled crawler checks cover en/ja/zh first-response homepage titles, description/social agreement, canonical OG URL and one parseable WebSite block. Twelve product variants retain single sharing tags and no homepage JSON-LD. Native share-image fallback passes.
- Fifteen compiled product status/recovery cases and native image/sharing isolation pass.
- Local bounded-catalog SSR checker fails with zero cards instead of twenty on both this change and an independently rebuilt unchanged main 9cff3c3c42b017700af92c00418c7765baa06345. This is a separate unresolved baseline finding, not a passing SSR verification. Hosted CI must be checked before merge readiness.

No new dependencies, UI layout, locale canonical/hreflang policy, deployment or Search Console actions. Merge requires explicit approval for this PR. Exact production and Google recrawl/site-name/index outcomes remain pending.
