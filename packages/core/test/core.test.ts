import test from "node:test";
import assert from "node:assert/strict";

import {
  acceptCandidate,
  applyCandidateOperations,
  assertAllowedOperations,
  createCandidate,
  createEmptyQueue,
  createTask,
  createTaskFromPack,
  enqueueCandidates,
  ignoreCandidate,
  type PlayableOperation
} from "../src/index.js";

test("creates a task with a timestamp", () => {
  const task = createTask({
    id: "board.review",
    scope: { app: "test", surface: "board" },
    snapshot: { cards: [] }
  });

  assert.equal(task.id, "board.review");
  assert.equal(typeof task.createdAt, "string");
});

test("builds a task from a task pack", () => {
  const task = createTaskFromPack(
    {
      id: "counter.review",
      title: "Review counter",
      allowedOperations: ["counter.increment"],
      buildSnapshot: (state: { value: number }) => ({ value: state.value }),
      buildInstructions: (snapshot) => `Review value ${snapshot.value}.`
    },
    { value: 3 },
    { app: "test", surface: "counter" }
  );

  assert.deepEqual(task.snapshot, { value: 3 });
  assert.equal(task.instructions, "Review value 3.");
});

test("queues, accepts, and ignores candidates", () => {
  const candidate = createCandidate({
    id: "candidate-a",
    taskId: "task-a",
    status: "suggested",
    operations: [],
    applyPolicy: "review_required"
  });

  const queued = enqueueCandidates(createEmptyQueue(), [candidate]);
  const accepted = acceptCandidate(queued, "candidate-a");
  const ignored = ignoreCandidate(queued, "candidate-a");

  assert.equal(queued.pending.length, 1);
  assert.equal(accepted.pending.length, 0);
  assert.equal(accepted.accepted.length, 1);
  assert.equal(ignored.ignored[0]?.status, "rejected");
});

test("applies candidate operations through a host-owned mapper", () => {
  type CounterOperation = PlayableOperation<{ amount: number }>;

  const candidate = createCandidate<CounterOperation>({
    taskId: "counter.review",
    status: "suggested",
    applyPolicy: "review_required",
    operations: [
      {
        type: "counter.increment",
        targetId: "counter",
        payload: { amount: 2 }
      }
    ]
  });

  const result = applyCandidateOperations({ value: 1 }, candidate, (state, operation) => {
    if (operation.type !== "counter.increment") {
      return state;
    }

    return { value: state.value + operation.payload.amount };
  });

  assert.equal(result.value, 3);
});

test("reports operations that are not allowed by the task", () => {
  const task = createTask({
    id: "board.review",
    scope: { app: "test", surface: "board" },
    snapshot: {},
    allowedOperations: ["card.create"]
  });

  const candidate = createCandidate({
    taskId: "board.review",
    status: "suggested",
    applyPolicy: "review_required",
    operations: [
      {
        type: "card.delete",
        payload: {}
      }
    ]
  });

  assert.deepEqual(assertAllowedOperations(task, candidate), ["card.delete"]);
});

