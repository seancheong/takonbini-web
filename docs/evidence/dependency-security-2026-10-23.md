# Dependency security update — 23 October 2026

Based on production/main `344d08d5f40dfcc95cd5f05c08dc66fc3637a7d4`. This is an implementation/validation checkpoint, not a merge or production-remediation claim.

Vite moves from7.3.6 to7.3.7; Vitest and its coordinated internal packages move from4.1.11 to4.1.12. Manifest minimums become^7.3.7 and^4.1.12, retaining existing caret policy. The generated lockfile also removes the now-unused @types/estree1.0.8 entry and uses the already-present1.0.9. No application source, infrastructure, script approvals or dependency overrides change.

## Advisory evidence

Fresh full audit before:7 findings (1 high,5 moderate,1 low). Fresh full and production-only audits after:0 findings. [Compact raw evidence and exact lockfile hash](dependency-security-2026-10-23/audit-summary.json). Registry advisory coverage is a point-in-time report, not proof of absence of all vulnerabilities or deployed exploitability.

Vite findings: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22. Mocker findings: GHSA-qxg6-89mg-rqv8 and GHSA-xp26-3454-mjgp. All seven disappear from the updated full graph. These concern development/test tooling; do not infer a verified production exploit from the baseline count.

Primary patched-version references: [Vite-related advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [manual mock registration](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8), [Windows redirect allowlist](https://github.com/vitest-dev/vitest/security/advisories/GHSA-xp26-3454-mjgp). PR#91 addresses Vite alone and remains separate/unmerged; its two residual mocker findings are why this update covers both packages.

## Validation

Node24.16.0 / pnpm10.20.0 local checks:

- Frozen-lockfile installation passes; no dependency build scripts were newly approved.
- 234 tests across33 files pass; TypeScript, lint and production build pass.
- Compiled image-route isolation, native transform and sharing JPEG/fallback pass.
- 14 crawler-sharing HTML cases and15 detail status/recovery cases pass.
- Catalog SSR passes en/ja/zh,20 server-rendered products, fixed page size and one upstream read.
- Diff whitespace check passes.

Hosted Node22 Web CI and exact immutable preview verification are recorded in the PR after publishing. Merge still requires explicit approval for that PR; exact production deployment/audit verification follows merge. Existing UX/performance/reliability/cost/observation gates are not closed by this dependency patch.
