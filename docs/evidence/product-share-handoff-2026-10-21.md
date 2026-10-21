# Local product sharing handoff — 21 October 2026

The maintainer accepted the revised sharing UI and reports local X and Email
success. Facebook and LinkedIn open their post editors with no link or attachment;
this is an empty-composer report, not merely a missing preview image. WhatsApp
has not been tested by the maintainer.

## Reproduction and limits

An authenticated Facebook desktop web composer was opened in Arc using the exact
local Share button URL. It showed an empty text field, no product attachment and
a disabled Share action, reproducing the reported symptom. No post was published.
Changing only the shared URL to the public HTTPS product began loading a link
attachment. The completed public composer was not verified before browser window
changes and an unrelated sign-in dialog blocked further native-browser inspection.
LinkedIn's authenticated editor has not yet been independently reproduced.

Anonymous HTTP comparisons retain the target URL through Facebook's share-channel
redirect and LinkedIn's login redirect for both local/public inputs. They do not
prove the authenticated editor accepted that URL. The public product separately
returns HTTP 200 with product title and Open Graph title/image/URL. Neither HTTP
metadata checks nor successful URI encoding establish platform completion.

Private screenshots, account details and raw browser output stay local.

## Corrected local handoff

Local review previously sent `http://localhost:3000/products/...` to every target.
That address is not publicly reachable. Share URLs now map localhost, `.localhost`,
IPv4 loopback and IPv6 loopback to `https://takonbini.com`, retaining the product
identifier and selected language only. The displayed URL, Copy, native sharing,
Facebook, LinkedIn, X, WhatsApp and Email use that same URL. Public preview and
production origins remain unchanged; local browsing remains on its local route.
This corrects the known private-address handoff without changing the platform
endpoints or adding unsupported text-prefill parameters.

`vitest run tests/product-share-action.test.tsx` was run before the fix: five new
checks failed because the actual handoff contained localhost/loopback instead of
the public URL. After the fix, 24 sharing-action checks pass, including Facebook
and LinkedIn's actual component hrefs, the shared copy/native payloads, loopback
variants and retention of a public preview origin. The full 193-test suite, types,
lint, build, compiled 14-case crawler HTML and native image isolation checks pass.
Local browser inspection confirms public HTTPS product URLs in both destination
parameters and the displayed copy field.

## Initial remaining gate (superseded by the follow-up below)

Verify completed Facebook and LinkedIn composers with the corrected local buttons,
then verify WhatsApp and remaining target/device behavior separately. A product
link attachment is a valid handoff even when the optional commentary text area
is empty; a completely empty editor is not a pass. No final platform pass, merge
or production release is claimed by this evidence.

## Follow-up — authenticated desktop editors verified

After the maintainer made Arc available, the exact public URL handoffs used by
the corrected local buttons were verified in authenticated desktop browser sessions.

- **Facebook passes:** the editor contains the product photograph, title and
  Takonbini domain, and Share is enabled. The optional commentary field is empty,
  but the product is present as a link attachment. This differs from the earlier
  localhost reproduction, which had no attachment and disabled Share.
- **LinkedIn passes:** its sharing endpoint reaches the post composer, finishes
  loading, and displays the product thumbnail, title and Takonbini domain.
- No Share/Post action was pressed. Private screenshots are retained locally,
  excluding account information and raw page content from public evidence.

This completes the scoped desktop Facebook/LinkedIn public-link editor check.
It supports the loopback-to-public URL correction; it is not a claim that every
browser/native app/device behaves identically. The maintainer's X/Email reports
remain separate from these observed checks. WhatsApp, native-device coverage,
PR-specific merge approval and exact production release verification remain open.
