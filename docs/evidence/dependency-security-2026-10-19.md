# Dependency security remediation — 19 October 2026

Addresses #82 under #17. Base: `a2c84b78198dadb99b105e3975e7f7c6a0b4b7ca`.
Production acceptance remains pending until this change is merged and deployed.

## Resolution

The prior production audit recorded 2 critical, 19 high, and 5 moderate findings.
Both fresh audits now report zero findings:
[production graph](dependency-security-2026-10-19/audit-prod.json) and
[full graph](dependency-security-2026-10-19/audit-full.json).
The production audit excludes devDependencies; it still includes build tools
through production parents. Neither scope alone describes deployed reachability.

The lockfile updates Seroval to 1.6.11, Rollup to 4.64.10, ws to 8.22.0,
PostCSS to 8.5.31, js-yaml to 4.3.2, nanoid to 3.3.20, browserslist to 4.29.3,
baseline-browser-mapping to 2.11.29, and source-map-js to 1.2.2. Full-graph
auditing also exposed old Babel, picomatch, shell-quote, and launch-editor
versions; compatible updates remove those findings too. The
[resolution summary](dependency-security-2026-10-19/resolution-summary.json)
lists old and new versions, including supporting dependency changes.

Solid 1.9.10 pins Seroval to `~1.3.0`. Providing `solid-js: ^1.9.17` explicitly
satisfies TanStack devtools' `>=1.9.7` peer range and uses Solid's upstream
`~1.6.8` Seroval range. No forced Seroval override or framework upgrade is needed.
The resolved graph contains only Seroval 1.6.11. The checked
[Seroval advisory](https://github.com/advisories/GHSA-jp82-f5mq-hwhp)
requires at least 1.6.3; the fresh audits also cover the other known advisories.

Existing PRs #64–#69 each modify only the lockfile and had passing checks on
their earlier bases. This change includes their six package fixes at equal or
newer versions and validates them together against current main. Those PRs
remain open; no merge or closure is implied.

## Build and reachability

The generated Vercel function contains `_libs/seroval.mjs` and
`_libs/seroval-plugins.mjs`; Seroval is also a TanStack serialization dependency,
so removing its vulnerable devtools path is not grounds to declare all
serialization unreachable. The resolution summary records SHA-256 hashes of
these generated modules. The function's traced external package manifest lists
only tslib 2.8.1; other runtime modules are bundled.

No separately named Solid, TanStack devtools, ws, Rollup, PostCSS, shell-quote,
or launch-editor module appears in the generated file inventory. Text searches
of generated client assets did not find those package names. Bundling and
minification mean these observations are not proof of complete code exclusion.
The security result rests on patched resolutions and fresh full-graph auditing,
not an exemption based on dev/build classification. Hosted preview verification
and post-deployment production checks must be recorded separately.

## Local validation

- `pnpm install --frozen-lockfile` passes without peer warnings.
- 101 tests across 18 files pass; TypeScript and the production build pass.
- Biome lint passes for 83 tracked source/config files via
  `git ls-files -z '*.ts' '*.tsx' '*.js' '*.mjs' '*.json' '*.css' | xargs -0 pnpm exec biome lint`.
  Plain `pnpm lint` encounters an existing nested root configuration inside the
  untracked `.worktrees` directory. That directory was left untouched.
- All six sequential and twelve concurrent URL/cookie/header locale precedence
  checks pass against the built preview:
  [results](dependency-security-2026-10-19/local-locales.json).
- Browser checks pass for Japanese catalog/detail rendering, Escape returning
  focus to the product link, and switching to English with the URL and heading
  updated. A fresh Traditional Chinese session renders 20 products and has no
  captured warning/error logs before the filter check. Selecting Lawson updates
  the filter and URL. These are sampled checks, not full browser acceptance.

The local API configured in `.env.local` was not running. Live-data checks use
the public `https://takonbini.com/api` read endpoint with a non-secret placeholder
header; no API credentials were sent to it. Initial attempts without a running
upstream showed the expected catalog error and are excluded from the clean
session result.

The build retains the existing Nitro preference for Vite 8 and large client
chunk warning. Local tooling: Node 22.16.0 and pnpm 10.20.0. Audit results are a
point-in-time registry check, not a guarantee against future advisories.
