# Provider Safety

Playable AI is provider-agnostic, but provider secrets need careful handling.

## Recommended Modes

### Mock Provider

Best for examples, tests, screenshots, and docs.

```text
browser -> mock provider -> candidates
```

No API key is needed.

### Backend-Mediated Provider

Best for SaaS apps.

```text
browser -> app backend -> AI provider -> app backend -> candidates
```

The backend owns auth, rate limits, provider keys, logging, and validation.

`@playable-ai/server` provides a small OpenAI-compatible adapter for this mode. It should run on the backend or inside a user-controlled local runtime, not in a public browser bundle.

### Local Runtime Provider

Best for local-first tools.

```text
browser or desktop app -> local model endpoint -> candidates
```

Use this for local sLLM, LM Studio, Ollama-like, or self-hosted endpoints.

## Rules

- Do not put remote provider keys in browser bundles.
- Do not store provider secrets in example code.
- Do not treat raw model text as trusted app state.
- Validate or normalize model output into candidates.
- Keep human review between candidates and app mutation.
- Let host apps decide what gets applied.

## Real-World Reference Integrations

It is valid to test Playable AI against real apps and real providers, as long as the results improve the open-source SDK.

Good credit usage:

- provider adapter compatibility testing
- structured-output validation
- reference task packs
- example app improvements
- docs, release notes, and maintainer automation

Avoid presenting provider credits as funding for a closed commercial app. The useful open-source loop is:

```text
real integration test
-> adapter or validation gap
-> SDK/docs/example improvement
-> release
```

## Why Candidates Matter

Candidates make AI output observable:

- users can inspect proposed operations
- maintainers can test candidate generation
- apps can reject unsafe operation types
- providers can be swapped without changing UI state ownership
