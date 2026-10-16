# StyleX integration spike — PR #73

Scope: official tooling, the native scroll action, and the shared portalled
Select path. This is not completion of #29 or permission to release mixed styling.
Baseline: `055e4f2` (merged main). Its lockfile was installed without changes,
production-built, and served independently as the rollback comparison source.
No production deployment, alias change, or live rollback was performed.

## Production parity

The baseline and candidate were built with the same node-server preset and
served on separate local ports. Comparisons used the same browser tab/viewport.
[Geometry results](stylex-integration-spike/geometry.json) cover closed triggers
and open language popups: 390/768/1280px × en/ja/zh × light/dark, plus 639/640px
to bracket the shell's responsive label breakpoint. All 20 cases match exactly.
Computed font sizes, line heights, spacing, radii, colors, and dimensions agree.
Shadow strings omit Tailwind's visually empty zero shadows; animation names are
compiler-generated. The final focus fix was rechecked at mobile dark and desktop
light: the top 180px screenshot regions have zero pixel difference in all channels.

| Representative final captures | Baseline | Candidate |
| --- | --- | --- |
| Mobile dark | [main](stylex-integration-spike/baseline-en-dark-390-open.jpg) | [StyleX](stylex-integration-spike/candidate-en-dark-390-open.jpg) |
| Desktop light | [main](stylex-integration-spike/baseline-en-light-1280-open.jpg) | [StyleX](stylex-integration-spike/candidate-en-light-1280-open.jpg) |

The local API was not configured. Screenshots therefore show catalog loading/error
states; they do not establish populated-card/image parity. Those components were
not migrated by this spike. Existing product tests continue to cover their states.

## Runtime and controls

- Vite dev/HMR: an already-open popup changed item right padding 32 → 40 → 32px
  when the source was temporarily changed/restored, without closing/reloading.
- Production head links one extracted stylesheet and no virtual dev stylesheet.
  Globals precede virtual StyleX CSS in development; explicit layers keep reset,
  StyleX priorities, and caller utilities in that order.
- Both shell callers retain 44px trigger minimums. Primitive default/small heights
  remain 36/32px. Placeholder, disabled opacity, native disabled state, invalid
  borders, light/dark invalid focus rings, and focus restoration were checked.
- A temporary unshipped harness checked dynamic StyleX width + inline properties,
  a utility padding override, labels/separators, popper side/4px offset, a 180px
  overflow popup, and keyboard End scrolling with both scroll affordances.
- Search submission still changes the URL. The native filter dialog opens and
  Escape restores focus to Filters. System theme follows the document preference.
- Browser log searches found no hydration warning or runtime stylex.create error.
  Local product API failures remain visible and were not treated as styling passes.
- Compiled Select transition/animation media rules set zero duration for reduced
  motion. OS preference emulation, Safari, and full-app Lighthouse were not run;
  those remain later release-matrix checks. Existing smooth scroll is unchanged.

## Checks and size comparison

All 61 tests, lint, TypeScript, and both production presets pass. Focused tests
cover SSR, size/state props, StyleX/native composition, portals, disabled options,
keyboard selection, Escape, and focus return. Test harnesses/configs were removed.

Totals below sum emitted client assets; gzip uses identical Python gzip settings.
They are not an initial-route transfer measurement.

| Assets | Main raw / gzip bytes | Candidate raw / gzip bytes |
| --- | ---: | ---: |
| CSS | 44,683 / 9,189 | 42,993 / 9,599 |
| JavaScript | 560,790 / 185,495 | 536,505 / 178,509 |

Tailwind's remaining consumers and reset remain installed. The active colors are
still owned by existing CSS variables, with one documented scroll-border bridge.
The Select data-slot bridge preserves arbitrary slotted markup; it is deliberately
retained until its consumers can migrate together.

## Merge and release gate

Issue #29 says: “Tailwind and StyleX may coexist only on the unpublished migration
branch.” This PR still has both. It can validate the spike and remain reviewable,
but it does not satisfy that merge/release constraint. The maintainer must either
explicitly amend the rollout to permit a merged integration slice or keep this
branch unpublished until the remaining migration removes Tailwind. The preceding
products-module release's observation obligations also remain documented in the
[release reconciliation](phase-7a-release-reconciliation.md).
