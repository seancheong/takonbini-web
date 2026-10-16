# Pull request workflow

## Merge authorization

A pull request may be merged only after the user explicitly approves merging
that specific PR. Once its checks pass, ask for approval or leave the pull
request open for the user to merge. Approval to create, update, or check a pull
request does not authorize merging it.

## GitHub CLI from Codex

If `gh auth status` reports an invalid token in the restricted command runner,
retry it with `sandbox_permissions: "require_escalated"` before asking the user
to sign in. On this Mac, the restricted runner cannot reliably access the
keyring and GitHub network; the elevated check has verified the existing login.
Use the elevated runner for `gh pr` commands when needed. The GitHub connector
may return `403 Resource not accessible by integration` even while `gh` works.

## UI and design system

Before adding or changing UI, read [DESIGN.md](DESIGN.md) and its relevant topic.
Use only implemented components, documented button classes, and semantic color
tokens. The StyleX plan describes proposed APIs; it does not make them available.
