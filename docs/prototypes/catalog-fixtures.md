# Catalog prototype fixtures

The controlled fixture set lives in
`src/features/product/fixtures/catalogPrototypeFixtures.ts`. It is exclusively
for comparing the two mobile-first catalog directions; it is not production
seed data and makes no claim about current products, prices, availability, or
store inventory.

## Coverage

Six synthetic products cover all three supported stores and Japanese, English,
and Chinese text. Together they exercise short, medium, and long titles; six
categories; all nine region values; low, medium, high, and unknown prices; new,
standard, upcoming-release, and stale-observation states; and a missing image.

The exported listing-state set distinguishes populated results, a genuinely
empty catalog, no matches for active filters/search, and a service error. The
stale fixture is intentionally excluded from populated active results.

## Content limitations

- Names, descriptions, prices, dates, observations, and source URLs are
  synthetic. Source links use the reserved `.invalid` domain.
- Placeholder images are embedded synthetic SVG cards, not retailer
  photography. They work offline and are suitable for layout comparison but
  cannot validate crop quality or the visual variability of real photography.
- Relative dates are generated from an injected clock so upcoming and stale
  scenarios remain deterministic in tests and prototypes.
- The set is deliberately small. It tests representative contrast, not every
  category/region combination, pagination volume, translation fallback, or
  malformed upstream data.
- Prototype conclusions must be rechecked with legitimate, freshly restored
  catalog observations before final UX validation.
