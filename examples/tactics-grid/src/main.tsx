import { useCandidateQueue, usePlayableProviderRunner, usePlayableTaskPack } from "@playable-ai/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  applyCandidateOperations,
  createCandidate,
  createMockProvider,
  type PlayableCandidate,
  type PlayableOperation,
  type PlayableTaskPack
} from "playable-ai";
import "./styles.css";

type TileKind = "plain" | "cover" | "wall" | "objective";
type UnitTeam = "player" | "enemy";

type GridTile = {
  id: string;
  x: number;
  y: number;
  kind: TileKind;
};

type GridUnit = {
  id: string;
  label: string;
  team: UnitTeam;
  x: number;
  y: number;
};

type TacticsState = {
  tiles: GridTile[];
  units: GridUnit[];
};

type UnitMoveOperation = PlayableOperation<{ x: number; y: number }> & {
  type: "unit.move";
};

type TileKindOperation = PlayableOperation<{ kind: TileKind }> & {
  type: "tile.set-kind";
};

type TacticsOperation = UnitMoveOperation | TileKindOperation;

const initialState: TacticsState = {
  tiles: createTiles(),
  units: [
    { id: "blue-1", label: "A", team: "player", x: 0, y: 4 },
    { id: "blue-2", label: "B", team: "player", x: 1, y: 5 },
    { id: "red-1", label: "S", team: "enemy", x: 0, y: 1 },
    { id: "red-2", label: "R", team: "enemy", x: 5, y: 1 },
    { id: "red-3", label: "G", team: "enemy", x: 4, y: 4 }
  ]
};

const tacticsScope = {
  app: "tactics-grid-example",
  surface: "level-editor",
  entityId: "training-level-01"
};

const tacticsTaskPack: PlayableTaskPack<TacticsState> = {
  id: "tactics.balance-level",
  title: "Balance tactics level",
  description: "Review a fictional level and suggest safe, human-reviewed balancing changes.",
  allowedOperations: ["unit.move", "tile.set-kind"],
  constraints: [
    "Do not remove player units.",
    "Do not create real-world tactical guidance.",
    "Return candidates for a fictional game editor only."
  ],
  buildSnapshot: (state) => ({
    grid: { width: 6, height: 6 },
    tiles: state.tiles,
    units: state.units
  }),
  buildInstructions: () =>
    "Suggest fictional level-balancing edits. Return reviewable operations, not direct state mutations."
};

const mockProvider = createMockProvider({
  id: "mock-tactics-balancer",
  generate: (task) => [
    createCandidate<TacticsOperation>({
      id: "cover-near-spawn",
      taskId: task.id,
      title: "Add cover near the player start",
      summary: "The player start is exposed. Add cover to create a fair first decision.",
      status: "suggested",
      confidence: 0.86,
      applyPolicy: "review_required",
      evidence: [
        {
          sourceId: "blue-1",
          label: "Player unit A",
          reason: "The player unit starts with no adjacent defensive tile."
        }
      ],
      operations: [
        {
          type: "tile.set-kind",
          targetId: "tile-1-4",
          payload: { kind: "cover" }
        }
      ]
    }),
    createCandidate<TacticsOperation>({
      id: "move-sniper",
      taskId: task.id,
      title: "Move the enemy scout away from the spawn lane",
      summary: "The enemy scout has an early line on the player start. Shift it deeper into the map.",
      status: "suggested",
      confidence: 0.79,
      applyPolicy: "review_required",
      evidence: [
        {
          sourceId: "red-1",
          label: "Enemy scout",
          reason: "The scout is too close to the player approach lane."
        }
      ],
      operations: [
        {
          type: "unit.move",
          targetId: "red-1",
          payload: { x: 2, y: 1 }
        }
      ]
    })
  ]
});

function App() {
  const [state, setState] = useState<TacticsState>(initialState);
  const queueController = useCandidateQueue<TacticsOperation>();

  const task = usePlayableTaskPack(tacticsTaskPack, state, tacticsScope, [state]);
  const providerRunner = usePlayableProviderRunner(mockProvider, {
    onCandidates: queueController.enqueue
  });

  const runAnalysis = async () => {
    await providerRunner.run(task);
  };

  const applyCandidate = (candidate: PlayableCandidate<TacticsOperation>) => {
    setState((current) => applyCandidateOperations(current, candidate, applyTacticsOperation));
    queueController.accept(candidate.id);
  };

  const ignore = (candidateId: string) => {
    queueController.ignore(candidateId);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Playable AI example</p>
          <h1>Tactics Grid Balancer</h1>
          <p>
            A fictional level editor that turns visible game state into an AI-readable task and returns
            reviewable candidates.
          </p>
        </div>
        <button type="button" disabled={providerRunner.isRunning} onClick={runAnalysis}>
          {providerRunner.isRunning ? "Analyzing" : "Analyze level"}
        </button>
      </section>

      <section className="workspace">
        <div className="board-panel">
          <h2>Level state</h2>
          <Grid state={state} />
          <p className="note">AI suggestions do not change the board until you apply a candidate.</p>
        </div>

        <div className="side-panel">
          <h2>Generated task</h2>
          <pre>{JSON.stringify(task, null, 2)}</pre>
        </div>

        <div className="side-panel">
          <h2>Review candidates</h2>
          {providerRunner.error ? <p className="empty">Provider error: {providerRunner.error.message}</p> : null}
          {queueController.queue.pending.length === 0 ? (
            <p className="empty">Run analysis to generate mock candidates.</p>
          ) : (
            <div className="candidate-list">
              {queueController.queue.pending.map((candidate) => (
                <article className="candidate-card" key={candidate.id}>
                  <span>{Math.round((candidate.confidence ?? 0) * 100)}% confidence</span>
                  <h3>{candidate.title}</h3>
                  <p>{candidate.summary}</p>
                  <code>{candidate.operations.map((operation) => operation.type).join(", ")}</code>
                  <div className="candidate-actions">
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
        </div>
      </section>
    </main>
  );
}

function Grid({ state }: { state: TacticsState }) {
  return (
    <div className="grid" aria-label="Tactics grid">
      {state.tiles.map((tile) => {
        const unit = state.units.find((item) => item.x === tile.x && item.y === tile.y);

        return (
          <div className={`tile is-${tile.kind}`} key={tile.id}>
            {unit ? <span className={`unit is-${unit.team}`}>{unit.label}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function createTiles(): GridTile[] {
  const specialTiles = new Map<string, TileKind>([
    ["2,2", "wall"],
    ["3,2", "wall"],
    ["4,1", "cover"],
    ["3,4", "cover"],
    ["5,5", "objective"]
  ]);

  return Array.from({ length: 36 }, (_, index) => {
    const x = index % 6;
    const y = Math.floor(index / 6);
    const key = `${x},${y}`;

    return {
      id: `tile-${x}-${y}`,
      x,
      y,
      kind: specialTiles.get(key) ?? "plain"
    };
  });
}

function applyTacticsOperation(state: TacticsState, operation: TacticsOperation): TacticsState {
  if (operation.type === "unit.move") {
    return {
      ...state,
      units: state.units.map((unit) =>
        unit.id === operation.targetId ? { ...unit, x: Number(operation.payload.x), y: Number(operation.payload.y) } : unit
      )
    };
  }

  if (operation.type === "tile.set-kind") {
    return {
      ...state,
      tiles: state.tiles.map((tile) =>
        tile.id === operation.targetId ? { ...tile, kind: String(operation.payload.kind) as TileKind } : tile
      )
    };
  }

  return state;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
