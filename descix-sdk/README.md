# @descix/sdk

**Shared runtime libraries for Node.js and the browser** — the client-side half of the platform:
managers, orchestrators, mesh asset access, request signing, and an MCP server implementation.

Consumed by the CLI and by the microservice scaffold.

## Entry points

| Import path | What it is |
|---|---|
| `@descix/sdk` / `@descix/sdk/node` | Node runtime surface (default) |
| `@descix/sdk/browser` | browser build |
| `@descix/sdk/mcp` | MCP server |
| `@descix/sdk/mcp/transports` | transport index |
| `@descix/sdk/mcp/transports/stdio` | stdio transport |
| `@descix/sdk/mcp/transports/http-sse` | HTTP + SSE transport |
| `@descix/sdk/managers/community` | `CommunityManager` |
| `@descix/sdk/managers/app` | `AppManager` |
| `@descix/sdk/orchestrators/wizard` | `WizardOrchestrator`, `WIZARD_STEPS` |
| `@descix/sdk/integrations/git` | `GitUtils` |
| `@descix/sdk/mesh/asset` | `fetchAppAsset` |

## Root exports

`CommunityManager` / `createCommunityManager`, `AppManager` / `createAppManager`,
`WizardOrchestrator` / `createWizardOrchestrator` / `WIZARD_STEPS`, `GitUtils` /
`createGitUtils`, `Signer`, `fetchAppAsset`, and `createSDK(apiClient)`.

Most managers come in a class form and a `create*` factory; the factory is the usual entry.

## Not to be confused with

- **`@descix/app-sdk`** — the *app shell* SDK: React shell, `window.DeSciX`, Powch bridge, and the
  `descix serve` dev gateway. That is what an app developer builds a site against; see that
  package's own README (`DeSciX_Core/descix-app-sdk/README.md` in the platform repo).
- **`@descix/cloud-core`** — the microservice infrastructure layer (config, Firestore, Pub/Sub).

Three packages carry "sdk" or "core" in their names and serve different audiences; check which
one a snippet is importing before copying it.
