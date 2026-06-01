# Codex for Open Source Application Notes

This document helps maintainers describe Playable AI accurately when applying to programs that support open-source maintenance.

It is not a guarantee of acceptance and should not be used to misrepresent project adoption. Keep application answers factual and update them as the repository grows.

## Repository

https://github.com/dreamwars99/playable-ai

## Maintainer Role

Primary maintainer.

## Short Project Description

Playable AI is an open-source TypeScript SDK for apps that want AI assistance without direct model writes to user-owned state. It turns app state into scoped tasks, routes those tasks through provider adapters, and returns structured candidates for human review.

The project aims to define a small open protocol between users, apps, and AI systems: apps expose scoped snapshots, AI returns structured candidates, and users stay in control of what gets applied.

## Why It Matters

AI-assisted features are becoming a baseline expectation for many software products. Open-source apps are adding AI to editors, boards, games, maps, dashboards, simulations, and local-first tools. Many of them need the same safety pattern:

```text
snapshot -> task -> provider -> candidate -> human review -> app-owned apply
```

Playable AI makes that pattern reusable. It helps maintainers add AI workflows while keeping provider secrets out of browser bundles, making model output reviewable, and preserving host-app ownership of state changes.

## Current Evidence

- MIT-licensed public repository.
- Core TypeScript SDK with task, provider, candidate, queue, and apply primitives.
- React hooks and server-side provider helpers.
- Two runnable React examples.
- CI for typecheck, tests, and builds.
- Documentation for concepts, integration, provider safety, repository structure, AI-agent customization, and contribution boundaries.
- Issue templates and security policy for ongoing maintenance.
- Public roadmap issues and release checklist.

## Suggested 500-Character Answer

Playable AI is an early MIT-licensed SDK for a growing OSS need: safely adding AI to stateful apps. As AI features become common in editors, games, boards, and dashboards, apps need more than chat boxes. Playable AI defines a reusable user-app-AI protocol: scoped snapshots, provider adapters, structured candidates, and human-reviewed apply.

## API Credits Usage

Use API credits to build and test OpenAI-compatible provider adapters, structured-output validation, and real-world reference integrations based on the OSS SDK. Feed the results back into examples, docs, tests, release workflows, PR review, issue triage, and safer patterns for AI-assisted open-source apps.

## Anything Else

This is a new project without stars or downloads yet, but it targets a broad ecosystem problem: how open-source apps connect AI to user-owned state safely. The repo already has a core SDK, React helpers, server helpers, examples, CI, security docs, issue templates, roadmap issues, and an active release plan.
