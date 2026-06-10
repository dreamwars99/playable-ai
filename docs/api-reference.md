# API Reference

This is a draft reference for the current public API surface.

Playable AI is split into three packages:

- `playable-ai`: framework-neutral core primitives
- `@playable-ai/react`: optional React hooks
- `@playable-ai/server`: optional backend and local-runtime provider helpers

## Core Package

Import from `playable-ai`.

```ts
import {
  acceptCandidate,
  applyCandidateOperations,
  assertAllowedOperations,
  createCandidate,
  createEmptyQueue,
  createMockProvider,
  createTask,
  createTaskFromPack,
  enqueueCandidates,
  ignoreCandidate,
  validateCandidateForTask
} from "playable-ai";
```

### JSON Types

| Type | Purpose |
| --- | --- |
| `JsonPrimitive` | `string`, `number`, `boolean`, or `null`. |
| `JsonValue` | Any JSON-safe primitive, object, or array. |
| `JsonObject` | JSON-safe object used for snapshots, payloads, and metadata. |

Snapshots, operation payloads, and metadata should stay JSON-safe so tasks can cross frontend, backend, desktop, local-runtime, and provider boundaries.

### `PlayableScope`

Identifies where a task came from.

```ts
type PlayableScope = {
  app: string;
  surface: string;
  entityId?: string;
  feature?: string;
};
```

Use `app` for the host app or integration id, `surface` for the current product area, and `entityId` for the focused board, document, level, item, or selection.

### `PlayableTask`

A scoped request for AI or mock-provider work.

```ts
type PlayableTask<TSnapshot extends JsonObject = JsonObject> = {
  id: string;
  scope: PlayableScope;
  snapshot: TSnapshot;
  allowedOperations?: string[];
  constraints?: string[];
  instructions?: string;
  createdAt: string;
  metadata?: JsonObject;
};
```

### `createTask`

Creates a task and fills `createdAt` when omitted.

```ts
const task = createTask({
  id: "board.review",
  scope: { app: "demo", surface: "board", entityId: "sprint-42" },
  snapshot: { cards: [] },
  allowedOperations: ["card.move"],
  constraints: ["Do not delete cards."]
});
```

### `PlayableOperation`

A typed proposed change. Operations are commands for the host app to interpret, not mutations applied by the SDK.

```ts
type PlayableOperation<TPayload extends JsonObject = JsonObject> = {
  type: string;
  targetId?: string;
  payload: TPayload;
};
```

### `PlayableCandidate`

A provider or mock-provider suggestion.

```ts
type PlayableCandidate<TOperation extends PlayableOperation = PlayableOperation> = {
  id: string;
  taskId: string;
  status: "suggested" | "inferred" | "extracted" | "rejected" | "stale";
  operations: TOperation[];
  applyPolicy: "review_required" | "auto_if_safe" | "manual_only";
  confidence?: number;
  title?: string;
  summary?: string;
  evidence?: PlayableEvidence[];
  createdAt: string;
  metadata?: JsonObject;
};
```

### `createCandidate`

Creates a candidate and fills `id` and `createdAt` when omitted.

```ts
const candidate = createCandidate({
  taskId: task.id,
  status: "suggested",
  applyPolicy: "review_required",
  operations: [
    {
      type: "card.move",
      targetId: "card-1",
      payload: { column: "doing" }
    }
  ]
});
```

### `PlayableTaskPack`

A reusable task definition for one app feature.

```ts
type PlayableTaskPack<TState, TSnapshot extends JsonObject = JsonObject> = {
  id: string;
  title: string;
  description?: string;
  allowedOperations: string[];
  constraints?: string[];
  buildSnapshot: (state: TState) => TSnapshot;
  buildInstructions?: (snapshot: TSnapshot) => string;
};
```

### `createTaskFromPack`

Builds a task from a task pack, host state, and scope.

```ts
const task = createTaskFromPack(taskPack, boardState, {
  app: "demo",
  surface: "board"
});
```

### Provider Types

```ts
type PlayableProviderRequest<TSnapshot extends JsonObject = JsonObject> = {
  task: PlayableTask<TSnapshot>;
};

type PlayableProviderResult<TOperation extends PlayableOperation = PlayableOperation> = {
  candidates: PlayableCandidate<TOperation>[];
};

type PlayableProvider<
  TSnapshot extends JsonObject = JsonObject,
  TOperation extends PlayableOperation = PlayableOperation
> = {
  id: string;
  run: (request: PlayableProviderRequest<TSnapshot>) => Promise<PlayableProviderResult<TOperation>>;
};
```

### `createMockProvider`

Creates a deterministic provider for examples, tests, screenshots, and docs.

```ts
const provider = createMockProvider({
  id: "mock-board-review",
  generate: (task) => [
    createCandidate({
      taskId: task.id,
      status: "suggested",
      applyPolicy: "review_required",
      operations: []
    })
  ]
});
```

### Candidate Queue Helpers

