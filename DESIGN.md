# Takonbini design system

Takonbini is a multilingual convenience-store catalog. Preserve the current quiet surfaces, store-specific accents, readable product images, and explicit search/filter controls while migrating styling infrastructure.

## Before editing UI

Read the topic for the control being changed, then inspect its linked implementation and caller. These docs describe the UI merged in PR #71; [the StyleX plan](docs/design/stylex-migration.md) describes proposed work, not installed APIs.

- [Buttons and action hierarchy](docs/design/buttons.md): closed class set, primary actions, icon actions, chips, and navigation.
- [Tokens and themes](docs/design/tokens.md): every declared semantic variable and its light/dark backing value.
- [Select and form controls](docs/design/forms.md): actual props, defaults, validation, and dialog behavior.
- [Shell components](docs/design/shell.md): header, theme/language controls, and scroll action.
- [Catalog components and states](docs/design/catalog.md): module boundaries, cards, grids, detail, pending/error states.
- [Typography, layout, and motion](docs/design/layout.md): current numeric values and migration exceptions.
- [StyleX migration](docs/design/stylex-migration.md): token map, integration spike, migration order, and exit gates.
- [Documentation verification](docs/design/verification.md): inventory coverage and agent prompt checks.

## Rules that apply to every UI change

1. Use the existing component or documented native-element pattern. There is no shared `Button`, `IconButton`, `Input`, or `Dialog` component. Unlisted variants and invented imports are bugs; add a reviewed implementation and its documentation together when a real new control is needed.
2. Components consume semantic colors from `src/styles.css`. New hex, RGB, OKLCH, palette utilities, and inline color literals belong only in a reviewed token-definition change. Preserve the explicit image/backdrop exceptions in the token reference.
3. Use `catalog-button` for a normal catalog action. Only Search and the dialog's Apply action use `catalog-button catalog-button-primary`. A store selection, filter chip, and navigation link each have their own existing pattern.
4. Keep theme and language ownership in the existing providers/controls. Read supported values from their source; copy uses locale keys, not English literals.
5. During #29, preserve markup, responsive geometry, interactions, focus/disabled/error states, and token values. The Shiori Editorial visual redesign is #27, a separate release.
6. Keep selectors with descendant dependencies together during migration. A class name's appearance is not its whole contract: native dialog semantics, portal theme inheritance, and CSS reset rules also matter.
7. Update the affected topic when an implemented public prop, style choice, or token changes. Planned APIs stay in the migration plan until they exist.
