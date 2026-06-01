# Codex for Open Source Application Notes

This document helps maintainers describe Playable AI accurately when applying to programs that support open-source maintenance.

It is not a guarantee of acceptance and should not be used to misrepresent project adoption. Keep application answers factual and update them as the repository grows.

## Repository

https://github.com/dreamwars99/playable-ai

## Maintainer Role

Primary maintainer.

## Short Project Description

Playable AI is an open-source TypeScript SDK for apps that want AI assistance without direct model writes to user-owned state. It turns app state into scoped tasks, routes those tasks through provider adapters, and returns structured candidates for human review.

## Why It Matters

Open-source apps are adding AI to editors, boards, games, maps, dashboards, simulations, and local-first tools. Many of them need the same safety pattern:

```text
snapshot -> task -> provider -> candidate -> human review -> app-owned apply
```

Playable AI makes that pattern reusable. It helps maintainers add AI workflows while keeping provider secrets out of browser bundles, making model output reviewable, and preserving host-app ownership of state changes.

## Current Evidence

- MIT-licensed public repository.
- Core TypeScript SDK with task, provider, candidate, queue, and apply primitives.
- Two runnable React examples.
- CI for typecheck, tests, and builds.
- Documentation for concepts, integration, provider safety, repository structure, AI-agent customization, and contribution boundaries.
- Issue templates and security policy for ongoing maintenance.

## Suggested 500-Character Answer

Playable AI is a TypeScript OSS SDK for AI-assisted interactive apps. It helps games, editors, boards, and local-first tools convert app state into scoped AI tasks, then return structured candidates for human review instead of direct model writes. The repo includes core primitives, provider contracts, safety docs, CI, and runnable examples.

## API Credits Usage

Use API credits to build and test provider adapters, structured-output validation, example task packs, maintainer automation, PR review, issue triage, release notes, and documentation checks for safe AI integration in open-source interactive apps.

