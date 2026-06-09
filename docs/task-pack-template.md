# Task Pack Template

Use this guide when you want to adapt Playable AI to your own app.

The template keeps the host app in charge. Playable AI helps you turn state into a task, receive candidates, validate those candidates, and map approved operations back into app-owned commands.

```text
host state
-> snapshot adapter
-> task pack
-> provider boundary
-> candidate validation
-> review UI
-> host-owned apply
```

## When To Use This

Start here if your app has state the AI needs to understand, such as:

- cards on a board
- events on a timeline
- cells, tiles, or entities in an editor
- records in a dashboard
- local-first documents that call a local runtime or backend provider

The template is not a full app. It is the copyable integration shape you adapt inside your app.

## The Five Pieces

### 1. Snapshot Adapter

Create a JSON-safe view of the smallest state the AI needs.

Good snapshots include stable ids and omit provider secrets, large private data, and unrelated app state.

### 2. Task Pack

Define what the AI is allowed to do.

Keep `allowedOperations` narrow. A task that reviews priorities should not be allowed to delete records unless that is truly part of the workflow.

### 3. Provider Boundary

Decide where model execution happens.

Safe defaults:

- public examples use mock providers
- SaaS apps call providers from a backend
- local-first apps call a user-controlled local runtime
- remote provider keys stay out of browser bundles

### 4. Candidate Validation

Run SDK-level validation before review or apply.

`validateCandidateForTask` checks the generic Playable AI contract: matching task ids, operation arrays, string operation types, string target ids, JSON object payloads, and allowed operation types.

### 5. Operation Mapper And Review UI

Show candidates to the user, then map approved operations to your own commands.

Playable AI does not own your database, UI, permissions, locks, or final state mutation.

## Copyable TypeScript Template

Replace the placeholder state, operations, and provider logic with your app's own types.

```ts
import {
  applyCandidateOperations,
  createCandidate,
  createMockProvider,
  createTaskFromPack,
  validateCandidateForTask,
  type PlayableCandidate,
  type PlayableOperation,
  type PlayableScope,
  type PlayableTaskPack
} from "playable-ai";

// 1. Host app state
type AppItem = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
};

type AppState = {
  items: AppItem[];
};

// 2. Operations the AI may propose
type MoveItemOperation = PlayableOperation<{ status: AppItem["status"] }> & {
  type: "item.move";
};

type UpdatePriorityOperation = PlayableOperation<{ priority: AppItem["priority"] }> & {
  type: "item.update-priority";
};

type AppOperation = MoveItemOperation | UpdatePriorityOperation;

// 3. Snapshot adapter
function buildSnapshot(state: AppState) {
  return {
    items: state.items.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      priority: item.priority
    }))
  };
}

// 4. Task pack
export const appReviewTaskPack: PlayableTaskPack<AppState, ReturnType<typeof buildSnapshot>> = {
  id: "app.review-items",
  title: "Review items",
  description: "Find small, reviewable improvements for the current item list.",
  allowedOperations: ["item.move", "item.update-priority"],
  constraints: [
    "Do not delete items.",
    "Only target ids that exist in the snapshot.",
    "Return candidates, not direct state mutations."
  ],
  buildSnapshot,
  buildInstructions: () =>
    "Review the item list and return short, structured candidates with small operations only."
};

// 5. Provider boundary
// Public examples should use mocks. Real remote providers should run on a backend
// or user-controlled local runtime, not in a public browser bundle.
export const mockProvider = createMockProvider<ReturnType<typeof buildSnapshot>, AppOperation>({
  id: "mock-app-reviewer",
  generate: (task) => [
    createCandidate<AppOperation>({
      taskId: task.id,
      status: "suggested",
      applyPolicy: "review_required",
      confidence: 0.8,
      title: "Move high-priority work into progress",
      summary: "The item is high priority and ready for active work.",
      operations: [
        {
          type: "item.move",
          targetId: "item-1",
          payload: {
            status: "doing"
          }
        }
      ],
      evidence: [
        {
          sourceId: "item-1",
          reason: "The item has high priority in the current snapshot."
        }
      ]
    })
  ]
});

// 6. Host-owned payload validation
function validateAppOperation(state: AppState, operation: AppOperation): string[] {
  const issues: string[] = [];
  const targetExists = operation.targetId ? state.items.some((item) => item.id === operation.targetId) : false;

  if (!targetExists) {
    issues.push(`Unknown target id: ${operation.targetId ?? "(missing)"}`);
  }

  if (operation.type === "item.move" && !["todo", "doing", "done"].includes(operation.payload.status)) {
    issues.push(`Invalid status: ${operation.payload.status}`);
  }

  if (
    operation.type === "item.update-priority" &&
    !["low", "medium", "high"].includes(operation.payload.priority)
  ) {
    issues.push(`Invalid priority: ${operation.payload.priority}`);
  }

  return issues;
}

// 7. Host-owned operation mapper
function applyAppOperation(state: AppState, operation: AppOperation): AppState {
  if (operation.type === "item.move") {
    return {
      ...state,
      items: state.items.map((item) =>
        item.id === operation.targetId ? { ...item, status: operation.payload.status } : item
      )
    };
  }

  if (operation.type === "item.update-priority") {
    return {
      ...state,
      items: state.items.map((item) =>
        item.id === operation.targetId ? { ...item, priority: operation.payload.priority } : item
      )
    };
  }

  return state;
}

// 8. Review/apply flow
export async function runReviewFlow(state: AppState, scope: PlayableScope): Promise<PlayableCandidate<AppOperation>[]> {
  const task = createTaskFromPack(appReviewTaskPack, state, scope);
  const result = await mockProvider.run({ task });

  return result.candidates.filter((candidate) => {
    const sdkValidation = validateCandidateForTask(task, candidate);

    if (!sdkValidation.valid) {
      return false;
    }

    return candidate.operations.every((operation) => validateAppOperation(state, operation).length === 0);
  });
}

export function applyReviewedCandidate(state: AppState, candidate: PlayableCandidate<AppOperation>): AppState {
  // Call this only after the user has reviewed and accepted the candidate.
  return applyCandidateOperations(state, candidate, applyAppOperation);
}
```

