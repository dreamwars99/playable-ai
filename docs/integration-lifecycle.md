# Integration Lifecycle

Playable AI fits into apps that already have their own UI, state model, backend, database, and domain rules.

The SDK does not replace those systems. It gives the app a repeatable lifecycle for turning state into AI-readable work and turning AI output back into reviewable app commands.

```text
host state
-> snapshot adapter
-> task pack
-> provider boundary
-> candidate parser
-> candidate validation
-> review queue
-> host-owned apply
```

## 1. Host State Stays Owned By The App

Start with the state your app already owns.

That state may live in React state, Redux, Zustand, a server database, a local-first document, a game engine, a spreadsheet, a graph editor, or another system.

Playable AI should receive a small snapshot, not direct write access to the full state owner.

```ts
type BoardCard = {
  id: string;
  title: string;
  column: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  locked?: boolean;
};

type BoardState = {
  cards: BoardCard[];
};
```

## 2. Snapshot Adapter

A snapshot adapter turns host state into compact, JSON-safe context.

Good snapshots are:

- scoped to the current user task
- stable enough for tests
- small enough for provider calls
- free of provider secrets
- explicit about ids the app can later update

```ts
function buildBoardSnapshot(state: BoardState) {
  return {
    cards: state.cards.map((card) => ({
      id: card.id,
      title: card.title,
      column: card.column,
      priority: card.priority
    }))
  };
}
```

## 3. Task Pack

A task pack defines what the AI is being asked to do and which operation types are allowed.

```ts
import { createTaskFromPack, type PlayableTaskPack } from "playable-ai";

const boardReviewPack: PlayableTaskPack<BoardState> = {
  id: "board.review",
  title: "Review board priorities",
  allowedOperations: ["card.update-priority", "card.move"],
  constraints: [
    "Do not delete cards.",
    "Do not mark unfinished work as done.",
    "Only propose operations with existing card ids."
  ],
  buildSnapshot: buildBoardSnapshot,
  buildInstructions: () => "Find blocked or misprioritized cards and return reviewable operations."
};

const task = createTaskFromPack(boardReviewPack, boardState, {
  app: "example-board",
  surface: "kanban",
  entityId: "sprint-42"
});
```

The task is serializable, so it can cross the boundary between frontend, backend, desktop runtime, or local model process.

## 4. Provider Boundary

The provider boundary decides where model execution happens.

Common modes:

```text
mock example:
browser -> mock provider -> candidates

backend-mediated app:
browser -> app backend -> AI provider -> app backend -> candidates

local-first app:
desktop/browser -> local runtime -> local or self-hosted model -> candidates
```

The frontend can create or display tasks, but remote provider secrets should stay in a backend or user-controlled local runtime.

Provider adapters should return structured candidates, not raw text that directly mutates app state.

## 5. Candidate Parser

A candidate is a proposed answer to a task.

It should include:

- operation types
- target ids
- JSON-safe payloads
- confidence or rationale
- optional evidence
- an apply policy

```ts
import { createCandidate } from "playable-ai";

const candidate = createCandidate({
  taskId: task.id,
  status: "suggested",
  applyPolicy: "review_required",
  confidence: 0.84,
  title: "Move blocked API task earlier",
  summary: "The task is high priority and blocks two dependent cards.",
  operations: [
    {
      type: "card.move",
      targetId: "card-api",
      payload: {
        column: "doing"
      }
    }
  ],
  evidence: [
    {
      sourceId: "card-api",
      reason: "The card has high priority and is referenced by dependent work."
    }
  ]
});
```

## 6. Candidate Validation

Treat candidates as untrusted proposed commands until they pass SDK-level and host-app validation.

```ts
import { validateCandidateForTask } from "playable-ai";

const validation = validateCandidateForTask(task, candidate);

if (!validation.valid) {
  throw new Error(validation.issues.map((issue) => issue.message).join(" "));
}
```

`validateCandidateForTask` checks the generic SDK contract:

- candidate `taskId` matches the task
- candidate `operations` is an array
- each operation has a string `type`
- optional `targetId` values are strings
- operation `payload` values are JSON objects
- operation types are allowed by the task, when an allow list exists

Real apps should still validate domain rules before applying operations. For example, a board app should check whether a card exists, a user has permission, a lock is active, or a payload value is allowed by the current workspace.

