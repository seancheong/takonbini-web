# Catalog SEO candidate — 19 October 2026

## Problem and resulting behavior

The production audit found standalone product pages declaring the homepage as
canonical and Open Graph URL. Sitemap enumeration stopped after 50 pages and
published partial results with HTTP 200 even for upstream failure or missing
configuration.

The root head now derives both URLs from the leaf route pathname. Query filters
and locale are excluded, consistently with the existing unparameterized sitemap
URLs. The site origin comes from serialized root loader data, so hydration and
client navigation do not depend on a server-only environment variable. Existing
localized titles/descriptions and shared social image remain unchanged.

Enumeration follows up to 500 pages, deduplicates overlapping IDs, detects
repeated cursors, and applies a 45-second overall fetch budget. It reserves the
homepage within the single-sitemap 50,000-URL limit. A successful document also
fits the 50 MiB XML limit. Incomplete enumeration, configuration/HTTP/transport/
payload failures, loops, or exceeded bounds produce HTTP 503 with `no-store`
and `Retry-After: 300`, rather than a partial success. Product path segments are
URL-encoded before XML entity escaping.

The [Sitemap protocol](https://www.sitemaps.org/protocol.html) sets the single-file
URL/size limits. Catalogs beyond this single-file envelope need a sitemap index;
this change reports unavailability rather than silently omitting products. It
does not add a snapshot or transaction to the mutable upstream catalog, so a
completed traversal is not a guarantee of a transactionally consistent snapshot.
The canonical policy follows the existing unparameterized URL structure; no
locale-specific canonical/hreflang redesign is claimed. See
[Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## Verification

- Nine targeted assertions failed before implementation. All 109 tests now pass,
  including enumeration beyond page 50, overlapping IDs, repeated cursors,
  request budget expiry, the URL-count bound, absent configuration, and partial
  upstream failure. Existing characterization expectations for partial success
  were deliberately changed to the new 503 contract.
- TypeScript, scoped Biome checking, repository lint, and production builds pass.
- [Local HTTP results](catalog-seo-2026-10-19/local-http.json): seven HTML probes
  pass for catalog plus two standalone products in en/ja/zh, including query
  filters. Every document has exactly one expected canonical and one expected
  Open Graph URL.
- The local production build's live-catalog sitemap returns HTTP 200 with 5,018
  unique same-origin URLs, including both sampled products. This exceeds the
  previous 5,001-URL ceiling. It is a current traversal, not a measured historical
  count difference or a database snapshot comparison.
- [Browser metadata](catalog-seo-2026-10-19/browser-metadata.json) confirms the
  standalone product URLs after hydration and catalog URLs after settled client
  navigation using Back to products. The existing masked catalog modal remains
  a catalog route; standalone product URLs are what crawlers render directly.
- Local preview used the public read-only catalog proxy; no private API key,
  production write, deployment, or scheduler action was needed.

## Gates remaining

Hosted preview checks, explicit PR merge approval, main CI, and production SEO
verification remain separate gates. #26/#29/#27 remain open for their other
acceptance requirements. No ranking, Search Console, full accessibility,
controlled performance, browser matrix, or observation-window acceptance is
inferred from these probes. #24's unattended refresh acceptance and #23's cost/
stability window are unaffected.
