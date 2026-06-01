# @playable-ai/react

React hooks for Playable AI task and candidate workflows.

The package is intentionally thin. It does not call model providers directly from the browser, store secrets, or decide how candidates mutate host state. It only helps React apps wire the framework-neutral `playable-ai` primitives into UI state.

## Hooks

- `usePlayableTaskPack`: builds a task from a task pack, app state, and scope.
- `useCandidateQueue`: manages pending, accepted, and ignored candidates.
- `usePlayableProviderRunner`: runs a provider adapter and exposes loading/error state.

## Example

```tsx
import { useCandidateQueue, usePlayableProviderRunner, usePlayableTaskPack } from "@playable-ai/react";

const task = usePlayableTaskPack(taskPack, boardState, {
  app: "my-board",
  surface: "kanban",
  entityId: "sprint-12"
});

const queue = useCandidateQueue();
const providerRunner = usePlayableProviderRunner(provider, {
  onCandidates: queue.enqueue
});

return (
  <button type="button" onClick={() => providerRunner.run(task)}>
    Review board
  </button>
);
```

