# Local Provider Integration Guide

Playable AI can work with local runtimes and OpenAI-compatible local endpoints without putting provider secrets in browser code.

The safe shape is:

```text
frontend app
-> builds task and shows review UI

backend or user-controlled local runtime
-> owns endpoint configuration
-> calls the local or self-hosted model
-> parses model output into candidates
-> returns structured candidates

host app
-> validates candidates
-> lets the user apply, ignore, edit, or lock
```

The frontend may know that a local runtime exists, but it should not own remote API keys or treat model output as trusted state.

## When To Use A Local Runtime

Use a local provider integration when:

- the user runs a local model endpoint
- a desktop app owns a local helper process
- a CLI or development server calls a provider on the user's machine
- a team runs a self-hosted OpenAI-compatible gateway
- the integration needs to work without committing to one vendor

Use mock providers for public examples and tests. Use a backend-mediated provider for hosted SaaS apps.

## Configuration Boundary

Endpoint configuration belongs in the backend or local runtime, not in a public browser bundle.

Good places for local provider configuration:

- environment variables for a local development server
- desktop app secret storage
- user-run CLI flags or config files
- backend secret storage
- self-hosted runtime configuration

Avoid these patterns:

- provider keys in browser local storage
- provider keys in static frontend builds
- provider keys committed to examples or fixtures
- endpoint secrets logged in task payloads, screenshots, or telemetry

A local endpoint may not require a key. If it does, the key should still stay in the local runtime or backend that performs the provider call.

## Minimal Local Runtime Flow

The browser creates a task with `playable-ai` and sends it to a trusted local or backend route:

```ts
async function runPlayableTask(task: unknown) {
  const response = await fetch("/api/playable/run-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task })
  });

  if (!response.ok) {
    throw new Error(`Provider route failed: ${response.status}`);
  }

  return response.json() as Promise<{ candidates: unknown[] }>;
}
```

That route can live in an app backend, desktop helper, local development server, or user-controlled runtime. It owns the provider endpoint configuration:

```ts
import { createOpenAICompatibleProvider } from "@playable-ai/server";
import { validateCandidateForTask, type PlayableTask } from "playable-ai";

const endpoint = process.env.PLAYABLE_AI_LOCAL_ENDPOINT;
const model = process.env.PLAYABLE_AI_LOCAL_MODEL;

if (!endpoint || !model) {
  throw new Error("Set PLAYABLE_AI_LOCAL_ENDPOINT and PLAYABLE_AI_LOCAL_MODEL in the local runtime.");
}

const provider = createOpenAICompatibleProvider({
  id: "local-openai-compatible",
  endpoint,
  model,
  apiKey: process.env.PLAYABLE_AI_LOCAL_API_KEY
});

export async function runLocalProvider(task: PlayableTask) {
  const result = await provider.run({ task });

  const checked = result.candidates.map((candidate) => ({
    candidate,
    validation: validateCandidateForTask(task, candidate)
  }));

  return {
    candidates: checked.filter((item) => item.validation.valid).map((item) => item.candidate),
    rejected: checked
      .filter((item) => !item.validation.valid)
      .map((item) => ({
        candidateId: item.candidate.id,
        issues: item.validation.issues
      }))
  };
}
```

This checks the generic SDK contract before returning candidates to the app. The host app should still run host-owned validation before apply, including target id existence, permissions, locks, enum/range checks, quotas, and payload-specific rules.

## Expected Provider Output

The OpenAI-compatible adapter expects assistant content that parses into either a candidate array or an object with a `candidates` array:

```json
{
  "candidates": [
    {
      "title": "Move blocked card",
      "summary": "The card is ready for active work.",
      "confidence": 0.82,
      "applyPolicy": "review_required",
      "operations": [
        {
          "type": "card.move",
          "targetId": "card-1",
          "payload": { "column": "doing" }
        }
      ]
    }
  ]
}
```

The adapter normalizes that output into Playable AI candidates. It does not make those candidates trusted app state.

## Frontend Responsibilities

Frontend code may:

- build the task from app state
- show the task preview
- call a trusted backend or local runtime
- display returned candidates
- let the user apply, ignore, edit, or lock candidates

Frontend code should not:

- store provider keys for remote services
- call remote provider APIs directly from a public bundle
- apply candidates without validation
- hide the review step from users

## Runtime Responsibilities

Backend or local runtime code should:

- load endpoint configuration from server-side or user-controlled settings
- call the local or self-hosted model endpoint
- request JSON candidate output
- parse provider output into candidates
- run `validateCandidateForTask`
- return structured candidates and validation failures
- avoid logging secrets or full sensitive snapshots by default

## Apply Responsibilities

Do not let the provider route mutate app state directly.

Use this apply-side order:

```text
candidate from provider
-> SDK validation
-> review UI
-> host payload validation
-> host-owned operation mapper
-> app state update
```

The host app remains the final authority. A local model can return malformed, stale, or unsafe operations just like a remote model can.

## Checklist

- [ ] Provider call runs in a backend or user-controlled local runtime.
- [ ] Endpoint URL, model name, and optional key live outside public browser code.
- [ ] Provider output is parsed into candidates.
- [ ] `validateCandidateForTask` runs before candidates are shown or applied.
- [ ] Host-owned validation runs before apply.
- [ ] Users can review, edit, ignore, or apply candidates.
- [ ] Logs avoid provider secrets and sensitive full snapshots.
