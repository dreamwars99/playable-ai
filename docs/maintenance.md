# Maintainer Workflow

Playable AI is early, so maintenance should stay lightweight, visible, and repeatable.

The goal is not process for its own sake. The goal is to keep the SDK generic, safe, and easy for contributors or AI coding agents to extend without breaking the core contract.

## Default Loop

Use this loop for most changes:

```text
issue
-> focused change
-> local validation
-> commit
-> push
-> CI
-> close issue with summary
```

Small documentation fixes may skip a new issue, but feature work, public API changes, provider behavior, examples, and CI updates should be issue-driven when practical.

## Maintainer Review Checklist

Before merging or pushing a meaningful change, check:

- Does the change keep core framework-neutral?
- Does it avoid provider secrets in browser examples?
- Does AI output remain a reviewable candidate?
- Does the host app still own final apply logic?
- Are example changes isolated under `examples/<name>`?
- Are public concepts documented?
- Are tests updated when behavior changes?
- Did `pnpm check` pass?
- Did `git diff --check` pass?

## Issue Triage

Useful labels are not required yet, but maintainers should still classify issues mentally:

- `docs`: concept, integration, API, release, or safety docs
- `core`: task, candidate, queue, provider contract, operation helpers
- `react`: hook behavior or React usage docs
- `server`: provider adapter, parser, redaction, backend/local runtime helper
- `example`: isolated runnable demo app work
- `ci`: workflow, package, build, or test automation
- `security`: provider key, unsafe apply, validation, or dependency issue

When an issue is too broad, split it into smaller issues before implementing.

## PR And Commit Expectations

Commits should be small and descriptive.

Good:

```text
docs: document integration lifecycle
docs: add API reference draft
test(core): cover candidate queue edge cases
ci: add Node version matrix
```

Avoid combining unrelated docs, package code, examples, and CI changes in one commit.

## Validation

Default validation:

```bash
pnpm check
git diff --check
```

Also check public docs and examples for unsafe private or provider-secret content before pushing.

Use focused validation for very small docs-only edits when speed matters, but run the full check before releases or package behavior changes.

## AI Coding Agent Workflow

AI-assisted maintenance is welcome, but agents should:

- read `AGENTS.md`
- keep changes scoped
- preserve package boundaries
- avoid direct AI-to-state mutation patterns
- avoid provider keys in examples
- explain validation results
- leave human-readable issue or commit summaries

Good agent prompt:

```text
Read README.md, AGENTS.md, and docs/maintenance.md.
Update the API reference for the current exports only.
Do not add new APIs.
Run pnpm check and git diff --check.
```

## Release Readiness Signals

A change is release-ready when:

- relevant tests pass
- docs match the public API
- examples build
- provider safety boundaries are preserved
- `CHANGELOG.md` has a useful entry
- CI is green on `main`
