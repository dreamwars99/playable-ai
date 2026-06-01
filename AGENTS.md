# Playable AI Agent Guide

This file is for AI coding agents and human maintainers working in this repository.

Playable AI is an open-source TypeScript toolkit for turning interactive app state into structured AI tasks and human-reviewable candidates. It should stay generic, moddable, provider-agnostic, and safe for apps that need human control over AI output.

## Project Mission

Build a small SDK that helps stateful apps connect to AI without giving the model direct ownership of app data.

The core flow is:

```text
app state
-> snapshot adapter
-> task pack
-> context / prompt pack
-> provider adapter
-> candidate
-> review queue
-> app-owned apply / reject / edit / lock
```

Playable AI does not know the host app. It gives host apps a replaceable contract for making their state understandable to AI.

## Non-Negotiable Principles

- Do not make Playable AI a chatbot wrapper.
- Do not make Playable AI own the host app database.
- Do not make Playable AI own the host app UI.
- Do not put provider keys or secrets in frontend examples.
- Do not let AI output directly mutate host app state.
- Do not make domain-specific prompts mandatory.
- Do not hard-code any private product workflow into the generic SDK.
- Keep all task, prompt, operation, provider, and renderer layers replaceable by app developers.

## Architecture Vocabulary

Use these terms consistently:

- `snapshot`: a JSON-safe view of host app state prepared for AI.
- `task`: a scoped request for AI work against a snapshot.
- `task pack`: a reusable bundle that defines task ids, task input shape, constraints, and output expectations.
- `context pack`: code that turns app state into concise AI-readable context.
- `prompt pack`: editable prompt templates and instructions for a task.
- `operation`: a typed proposed change the host app may apply.
- `candidate`: AI or mock-provider output containing proposed operations, confidence, evidence, and apply policy.
- `review queue`: host-app or SDK helper state where candidates wait for human review.
- `provider adapter`: integration layer for OpenAI-compatible APIs, local models, mock providers, or self-hosted endpoints.
- `renderer`: optional UI that displays tasks or candidates; renderers are replaceable.

## Intended Package Boundaries

Use this structure as the project grows:

```text
packages/core
  framework-neutral TypeScript primitives:
  task, snapshot, operation, candidate, task pack, prompt pack, provider adapter contracts

packages/react
  optional React hooks:
  usePlayableTask, useCandidateQueue, useProviderRun

packages/server
  optional Node/server helpers:
  provider execution, request validation, redaction helpers

examples/tactics-grid
  small React game/editor demo showing board state -> candidates -> apply/reject

examples/kanban-quest
  non-game productivity demo showing the same contract in a board app

examples/city-sim
  simulation dashboard demo showing numeric/system state -> recommendations
```

Do not make `packages/core` depend on React, DOM, Vite, Node-only APIs, or a specific provider.

## Moddability Contract

Every example and package should show how developers can replace:

- snapshot adapter
- task definitions
- prompt/context templates
- provider adapter
- operation mapper
- candidate review UI
- apply policy

Prefer extension points over sealed abstractions.

Good:

```ts
createTaskPack({
  id: "tactics.balance",
  buildSnapshot,
  allowedOperations,
  buildPrompt,
  parseCandidate
});
```

Bad:

```ts
runTacticsAiThatMutatesTheBoardDirectly(board);
```

## Provider Safety

Examples may include mock providers and local endpoint shapes.

Browser examples must not ask users to paste provider secrets into frontend state unless the example is explicitly a local-only demo and the README explains the risk. Prefer backend-mediated provider execution for remote APIs.

Keep this separation:

```text
frontend
-> creates task and displays candidates

backend or local runtime
-> owns provider secrets and calls model APIs

host app
-> decides whether and how to apply operations
```

## Example Design Rules

Examples should be small, visual, and honest.

Good first examples:

- `tactics-grid`: fictional 6x6 level balancing demo.
- `kanban-quest`: task board suggestions.
- `city-sim`: simulation dashboard recommendations.

Avoid real military targeting, surveillance, weapon optimization, or operational decision tooling. Fictional game balancing and benign simulation planning are acceptable.

Each example should include:

- visible app state
- an `Analyze` or `Generate candidates` action
- a serialized task preview
- candidate cards
- `Apply` / `Ignore` controls
- a note that mock providers can be replaced

## README / Documentation Tone

Be clear and concrete.

Do not claim that Playable AI can magically support every app with no adapter work. Say that host apps can integrate by writing:

1. snapshot adapter
2. task definition
3. provider adapter or backend endpoint
4. operation mapper
5. review UI

## Development Rules

- Use TypeScript.
- Keep core APIs small and serializable.
- Prefer plain objects and discriminated unions over class-heavy APIs.
- Keep examples runnable with `pnpm`.
- Add tests once core helpers exist.
- Add documentation when adding a new public concept.
- Keep generated screenshots and assets small.

## Commit / Maintenance Guidance

This repository is public OSS. Commits should be small and meaningful.

Useful commit sequence:

1. docs: explain the concept
2. feat(core): add task and candidate types
3. feat(core): add task pack helpers
4. feat(example): add tactics grid demo
5. docs: add integration guide
6. ci: add typecheck workflow

Do not mix unrelated package scaffolding, examples, and docs rewrites in one commit when avoidable.

## What Not To Copy From Private Apps

Do not copy private product-specific prompts, private domain ontologies, paid workflow logic, customer data, API keys, unreleased assets, or private roadmap details into this repository.

Generic concepts are fine. Private product implementation is not.

