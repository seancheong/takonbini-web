# Select and forms

Search and Filters share a 56px outer height. The Search submit label stays on one line and does not shrink in CJK locales. Filter choices are wrapping 44px checkbox tiles with filterOptionBorder edges, primary selected edges, and filterSelected surfaces. Choice and price labels use 14px text; price inputs remain 16px. Section legends use 14px semibold text with 12px separation from options; sections have 24px gaps.

CatalogFilters opens a native modal up to 720px wide and `min(860px, 100dvh - 64px)` tall. Header and footer stay visible while the body scrolls. Below 600px it becomes a full-width bottom sheet capped at `100dvh - 24px`, with safe-area footer padding. Escape and Close dismiss without applying; Apply submits valid drafts and dismisses. Opening locks page scrolling on the document root so the sticky header keeps its viewport scroll container; closing restores the previous root overflow and trigger focus.

## Approved catalog revamp — 17 October 2026

CatalogFilters uses the bounded native modal described above, with draft/apply/reset semantics. It exposes every category and region and validates whole-yen price ranges. The Filters trigger toggles the section with aria-expanded/aria-controls. ProductPreview owns the product-details modal; closing either modal restores root overflow and trigger focus.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

## Select

Use [the existing Radix wrapper](../../src/components/ui/select.tsx) for a single choice such as theme or language. Use labeled checkboxes in CatalogFilters for multiple staged choices; Select has no search/combobox or multi-select API.

`SelectTrigger.size` is exactly `"sm" | "default"`; default is `"default"` (36px high), `sm` is 32px. These are the only size names. The theme/language callers override minimum height to 44px; preserve that touch target. There is no `variant` prop.

`SelectContent` defaults: `position="item-aligned"`, `align="center"`. Radix also supports `position="popper"` and alignment values; preserve those prop contracts instead of inventing appearance variants. Theme and language callers use `position="popper"` and `align="end"` so the popup opens from the trigger and stays within the viewport.

Correct, extracted from [LanguageSelect](../../src/components/LanguageSelect.tsx):

```tsx
<SelectTrigger
  xstyle={styles.trigger}
  aria-label={t("language.changeLanguage")}
>
  <div {...stylex.props(layoutStyles.row)}>
    <Globe size={16} {...stylex.props(layoutStyles.icon)} />
    <SelectValue>{t(`language.${currentLanguage}`)}</SelectValue>
  </div>
</SelectTrigger>
```

Incorrect mutation: `<SelectTrigger size="icon" variant="ghost">`. Neither appearance prop is implemented.

Compose the exported parts instead of duplicating Radix markup:

| Export | Use/default or appearance input |
| --- | --- |
| `Select` | Root value/onValueChange or Radix defaultValue; no custom appearance props |
| `SelectTrigger` | Trigger size, className and xstyle, disabled/invalid/placeholder states |
| `SelectValue` | Current value/placeholder; no custom variant |
| `SelectContent` | Portalled popup; position, align, className |
| `SelectItem` | Required value; disabled and className; checked indicator is built in |
| `SelectGroup`, `SelectLabel` | Group related options; label uses muted text |
| `SelectSeparator` | Divide option groups; no variant |
| `SelectScrollUpButton`, `SelectScrollDownButton` | Internal overflow affordances, already included by Content |

Theme and language controls are the only external Select call sites. Group/label/separator exports have no current external call sites; do not invent usage evidence. Preserve Radix `data-state`, `data-side`, placeholder, disabled, invalid, focus and portal behavior in #29. Theme variables must inherit into the portal, which lives outside the trigger subtree.

Select's owned elements now use compiled StyleX styles. `SelectTrigger.xstyle` is
an optional `stylex.StyleXStyles` input; compose it after base/size styles for a
caller override. The two shell callers use it for 44px touch targets, horizontal
padding, and border suppression. Dynamic StyleX variables and native `style`
are preserved; native inline properties take precedence. Existing Radix props
and refs pass through. `className` remains supported, for caller-owned CSS; Tailwind utility merging has been removed. Use `xstyle`
for typed overrides and native `style` for runtime inline values. Do not add an appearance variant for these overrides.

SVG/value/item-text geometry is applied to owned elements and both shell callers.
Arbitrary new children must carry their own explicit styles; no global descendant
selector will size them. Preserve the documented 16px shell icons. Enter/exit use 180ms/120ms ease-out motion with the Radix trigger origin. Popper positioning retains its side offsets. Reduced motion and keyboard actions disable menu animations.

## Catalog search

Use [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx) inside the existing catalog; use a normal navigation link to open a different page. No shared `Input` component or input size/variant API exists.

