import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  acceptCandidate,
  applyCandidateOperations,
  createCandidate,
  createEmptyQueue,
  createMockProvider,
  createTaskFromPack,
  enqueueCandidates,
  ignoreCandidate,
  type PlayableCandidate,
  type PlayableOperation,
  type PlayableTaskPack
} from "playable-ai";
import "./styles.css";

type ColumnId = "todo" | "doing" | "done";

type KanbanCard = {
  id: string;
  title: string;
  column: ColumnId;
  priority: "low" | "medium" | "high";
};

type KanbanState = {
  cards: KanbanCard[];
};

type CardMoveOperation = PlayableOperation<{ column: ColumnId }> & {
  type: "card.move";
};

type CardCreateOperation = PlayableOperation<{
  title: string;
  column: ColumnId;
  priority: KanbanCard["priority"];
}> & {
  type: "card.create";
};

type KanbanOperation = CardMoveOperation | CardCreateOperation;

const columns: Array<{ id: ColumnId; label: string }> = [
  { id: "todo", label: "Todo" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" }
];

const initialState: KanbanState = {
  cards: [
    { id: "card-1", title: "Define task pack API", column: "doing", priority: "high" },
    { id: "card-2", title: "Write tactics-grid README", column: "todo", priority: "medium" },
    { id: "card-3", title: "Sketch provider safety docs", column: "todo", priority: "high" },
    { id: "card-4", title: "Create first license file", column: "done", priority: "low" }
  ]
};

const kanbanTaskPack: PlayableTaskPack<KanbanState> = {
  id: "kanban.quest-review",
  title: "Find blockers and next actions",
  allowedOperations: ["card.move", "card.create"],
  constraints: ["Do not move done cards.", "Do not delete cards.", "Return reviewable candidates only."],
  buildSnapshot: (state) => ({
    columns,
    cards: state.cards
  }),
  buildInstructions: () => "Find a safe next action for this board. Return candidates, not direct writes."
};

const mockProvider = createMockProvider({
  id: "mock-kanban-quest",
  generate: (task) => [
    createCandidate<KanbanOperation>({
      id: "move-provider-docs",
      taskId: task.id,
      title: "Move provider safety docs into active work",
      summary: "Provider safety is a release blocker for AI integrations, so it should move into Doing.",
      status: "suggested",
      confidence: 0.88,
      applyPolicy: "review_required",
      evidence: [
        {
          sourceId: "card-3",
          label: "Sketch provider safety docs",
          reason: "Remote provider examples need safety guidance before release."
        }
      ],
      operations: [
        {
          type: "card.move",
          targetId: "card-3",
          payload: { column: "doing" }
        }
      ]
    }),
    createCandidate<KanbanOperation>({
      id: "add-ci-card",
      taskId: task.id,
      title: "Add a CI workflow card",
      summary: "The board has code and docs work, but no visible automation task.",
      status: "suggested",
      confidence: 0.73,
      applyPolicy: "review_required",
      operations: [
        {
          type: "card.create",
          payload: {
            title: "Add GitHub Actions typecheck workflow",
            column: "todo",
            priority: "medium"
          }
        }
      ]
    })
  ]
});

function App() {
  const [state, setState] = useState<KanbanState>(initialState);
  const [queue, setQueue] = useState(createEmptyQueue<KanbanOperation>());

  const task = useMemo(
    () =>
      createTaskFromPack(kanbanTaskPack, state, {
        app: "kanban-quest-example",
        surface: "board",
        entityId: "oss-launch"
      }),
    [state]
  );

  const runAnalysis = async () => {
    const result = await mockProvider.run({ task });
    setQueue((current) => enqueueCandidates(current, result.candidates));
  };

  const applyCandidate = (candidate: PlayableCandidate<KanbanOperation>) => {
    setState((current) => applyCandidateOperations(current, candidate, applyKanbanOperation));
    setQueue((current) => acceptCandidate(current, candidate.id));
  };

  const ignore = (candidateId: string) => {
    setQueue((current) => ignoreCandidate(current, candidateId));
  };

  return (
    <main className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">Playable AI example</p>
          <h1>Kanban Quest Board</h1>
          <p>Stateful app data becomes a task. Model output becomes candidates. Humans decide what lands.</p>
        </div>
        <button type="button" onClick={runAnalysis}>
          Find next actions
        </button>
      </header>

      <section className="layout">
        <div className="board">
          {columns.map((column) => (
            <section className="column" key={column.id}>
              <h2>{column.label}</h2>
              {state.cards
                .filter((card) => card.column === column.id)
                .map((card) => (
                  <article className={`card priority-${card.priority}`} key={card.id}>
                    <span>{card.priority}</span>
                    <p>{card.title}</p>
                  </article>
                ))}
            </section>
          ))}
        </div>

        <aside className="panel">
          <h2>Task JSON</h2>
          <pre>{JSON.stringify(task, null, 2)}</pre>
        </aside>

        <aside className="panel">
          <h2>Candidates</h2>
          {queue.pending.length === 0 ? (
            <p className="empty">Generate candidates to review board changes.</p>
          ) : (
            <div className="candidate-list">
              {queue.pending.map((candidate) => (
                <article className="candidate" key={candidate.id}>
                  <span>{Math.round((candidate.confidence ?? 0) * 100)}%</span>
                  <h3>{candidate.title}</h3>
                  <p>{candidate.summary}</p>
                  <code>{candidate.operations.map((operation) => operation.type).join(", ")}</code>
                  <div>
                    <button type="button" onClick={() => applyCandidate(candidate)}>
                      Apply
                    </button>
                    <button type="button" className="secondary" onClick={() => ignore(candidate.id)}>
                      Ignore
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function applyKanbanOperation(state: KanbanState, operation: KanbanOperation): KanbanState {
  if (operation.type === "card.move") {
    return {
      ...state,
      cards: state.cards.map((card) =>
        card.id === operation.targetId ? { ...card, column: String(operation.payload.column) as ColumnId } : card
      )
    };
  }

  if (operation.type === "card.create") {
    return {
      ...state,
      cards: [
        ...state.cards,
        {
          id: `card-${state.cards.length + 1}`,
          title: String(operation.payload.title),
          column: String(operation.payload.column) as ColumnId,
          priority: String(operation.payload.priority) as KanbanCard["priority"]
        }
      ]
    };
  }

  return state;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
