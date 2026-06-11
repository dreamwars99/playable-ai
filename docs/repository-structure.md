# Repository Structure

Playable AI separates reusable SDK code from example apps.

This keeps the core stable while allowing many examples to be built in parallel.

## Layout

```text
packages/
  core/
    Framework-neutral TypeScript primitives.

  react/
    Optional React hooks and UI helpers.

  server/
    Optional backend helpers for provider execution and request validation.

examples/
  tactics-grid/
    Fictional game/editor demo.

  kanban-quest/
    Productivity board demo.

  city-sim/
    Simulation dashboard demo.

  local-provider-runtime/
    Non-UI backend or local runtime provider route reference.

docs/
  Public documentation.

.github/
  Pull request template and automation.
```

## Ownership Rules

### `packages/core`

Core is the contract layer.

It should define generic types and helpers for:

- snapshots
- task envelopes
- task packs
- prompt/context packs
- operations
- candidates
- provider adapter interfaces
- review queues

Core must not depend on React, DOM APIs, Vite, app-specific data, or one provider.

### `packages/react`

React helpers are optional integration helpers.

They can make it easier to use Playable AI in React apps, but they must not define the core protocol.

### `packages/server`

Server helpers are optional integration helpers.

They can help backend apps run provider adapters safely, call OpenAI-compatible or local endpoints, validate requests, redact sensitive fields, and return candidates.

### `examples/*`

Each example is isolated. Most examples are runnable apps; provider references may be non-UI runtimes.

Examples should show how to adapt Playable AI without changing the core SDK. They may include their own UI, styles, mock providers, fixtures, and screenshots.

If an example needs a new generic helper, add it to `packages/core` in a separate commit or explain the coupling clearly in the PR.

## Recommended Example Pattern

Each example should include:

```text
examples/<name>/
  README.md
  package.json
  src/
    App.tsx
    taskPack.ts
    mockProvider.ts
    operationMapper.ts
```

The important flow is:

```text
visible app state
-> snapshot adapter
-> task pack
-> mock or real provider adapter
-> candidates
-> apply / ignore / edit
```

Non-UI runtime examples should instead show:

```text
task request
-> backend or local runtime route
-> provider adapter
-> candidate validation
-> structured response
```

## Merge Conflict Strategy

Example contributors should mostly work under one folder:

```text
examples/<their-example>/**
```

Core contributors should mostly work under:

```text
packages/core/**
```

Documentation contributors should mostly work under:

```text
docs/**
```

This is not a hard security boundary, but it keeps public collaboration manageable.
