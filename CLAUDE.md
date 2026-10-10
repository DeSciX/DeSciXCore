## DeSciX lane
LANE: platform          ENV: DEV (Unkamon/.descix/workspace.json; `descix whoami` must print dev chosen by env.apiUrl — never by an environment variable)
SDK: the Core working tree via DESCIX_CLI; app-lane repos never read these trees — they use the published @descix/cli and @descix/app-sdk and the handbook named in the index
INDEX: /Users/essam/Code/Unkamon/CLAUDE.md — inherited automatically (this repo sits inside the Unkamon tree)

# DeSciX_Core — SDK & Package Agent

Shared packages consumed by `DeSciX_Cloud` and `DeSciX_Powch` via npm link. This project is the sole source of truth for these packages — do not duplicate their logic in consuming projects: consumers use the published npm packages; app-lane repos never read this tree.

**Root invariants apply:** [`../CLAUDE.md`](../CLAUDE.md)
**V2 audit for this sub-project:** [`../V2_docs/audit/v2-legacy-audit.md#desciX_core`](../V2_docs/audit/v2-legacy-audit.md)

---

## Packages

| Package | Entry | Consumers |
|---------|-------|-----------|
| `@descix/sdk` | MCP server, RAG orchestrators, Git integrations | CLI, backend services |
| `@descix/cloud-core` | Firestore, Pub/Sub, Secret Manager bootstrap | All GCP microservices |
| `@descix/platform-api` | Shared business logic: Firestore models, auth/session, email, permissions, entitlements | DeSciX_Cloud microservice, DeSciX_Powch microservice |
| `@descix/app-sdk` | App shell framework, React components, Web3 stack | DeSciX_Cloud site, DeSciX_Powch site |
| `@descix/cli` | Unified CLI + MCP server (`bin/descix.js`) | All developers, E2E tests, CI |

---

## Local Development Setup

```bash
# Register all packages globally (run once after clone or package.json changes)
npm run link   # in DeSciX_Core/

# Then in each consuming project:
npm link @descix/cloud-core                  # DeSciX_Cloud/microservice
npm link @descix/app-sdk                     # DeSciX_Cloud/site, DeSciX_Powch/site
npm link @descix/cli                         # global CLI
```

See [`LINK_SETUP.md`](LINK_SETUP.md) for the full sequence.

---

## Separation of Concerns

Before any change, state which package boundary is being touched and confirm no logic is being duplicated across packages. Package responsibilities:

- `@descix/cloud-core` — GCP service bootstrap only; no business logic
- `@descix/platform-api` — Shared business logic (models, auth, email, permissions, entitlements); depends on cloud-core for all GCP access; never imports from consuming services
- `@descix/app-sdk` — app container + UI primitives + **dev gateway** (`src/dev/gateway.js`); no platform-specific business logic. The gateway is SDK infrastructure — the platform PWA is a peer consumer, not a privileged one.
- `@descix/app-sdk/dev` exports: `createViteProxyConfig` (app-level proxy rules + `_staticRoutes` for `site.static` products), `createViteServerConfig` (HTTPS + proxy for any app), `runGateway` (pure reverse proxy replicating the production LB), `staticSitePlugin` (Vite middleware serving static files at `/p/{appId}/` for products with `site.static`), `getViteHttpsConfig`, `watchWorkspaceConfig`
- `@descix/sdk` — shared runtime utilities; no GCP-specific code (that belongs in cloud-core)
- `@descix/cli` — HTTP-only client; zero direct service imports; all operations via `/apifront/`. CLI commands like `descix serve` are thin wrappers around app-sdk functions.

---

## Key Patterns

### CLI is HTTP-only
The CLI never imports backend services directly. All operations are `POST /apifront/` calls. The origin is resolved by `lib/origin.js`, in this order: the `--api-url` / `--env` global flags (they set, and therefore outrank, the env var), then `DESCIX_API_URL`, then `.descix/workspace.json` `env.apiUrl`, then `~/.descix/config.json` `api_url`, then the declared default, PROD. **There is no port-derived step** — an environment NAME never becomes an origin, and `env.platform.microservice.port` is not consulted. A local backend is a URL you name. Every network-bound command prints the resolved origin AND the source that chose it on stderr; read that line rather than assuming.

### CLI testing — use CLI, never curl
After `descix login` / bootstrap, all testing must use `node DeSciX_Core/descix-cli/bin/descix.js [command]`. Curl bypasses session, auth middleware, and entitlement checks — it is not a valid substitute. This is how real bugs in auth and entitlement are caught.

### workspace.json format — v3 single-app (canonical)
- **v3 format** (current, canonical): one `env.app` `{appId, communityId, kbId, site{static|port,protocol}, microservice{port,devCommand}}` per repo; the repo root IS the workspace root (`descix app init` runs from it, and a checkout nested inside another workspace is refused by `assertNoParentWorkspace`). A GATEWAY workspace instead carries `env.gateway.{port, shell, appRepos[]}` — each listed repo holds its own v3 file, which is the sole authority for that app.
- **v1 (`communities`) and v2.1-multi (`env.platform`/`env.products`) are retired.** Loading either throws the typed `WorkspaceRetiredFormatError` naming the migration, and `tryLoad` RETHROWS it — retired is not absent.
- `registerApp(communityId, appId, {kbId})` is single-slot: the same id is idempotent, a different id refuses loudly.
- When reading workspace config in CLI commands: use `WorkspaceConfig` only — `PathContext` is removed.

