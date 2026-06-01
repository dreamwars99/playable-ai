# Contributing to Playable AI

Thanks for helping improve Playable AI.

This project is intentionally small and modular. The goal is to make it easy for humans and AI coding agents to add task packs, provider adapters, and example apps without creating merge conflicts in the core SDK.

## Start Here

Before changing code, read:

1. [`README.md`](./README.md)
2. [`AGENTS.md`](./AGENTS.md)
3. [`docs/repository-structure.md`](./docs/repository-structure.md)

## Contribution Types

### Core SDK Changes

Core changes live under:

```text
packages/core/**
```

Use this area for framework-neutral TypeScript primitives:

- snapshots
- tasks
- task packs
- prompt/context packs
- operations
- candidates
- provider adapter contracts
- review queue helpers

Core changes should be generic. Do not add app-specific prompts, UI assumptions, browser-only APIs, or provider-specific behavior to `packages/core`.

### React Helper Changes

React helpers will live under:

```text
packages/react/**
```

This package should depend on `packages/core`, not the other way around.

### Server Helper Changes

Server-side helpers will live under:

```text
packages/server/**
```

Use this area for backend-mediated provider execution, request validation, redaction helpers, and provider safety utilities.

### Example App Changes

Example apps live under:

```text
examples/<example-name>/**
```

Examples should be isolated. A PR that adds or updates an example should stay inside that example folder unless a missing generic primitive needs to be added to `packages/core`.

Good example PR:

```text
examples/tactics-grid/**
```

Risky example PR:

```text
examples/tactics-grid/**
packages/core/**
README.md
AGENTS.md
```

If an example needs a core change, explain the missing primitive clearly in the PR.

### Documentation Changes

Documentation lives under:

```text
README.md
AGENTS.md
CONTRIBUTING.md
docs/**
examples/*/README.md
packages/*/README.md
```

Keep public docs direct, short, and example-first.

## PR Checklist

Before opening a PR:

- Keep the change focused.
- Run `pnpm check`.
- Run `git diff --check`.
- Update docs if you introduce a public concept.
- Keep provider secrets out of examples.
- Do not let AI output directly mutate app state.

## AI-Assisted Contributions

AI-assisted contributions are welcome.

If you use an AI coding agent, ask it to read `AGENTS.md` first. The agent should preserve the project boundaries:

- core stays framework-neutral
- examples stay isolated
- provider secrets stay out of frontend code
- AI results remain reviewable candidates

## Commit Style

Use short, conventional-ish commit messages:

```text
docs: explain repository structure
feat(core): add task envelope types
feat(example): add tactics grid demo
ci: add typecheck workflow
```

## Safety Boundaries

Do not contribute code that targets real-world weapon operation, surveillance, targeting, or operational military decision-making. Fictional game balancing, benign simulations, educational examples, and productivity examples are welcome.

