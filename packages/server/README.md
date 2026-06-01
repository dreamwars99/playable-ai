# @playable-ai/server

Server-side provider helpers for Playable AI workflows.

This package is for backends, local runtimes, CLIs, desktop apps, and self-hosted services. It keeps provider execution away from browser bundles while preserving the Playable AI contract:

```text
task -> provider adapter -> structured candidates -> host-owned review/apply
```

## OpenAI-Compatible Provider

`createOpenAICompatibleProvider` calls a chat-completions-compatible endpoint and parses JSON candidates.

```ts
import { createOpenAICompatibleProvider } from "@playable-ai/server";

const provider = createOpenAICompatibleProvider({
  id: "openai-compatible",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? "your-model"
});

const result = await provider.run({ task });
```

For local or self-hosted endpoints, set `endpoint` to the local server URL and omit `apiKey` if the runtime does not require one.

## Expected Model Output

The model should return JSON with a `candidates` array:

```json
{
  "candidates": [
    {
      "title": "Move blocked card",
      "summary": "The card is ready for active work.",
      "confidence": 0.82,
      "operations": [
        {
          "type": "card.move",
          "targetId": "card-1",
          "payload": { "column": "doing" }
        }
      ]
    }
  ]
}
```

The adapter normalizes model output into Playable AI candidates. Host apps must still validate operation types, enforce user permissions, and decide what can be applied.
