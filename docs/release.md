# Release Workflow

Playable AI is in early public development. Releases should be simple, traceable, and honest about what changed.

## Versioning

Before the first stable release, use small `0.x.y` releases.

Suggested interpretation:

- patch: docs, tests, CI, small bug fixes
- minor: new public helpers, examples, provider adapters, or integration patterns
- major: reserved for the future stable API

## Release Checklist

Before cutting a release:

- [ ] Review open issues for release blockers.
- [ ] Run `pnpm check`.
- [ ] Run `git diff --check`.
- [ ] Confirm GitHub Actions is green on `main`.
- [ ] Update `CHANGELOG.md`.
- [ ] Confirm docs match the current public API.
- [ ] Confirm examples still use mock or safe provider boundaries.
- [ ] Create an annotated tag.
- [ ] Publish GitHub release notes.

## Changelog Format

Use `CHANGELOG.md` for user-visible changes.

Keep entries direct:

```md
## 0.1.1 - 2026-06-02

- Add integration lifecycle documentation.
- Add API reference draft.
- Expand provider safety and BYOK guidance.
- Update CI to run on Node 24.
```

## Tagging

Use annotated tags for releases.

```bash
git tag -a v0.1.1 -m "v0.1.1"
git push origin v0.1.1
```

If a tag needs to be recreated during early development, document why in the release notes.

## GitHub Release Notes

Release notes should include:

- what changed
- who should care
- validation status
- any known limitations

Example:

```md
## What changed

- Added API reference docs.
- Expanded provider safety guidance.

## Validation

- pnpm check
- GitHub Actions Check

## Known limitations

- Packages are not published to npm yet.
```

## NPM Publishing

The packages are not published to npm yet.

When publishing begins, add a package publishing checklist before the first npm release. Until then, releases are GitHub source releases.

## NPM Publish Readiness

Before publishing packages to npm, run the package dry-run check:

```bash
pnpm pack:check
```

This command builds all workspace packages and runs `npm pack --dry-run --json` for:

- `packages/core`
- `packages/react`
- `packages/server`

Review the dry-run output before publishing. Each publishable package should include:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/index.d.ts.map`
- `README.md`
- `LICENSE`
- `package.json`

Also confirm:

- scoped packages have `publishConfig.access` set to `public`
- package `repository.directory` points to the package folder
- workspace dependencies are rewritten to concrete package versions in dry-run output
- no examples, tests, local files, screenshots, secrets, or build caches are included
- package versions match the intended release version

Do not publish from a dirty worktree. Run `pnpm check`, confirm CI is green, and create the GitHub source release first.

## Rollback

For source releases, prefer a follow-up fix release over deleting published tags.

Use tag deletion only for obvious early-development mistakes and document it clearly.