### WorkspaceConfig — canonical methods (v3)
- **`getAppByAppId(appId)`** — primary app lookup, resolved from `env.app`. Returns a COPY `{ localPath, absolutePath, communityId, kbId }` or `null`.
- **`_liveEnvEntry(appId)`** — the one owner of "find the LIVE env.app entry or hard-fail"; every entry setter (`setStaticSite`, `setMicroservicePort`) goes through it.
- **`setStaticSite(appId, { static, port, protocol })`** — mutates the live `env.app` entry's `site.{}` and calls `save()`. ONE ACTIVE MODE PER WRITE: `static` alone clears `port`+`protocol`, `port` alone clears `static`, both in one call keeps both (the gateway serves the dev server — site.port wins). `protocol` is "http"|"https" (default https when absent), dev-server mode only. Pass `null` for a field to remove it; empty `site.{}` is cleaned up. Hard-fails if `appId` is not THE app.
- **`getSitePath(appId)`** / **`getMicroservicePath(appId)`** — convenience wrappers returning `absolutePath/site` and `absolutePath/microservice` respectively.
- **`setEnvironment(envName)`** — canonical way to persist environment to workspace.json.
- **`setEnvKey(dottedKey, value)`** — workspace-level env keys (`gateway.port`, `devCerts.*`, `powchUrl`, `siteUrl`); each has a `descix config set-*` verb.
- **`workspaceConfig.env`** is read-only — mutate through the setters (`descix app set-site` / `set-port`, explicit only, no auto-allocation); never hand-edit workspace.json.
- The app-set owner for multi-repo dev is `@descix/app-sdk`'s `resolveWorkspaceApps(workspaceRoot)` (`src/dev/workspaceApps.js`) — gateway and watchers consume it, never a second derivation.

### KB Mode — ONE sync surface
- `descix kb corpus sync` is the ONLY KB sync surface: corpus manifest → chunks → Pinecone.
- `descix app init -a <app_id> --kb <kb_name>` creates a KB and is `kb corpus sync`'s dependency — `kb corpus sync` refuses and names it when the KB is not registered.
- `descix kb chunk`, `descix kb sync` and `descix sync kb` are REMOVED. Each exits non-zero naming `descix kb corpus sync`. There is no alias and no fallback flag.
- Drive Mode (Drive → GCS → Pinecone) is server-side only for PWA users; never add Drive pipeline calls to CLI commands
- `descix drive pull/push` manage the Drive source IPDoc store — they are the correct commands for Drive content authoring

### Developer onboarding sequence (after bootstrap)
```bash
node bin/descix.js app list                   # discover available apps
node bin/descix.js app init -a daita           # registers KB doc + scaffolds site/, microservice/, assets/
# Create apps/daita/.descix/manifests/General.json corpus manifest, then:
node bin/descix.js kb corpus sync -a daita     # sync corpus manifest → Pinecone
node bin/descix.js chat -a daita "..."         # verify RAG
```

### MCP uses CLI
All MCP tool calls invoke CLI commands. The canonical MCP entry point (after legacy removal) is `@descix/sdk`'s MCP server integration, not the legacy `DeSciXMCPServer` class.

### Powch Integration for App Developers
- **Inside AppShell (default):** Powch sidebar is automatic. Use `usePowchBridge()` hook to call `bridge.login({ registerDeSciX: true })`, `bridge.sign()`, `bridge.connectWallet()`, etc. `registerDeSciX: true` ensures the full site pass flow (email + TOS + DeSciX registration) completes before returning.
- **Standalone (no AppShell):** Import `PowchClient` from `@descix/app-sdk/powch-client`. It auto-detects embedded vs standalone mode — if `window.DeSciX.powch` exists, delegates to host's bridge; otherwise creates its own iframe sidebar.
- **Session sync:** After `bridge.login()` resolves, call `window.DeSciX.loginWithSessionToken(result)` then fire `LOGIN_SUCCESS` event. The bridge also syncs automatically via `_syncSessionToHost()` on every successful POWCH_RESPONSE.
- **Reference implementations:** `DeSciX_Powch/samples/standalone-vanilla/` (pure JS) and `standalone-react/` (React + PowchClient).

### No silent failures in cloud-core
`@descix/cloud-core` bootstraps services from Secret Manager. If a required config value is null/missing, let it surface — never add default fallbacks. This exposes misconfigurations early.

---

## References

- [LINK_SETUP.md](LINK_SETUP.md) — npm link sequence
- [V2 Docs: App SDK](../V2_docs/app-sdk/) — App SDK usage patterns
- [V2 Docs: MCP Mesh](../V2_docs/services/mcp-mesh.md) — MCP integration architecture
- [V2 Docs: Development](../V2_docs/development/) — Local dev setup