Search uses CatalogControls' private `searchForm`, `searchField`, `searchLabel`, and `searchInput` styles. It has a visible associated label, a `type="search"` input at 16px, a 44px minimum input height, and form submission. The decorative search icon is inside an associated overlay label so clicking it focuses the input. Search disables autocomplete and spellcheck; while catalog navigation or refresh is pending, its submit button is disabled and retains the localized Search label so its width stays fixed. Loading feedback belongs to the results overlay. The submit handler also guards pending requests. Search text is draft until submit; do not silently add debounce or live filtering in #29.

Correct, from CatalogControls:

```tsx
<label htmlFor={id}>{t("product.filters.searchLabel")}</label>
```

Incorrect mutation: replacing this label with only a placeholder. The field would lose its persistent visible name.

## CatalogFilters / ProductFilterDrawer

[CatalogFilters.tsx](../../src/features/products/catalog/CatalogFilters.tsx) currently default-exports a function named `ProductFilterDrawer`. It owns the native modal `dialog`; there is no shared `Dialog` export. Use it for staged filters; use the store picker for immediate single-store changes.

Props: `filters`, `setFilters`, `isFilterOpen`, `setIsFilterOpen`, `onApply`, `onReset`, and optional `activeCount` (default 0). The first six are required; none selects a visual variant. Closed/open comes from `isFilterOpen`, not from mounting a styled div. The parent copies applied filters into draft when opening.

Correct, from [CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx):

```tsx
setIsFilterOpen={(open) => {
  if (open) setDraftFilters(filters);
  setIsFilterOpen(open);
}}
```

Incorrect mutation: apply filters from every checkbox change. It removes the dialog's staged Apply behavior.

- Use fieldset/legend for stores, categories, regions and price. Labels wrap native checkboxes; selected appearance follows `data-selected`.
- Prices are nonnegative integers; an absent bound differs from zero. Minimum must not exceed maximum. Preserve `aria-invalid`, error descriptions, and `role="alert"`.
- Apply submits only valid draft values and closes. Reset calls `onReset`; it is not a destructive action. Escape/cancel and close must synchronize parent open state.
- Desktop dialog: max width 640px, max height `min(85dvh, 850px)`. At ≤600px it becomes a bottom sheet using the same native dialog. Keep safe-area footer padding and scrolling content.
- Preserve native modal focus containment and return-to-trigger behavior. StyleX conversion must not replace `showModal()` with CSS visibility.


## Validation and applied state

Price errors appear on field blur or attempted Apply, then update as the user corrects the values. Integer validation marks the offending field; an inverted range marks the maximum. Apply remains operable so invalid submission can explain the error and focus the offending field. Native constraint popovers are disabled in favor of the inline error. Reset filters clears staged choices and validation visibility, retaining the current search; Apply confirms the cleared draft. Dialog instructions make this distinction explicit in every supported locale.

The filter trigger shows the number of applied store/category/region selections plus individual price bounds and the upcoming toggle. Search and pagination do not count. This count comes from the parent applied filters rather than the editable draft.

On compact screens, search uses the full toolbar width and the filter trigger sits on the next row so its count cannot squeeze the search input.


## Review fixes

Native `validity.badInput` is checked on editing and before submission: incomplete numeric input is distinct from an intentionally empty price bound. Malformed prices keep the dialog open and focus the offending input. Reset/reopen clears this invalid-draft state. Error text and invalid input borders use the dedicated errorText token. Apply's pressed state preserves the primary foreground/background pairing. The Close action has min-width 44px and cannot flex-shrink.

Pointer-triggered filter dismissal retains the native dialog for its 180ms exit before releasing focus/scroll locking. Apply commits once that exit completes. Keyboard dismissal and reduced-motion dismissal remain immediate. See [motion](layout.md#catalog-interaction-motion--18-october-2026).

The filter dialog enters with a 12px rise/0.98 scale over 250ms on desktop, or a 24px rise over 280ms below 600px. Backdrop timing matches. Keyboard actions and reduced motion are immediate. Sticky access opens this same dialog and copies applied values into the draft.

## Share-link copy field

ProductShareAction's native dialog always shows a labelled `type="url"` read-only
field with 16px text, even before copying. Focusing selects the clean URL. In local loopback review, that URL points to the
public Takonbini product; it is consistent with every sharing destination. Copy
is a separate native button, and feedback uses a polite output. Clipboard denial
keeps the field available and adds error text/icon and a token-based error border.
Native dialog focus starts at Close and returns to the trigger on dismissal;
Escape/backdrop dismissal preserves an underlying product modal. See the catalog
topic for platform, native-share, copy and cancellation behavior.