## Adapt It To Your App Shape

### Board Or Kanban App

- Snapshot: columns, cards, status, priority, blockers
- Operations: `card.move`, `card.update-priority`, `card.annotate`
- Host validation: target card exists, destination column exists, completed cards are locked

### Timeline Or Outline Editor

- Snapshot: events, order, act/phase, tension, notes
- Operations: `event.move`, `event.create`, `event.annotate`
- Host validation: order values are in range, locked events cannot move, created events have required fields

### Grid Or Game Editor

- Snapshot: grid size, tiles, entities, rules relevant to the current edit
- Operations: `tile.set-kind`, `entity.move`, `entity.annotate`
- Host validation: target coordinate is inside bounds, blocked cells cannot receive entities, suggestions stay fictional and non-operational

### Dashboard Or Review Tool

- Snapshot: visible records, metrics, thresholds, selected filters
- Operations: `record.flag`, `record.update-status`, `note.create`
- Host validation: user can edit the record, status transition is allowed, payload values fit the current schema

### Local-First App

- Snapshot: the local document slice needed for the current task
- Provider boundary: local runtime, desktop helper, or backend endpoint
- Host validation: document version matches, user still owns the lock, candidate applies to the current local state

## Safety Checklist

- Keep remote provider keys out of browser bundles.
- Treat model output as untrusted until parsed into candidates and validated.
- Use narrow `allowedOperations`.
- Include stable ids in snapshots so operations can target real app entities.
- Run `validateCandidateForTask` before review or apply.
- Add host-owned payload validation before applying operations.
- Show candidates to the user before changing state.
- Apply operations through app-owned commands, not direct model writes.

## Where To Go Next

- Concepts: [`concepts.md`](./concepts.md)
- Integration guide: [`integration.md`](./integration.md)
- Full lifecycle: [`integration-lifecycle.md`](./integration-lifecycle.md)
- Provider safety: [`provider-safety.md`](./provider-safety.md)
- API reference: [`api-reference.md`](./api-reference.md)
