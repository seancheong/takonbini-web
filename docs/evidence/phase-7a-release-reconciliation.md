# Phase 7A release reconciliation

Status: amended baseline accepted; recovery source verified; observation gate remains open.

This record reconciles [#18](https://github.com/seancheong/takonbini-web/issues/18)
with the release shipped in [PR #63](https://github.com/seancheong/takonbini-web/pull/63).
It does not close #18 or authorize the blocked implementation phase #26.

## Release and verification

- Merged reference: `cb39d06d5f26499c38320af5a612b08e79a1ffc2`.
- Patched pre-merge reference: `1c6d0973957d3f7368c09286c91edc6670f58176`.
  Their repository contents are identical (`git diff 1c6d097 cb39d06` is empty).
- Start: `1.168.60`; Start server core: `1.169.39`; Router: `1.170.41`;
  Query: `5.102.0`. The committed lockfile pins the resolved graph.
- Security basis: [TanStack's CVE-2026-102989 advisory](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8).
- GitHub CI and the Vercel preview passed for the patched reference. GitHub
  also reports a successful Vercel production deployment for the merged commit.
- All 29 tests pass against the merged reference. Before merging, type checking,
  lint, build, and production-build HTTP checks for catalog, API, and detail passed.
- The maintainer reported the merged UI works as expected in production.

At **15 October 2026, 06:35:45 MYT**, read-only production checks against
`https://takonbini.com` returned HTTP 200 for all of the following:

| Check | Content assertion |
| --- | --- |
| Catalog SSR | Current English catalog heading appears |
| Seven-Eleven, Lawson, FamilyMart API browse | Each page is nonempty and belongs to the requested store |
| Three store-filtered catalog routes | Route returns successfully |
| Product detail with catalog filters | Catalog return link appears |
| Retailer image proxy | Sample product image returns successfully |
| Sitemap | XML has opening and closing urlset elements |

These checks are a checkpoint, not proof of continuous monitoring, exhaustive
accessibility, performance, or complete sitemap enumeration. Retailer product
payloads, private endpoints, and credentials are excluded from this record.

## Maintainer acceptance

On **15 October 2026, 07:21 MYT**, the maintainer explicitly approved using
merged PR #63 as the amended Phase 7A baseline while retaining the observation
and safe rollback gates. This accepts the bundled-release exception; it does
not authorize merging readiness PR #70, closing #18, or promoting a rollback.

## Reconciliation against #18

| Gate | Evidence and remaining work |
| --- | --- |
| Characterization and compatibility tests | 29 tests and built-route probes pass. Extend full hydration/navigation/head coverage before mechanical moves. |
| Compatibility-only change | **Accepted amendment.** PR #63 bundled catalog UX and the security upgrade. Historical release isolation was not met; the maintainer accepted this patched release as the new baseline on 15 October 2026. |
| Production verification and 24-hour observation | Initial checkpoint passes; window is pending. A conservative window starts at the checkpoint above and ends no earlier than **16 October 2026, 06:35:45 MYT**. Repeat checks and review incidents at the end; elapsed time alone is not acceptance. |
| Previous lockfile and tested rollback deployment | **Recovery source verified; hosted promotion untested.** The previous graph resolves vulnerable Start `1.145.10` and remains history only. The accepted patched baseline was independently rebuilt and its retained deployment checked; no production alias rollback was exercised. |

## Safe rollback baseline for subsequent phases

For the future #26 release, the accepted patched reference `cb39d06` is the
rollback source. On **15 October 2026, 07:22 MYT**, an independent managed
checkout of that exact commit passed:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

All 29 tests passed. The rebuilt production artifact was started on a separate
local port with existing API configuration supplied through the process
environment. Catalog SSR, product API, and detail SSR returned HTTP 200 with
expected content. Credentials were neither copied into the checkout nor
included in this evidence.

GitHub deployment `7078753180` identifies the retained production deployment
of `cb39d06`, reported successful at 15 October 2026, 06:25:30 MYT. Read-only
checks against its immutable deployment URL returned HTTP 200 for the catalog
and products API. The deployment status retains its URL; use that immutable
URL rather than a moving branch alias when selecting a rollback target.

### Recovery procedure

1. Resolve the immutable successful deployment for `cb39d06` from the GitHub
   deployment record above. Recheck its catalog and API responses.
2. If the retained deployment is unavailable, rebuild a clean checkout of the
   exact commit with its frozen lockfile using the verified commands above.
   Configure the existing server-side API environment through Vercel; secrets
   remain outside version control. Validate that replacement in preview first.
3. Obtain explicit approval for the concrete deployment to restore. With an
   authenticated Vercel account for the project, run
   `vercel rollback <immutable-deployment-url>` and wait for completion.
   The syntax was verified with Vercel CLI 64.1.0 help; the mutation was not run.
4. Recheck the public catalog, all three store APIs, filtered detail return,
   image proxy, and sitemap, then record the new deployment/incident outcome.

**Verified:** independently installable source, frozen dependency graph,
production build, local restored routes, and reachable retained deployment.
**Not verified:** authenticated Vercel rollback execution or a production alias
promotion. Keep this distinction when deciding whether the hosted rollback
gate is sufficient. A live drill still needs concrete authorization; the
Phase 0 record explicitly deferred that mutation.

The previous vulnerable lockfile and the Vercel vulnerability override are
excluded from this recovery procedure.

## Next gate

#26 implementation remains gated until the observation evidence is complete
and the remaining hosted rollback gate is resolved. The amended baseline
acceptance is recorded above.
The [products-module migration plan](../plans/phase-7b-products-module.md)
is preparatory documentation only. StyleX and Shiori retain their later,
separate releases (#29 and #27).