SDK-level validation answers "does this candidate fit the Playable AI contract?" Host-owned validation answers "is this operation allowed in this app, for this user, right now?"

```ts
import { type PlayableOperation } from "playable-ai";

const allowedColumns = ["todo", "doing", "done"] as const satisfies readonly BoardCard["column"][];
const allowedPriorities = ["low", "medium", "high"] as const satisfies readonly BoardCard["priority"][];

function isBoardColumn(value: unknown): value is BoardCard["column"] {
  return typeof value === "string" && allowedColumns.includes(value as BoardCard["column"]);
}

function isBoardPriority(value: unknown): value is BoardCard["priority"] {
  return typeof value === "string" && allowedPriorities.includes(value as BoardCard["priority"]);
}

function validateBoardOperationForApply(
  state: BoardState,
  operation: PlayableOperation,
  user: { canEditBoard: boolean }
) {
  if (!user.canEditBoard) {
    throw new Error("User cannot edit this board.");
  }

  const card = state.cards.find((item) => item.id === operation.targetId);

  if (!card) {
    throw new Error(`Unknown card id: ${operation.targetId ?? "(missing)"}`);
  }

  if (card.locked) {
    throw new Error(`Card is locked: ${card.id}`);
  }

  if (operation.type === "card.move") {
    if (!isBoardColumn(operation.payload.column)) {
      throw new Error("Invalid destination column.");
    }

    return;
  }

  if (operation.type === "card.update-priority") {
    if (!isBoardPriority(operation.payload.priority)) {
      throw new Error("Invalid priority.");
    }

    return;
  }

  throw new Error(`Unsupported operation: ${operation.type}`);
}
```

Good host-owned validation usually checks:

- target ids exist in the current state
- enum values and numeric ranges are valid for the app
- the current user has permission to change the target
- the target is not locked, archived, stale, or owned by another workflow
- payload-specific rules still hold after any state changes since the task was created

Candidates remain untrusted until the host app accepts them. A provider, parser, mock fixture, or local model can produce a well-formed candidate that is still wrong for the current domain state.

## 7. Review Queue

Candidates should wait for user or maintainer review.

```ts
import { createEmptyQueue, enqueueCandidates } from "playable-ai";

const queue = enqueueCandidates(createEmptyQueue(), [candidate]);
```

A host UI can render candidates as cards, table rows, inspector panels, timeline markers, map annotations, or any other product-native surface.

Common actions:

- apply
- ignore
- edit
- lock
- rerun

## 8. Host-Owned Apply

Playable AI does not know how to mutate your app. The host app maps approved operations to its own commands.

```ts
import { applyCandidateOperations, type PlayableOperation } from "playable-ai";

function applyBoardOperation(state: BoardState, operation: PlayableOperation): BoardState {
  if (operation.type === "card.move") {
    return {
      ...state,
      cards: state.cards.map((card) =>
        card.id === operation.targetId
          ? { ...card, column: operation.payload.column as BoardCard["column"] }
          : card
      )
    };
  }

  return state;
}

const nextState = applyCandidateOperations(boardState, candidate, applyBoardOperation);
```

Run generic candidate validation and host-specific payload validation before applying operations. Treat candidate operations as untrusted proposed commands until the app accepts them.

## 9. What Changes Across Apps

Every app changes these pieces:

- snapshot adapter
- task pack
- provider adapter or backend endpoint
- candidate parser
- candidate validation policy
- operation mapper
- review UI

The lifecycle stays the same.

This is why the same SDK can support a board, game editor, timeline, map, graph, dashboard, notebook, or local-first creative tool without forcing those apps to share one frontend or backend architecture.

## Integration Checklist

- [ ] Identify the smallest useful state snapshot.
- [ ] Define allowed operation types.
- [ ] Write constraints that protect user-owned state.
- [ ] Decide where the provider call runs.
- [ ] Parse provider output into candidates.
- [ ] Validate candidates against the task before review or apply.
- [ ] Validate target ids, permissions, locks, ranges, enums, and payload-specific rules in the host app.
- [ ] Show candidates before applying anything.
- [ ] Map approved operations to host app commands.
- [ ] Test invalid operation types and rejected candidates.
