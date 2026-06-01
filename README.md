# Playable AI

Turn interactive app state into structured AI tasks and human-reviewable candidates.

Playable AI is an open-source TypeScript toolkit for building applications where the user interacts with a product like a game, board, editor, map, canvas, or studio, while the AI layer works through explicit tasks, structured context, provider adapters, and reviewable results.

The core idea is simple:

```text
interactive state
-> scoped task
-> provider adapter
-> structured candidate
-> human review
-> apply / reject / edit / lock
```

It is not a prompt collection and it is not a chatbot wrapper. Playable AI is a small workflow layer for apps that need AI to understand product state without letting model output directly overwrite user-owned data.

## Why

Many AI apps start as a text box connected to a model. That works for quick generation, but it breaks down when an app has real state:

- cards on a board
- nodes in a graph
- timeline points
- manuscript sections
- map regions
- simulation entities
- design objects
- user-edited fields that must not be overwritten

Playable AI treats AI output as a candidate, not as a direct write. The user stays in control.

## What This Project Provides

The first public release will focus on a small set of reusable primitives:

- state snapshots
- task registry definitions
- provider adapter interfaces
- structured candidate envelopes
- evidence and provenance metadata
- apply policies
- review queues
- React-friendly hooks and examples

## Example Use Cases

- a writing tool that turns a manuscript selection into review candidates
- a worldbuilding app that maps notes into structured entities
- a kanban board that asks AI to group or refine tasks
- a strategy game editor that asks AI to suggest balancing changes
- a diagram tool that asks AI to detect missing steps
- a local-first app that can use either a local sLLM endpoint or a remote provider

## Project Status

Playable AI is in early public development.

Current focus:

1. define the core task and candidate model
2. add a minimal provider adapter contract
3. ship a small React example
4. add a manuscript/source-map example
5. publish the first npm package

## Repository Structure

Playable AI separates reusable SDK code from example apps:

```text
packages/core    framework-neutral SDK primitives
packages/react   optional React integration helpers
packages/server  optional backend/provider helpers
examples/*       isolated demo apps
docs/*           public documentation
```

Example apps should stay inside `examples/<example-name>` so contributors can add demos without creating conflicts in the core SDK. See [`docs/repository-structure.md`](./docs/repository-structure.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Installation

The package is not published to npm yet. For now, use the repository directly:

```bash
git clone https://github.com/dreamwars99/playable-ai.git
cd playable-ai
corepack enable
pnpm install
```

After the first npm release, the intended install path will be:

```bash
pnpm add playable-ai
```

or:

```bash
npm install playable-ai
```

## Intended API Shape

The API is still being implemented, but the library is designed around this shape:

```ts
import { createTask, createCandidate } from "playable-ai";

const task = createTask({
  id: "board.group-tasks",
  scope: {
    app: "demo-kanban",
    surface: "board",
    entityId: "sprint-42"
  },
  snapshot: {
    columns: ["Todo", "Doing", "Done"],
    cards: [
      { id: "card-1", title: "Write README", status: "Todo" },
      { id: "card-2", title: "Add adapter contract", status: "Doing" }
    ]
  }
});

const candidate = createCandidate({
  taskId: task.id,
  status: "suggested",
  confidence: 0.82,
  operations: [
    {
      type: "card.move",
      targetId: "card-1",
      payload: { status: "Doing" }
    }
  ],
  applyPolicy: "review_required"
});
```

## Provider Model

Playable AI is provider-agnostic.

Adapters can target:

- OpenAI-compatible APIs
- local sLLM endpoints
- self-hosted model servers
- mocked or deterministic development providers

Provider keys should stay outside browser bundles. Apps using Playable AI should route sensitive model calls through their own secure backend, local service, or explicitly user-controlled runtime.

## React Apps

Playable AI is designed to work well in React apps, but the core package will not require React.

The planned structure:

```text
packages/core      framework-neutral TypeScript primitives
packages/react     optional React hooks and helpers
packages/server    optional backend/provider helpers
examples/tactics-grid fictional game/editor demo
examples/kanban-quest productivity board demo
```

## Open-Core Friendly

This project is intentionally generic.

Commercial apps can keep their domain-specific prompts, private workflows, paid features, and production infrastructure closed while still using or contributing to the shared task/candidate workflow layer.

## Customize It With Your AI Agent

Playable AI is meant to be changed. Give this repository to your coding agent, ask it to read [`AGENTS.md`](./AGENTS.md), and have it create a task pack for your own app.

For example:

```text
Read README.md and AGENTS.md in this repository.
My app is a [game/editor/dashboard/board].
Design a Playable AI task pack that turns my app state into AI-readable tasks,
returns reviewable candidates, and never mutates my app state directly.
```

Your app keeps its own UI, backend, database, prompts, and business logic. Playable AI only provides the modifiable contract between app state, AI tasks, provider output, and human review.

## For AI Coding Agents

This repository includes an [`AGENTS.md`](./AGENTS.md) guide for Codex, OpenCode, Cline, Claude Code, and other AI coding agents. It explains the project boundaries, moddability contract, provider safety rules, and how to add task packs or examples without turning Playable AI into a closed prompt wrapper.

## License

MIT
