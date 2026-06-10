# Provider Safety And BYOK

Playable AI is provider-agnostic, but provider secrets need careful handling.

The safest default is:

```text
frontend UI
-> task and candidate review

backend, local runtime, or test harness
-> provider execution
```

The SDK can describe tasks and candidates in the browser. Remote provider secrets should not live there.

## Recommended Modes

### Mock Provider

Best for examples, tests, screenshots, and docs.

```text
browser -> mock provider -> candidates
```

No API key is needed.

Use this mode for public examples, tests, screenshots, documentation, and contributor demos.

### Backend-Mediated Provider

Best for SaaS apps.

```text
browser -> app backend -> AI provider -> app backend -> candidates
```

The backend owns auth, rate limits, provider keys, logging, and validation.

`@playable-ai/server` provides a small OpenAI-compatible adapter for this mode. It should run on the backend or inside a user-controlled local runtime, not in a public browser bundle.

Recommended responsibilities:

- authenticate the user
- enforce rate limits and quotas
- keep provider keys in server-side secrets
- redact sensitive fields before provider calls
- validate candidate operation types
- validate host-owned payload rules before apply
- record useful audit metadata
- return only structured candidates to the frontend

### BYOK Provider

Best for tools where the user intentionally brings their own provider account.

```text
user-controlled runtime -> user's provider key -> candidates
```

BYOK can be safe when the user controls where the key is stored and executed. It is not the same as asking users to paste a key into a public frontend bundle.

Acceptable BYOK shapes:

- desktop app secret storage
- local development server environment variables
- user-run CLI or local runtime
- encrypted app-managed secret storage with clear user consent

Risky BYOK shapes:

- provider key stored in browser local storage
- provider key embedded in a static build
- provider key committed to examples or fixtures
- provider key logged in task payloads, screenshots, or telemetry

### Local Runtime Provider

Best for local-first tools.

```text
browser or desktop app -> local model endpoint -> candidates
```

Use this for local sLLM, LM Studio, Ollama-like, or self-hosted endpoints.

Local runtime integrations should still treat model output as untrusted. A local model can return invalid operations just like a remote model can.

For a local runtime walkthrough, see [`local-provider-guide.md`](./local-provider-guide.md).

### Self-Hosted Remote Provider

Best for teams that run their own model gateway.

```text
browser -> app backend -> self-hosted model gateway -> candidates
```

The app backend should still own auth, rate limits, logging policy, output validation, and user-facing apply decisions.

## Rules

- Do not put remote provider keys in browser bundles.
- Do not store provider secrets in example code.
- Do not ask users to paste remote API keys into public examples.
- Do not treat raw model text as trusted app state.
- Validate or normalize model output into candidates.
- Run `validateCandidateForTask` and host-owned payload validation before applying candidates.
- Keep human review between candidates and app mutation.
- Let host apps decide what gets applied.
- Prefer mock providers for examples unless the example is explicitly local-only.
- Document where provider execution happens.
- Document where secrets are stored.

## Minimum Provider Checklist

Before connecting a real provider, answer these questions:

- Where does the provider call run?
- Where is the provider key stored?
- Which fields are included in the task snapshot?
- Which operation types are allowed?
- What parser turns model output into candidates?
- What validation rejects malformed or disallowed operations?
- What host validation rejects unknown target ids, invalid payload values, missing permissions, or locked targets?
- What UI shows candidates before apply?
- What logs are kept, and do they avoid secrets?

## Frontend Boundary

Frontend code may:

- build scoped tasks
- show task previews
- call a trusted backend or local runtime
- display candidates
- let users apply, ignore, edit, or lock candidates

Frontend code should not:

- own remote provider secrets
- trust model output without parsing
- apply operations without host validation
- hide the fact that AI output is pending review

## Backend Or Local Runtime Boundary

Backend or local runtime code may:

- call OpenAI-compatible endpoints
- call local model endpoints
- inject provider headers
- parse JSON candidate output
- redact task snapshots
- enforce usage limits
- reject malformed candidates

This boundary should return structured candidates, not direct mutations.

For the apply-side validation pattern, see [Integration Lifecycle: Candidate Validation](./integration-lifecycle.md#6-candidate-validation).

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
