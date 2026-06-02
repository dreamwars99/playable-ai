---
name: Maintenance task
about: Plan docs, CI, release, testing, or maintainer workflow work
title: "maint: "
labels: maintenance
assignees: ""
---

## Goal

What maintenance outcome should this task achieve?

## Scope

Which areas are expected to change?

- [ ] `docs`
- [ ] `.github`
- [ ] `packages/core`
- [ ] `packages/react`
- [ ] `packages/server`
- [ ] `examples/<name>`
- [ ] release or changelog files

## Safety / Boundaries

- [ ] No provider secrets will be added.
- [ ] No example will imply direct AI-to-state mutation.
- [ ] No private product workflow or private data will be copied.
- [ ] Package boundaries will stay intact.

## Validation Plan

- [ ] `pnpm check`
- [ ] `git diff --check`
- [ ] GitHub Actions, if workflow or package behavior changes
- [ ] Manual docs/example review, if applicable

## Done When

What should be true before this issue is closed?
