# Security Policy

Playable AI is a workflow layer for AI-assisted apps. It is not a provider gateway, auth system, sandbox, or secrets manager.

## Supported Versions

Playable AI is in early public development. Security fixes target the current `main` branch until the first published npm release.

## Reporting a Vulnerability

Please open a private security advisory on GitHub when possible. If that is not available, open an issue with a minimal description and avoid posting secrets, credentials, exploit payloads, or private user data.

Useful reports include:

- provider secrets exposed to browser bundles
- examples that imply direct AI writes to user-owned state
- unsafe default behavior around candidate application
- dependency or build issues that affect downstream apps
- documentation that could encourage unsafe integration patterns

## Security Boundaries

Playable AI expects host applications to own:

- authentication
- provider secrets
- network calls to remote model APIs
- user permissions
- persistence
- audit logs
- final application of candidate operations

The SDK helps structure tasks and reviewable candidates. Host apps must still validate model output, enforce authorization, and decide what can be applied.

## Provider Keys

Do not put provider API keys in frontend examples or client bundles. Use a backend, local service, or explicitly user-controlled runtime for sensitive provider calls.

See [`docs/provider-safety.md`](./docs/provider-safety.md) for BYOK, backend-mediated provider, local runtime, and self-hosted provider guidance.
