# Phase 7A release reconciliation

Status: production baseline verified; Phase 7A exit gate remains open.

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

## Reconciliation against #18

| Gate | Evidence and remaining work |
| --- | --- |
| Characterization and compatibility tests | 29 tests and built-route probes pass. Extend full hydration/navigation/head coverage before mechanical moves. |
| Compatibility-only change | **Not met.** PR #63 bundled catalog UX and the security upgrade. Historical release isolation cannot be reconstructed. Maintainer acceptance of an amended baseline is still needed. |
| Production verification and 24-hour observation | Initial checkpoint passes; window is pending. A conservative window starts at the checkpoint above and ends no earlier than **16 October 2026, 06:35:45 MYT**. Repeat checks and review incidents at the end; elapsed time alone is not acceptance. |
| Previous lockfile and tested rollback deployment | **Not met.** The previous graph resolves vulnerable Start `1.145.10`; Vercel rejected the original PR deployment. It is retained as history, not a deployable rollback recommendation. |

## Safe rollback baseline for subsequent phases

For the future #26 release, the current patched merged reference is the
candidate rollback source. Keep its lockfile, successful production deployment
reference, and an independently rebuildable checkout. Rebuilding it and
promoting a deployment are separate actions; there has been no production
rollback drill during this reconciliation. The earlier Phase 0 record also
explicitly deferred a live web rollback drill.

Do not use a previous vulnerable lockfile or the Vercel vulnerability override
as a recovery plan. Before #18 closes, record maintainer acceptance of the
bundled-release exception and a tested safe rollback procedure. Keep production
promotion subject to explicit authorization.

## Next gate

#26 implementation remains gated until the #18 reconciliation is accepted,
its observation evidence is complete, and the safe rollback gate is resolved.
The [products-module migration plan](../plans/phase-7b-products-module.md)
is preparatory documentation only. StyleX and Shiori retain their later,
separate releases (#29 and #27).
