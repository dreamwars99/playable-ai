# Example Smoke Check Design

Playable AI examples should stay small, fast to run, and safe by default. The current CI already typechecks and builds each example through `pnpm check`. A smoke check should add confidence that the built demos can render and generate mock candidates without turning the repository into a heavy end-to-end test suite.

This is a design note for the first runnable smoke automation. It does not introduce a new test framework yet.

## Goals

- confirm each example renders its main screen
- confirm each example builds a visible task preview
- confirm each mock provider action creates reviewable candidates
- confirm generated candidates pass SDK-level validation before apply
- keep CI runtime small and provider-free

## Non-Goals

- no remote provider calls
- no provider keys or local secrets
- no screenshots on successful runs
- no broad visual regression testing
- no real domain correctness scoring

## Preferred Runner Shape

Use build output plus a lightweight browser runner.

```text
pnpm check
-> build examples
-> serve each built example
-> open one browser page
-> click the mock-provider action
-> assert candidate UI appears
```

Build output is more production-like than a dev server and reuses the work CI already performs. A dev server is useful while developing tests locally, but the default CI smoke should run against built assets or `vite preview` so it catches bundling and runtime issues together.

A browser runner is the right layer for the first real smoke because the important behavior is interactive: render the app, click the mock-provider button, and observe candidate cards. Node-only tests can cover package helpers, but they cannot prove that the example UI is wired correctly.

## CI Budget

Keep the smoke job separate from the existing Node 22/24 package matrix:

- run on Node 24 only
- run one browser engine, preferably Chromium
- run examples serially to avoid flaky port conflicts
- avoid screenshots and traces unless a check fails
- fail fast when an example does not render or generate candidates
- target under two minutes after dependencies are installed

If a browser framework is added later, document the dependency and keep it scoped to example smoke checks.

## Per-Example Checks

| Example | Render check | Task check | Candidate check | Apply check |
| --- | --- | --- | --- | --- |
| `examples/tactics-grid` | `Tactics Grid Balancer` heading and `Tactics grid` surface are visible. | Task JSON includes `tactics.balance-level` and allowed operations. | Click `Analyze level`; at least one candidate card appears with `Validation passed before apply.` | Click the first enabled `Apply`; the pending candidate count decreases or the candidate disappears. |
| `examples/kanban-quest` | `Kanban Quest Board` heading and `Todo` / `Doing` / `Done` columns are visible. | Task JSON includes `kanban.quest-review` and allowed operations. | Click `Find next actions`; at least one candidate appears with `Validation passed before apply.` | Click the first enabled `Apply`; the board still renders and the candidate leaves pending review. |
| `examples/timeline-review` | `Timeline Review` heading and `Event timeline` surface are visible. | Task JSON includes `timeline.review-continuity` and allowed operations. | Click `Review timeline`; at least one candidate appears with `Validation passed before apply.` | Click the first enabled `Apply`; the timeline still renders and the candidate leaves pending review. |

Prefer accessible selectors from visible headings, labels, and button names. Add stable test ids only when accessible selectors become too brittle.

## Proposed Script

When implementation is ready, add a root script such as:

```json
{
  "scripts": {
    "smoke:examples": "node scripts/smoke-examples.mjs"
  }
}
```

The script can discover examples from a small manifest:

```ts
const examples = [
  {
    name: "tactics-grid",
    path: "examples/tactics-grid",
    heading: "Tactics Grid Balancer",
    action: "Analyze level",
    taskId: "tactics.balance-level"
  }
];
```

The first implementation should keep the manifest explicit. That makes failures easier to read and avoids guessing how every future example should behave.

## Maintenance Rule

When a new runnable example is added, maintainers should update this smoke design or the eventual smoke manifest in the same change. A runnable example should show:

- visible state
- task preview
- mock or safe provider action
- candidate review UI
- validation status before apply
- apply or ignore controls

That keeps examples useful as real integration references, not only screenshots or static demos.
