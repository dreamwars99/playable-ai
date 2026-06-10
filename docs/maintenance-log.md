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

## 2026-06-10

### Host Payload Validation Patterns

Reason:
Apps need to understand that SDK-level candidate validation is only the generic contract check. Domain rules such as permissions, locks, target existence, and payload-specific constraints still belong to the host app before apply.

Updated:
- Expanded the integration lifecycle candidate validation section with a TypeScript host validation example.
- Added checklist coverage for target ids, permissions, locks, ranges, enums, and payload-specific rules.
- Added provider safety and API reference cross-links to the host validation guidance.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #21

### Choose Your App Shape Quickstart

Reason:
New visitors need a fast way to map their app shape to the closest example or integration guide without reading the full documentation set first.

Updated:
- Added a README section that maps board, grid/game editor, timeline, local-first, and provider-backed apps to the best starting docs or examples.
- Added matching example-selection notes to `examples/README.md`.
- Added a short starting-point list to `docs/integration.md`.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #22

## 2026-06-09

### Task Pack Template Guide

Reason:
Developers adapting Playable AI need a copyable starting point that shows how snapshots, task packs, provider boundaries, candidate validation, operation mapping, and review UI fit together.

Updated:
- Added `docs/task-pack-template.md`.
- Included a copyable TypeScript skeleton for state, operations, snapshot adapter, task pack, mock provider, SDK validation, host payload validation, and host-owned apply.
- Added adaptation notes for board, timeline, grid/editor, dashboard, and local-first app shapes.
- Linked the guide from the docs index and README.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #24

## 2026-06-08

### Contributor-Ready Issue Backlog

Reason:
After the public entry-point polish, the repository needed a small set of well-scoped issues that map to the roadmap and show how contributors can help without touching core internals first.

Updated:
- Added area labels for docs, examples, validation, provider work, and maintenance work.
- Opened five contributor-ready issues with motivation, suggested files, scope, and acceptance criteria.
- Linked the tracked near-term issues from the public roadmap.
- Kept the backlog focused on docs, examples, validation patterns, provider guidance, and smoke-check design.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #20
- Issues #21, #22, #23, #24, #25

## 2026-06-06

### Public Repository Entry Point Polish

Reason:
After the `v0.2.0` source release, new visitors need a faster way to understand what the repository does, how to run it, and where the project is headed. The entry point should make the early OSS status clear without overstating adoption.

Updated:
- Added a README quickstart near the top of the repository.
- Added an at-a-glance summary for status, package shape, examples, provider stance, and roadmap.
- Added a public roadmap document.
- Linked the roadmap from the docs index and maintainer notes.
- Refreshed GitHub repository description and topics.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- GitHub Actions Check

Related:
- Issue #19

### v0.2.0 MVP Validation Source Release

Reason:
The MVP lifecycle now exists across the core SDK, docs, provider safety guidance, and all runnable examples. A source release gives maintainers and evaluators a stable reference point for the completed task, provider, candidate, validation, review, and host-owned apply loop.

Updated:
- Prepared `v0.2.0`.
- Moved `CHANGELOG.md` Unreleased entries into `0.2.0`.
- Updated package and example versions to `0.2.0`.
- Prepared the annotated `v0.2.0` tag and GitHub source release.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- `pnpm pack:check`
- GitHub Actions Check

Related:
- Issue #18
- Release `v0.2.0`

### MVP Validation Gate Across Examples

Reason:
The core candidate validator should be visible in real example flows, not only in API docs. Wiring it into every runnable example makes the first MVP loop complete: task, provider, candidate, validation, review, and host-owned apply.

Updated:
- Added `validateCandidateForTask` checks to the tactics-grid, kanban-quest, and timeline-review examples.
- Displayed candidate validation status in each review UI.
- Blocked example apply actions when SDK-level validation fails.
- Updated README, integration docs, provider safety docs, examples docs, and OSS application notes to describe candidate validation as part of the lifecycle.

Validation:
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- `pnpm pack:check`
- browser smoke for runnable examples
- GitHub Actions Check

Related:
- Issue #17

### Core Candidate Validation Helper

Reason:
Host apps need a small SDK-level guard before applying AI or mock-provider candidates. Allowed-operation checks were available, but apps also benefit from a structured result that reports task mismatches and invalid operation shapes.

Updated:
- Added `validateCandidateForTask` to the core package.
- Added validation issue/result types.
- Added tests for valid candidates, task mismatches, disallowed operations, invalid operation shapes, invalid target ids, invalid payloads, and invalid operations collections.
- Documented the helper in the API reference.

Validation:
- `pnpm --filter playable-ai test`
- `pnpm --filter playable-ai typecheck`
- `git diff --check`
- public sensitive-term scan
- `pnpm check`
- `pnpm pack:check`
- GitHub Actions Check

Related:
- Issue #16

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
