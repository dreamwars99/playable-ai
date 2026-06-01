# Timeline Review Example Design

`timeline-review` is a planned example app that shows how Playable AI can support stateful creative planning tools without turning the model into the owner of the user's work.

The example is intentionally lightweight. It is not a full writing product, story engine, or domain-specific planning system. It is a small event timeline app that demonstrates how an application can expose structured state, ask for review, and receive human-approved candidates.

## What It Proves

This example should prove that Playable AI works beyond games and productivity boards.

It covers apps that manage ordered events, such as:

- narrative outlines
- game quest chains
- product roadmap milestones
- learning plans
- historical sequences
- campaign plans

The important pattern is the same in all of these domains:

```text
event timeline state
-> scoped review task
-> provider adapter or mock provider
-> structured candidates
-> human review
-> app-owned apply
```

## User Story

A user has a small timeline of events. They want help spotting continuity gaps, sudden pacing jumps, or missing bridge events.

The app should let the user:

- see the current event timeline
- generate a task JSON preview
- run a mock review provider
- inspect candidates
- apply or ignore each candidate

The app should not generate full prose or replace the user's creative decisions.

## State Shape

The example state should stay JSON-safe and easy to inspect:

```ts
type TimelineEvent = {
  id: string;
  title: string;
  act: "setup" | "development" | "climax" | "resolution";
  order: number;
  tension: number;
  note?: string;
};

type TimelineState = {
  events: TimelineEvent[];
};
```

## Allowed Operations

The example should allow only small, reviewable changes:

```text
event.move
event.create
event.annotate
```

Operation meanings:

- `event.move`: propose a new order for an existing event.
- `event.create`: propose a missing bridge event.
- `event.annotate`: add a short continuity, pacing, or motivation note to an existing event.

The example should not include operations that rewrite the whole timeline or generate long-form prose.

## Task Pack

The task pack should be named:

```text
timeline.review-continuity
```

Suggested constraints:

- Do not rewrite the user's full outline.
- Do not delete events.
- Return candidates, not direct state mutations.
- Keep suggestions short and reviewable.
- Prefer continuity, pacing, and missing-bridge feedback.

Suggested instructions:

```text
Review the event timeline for continuity, pacing, and missing bridge events.
Return structured candidates with small operations only.
```

## Mock Candidates

The first mock provider can return candidates like:

1. Move a setup clue earlier because a later reveal depends on it.
2. Add a bridge event before the climax because tension jumps too quickly.
3. Annotate an event with a motivation note because the user's timeline does not yet explain why the event happens.

These candidates should be deterministic and should not require an API key.

## UI Layout

The first version can use three columns:

1. timeline state
2. generated task JSON
3. review candidates

Recommended controls:

- `Review timeline`
- `Apply`
- `Ignore`

The example should visually show that applying a candidate changes app-owned state after review.

## Safety Boundary

The example should make the boundary visible:

- AI output is not canonical state.
- Candidates wait for review.
- The host app owns operation application.
- Provider calls can later be swapped from mock to server/local runtime.

## Acceptance Criteria

- Add `examples/timeline-review`.
- Use `playable-ai` core primitives.
- Use `@playable-ai/react` hooks where helpful.
- Include a mock provider.
- Include a README for the example.
- Add the example to the root README table.
- Add the example to `examples/README.md`.
- Keep the example generic and public-safe.
- Pass `corepack pnpm check`.
- Add a screenshot in a follow-up change.
