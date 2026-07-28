# TanStack upgrade target

**Decision date:** 2026-07-28  
**Decision ticket:** [Choose a safe TanStack upgrade target](https://github.com/seancheong/takonbini-web/issues/6)

## Decision

Upgrade Takonbini in one compatibility-only change to the exact package snapshot below, validate it on a Vercel Preview Deployment, and create the rollback point **before** moving files or changing UX.

TanStack's related packages do not share one release number. “Aligned” therefore means following the exact dependency and peer-dependency graph published for the selected Start release, not forcing every package to the same version. As of the decision date, `@tanstack/react-start@1.168.32` directly requires `@tanstack/react-router@1.170.18`, while its plugin core requires `@tanstack/router-plugin@1.168.23`; those different versions are the compatible set published by TanStack ([Start registry metadata](https://registry.npmjs.org/@tanstack%2Freact-start/latest), [plugin-core registry metadata](https://registry.npmjs.org/@tanstack%2Fstart-plugin-core/latest)).

### Exact target snapshot

| Package/runtime | Target | Reason |
| --- | ---: | --- |
| Node.js | `22.x`, at least `22.12.0` | Current Start requires Node `>=22.12.0`; Vite 7 requires Node `20.19+` or `22.12+`. Pinning the deployed major to 22 matches the repository's successful local baseline and avoids combining a runtime-major migration with the framework migration. ([Start metadata](https://registry.npmjs.org/@tanstack%2Freact-start/latest), [Vite 7 migration guide](https://v7.vite.dev/guide/migration)) |
| `@tanstack/react-start` | `1.168.32` | Current release snapshot and source of the aligned Router requirement. ([registry](https://registry.npmjs.org/@tanstack%2Freact-start/latest)) |
| `@tanstack/react-router` | `1.170.18` | Exact dependency of the selected Start release. ([registry](https://registry.npmjs.org/@tanstack%2Freact-router/latest)) |
| `@tanstack/react-router-ssr-query` | `1.167.1` | Current integration; requires Query `>=5.90.0` and Router `>=1.127.0`. ([registry](https://registry.npmjs.org/@tanstack%2Freact-router-ssr-query/latest)) |
| `@tanstack/react-query` | `5.101.4` | Current Query v5 patch and satisfies the SSR integration. ([registry](https://registry.npmjs.org/@tanstack%2Freact-query/latest)) |
| `@tanstack/react-router-devtools` | `1.167.0` | Current devtools release; its Router peer is `^1.170.0`. ([registry](https://registry.npmjs.org/@tanstack%2Freact-router-devtools/latest)) |
| `@tanstack/react-query-devtools` | `5.101.4` | Matches the selected Query version through its `^5.101.4` peer. ([registry](https://registry.npmjs.org/@tanstack%2Freact-query-devtools/latest)) |
| `@tanstack/react-devtools` | `0.10.9` | Current compatible devtools shell. ([registry](https://registry.npmjs.org/@tanstack%2Freact-devtools/latest)) |
| `@tanstack/devtools-vite` | `0.8.3` | Current release supports Vite 6, 7, and 8. ([registry](https://registry.npmjs.org/@tanstack%2Fdevtools-vite/latest)) |
| Vite | `7.3.6` | Latest Vite 7 patch on the decision date; satisfies Start and Nitro without adding the Vite 8/Rolldown migration. ([Vite registry](https://registry.npmjs.org/vite), [Vite 8 announcement](https://vite.dev/blog/announcing-vite8)) |
| `@vitejs/plugin-react` | `5.2.0` | Latest v5 line and therefore the compatible React plugin for Vite 7; v6 requires Vite 8. ([registry](https://registry.npmjs.org/@vitejs%2Fplugin-react)) |
| Nitro | `3.0.260610-beta` | Current npm `latest` and the Vite plugin documented for Vercel. It must be exact-pinned because the package remains a prerelease and the integration is explicitly under active development. ([registry](https://registry.npmjs.org/nitro/latest), [TanStack hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Vercel support announcement](https://vercel.com/changelog/support-for-tanstack-start)) |
| React / React DOM | `19.2.8` | Current patch pair; supported by Start, Router, and Query. ([React registry](https://registry.npmjs.org/react/latest), [React DOM registry](https://registry.npmjs.org/react-dom/latest)) |
| TypeScript | remain on `5.9.3` | The lockfile already resolves this stable 5.x version. TypeScript 7 is a separate major and is not needed for this upgrade; Router recommends TypeScript 5.3 or newer. ([Router quick start](https://tanstack.com/router/latest/docs/quick-start)) |

Use exact versions for the migration commit and keep the generated lockfile. Do not retain the current broad `"nitro": "latest"` declaration: it makes a clean install change deployment machinery without a source change.

Remove the repository's direct `@tanstack/router-plugin` dependency unless implementation inspection discovers a direct import. The current application imports only the Start Vite plugin, and Start's plugin core already depends on the exact Router plugin it needs ([plugin-core registry metadata](https://registry.npmjs.org/@tanstack%2Fstart-plugin-core/latest)). This is dependency cleanup, not a switch to a separately configured Router plugin.

Defer Vite 8, `@vitejs/plugin-react` 6, TypeScript 7, Rsbuild, React Server Components, and any folder moves. They are independent choices with larger blast radii and do not unblock the planned structure or UX work.

## What the repository already gets right

The repository's locked baseline is newer than its declared minimum ranges: Start `1.145.10`, Router/SSR integration `1.145.7`, Query `5.90.16`, Vite `7.3.1`, React `19.2.3`, and Nitro `3.0.1-alpha.1`. On Node `22.16.0`, that baseline produced a Vercel/Nitro production build successfully on 2026-07-28.

Several current conventions should be preserved:

- `src/router.tsx` exports `getRouter()` and creates a fresh Router and QueryClient for each call. Start requires a `getRouter` function returning a new router instance, and the Query integration specifically requires a fresh QueryClient per SSR request. ([Start routing](https://tanstack.com/start/latest/docs/framework/react/guide/routing), [Query integration](https://tanstack.com/router/latest/docs/integrations/query))
- The repository uses Start's file routes, `src/routes/__root.tsx`, and generated `src/routeTree.gen.ts`. Start defines those as framework conventions; the bundler owns path updates and route-tree generation. ([Start routing](https://tanstack.com/start/latest/docs/framework/react/guide/routing))
- `src/routes/products.$id.tsx` awaits `ensureQueryData` and reads with `useSuspenseQuery`, which participates in SSR hydration/streaming through the Router integration. The index route's unawaited `prefetchInfiniteQuery` is the documented non-blocking streaming shape, but it needs a regression test. ([Query integration](https://tanstack.com/router/latest/docs/integrations/query))
- The server handlers use the unified `createFileRoute(..., { server: { handlers } })` shape introduced for Start RC and still documented today. ([Start RC migration notes](https://github.com/TanStack/router/discussions/2863), [middleware/server-route examples](https://tanstack.com/start/latest/docs/framework/react/guide/middleware))
- `vite.config.ts` orders `tanstackStart()`, `nitro()`, and the React plugin consistently with TanStack and Vercel examples. ([TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Vercel support](https://vercel.com/changelog/support-for-tanstack-start))

## Risks the architecture plan must account for

### 1. The upgrade has no meaningful automated safety net yet

The production build passes, but `pnpm test` reports “No test files found,” and `pnpm check` already fails on formatting in the two TanStack Query integration files. These are baseline facts, not upgrade regressions. Before changing versions, add a small black-box characterization suite or equivalent preview checks for:

- SSR HTML for `/` and `/products/:id`;
- hydration without console warnings in every supported language and theme;
- client navigation, back-to-catalog behavior, search-param preservation, pending and error states;
- `/api/products`, `/api/products/:id`, `/api/image`, and `/sitemap.xml` status/body/header behavior;
- route generation from a clean checkout; and
- server/client secret separation.

Record the existing Biome failures separately, then make the compatibility commit pass an agreed clean baseline so unrelated formatting work is not misattributed to TanStack.

### 2. Route loaders are isomorphic, not server-only

Start includes application code in both environments by default, and route loaders run during SSR **and** client navigation. Secrets and server-only dependencies must remain behind server routes, server functions, or explicit server-only boundaries. ([execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model), [code-execution patterns](https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns))

Takonbini currently keeps `PRODUCTS_API_KEY` reads inside server-route handlers, which is correct. A later module reorganization must not move that upstream gateway into an isomorphic route loader or shared query module. The current `productService.ts` performs an absolute HTTP round-trip back through Takonbini's own `/api` routes during SSR; keep it working through the compatibility upgrade, then decide separately whether a server function/gateway seam should avoid that extra hop.

### 3. Hydration correctness is application-specific

The root document changes a process-wide i18n singleton during `beforeLoad`, uses a browser language detector, updates document state after hydration, and suppresses hydration warnings on `<html>`. The theme path likewise combines a server-read cookie with browser media queries. These may work today, but a successful build cannot prove request isolation or matching server/client output. Start explicitly warns that server/client output differences produce hydration mismatches. ([code-execution patterns](https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns))

The upgrade gate therefore needs concurrent SSR requests in different languages plus light/dark/system hydration checks. Do not “fix” this inside the package bump; surface any failure as a separate architecture ticket.

### 4. Query streaming behavior must be observed, not inferred from types

The Router integration dehydrates initial queries and incrementally hydrates streamed queries. `useSuspenseQuery` runs on the server; plain `useQuery` does not. Awaited loader queries block the SSR request, while unawaited prefetches can stream. ([Query integration](https://tanstack.com/router/latest/docs/integrations/query))

Verify that the catalog produces useful server-rendered content for SEO, the product page does not issue a duplicate browser request after hydration, and an upstream failure reaches the intended route error state. Capture request counts and HTML, not just screenshots.

### 5. Route generation is generated infrastructure, not a feature folder

Start requires the route directory, root route, router factory, and generated route tree, but TanStack Router permits flat, directory, and mixed file-route layouts. The generated tree is maintained by the bundler and should not be edited or formatted by hand. ([Start routing](https://tanstack.com/start/latest/docs/framework/react/guide/routing), [file-based routing](https://tanstack.com/router/latest/docs/routing/file-based-routing), [Vite installation](https://tanstack.com/router/latest/docs/installation/with-vite))

TanStack does **not** prescribe where Takonbini's product contracts, query definitions, UI components, formatting logic, or server gateway must live. Those feature/module seams are an application architecture decision. Keep route files as route adapters, but do not present a proposed feature-folder layout as a framework migration requirement.

After a clean install and build, review the generated `routeTree.gen.ts` diff. Commit it only if the selected generator legitimately changes it, and never combine that generated diff with route moves.

### 6. Vercel success depends on Nitro, which is still prerelease

Vercel officially supports Start through Nitro and the existing plugin shape, but TanStack warns that the Nitro/Vite integration is still under active development. ([Vercel support](https://vercel.com/changelog/support-for-tanstack-start), [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)) The compatibility change must therefore produce and exercise a Vercel Preview Deployment before merge:

- confirm the generated `.vercel/output` and Node 22 runtime;
- exercise SSR, streaming, all server routes, environment variables, response streaming, cache headers, and redirects;
- compare server/runtime logs for cold-start or handler errors; and
- retain the prior deployment as the immediate rollback target.

Do not infer deployment safety from `vite build` alone, and do not combine this with the separate scraping Workflow rollout.

### 7. Environment reads need explicit boundaries

Current secret reads happen inside per-request server handlers, matching Start's guidance. Start recommends per-request environment reads and warns that module-scope reads can be unavailable on request-injected runtimes or leak into client bundles. ([environment variables](https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables))

The later architecture decision should centralize validated server environment access behind a server-only gateway, while leaving public configuration explicit. Preserve behavior during the version upgrade first.

## Required migration sequence

1. Record the current Node and pnpm versions, clean build output, known Biome failures, and lack of tests.
2. Add the smallest characterization coverage listed above without changing product behavior.
3. Pin Node 22 for local/CI/Vercel and install the exact target snapshot in one package/lockfile commit. Remove only the unused direct Router plugin and replace `nitro: latest` with its exact version.
4. Run formatting/lint, type checking, unit/integration coverage, a clean production build, and route-tree diff review.
5. Deploy a Vercel Preview and execute the SSR/hydration/server-route matrix in both themes and all three languages.
6. Merge and observe production before starting folder moves. Tag or otherwise retain a simple rollback point.
7. Make structural refactoring a later behavior-preserving change; make UX changes later still.

## Acceptance gate

The TanStack compatibility change is accepted only when:

- the exact direct versions and lockfile are committed, with no `latest` deployment dependency;
- Node 22 is pinned consistently;
- a clean checkout generates/builds the route tree deterministically;
- SSR HTML, query hydration/streaming, API routes, sitemap, image proxy, client navigation, language/theme hydration, and environment boundaries pass the characterization matrix;
- the Vercel Preview passes real requests and has no new runtime errors;
- no folder moves, route renames, UX changes, Query-policy redesign, or scraper Workflow code appear in the upgrade diff; and
- the previous production artifact remains available for rollback.

## Repository baseline evidence

Commands run in the isolated research worktree on 2026-07-28:

- `pnpm install --frozen-lockfile`: succeeded.
- `pnpm build`: succeeded on Node `22.16.0`, producing Nitro's Vercel output with a `nodejs22.x` runtime; warned that the main client chunk is about 523 kB minified.
- `pnpm test`: failed because no test files exist; outside the restricted sandbox it also reported a lingering Vite server before closing.
- `pnpm check`: failed only on pre-existing formatting differences in `src/integrations/tanstack-query/devtools.tsx` and `root-provider.tsx`.
- `git status --short`: clean after the baseline commands.

These results establish the pre-upgrade state; they do not validate the proposed target, which must be installed and exercised by the later implementation ticket.