| API | Purpose |
| --- | --- |
| `createEmptyQueue()` | Creates `{ pending: [], accepted: [], ignored: [] }`. |
| `enqueueCandidates(queue, candidates)` | Adds candidates to `pending`. |
| `acceptCandidate(queue, candidateId)` | Moves a pending candidate to `accepted`. |
| `ignoreCandidate(queue, candidateId)` | Moves a pending candidate to `ignored` with `status: "rejected"`. |

### `applyCandidateOperations`

Applies a candidate through a host-owned operation mapper.

```ts
const nextState = applyCandidateOperations(state, candidate, (currentState, operation) => {
  if (operation.type === "card.move") {
    return moveCard(currentState, operation.targetId, operation.payload);
  }

  return currentState;
});
```

The SDK does not validate domain permissions or business rules here. The host app should validate the candidate before calling its mapper.

### `assertAllowedOperations`

Returns operation types from a candidate that are not included in the task's `allowedOperations`.

```ts
const blockedTypes = assertAllowedOperations(task, candidate);

if (blockedTypes.length > 0) {
  // Reject or ask the provider to regenerate.
}
```

### `validateCandidateForTask`

Validates a candidate against a task before host-owned apply.

```ts
const result = validateCandidateForTask(task, candidate);

if (!result.valid) {
  console.warn(result.issues);
}
```

Validation issues use this shape:

```ts
type PlayableCandidateValidationIssue = {
  code:
    | "candidate_task_mismatch"
    | "candidate_operations_invalid"
    | "operation_type_invalid"
    | "operation_target_invalid"
    | "operation_payload_invalid"
    | "operation_not_allowed";
  message: string;
  operationIndex?: number;
  operationType?: string;
};
```

The helper checks:

- candidate `taskId` matches the task id
- `operations` is an array
- each operation has a string `type`
- optional `targetId` values are strings
- operation `payload` values are JSON objects
- operation types are included in `task.allowedOperations`, when an allow list exists

It does not replace host-app business rules. Apps should still enforce permissions, ownership, locks, quotas, and domain-specific validation before applying operations.

For a host-owned payload validation example, see [Integration Lifecycle: Candidate Validation](./integration-lifecycle.md#6-candidate-validation).

## React Package

Import from `@playable-ai/react`.

```tsx
import {
  useCandidateQueue,
  usePlayableProviderRunner,
  usePlayableTaskPack
} from "@playable-ai/react";
```

### `usePlayableTaskPack`

Memoizes `createTaskFromPack(pack, state, scope)`.

```tsx
const task = usePlayableTaskPack(taskPack, appState, {
  app: "demo",
  surface: "board",
  entityId: "sprint-42"
});
```

Pass a custom dependency list when the default `[pack, state, scope]` is not stable enough for your app.

### `useCandidateQueue`

Keeps a candidate queue in React state.

```tsx
const queue = useCandidateQueue();

queue.enqueue(candidates);
queue.accept(candidateId);
queue.ignore(candidateId);
queue.reset();
```

### `usePlayableProviderRunner`

Runs a provider adapter and exposes `isRunning` and `error`.

```tsx
const runner = usePlayableProviderRunner(provider, {
  onCandidates: queue.enqueue,
  onError: (error, task) => {
    console.error("Provider failed", task.id, error);
  }
});

await runner.run(task);
```

The hook does not call remote models by itself. It runs the provider object supplied by the host app.

## Server Package

Import from `@playable-ai/server`.

```ts
import {
  buildPlayableTaskPrompt,
  createOpenAICompatibleProvider,
  parseCandidateJson
} from "@playable-ai/server";
```

### `createOpenAICompatibleProvider`

Creates a provider adapter for chat-completions-compatible endpoints.

```ts
const provider = createOpenAICompatibleProvider({
  id: "openai-compatible",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? "your-model"
});

const result = await provider.run({ task });
```

Options:

| Option | Purpose |
| --- | --- |
| `id` | Provider id exposed through the adapter. |
| `endpoint` | Chat-completions-compatible endpoint URL. |
| `model` | Model name sent to the endpoint. |
| `apiKey` | Optional bearer token. Keep it out of browser bundles. |
| `temperature` | Optional sampling temperature. Defaults to `0.2`. |
| `headers` | Extra request headers. |
| `systemPrompt` | Optional replacement for the default system prompt. |
| `buildUserMessage` | Optional custom task-to-message function. |
| `parseResponse` | Optional custom parser for assistant message content. |
| `fetch` | Optional injected fetch for tests or custom runtimes. |

### `buildPlayableTaskPrompt`

Serializes a task and expected output shape into a JSON prompt string.

```ts
const prompt = buildPlayableTaskPrompt(task);
```

### `parseCandidateJson`

Parses model content into normalized candidates.

```ts
const candidates = parseCandidateJson(
  JSON.stringify({
    candidates: [
      {
        title: "Move blocked card",
        operations: [{ type: "card.move", targetId: "card-1", payload: { column: "doing" } }]
      }
    ]
  }),
  task
);
```

The parser accepts either a raw candidate array or an object with a `candidates` array.

## Stability Notes

The API is still early. Prefer small integrations and explicit operation mappers while the project hardens.

Stable design commitments:

- provider output is represented as candidates
- candidates do not mutate host state directly
- host apps own apply logic
- frontend examples do not contain remote provider secrets
- core stays framework-neutral
