# Maintenance Log

This log records maintainer-facing project activity that may not map directly to a release.

Use `CHANGELOG.md` for release-facing changes. Use this file for date-based maintenance context: why a task was done, what changed, how it was validated, and which issue or commit relates to the work.

## Entry Format

```md
## YYYY-MM-DD

### Short Task Name

Reason:
Why this maintenance work mattered.

Updated:
- What changed.

Validation:
- What was checked.

Related:
- Issue #...
- Commit `...`
```

## 2026-06-06

### Provider Parser Hardening

Reason:
Model/provider output is one of the highest-risk boundaries in Playable AI. The server adapter should fail explicitly for malformed output and preserve safe defaults when optional model fields are invalid.

Updated:
- Added provider parser tests for malformed JSON.
- Added tests for missing `candidates` arrays and missing `operations` arrays.
- Added tests for invalid operation payloads.
- Added tests for raw candidate arrays and default candidate normalization.
- Wrapped malformed JSON parse failures with a provider-specific error message.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- `pnpm pack:check`
- GitHub Actions Check

Related:
- Issue #15

### Maintenance Log And Agent Guidance

Reason:
The project now has several maintenance workflows, release steps, and CI/package checks. A date-based log gives maintainers and AI coding agents a compact place to recover why changes were made, without turning `CHANGELOG.md` into an operations journal.

Updated:
- Added this maintenance log.
- Linked the log from the docs index and maintainer workflow docs.
- Updated `AGENTS.md` so AI coding agents know when to update the log.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #14

## 2026-06-05

### Package Dry-Run CI

Reason:
The project added npm publish readiness checks, but they were only validated locally. Running package dry-runs in CI keeps tarball contents visible before any future npm publish.

Updated:
- Added a separate GitHub Actions `package dry-run` job.
- Kept the existing Node 22/24 `pnpm check` matrix.
- Updated `CHANGELOG.md` with the CI publish-readiness check.

Validation:
- `workflow yaml ok`
- `git diff --check`
- public sensitive-term scan
- `pnpm pack:check`
- `pnpm check`
- GitHub Actions Check: Node 22, Node 24, package dry-run

Related:
- Issue #13
- Commit `521796e`

## 2026-06-04

### NPM Publish Readiness Audit

Reason:
After the first patch release, the next practical maintainer task was to check whether the publishable packages were ready for a future npm release without actually publishing them.

Updated:
- Added package-local `LICENSE` files.
- Added package repository, homepage, bugs, and keyword metadata.
- Added public publish config for scoped packages.
- Added `pnpm pack:check`.
- Documented npm publish readiness in `docs/release.md`.

Validation:
- `pnpm pack:check`
- `pnpm install --frozen-lockfile`
- `pnpm check`
- `git diff --check`
- public sensitive-term scan
- publish metadata script
- GitHub Actions Check: Node 22 and Node 24

Related:
- Issue #12
- Commit `822b0a7`

## 2026-06-02

### v0.1.1 Source Release

Reason:
The repository had accumulated integration docs, API docs, provider safety guidance, maintainer workflow docs, CI updates, and core tests. A source release made those changes easy to reference from GitHub.

Updated:
- Prepared `v0.1.1`.
- Moved `CHANGELOG.md` Unreleased entries into `0.1.1`.
- Updated package and example versions to `0.1.1`.
- Created annotated tag `v0.1.1`.
- Published the GitHub source release.

Validation:
- `pnpm install --frozen-lockfile`
- `pnpm check`
- `git diff --check`
- public sensitive-term scan
- GitHub Actions Check: Node 22 and Node 24

Related:
- Issue #11
- Commit `5256a8e`
- Release `v0.1.1`

### Maintainer Workflow Foundation

Reason:
The project needed stronger OSS maintenance signals beyond example apps: docs, safety boundaries, tests, CI, and visible issue-driven work.

Updated:
- Added integration lifecycle docs.
- Added API reference draft.
- Expanded provider safety and BYOK guidance.
- Added maintainer and release workflow docs.
- Added core edge-case tests.
- Added Node 22/24 CI matrix.
- Added maintenance task issue template.

Validation:
- `pnpm check`
- `git diff --check`
- public sensitive-term scan
- GitHub Actions Check

Related:
- Issues #4, #5, #6, #7, #8, #9, #10
- Commits `a443b89`, `caaae1f`, `026cabe`, `78eae45`, `dcd8ac5`, `88bcc48`, `ac7ea87`
