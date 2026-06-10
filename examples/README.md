# Examples

Example apps show how Playable AI can be adapted to different domains.

Each example should live in its own folder:

```text
examples/<example-name>/
```

Examples should be isolated and runnable with `pnpm`.

All current examples use mock providers and validate candidates before applying operations to local app state.

Choose the closest example for your app shape:

- board or workflow app: start with [`kanban-quest`](./kanban-quest)
- grid, game editor, or simulation surface: start with [`tactics-grid`](./tactics-grid)
- timeline, outline, or ordered review tool: start with [`timeline-review`](./timeline-review)

Current examples:

- `tactics-grid`: fictional 6x6 game/editor balancing demo
- `kanban-quest`: task board suggestions
- `timeline-review`: event timeline review for continuity, pacing, and missing bridge candidates

Planned examples:

- `city-sim`: simulation dashboard recommendations

Example apps should not modify `packages/core` unless they expose a missing generic primitive.
