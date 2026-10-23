# Filter indexing and structured-data review — 23 October 2026

Tracks #116 and SEO map #108. The review found an active-result indexing gap;
this PR implements explicit exclusion of those result pages. Structured-data
eligibility assessment is complete, with the decisions below. Production merge,
deployment verification and Google processing remain separate gates.

## Public production baseline

Read-only HTTP probes of takonbini.com found:

| URL case | Status | Robots | Canonical |
| --- | --- | --- | --- |
| Clean English homepage | 200 | index, follow | English homepage |
| Homepage search=coffee | 200 | index, follow | Clean English homepage |
| Homepage stores=Lawson | 200 | index, follow | Clean English homepage |
| Chinese homepage includeSoon=true | 200 | index, follow | Clean Chinese homepage |
| Homepage minPrice=0 | 200 | index, follow | Clean English homepage |
| Browse with ignored search=coffee | 200 | index, follow | Clean Browse URL |
| Product with search return-state | 200 | index, follow | Product locale URL |
| Missing product | 404 | index, follow | Missing product URL |

Each sampled collection response had 20 server-rendered cards. These are public
HTML observations, not Google-selected canonicals or indexing outcomes. A
canonical annotation alone is not explicit exclusion of distinct filtered
results from Search.

## Implemented policy

Active parsed homepage filters emit `noindex, follow`: nonblank search, valid
store/category/region selections, finite price boundaries (including zero), or
includeSoon=true. Detection uses the existing parser/encoder, so ignored values,
empty filters, false upcoming state, tracking parameters and unused page/limit
parameters do not accidentally exclude the clean homepage. The fixed 20-item
fetch and filter behavior remain unchanged.

The existing clean localized canonical/OG URL is retained. Excluded result pages
do not advertise hreflang alternates or homepage WebSite JSON-LD. Clean locale
homepages keep their identity markup and reciprocal language links. Product
return-state filters do not change the product content and do not exclude the
product. Browse ignores these filter parameters and keeps its clean, indexable
slice canonical and sequential discovery links. Correct missing-product 404s
and the existing product-translation sitemap policy are preserved.

Robots.txt remains crawlable so Google can read noindex. This is an indexing
policy, not a crawl-volume reduction claim. Previously indexed variants require
recrawling before Google can process the directive. Product discovery continues
through the clean catalog, Browse and sitemap rather than relying on excluded
search/filter pages. Unknown ignored URL variations remain canonicalized aliases;
no claim is made that all crawl duplication has been eliminated.

## Structured-data decisions

### Product / offers: defer new markup

Google supports product snippets on pages where visitors cannot purchase
products directly, provided the page meets the required data/content rules.
A Product snippet needs name plus at least one of offers, review or
aggregateRating. The application has retailer-sourced names/descriptions,
prices, images, outbound links and release/region information. Its contract has
no reviews or aggregate ratings, no verified offer/stock state, and no offer
validity timestamp. Displayed retailer price alone does not establish verified
current commercial availability or a Takonbini sale.

Do not fabricate ratings, reviews, stock, seller identity or an offer merely to
satisfy the validator. Defer Product/Offer markup on present evidence. This is a
site-specific evidence decision, not a rule that all non-selling catalogs are
ineligible. Generic Product markup without the required rich-result properties
would not establish Google snippet eligibility. The existing homepage WebSite
identity markup remains appropriate.

### BreadcrumbList: a possible fit, defer adding a trail

Home → product is a truthful typical navigation path. A Browse/store/category
hierarchy is not established by the product URL; do not invent one. Google
requires at least two ListItems and recommends a typical user path. Current
standalone product navigation exposes a return-to-products link and product
heading, without a dedicated breadcrumb trail. Defer BreadcrumbList until an
explicit user-facing trail has a demonstrated navigation purpose and the markup
can match it. No new breadcrumb UI or hidden hierarchy is added solely for SEO.
This completes the requested eligibility assessment; it is not a promise of
rich results or a mandatory new implementation task.

## Verification scope

Regression tests exercise the real head callback for every active filter key.
Compiled app checks cover combinations and all three locales, clean/empty/
ignored filters, absence of alternates on excluded pages, retained product
indexing despite return-state, missing-product 404s and unchanged sitemap policy.
The existing Browse traversal check covers ignored parameters, distinct slices,
terminal and invalid-boundary behavior. Hosted preview and production evidence
must be recorded separately from these deterministic checks.

## Primary references

- [Google pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading): excluding unwanted result variations while keeping discoverable chunks.
- [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing): crawl access is needed to read the directive.
- [Google faceted navigation](https://developers.google.com/crawling/docs/faceted-navigation): crawl costs and canonical consolidation are separate concerns.
- [Google product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet): required properties and applicable non-selling pages.
- [Google breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): typical paths and required ListItems.
