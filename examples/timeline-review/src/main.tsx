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

type TimelineAct = "setup" | "development" | "climax" | "resolution";

type TimelineEvent = {
  id: string;
  title: string;
  act: TimelineAct;
  order: number;
  tension: number;
  note?: string;
};

type TimelineState = {
  events: TimelineEvent[];
};

type EventMoveOperation = PlayableOperation<{ order: number }> & {
  type: "event.move";
};

type EventCreateOperation = PlayableOperation<{
  title: string;
  act: TimelineAct;
  order: number;
  tension: number;
  note?: string;
}> & {
  type: "event.create";
};

type EventAnnotateOperation = PlayableOperation<{ note: string }> & {
  type: "event.annotate";
};

type TimelineOperation = EventMoveOperation | EventCreateOperation | EventAnnotateOperation;

const initialState: TimelineState = {
  events: [
    {
      id: "event-1",
      title: "A courier loses the route map",
      act: "setup",
      order: 1,
      tension: 2,
      note: "The group starts with a clear destination but weak logistics."
    },
    {
      id: "event-2",
      title: "A sealed gate blocks the shortcut",
      act: "setup",
      order: 2,
      tension: 3
    },
    {
      id: "event-3",
      title: "A false ally redirects the group",
      act: "development",
      order: 3,
      tension: 5
    },
    {
      id: "event-4",
      title: "The signal tower goes dark",
      act: "climax",
      order: 4,
      tension: 9
    },
    {
      id: "event-5",
      title: "The route reopens at dawn",
      act: "resolution",
      order: 5,
      tension: 4
    }
  ]
};

const timelineScope = {
  app: "timeline-review-example",
  surface: "event-timeline",
  entityId: "outline-01"
};

const timelineTaskPack: PlayableTaskPack<TimelineState> = {
  id: "timeline.review-continuity",
  title: "Review event timeline",
  allowedOperations: ["event.move", "event.create", "event.annotate"],
  constraints: [
    "Do not rewrite the user's full outline.",
    "Do not delete events.",
    "Return candidates, not direct state mutations.",
    "Keep suggestions short and reviewable.",
    "Prefer continuity, pacing, and missing-bridge feedback."
  ],
  buildSnapshot: (state) => ({
    events: sortEvents(state.events)
  }),
  buildInstructions: () =>
    "Review the event timeline for continuity, pacing, and missing bridge events. Return structured candidates with small operations only."
};

const mockProvider = createMockProvider({
  id: "mock-timeline-reviewer",
  generate: (task) => [
    createCandidate<TimelineOperation>({
      id: "move-setup-clue",
      taskId: task.id,
      title: "Move the setup clue earlier",
      summary: "The blocked shortcut matters later, so the timeline reads cleaner if that clue appears first.",
      status: "suggested",
      confidence: 0.83,
      applyPolicy: "review_required",
      evidence: [
        {
          sourceId: "event-2",
          label: "A sealed gate blocks the shortcut",
          reason: "This event sets up the later route problem."
        }
      ],
      operations: [
        {
          type: "event.move",
          targetId: "event-2",
          payload: { order: 0 }
        }
      ]
    }),
    createCandidate<TimelineOperation>({
      id: "add-bridge-before-climax",
      taskId: task.id,
      title: "Add a bridge before the climax",
      summary: "The jump from misdirection to a dark signal tower is sharp. A bridge event can make the escalation easier to follow.",
      status: "suggested",
      confidence: 0.78,
      applyPolicy: "review_required",
      operations: [
        {
          type: "event.create",
          payload: {
            title: "The group finds a damaged relay marker",
            act: "development",
            order: 4,
            tension: 7,
            note: "Bridge event that connects the false ally to the tower failure."
          }
        }
      ]
    }),
    createCandidate<TimelineOperation>({
      id: "annotate-motivation",
      taskId: task.id,
      title: "Annotate the false ally's motive",
      summary: "The turn has useful tension, but a short motivation note would make later decisions easier to evaluate.",
      status: "suggested",
      confidence: 0.74,
      applyPolicy: "review_required",
      evidence: [
        {
          sourceId: "event-3",
          label: "A false ally redirects the group",
          reason: "The timeline shows the betrayal but not the reason behind it."
        }
      ],
      operations: [
        {
          type: "event.annotate",
          targetId: "event-3",
          payload: { note: "Clarify what the false ally gains by delaying the group." }
        }
      ]
    })
  ]
});

