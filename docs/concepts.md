# Concepts

Playable AI is a contract layer between a host app and an AI provider.

It does not own the app UI, database, or business logic. It helps the app package state into tasks and receive AI output as reviewable candidates.

## Snapshot

A `snapshot` is a JSON-safe view of host app state.

It should be small enough for a model or mock provider to inspect, but rich enough to explain the current state.

Examples:

- a grid of tiles and units
- a kanban board with cards and columns
- a simulation dashboard with district metrics
- an editor selection with surrounding context

## Task

A `task` is a scoped request for AI work.

It includes:

- task id
- app/surface/entity scope
- snapshot
- allowed operation types
- constraints
- optional instructions

Tasks are serializable so they can cross frontend/backend/local-runtime boundaries.

## Operation

An `operation` is a typed proposed change.

Examples:

- `card.move`
- `card.create`
- `tile.set-kind`
- `unit.move`

Playable AI never applies operations by itself. The host app maps operations to its own commands.

## Candidate

A `candidate` is a model or mock-provider suggestion.

It can include:

- title
- summary
- confidence
- evidence
- operations
- apply policy

Candidates wait for human review before they affect host app state.

## Task Pack

A `task pack` is a reusable bundle that knows how to create a task for a specific app feature.

It usually includes:

- snapshot builder
- allowed operations
- constraints
- optional instructions

App developers can write their own task packs or ask an AI coding agent to create one after reading `README.md` and `AGENTS.md`.

## Provider Adapter

A `provider adapter` is the layer that runs a task.

Adapters may target:

- a mock provider
- a backend endpoint
- a local model endpoint
- an OpenAI-compatible API

Provider adapters return candidates. They do not directly mutate host state.

