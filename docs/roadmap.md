# Roadmap

Playable AI is an early public SDK. The goal is to keep the project small, generic, and useful for apps that want AI assistance without giving model output direct write access to user-owned state.

This roadmap is intentionally practical. It focuses on the reusable protocol:

```text
snapshot -> task -> provider -> candidate -> validation -> review -> app-owned apply
```

## Current Baseline

The `v0.2.1` source release includes:

- framework-neutral core primitives for tasks, candidates, operations, queues, mock providers, and candidate validation
- optional React hooks for task packs, provider runners, and candidate queues
- optional server helpers for OpenAI-compatible or local chat-completions-style providers
- three runnable React examples
- a copyable task pack template
- host-owned payload validation guidance
- local provider integration guidance
- provider safety documentation
- integration lifecycle documentation
- CI for Node 22, Node 24, package dry-runs, and example browser smoke checks

## Near-Term Priorities

### 1. Task Pack Templates

Add copyable task-pack templates for common app shapes:

- board or kanban apps
- timeline or outline editors
- grid or simulation editors
- local-first tools that use a backend or local runtime for provider execution

The goal is to help maintainers adapt Playable AI without guessing where snapshots, allowed operations, validation, and apply mapping should live.

The first generic template is available in [`task-pack-template.md`](./task-pack-template.md). Future templates can split into app-specific variants when the examples need more depth.

### 2. Host Payload Validation Patterns

`validateCandidateForTask` checks the generic SDK contract. Host apps still need domain validation.

Near-term work should document and test patterns for:

- target id existence checks
- enum and range checks
- permission and lock checks
- payload validators that run before app-owned apply

### 3. Provider Integration Examples

Keep public examples safe by default, but add reference docs for:

- mock providers
- backend-mediated OpenAI-compatible providers
- local model endpoints
- user-controlled local runtimes

Remote provider keys should not be stored in browser examples.

The local runtime boundary is documented in [`local-provider-guide.md`](./local-provider-guide.md).

### 4. Example Smoke Automation

The examples build in CI and now have a lightweight smoke check that confirms each example can render its main screen, generate reviewable mock candidates, and apply one validated candidate.

The smoke check is documented in [`example-smoke-checks.md`](./example-smoke-checks.md). It should stay small, run against built example output, and avoid remote provider calls.

### 5. Contributor-Friendly Issues

Open small, well-scoped issues for docs, examples, validation patterns, and provider adapter tests. Contributors should be able to improve examples without touching core package internals.

## Tracked Near-Term Issues

The first contributor-ready backlog is intentionally small and maps to the priorities above:

- Task pack templates: [#24](https://github.com/dreamwars99/playable-ai/issues/24)
- Host payload validation patterns: [#21](https://github.com/dreamwars99/playable-ai/issues/21)
- Local provider integration guide: [#25](https://github.com/dreamwars99/playable-ai/issues/25)
- Local provider deployment shapes: [#29](https://github.com/dreamwars99/playable-ai/issues/29)
- Example smoke check design: [#23](https://github.com/dreamwars99/playable-ai/issues/23)
- Choose-your-app-shape quickstart: [#22](https://github.com/dreamwars99/playable-ai/issues/22)

These issues are meant to be small enough for focused contributions while still improving the SDK's public integration story.

## Longer-Term Ideas

- package publishing checklist for the first npm release
- optional helper for typed operation payload validators
- additional example app showing graph, map, or dashboard state
- redaction helpers for task snapshots
- richer docs for AI coding agents adapting the SDK to a host app

## Non-Goals

Playable AI should not become:

- a chatbot wrapper
- a prompt marketplace
- a host app database
- a UI framework
- a provider-key storage layer
- a system where AI output directly mutates user state

The SDK should stay replaceable, provider-agnostic, and easy for maintainers to audit.
