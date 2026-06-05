# Examples

Example apps show how Playable AI can be adapted to different domains.

Each example should live in its own folder:

```text
examples/<example-name>/
```

Examples should be isolated and runnable with `pnpm`.

All current examples use mock providers and validate candidates before applying operations to local app state.

Current examples:

- `tactics-grid`: fictional 6x6 game/editor balancing demo
- `kanban-quest`: task board suggestions
- `timeline-review`: event timeline review for continuity, pacing, and missing bridge candidates

Planned examples:

- `city-sim`: simulation dashboard recommendations

Example apps should not modify `packages/core` unless they expose a missing generic primitive.