function App() {
  const [state, setState] = useState<TimelineState>(initialState);
  const queueController = useCandidateQueue<TimelineOperation>();

  const task = usePlayableTaskPack(timelineTaskPack, state, timelineScope, [state]);
  const providerRunner = usePlayableProviderRunner(mockProvider, {
    onCandidates: queueController.enqueue
  });

  const runReview = async () => {
    await providerRunner.run(task);
  };

  const applyCandidate = (candidate: PlayableCandidate<TimelineOperation>) => {
    setState((current) => applyCandidateOperations(current, candidate, applyTimelineOperation));
    queueController.accept(candidate.id);
  };

  const ignore = (candidateId: string) => {
    queueController.ignore(candidateId);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Playable AI example</p>
          <h1>Timeline Review</h1>
          <p>Ordered event state becomes a task. Model output becomes reviewable continuity candidates.</p>
        </div>
        <button type="button" disabled={providerRunner.isRunning} onClick={runReview}>
          {providerRunner.isRunning ? "Reviewing" : "Review timeline"}
        </button>
      </header>

      <section className="layout">
        <div className="timeline-panel">
          <h2>Timeline state</h2>
          <Timeline events={state.events} />
        </div>

        <aside className="panel">
          <h2>Task JSON</h2>
          <pre>{JSON.stringify(task, null, 2)}</pre>
        </aside>

        <aside className="panel">
          <h2>Candidates</h2>
          {providerRunner.error ? <p className="empty">Provider error: {providerRunner.error.message}</p> : null}
          {queueController.queue.pending.length === 0 ? (
            <p className="empty">Review the timeline to generate mock continuity candidates.</p>
          ) : (
            <div className="candidate-list">
              {queueController.queue.pending.map((candidate) => (
                <article className="candidate" key={candidate.id}>
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
        </aside>
      </section>
    </main>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="timeline" aria-label="Event timeline">
      {sortEvents(events).map((event) => (
        <li className={`event event-${event.act}`} key={event.id}>
          <div className="event-marker">
            <span>{event.order}</span>
          </div>
          <article>
            <div className="event-meta">
              <span>{event.act}</span>
              <span>Tension {event.tension}</span>
            </div>
            <h3>{event.title}</h3>
            {event.note ? <p>{event.note}</p> : <p className="muted">No note yet.</p>}
          </article>
        </li>
      ))}
    </ol>
  );
}

function applyTimelineOperation(state: TimelineState, operation: TimelineOperation): TimelineState {
  if (operation.type === "event.move" && operation.targetId) {
    return normalizeTimeline({
      ...state,
      events: state.events.map((event) =>
        event.id === operation.targetId ? { ...event, order: Number(operation.payload.order) } : event
      )
    });
  }

  if (operation.type === "event.create") {
    return normalizeTimeline({
      ...state,
      events: [
        ...state.events,
        {
          id: `event-${state.events.length + 1}`,
          title: String(operation.payload.title),
          act: operation.payload.act,
          order: Number(operation.payload.order),
          tension: Number(operation.payload.tension),
          note: operation.payload.note ? String(operation.payload.note) : undefined
        }
      ]
    });
  }

  if (operation.type === "event.annotate" && operation.targetId) {
    return {
      ...state,
      events: state.events.map((event) =>
        event.id === operation.targetId ? { ...event, note: String(operation.payload.note) } : event
      )
    };
  }

  return state;
}

function normalizeTimeline(state: TimelineState): TimelineState {
  return {
    ...state,
    events: sortEvents(state.events).map((event, index) => ({
      ...event,
      order: index + 1
    }))
  };
}

function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
