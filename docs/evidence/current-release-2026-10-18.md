# Current release acceptance checkpoint — 18 October 2026

This checkpoint supports #24, #26, #29, #27, #16, and #74. These tickets remain
open. No deployment, rollback, scheduler change, or acceptance closure occurred.

## References

- Production GitHub deployment `7154378896` records main
  `058872664a96d3da3e4d936c50cca7c2fd54c997` (PR #79).
- Local starting reference: `0b52a5b8f4accda418d9c69ee5a7807bf66ae535`.
  Its tracked contents match the merged reference before this fix.
- Public HTTP checkpoint: [results](current-release-2026-10-18/http-checks.json).

## Production checks and blocking locale defect

All three store browse APIs returned nonempty 20-product pages belonging to the
requested store. A sampled cursor page contained 20 additional products without
ID overlap. Sampled direct Japanese detail returned HTTP 200. Sitemap XML parsed
and contained 5,001 entries; full enumeration/completeness was not established.
Document title and description metadata were present in the sampled locale HTML.
Request timings in the artifact are individual wall times, not a performance benchmark.

Concurrent production requests returned incorrect document languages in three of
six precedence cases. A follow-up isolated comparison passed six sequential URL
requests, then failed three of six concurrent URL requests; responses reported
Vercel cache MISS and age zero. Server rendering mutated the shared i18next
singleton before awaiting catalog loading, allowing another request to change
its language before rendering and metadata generation.

The local fix creates an independent translation instance per server router,
provides it to React, and uses it for root locale selection and route metadata.
The browser retains its existing language detector and persistence behavior.
The regression test failed with `lang="zh"` for an English request before the
fix and passes after it. Production still requires this fix to be reviewed and
released before concurrent locale acceptance can pass.

## Local validation of the fix

- 101 tests across 18 files pass, including overlapping translated React SSR.
- TypeScript, Biome lint of `src`/`tests`, and the production build pass.
- Twelve concurrent actual HTTP requests to the local production build all
  returned the requested English/Japanese/Traditional Chinese document language:
  [results](current-release-2026-10-18/local-concurrent-locales.json).
- The repeatable URL/cookie/weighted-header precedence probe is
  `python3 scripts/check-ssr-locales.py http://127.0.0.1:3010`:
  [results](current-release-2026-10-18/local-locale-precedence.json).
- Browser hydration displayed the expected locale headings and controls in all
  three languages. Across all 18 combinations of three languages, light/dark,
  and 390/768/1280-pixel widths (900 high), each catalog contained 20 cards, the
  intended language/theme marker, and no document horizontal overflow. This is
  a DOM/layout smoke check, not complete visual, contrast, or accessibility acceptance.
- No warning/error browser log was captured during the local checks.

Build warnings remain: Nitro's Vite 8 preference while this app uses Vite 7,
a client chunk above 500 kB, old Browserslist data, and bundled dependency
`use client` directives. They did not fail this build.

## Production interaction checkpoint

In the in-app browser, a real product opened as a labelled detail dialog with
focus on its close button; Escape returned to the catalog; Forward restored
the modal; Back returned to the catalog. Changing Chinese to Japanese updated
the URL, heading, language-change output, and selector focus. A Lawson filter
updated the URL and returned a populated catalog. These sampled checks do not
establish Safari/VoiceOver delivery, uncached transition quality, retained scroll
for every navigation path, or reduced-motion/transparency acceptance.

## MongoDB refresh evidence — #24 remains open

Read-only inspection of the current production workflow confirms cron
`0 18 * * 1-3` (Tuesday/Wednesday/Thursday 02:00 Malaysia time), a shared
concurrency group with cancellation disabled, and a 300-minute job timeout.
This is a GitHub-hosted production workflow; daily Scraper CI is separate and
cannot serve as evidence of full refresh completion.

The latest three production schedule records show success, failure, success.
The failed middle cycle exhausted three attempts for one FamilyMart detail
page. The final success used a newer scraper revision and passed its translated
MongoDB verification. There is only one successful scheduled cycle on that
revision in the inspected history, so two consecutive accepted cycles are not
proven. Start times were several hours after the configured 02:00 slot; cadence
configuration does not prove punctual execution. Private logs, repository URLs,
product identifiers, and retailer payloads are excluded from this record.

Remaining operational work: collect the next qualifying cycle, check per-store
freshness and translation results, account for scheduler delay, review recovery
and alerts, and measure actual cost/count movements. Workflow concurrency and
success statuses alone do not prove atomic publication, leases, or recovery.

## Current security gate

A fresh `pnpm audit --prod --json` reports 2 critical, 19 high, and 5 moderate
findings: [redacted summary](current-release-2026-10-18/dependency-audit.json).
The critical findings identify Seroval 1.3.2 through the TanStack developer-tools
Solid dependency. The production build reports stripping development tools;
this does not by itself establish reachability or exemption for every finding.
A dependency remediation and deployed-artifact assessment remains a release
hard gate. No dependency versions were changed by this locale fix.

## Outstanding acceptance

Keep #24 open for two scheduled cycles and measured recovery/freshness/cost.
Keep #26/#29 open for current production, recovery, and observation evidence.
Keep #16/#27/#74 open for the locale fix's release verification, complete browser
and accessibility checks, missing-translation/slow/error scenarios, performance,
SEO/sitemap completeness, and observation acceptance. The original isolated
release windows cannot be reconstructed retroactively. The final 30-day #23
window is not established by these checkpoints.
