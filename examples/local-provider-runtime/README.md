# Local Provider Runtime

This example shows a small backend or user-controlled local runtime route for Playable AI.

It is not a browser app. It demonstrates the safe provider boundary:

```text
frontend
-> sends a Playable AI task to a trusted local route

local runtime
-> reads endpoint/model/key from runtime config
-> calls an OpenAI-compatible endpoint
-> parses model output into candidates
-> runs SDK candidate validation
-> returns accepted and rejected candidate results

host app
-> reviews candidates
-> runs host-owned payload validation
-> applies accepted operations through app-owned commands
```

## Run The Tests

```bash
pnpm --filter @playable-ai/example-local-provider-runtime test
```

The tests use an injected mock fetch. They do not call a real provider and do not require API keys.

## Runtime Configuration

For a real local endpoint, load configuration in the runtime process:

```bash
PLAYABLE_AI_LOCAL_ENDPOINT=http://127.0.0.1:1234/v1/chat/completions
PLAYABLE_AI_LOCAL_MODEL=local-model
PLAYABLE_AI_LOCAL_API_KEY=optional-local-token
```

Do not put remote provider keys in browser state, static frontend builds, screenshots, fixtures, or logs.

## Files

- [`src/index.ts`](./src/index.ts): reference route helper.
- [`test/reference-route.test.ts`](./test/reference-route.test.ts): mock-provider tests.
