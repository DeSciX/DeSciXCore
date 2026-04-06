# DeSciX_Core — SDK & Package Agent

Shared packages consumed by `DeSciX_Cloud` and `DeSciX_Powch` via npm link. This project is the sole source of truth for these packages — do not duplicate their logic in consuming projects.

**Root invariants apply:** [`../CLAUDE.md`](../CLAUDE.md)
**V2 audit for this sub-project:** [`../V2_docs/audit/v2-legacy-audit.md#desciX_core`](../V2_docs/audit/v2-legacy-audit.md)

---

## Packages

| Package | Entry | Consumers |
|---------|-------|-----------|
| `cryptoapis-sdk` | OpenAPI-generated SDK | DeSciX_Cloud microservice, DeSciX_Powch microservice |
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
npm link @descix/cloud-core cryptoapis-sdk   # DeSciX_Cloud/microservice
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

## V2 Pending Items (from audit)

### P0 — Complete
- `update.js updateKB()`: Drive stages 1-3 removed; delegates to `runKbChunk()` + `runKbSync()` ✓
- `kb.js`: PathContext replaced with WorkspaceConfig for v2 workspace format support ✓
- `WorkspaceConfig.getApiUrl()` and `PathContext.getApiUrl()`: now derive from `env.platform.microservice.port` ✓
- Remaining: `descix app list` + `descix app init` commands (see plan)

### P1 — Remove Legacy
- `descix-cli/bin/mcp-server.js`: imports non-existent `vendor/mcp/tools.js` — determine canonical MCP entry point, remove `DeSciXMCPServer` legacy
- `descix-cli/tests/mcp-flow.test.js`: imports `vendor/mcp/mcp-server.js` (missing) — remove or rewrite
- `-c` and `-a` CLI flags: deprecated for local workspace operations — remove

### P1 — Fix E2E Test Syntax
- `DeSciX_Cloud/microservice/tests/cliE2ETest.js`: update `descix sync stage1` → `descix sync kb stage1`

---

## Key Patterns

### CLI is HTTP-only
The CLI never imports backend services directly. All operations are `POST /apifront/` calls to a running backend at `https://localhost:4000`. The backend URL is derived automatically from `env.platform.microservice.port` in `workspace.json` — no `DESCIX_API_URL` env var needed in dev.

### CLI testing — use CLI, never curl
After `descix login` / bootstrap, all testing must use `node DeSciX_Core/descix-cli/bin/descix.js [command]`. Curl bypasses session, auth middleware, and entitlement checks — it is not a valid substitute. This is how real bugs in auth and entitlement are caught.

### workspace.json format — v1 vs v2
- **v2 format** (current, canonical): `env.platform` + `env.products[]` — app UUIDs in unified product registry. `WorkspaceConfig._buildAppIdMap()` and `getAppByAppId()` read this. **Use this for all CLI workspace resolution.**
- **v1 format** (legacy): `communities.{id}.apps.{id}` — `WorkspaceConfig.registerApp()` still writes this format; removal is a post-E2E refactor TODO.
- When reading workspace config in CLI commands: use `WorkspaceConfig` (not `PathContext`) — it handles v2 format first, then falls back to v1.

### KB Mode — Git Mode only in CLI
- `descix update kb` and `descix kb build/chunk/sync` are Git Mode: local files → chunks → `kb_sync_chunks` → Pinecone
- Drive Mode (Drive → GCS → Pinecone) is server-side only for PWA users; never add Drive pipeline calls to CLI commands
- `descix kb pull/push` manage the Drive source IPDoc store — they are correct and must be preserved

### Developer onboarding sequence (after bootstrap)
```bash
node bin/descix.js app list          # discover available apps
node bin/descix.js app init -a daita  # registers KB doc + local dirs
node bin/descix.js update kb -a daita # chunk + sync to Pinecone
node bin/descix.js chat -a daita "..."# verify RAG
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
