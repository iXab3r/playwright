# Playwright fork — shared agent guide

This checkout is the `iXab3r/playwright` fork. `AGENTS.md` and the Markdown guides under
`docs/development/` are the common instructions for every harness. Read the guide for the changed
surface; preserve upstream runtime/API contracts and generated-source ownership.

### Monorepo Packages

| Package | npm name | Purpose |
|---------|----------|---------|
| `playwright-core` | `playwright-core` | Browser automation engine: client, server, dispatchers, protocol |
| `playwright` | `playwright` | Test runner + browser automation (public package) |
| `playwright-test` | `@playwright/test` | Test runner entry point |
| `playwright-client` | `@playwright/client` | Standalone client package |
| `protocol` | *(internal)* | RPC protocol definitions (`protocol.yml` → generated `channels.d.ts`) |

### Browser Packages

`playwright-chromium`, `playwright-firefox`, `playwright-webkit` — per-browser distributions.
`playwright-browser-chromium`, `playwright-browser-firefox`, `playwright-browser-webkit` — binary packages.

### Tooling Packages

| Package | Purpose |
|---------|---------|
| `html-reporter` | HTML test report viewer |
| `trace-viewer` | Trace viewer UI |
| `recorder` | Test recorder |
| `web` | Shared web UI components |
| `injected` | Scripts injected into browser pages |

### Component Testing

`playwright-ct-core`, `playwright-ct-react`, `playwright-ct-vue`

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `tests/` | All test suites (page, library, playwright-test, mcp, components, etc.) |
| `docs/src/` | API documentation — **source of truth** for public TypeScript types |
| `docs/src/api/` | Per-class API reference (`class-page.md`, `class-locator.md`, etc.) |
| `utils/` | Build scripts, code generation, linting, doc tools |
| `browser_patches/` | Browser engine patches |

## Build

```bash
npm run build       # Full build
npm run watch       # Watch mode (recommended during development)
```

Verify whether a watch/build process is running and whether its output covers the current source. A fresh
clone has no assumed watcher or generated artifacts. Build before runtime verification when needed;
watch can regenerate types, channels and validators while developing. Do not hand-edit generated output.

## Lint and type check

```bash
npm run flint
```

Runs all lint checks in parallel: eslint, tsc, doclint, check-deps, generate_channels, generate_types, lint-tests, test-types, lint-packages, code-snippet linting.

For code, API-reference or generation changes, run `flint` before committing; it is the repository
verification entry point rather than an ad hoc set of compiler commands. Agent-guide-only prose uses
link, command/config consistency and `git diff --check` inspection. This does not waive required CI.

## Test Commands

| Command | Scope |
|---------|-------|
| `npm run ctest <filter>` | Chromium only library tests — **use during development** |
| `npm run test -- <filter> --project=chromium-library` | One library project; omit `--project` for the full matrix |
| `npm run ttest <filter>` | Test runner (`tests/playwright-test/`) |
| `npm run ctest-mcp <filter>` | Chrome-channel MCP tools (`tests/mcp/`) |
| `npm run test-mcp -- <filter> --project=chromium` | MCP tools (`tests/mcp/`) |


Library projects use names such as `chromium-library`, `chromium-page`, `firefox-library` and
`webkit-page`; `ctest` selects `chromium-*`. MCP projects use `chrome`, `chromium`, `firefox` and
`webkit` (plus `msedge` on Windows). Consult the owning config before selecting a project.

### Filtering

```bash
npm run ctest tests/page/locator-click.spec.ts         # Specific file
npm run ctest tests/page/locator-click.spec.ts:12      # Specific location
npm run ctest -- --grep "should click"                 # By test name
npm run ctest-mcp snapshot                             # By file name part
```

### Test Directories and Fixtures

| Directory | Import | Key Fixtures | What to Test |
|-----------|--------|--------------|--------------|
| `tests/page/` | `import { test, expect } from './pageTest'` | `page`, `server`, `browserName` | User interactions: click, fill, navigate, locators, assertions |
| `tests/library/` | `import { browserTest, expect } from '../config/browserTest'` | `browser`, `context`, `browserType` | Browser/context lifecycle, cookies, permissions, browser-specific features |
| `tests/playwright-test/` | `import { test, expect } from './playwright-test-fixtures'` | test runner fixtures | Test runner: reporters, config, annotations, retries |
| `tests/mcp/` | `import { test, expect } from './fixtures'` | `client`, `server` | MCP tools via `client.callTool()` |

**Decision rule**: Does the test need `browser`/`browserType`/`context` → `tests/library/`. Just needs `page` + `server` → `tests/page/`.

## DEPS System

Import boundaries are enforced via `DEPS.list` files (52+ across the repo), checked by `npm run flint`.

**Key rule**: Client code NEVER imports server code. Server code NEVER imports client code. Communication is only through the protocol.
When creating or moving files, update the relevant `DEPS.list` to declare allowed imports. Files marked `"strict"` can only import what is explicitly listed.

## Coding Convention

For exported classes:
- `private _method()` — only used within the class itself
- `_method()` (no `private`) — used by other code in the same file, but not outside the file
- `method()` (public) — used in other files

Non-exported classes have no naming convention; they are internal implementation details.

## Commit Convention

Use semantic commit messages: `label(scope): description`, with labels such as `fix`, `feat`,
`chore`, `docs`, `test` and `devops`. Run the applicable checks above and fix their failures.

Resolve the actual remote and intended base before publication. Fork maintenance targets
`iXab3r/playwright`; upstream `microsoft/playwright` is a separate destination requiring an explicit
request. New branches default to `bugfix/<short-description>`; preserve an explicitly requested name.

Create PRs with an explicit repository and base, for example `gh pr create --repo iXab3r/playwright
--base main --head bugfix/shared-agent-rules`. Keep the description short: problem, resulting behavior,
actual verification and material limitations. Use a UTF-8 `--body-file` for multiline text. Never
force-push or bypass required checks; verify the reviewed head and final merge. Do not add agent
co-author trailers or generated-by banners.

## Independent architecture and diff review

Use [the shared review guide](docs/development/review.md) when independent review is needed.
Architects and reviewers start with empty conversation context and one focused neutral question,
then inspect source and tests to form their own assessment. The delivery owner makes fixes and merges.

## Development Guides

Detailed guides for common development tasks:

- **[Architecture: Client, Server, and Dispatchers](docs/development/library.md)** — package layout, protocol layer, ChannelOwner/SdkObject/Dispatcher base classes, DEPS rules, end-to-end RPC flow, object lifecycle
- **[Adding and Modifying APIs](docs/development/api.md)** — 6-step process: define docs → implement client → define protocol → implement dispatcher → implement server → write tests
- **[MCP Tools and CLI Commands](docs/development/tools.md)** — `defineTool()`/`defineTabTool()`, tool capabilities, CLI `declareCommand()`, config options, testing with MCP fixtures
- **[Vendoring Dependencies](docs/development/vendor.md)** — bundle architecture, esbuild setup, typed wrappers, adding deps to existing bundles
