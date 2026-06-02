# Integration Guide

Playable AI is designed for apps that already have their own state, UI, backend, and persistence.

To integrate it, build five small pieces.

## 1. Snapshot Adapter

Turn your app state into a JSON-safe snapshot.

```ts
const buildSnapshot = (board: BoardState) => ({
  columns: board.columns,
  cards: board.cards.map((card) => ({
    id: card.id,
    title: card.title,
    column: card.column,
    priority: card.priority
  }))
});
```

## 2. Task Pack

Define what the AI is allowed to do.

```ts
const taskPack = {
  id: "kanban.quest-review",
  title: "Find blockers",
  allowedOperations: ["card.move", "card.create"],
  constraints: ["Do not delete cards.", "Do not move done cards."],
  buildSnapshot
};
```

## 3. Provider Adapter

Run the task through a mock provider, backend endpoint, local model, or remote provider.

Frontend-only examples should use mock providers. Remote provider keys should stay on a backend or user-controlled local runtime.

For backend or local runtime integrations, `@playable-ai/server` includes an OpenAI-compatible adapter:

```ts
import { createOpenAICompatibleProvider } from "@playable-ai/server";

const provider = createOpenAICompatibleProvider({
  id: "openai-compatible",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? "your-model"
});

const result = await provider.run({ task });
```

Use the same shape for local or self-hosted chat-completions-style endpoints by changing `endpoint` and `model`.

## 4. Operation Mapper

Map candidate operations to your app commands.

```ts
function applyOperation(state: BoardState, operation: PlayableOperation): BoardState {
  if (operation.type === "card.move") {
    return moveCard(state, operation.targetId, operation.payload);
  }

  return state;
}
```

## 5. Review UI

Show candidates before changing the app.

Recommended actions:

- Apply
- Ignore
- Edit
- Lock

The host app decides what these actions mean.

## Minimal Flow

```text
host state
-> snapshot adapter
-> task pack
-> provider adapter
-> candidates
-> review UI
-> host-owned operation mapper
```

Playable AI is useful because this flow works across apps without forcing them to share a UI framework, backend, database, or prompt stack.

For a step-by-step walkthrough of the full lifecycle, see [`integration-lifecycle.md`](./integration-lifecycle.md).
