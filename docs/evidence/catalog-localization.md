# Catalog localization — issue #16

Implementation checkpoint: 18 October 2026. This continues the current catalog design; it does not restore the historical Weekly masthead or prototype routes.

## Implemented contract

- Optional root `lang` search state, normalized to en/ja/zh, is retained on filters and detail links. Missing locale is added after hydration with replace navigation. Locale never enters product filters, query keys, or upstream requests.
- SSR resolution: supported explicit URL, saved cookie, weighted supported Accept-Language, then English. Unsupported URL values fall through. The browser prioritizes the URL and persists choices using the existing cookie.
- Explicit selection changes the interface immediately and replaces the current URL while retaining search, hash, history state, modal mask, and scroll. A polite output announces the selection and focus remains on the selector.
- The Chinese interface uses zh-Hant document language and an explicit Traditional Chinese label. Japanese/Traditional Chinese use local script-specific font stacks.
- Titles and descriptions resolve independently using the prototype's approved order: en → ja → zh; ja → en → zh; zh → ja → en. Empty/whitespace values are missing. Each displayed fallback field has an actual-language tag and localized visible note. Empty descriptions remain absent. No retailer translation is generated.

## Local verification

- 100 tests across 17 files pass, including weighted locale precedence, invalid/region tags, per-field fallback, visible card/detail labels, retained locale on links, filter/query isolation, and masked modal/history preservation through a locale change.
- TypeScript, scoped source/test Biome lint, and production build pass.
- Actual local server HTML was requested with conflicting URL/cookie/header preferences: URL ja beats saved zh and browser en; URL zh beats saved en and browser ja; unsupported URL fr falls through to saved ja; no URL uses saved zh. Resulting document languages were ja, zh-Hant, ja, zh-Hant respectively.
- Browser selection ja → zh retained Lawson filtering, updated the URL/document language, announced the change, and returned focus to the selector.
- At a 1280×900 viewport, zh → ja preserved scrollY=900 and selector focus. A 390×844 Chinese layout had no horizontal overflow and used the intended Traditional Chinese font stack.
- Existing modal, filter, theme, scroll, SSR/hydration, and navigation regression tests remain passing.

## Remaining acceptance

This local implementation checkpoint does not close #16. Hosted/production verification, the full three-locale × light/dark × responsive visual matrix, real VoiceOver/Safari preference checks, and production observation acceptance still need recorded results. Automated live-region/focus behavior and rendered language tags do not establish a complete screen-reader or WCAG audit. The current approved masthead is retained under the roadmap reconciliation; older Weekly copy is historical.
