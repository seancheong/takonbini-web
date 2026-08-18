# Approved catalog localization decision

Issue [#15](https://github.com/seancheong/takonbini-web/issues/15) approved the localized Shiori catalog prototype.
Production work is tracked separately in implementation issue [#16](https://github.com/seancheong/takonbini-web/issues/16).

## Decision

- Interaction: **Direct** compact language selector.
- Locales: English, Japanese, and Traditional Chinese.
- Masthead: **Weekly** editorial direction.
- Decorative issue numbering: removed; it has no catalog meaning and would become stale.
- Locale precedence: explicit `lang` URL, saved choice, supported browser preference, then English.
- State preservation: language changes retain search, filters, theme, scroll position, and an open product modal.
- Content fallback: deterministic per-field fallback with the fallback language identified to the visitor.
- Accessibility: update document language, announce locale changes, retain focus and modal context, and preserve the WCAG 2.2 AA contract from issue #12.

## Interactive evidence

Run the application and open:

- Approved copy: `http://localhost:3000/prototypes/catalog-copy?v=2&lang=en`
- Localization interaction comparison: `http://localhost:3000/prototypes/catalog-localization?v=1&lang=en`

## Visual evidence

| Locale | Desktop · light | Mobile · dark |
| --- | --- | --- |
| English | [View](./weekly-en-desktop-light.png) | [View](./weekly-en-mobile-dark.png) |
| Japanese | [View](./weekly-ja-desktop-light.png) | [View](./weekly-ja-mobile-dark.png) |
| Traditional Chinese | [View](./weekly-zh-desktop-light.png) | [View](./weekly-zh-mobile-dark.png) |

The screenshots use synthetic publication-safe fixtures. They demonstrate the approved masthead, Direct locale control, grid, mobile layout, and both themes; they are not production screenshots.
