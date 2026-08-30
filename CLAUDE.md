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

## V2.1 Pending Items (ws-cli-v2.1-purge)

### Complete (WS-CLI-V2.1-PURGE Batch 2)
- `update.js updateKB()`: Drive stages 1-3 removed; delegates to `runKbChunk()` + `runKbSync()` ✓
- `kb.js`: PathContext replaced with WorkspaceConfig for v2 workspace format support ✓
- `WorkspaceConfig.getApiUrl()` and `PathContext.getApiUrl()`: now derive from `env.platform.microservice.port` ✓
- `app init` hardening: hard-fails if app already mapped and `-p` given ✓
- `kb/General/` scaffold removed from `app init` ✓
- `descix kb pull/push` removed; moved to `descix drive pull/push` ✓
- `descix app set-localpath` and `descix app unmap` added ✓

### Complete (WS-CLI-V2.1-PURGE Batch 4)
- `WorkspaceConfig.getApp(communityId, appId)` was removed in PR #7 but 6 call sites were missed. All 6 migrated or refactored ✓
- `WorkspaceConfig.setSitePort(appId, port)` added — mutates live `env.products[]`/`env.platform` entry and auto-saves ✓
- `descix site servelocal` and `update.js` port handler refactored to use `setSitePort` (eliminates stale-copy mutation) ✓
- `descix update kb` v1 community-keyed fallback block (`if (!appConfig && ctx.communityId)`) deleted entirely ✓
- Error message for unmapped app now references both `descix app init` and `descix app set-localpath` ✓
- Meta-test `removed-methods-anti-regression.test.js` guards against future re-introduction of removed methods ✓

### Complete (WS-CLI-V2.1-PURGE Batch 5)
- `Hydrator.copyScaffold()` path-walk bug fixed: `lib/core/Hydrator.js:709` now walks two `'..'` from `lib/core/` to `descix-cli/` (was three, which reached `DeSciX_Core/` — one level too high) ✓
- `microservice init` now injects `LOCAL_PORT` into `defaults-config.json` and `debugPort` + `app_id`/`community_id`/`name`/`domain` into `manifest.json` from `workspace.json` `env.products[<app>].microservice.port` ✓
- `microservice init` hard-fails with canonical error if `microservice.port` is missing from workspace.json — port-allocation policy gap surfaced as `WS-CLI-MESH-ROUTING-GAP` ✓
- Test coverage for `copyScaffold()` added to `site-init.test.js` and `microservice-init.test.js` (Batch 4 tests only exercised `WorkspaceConfig.getAppByAppId()`, not the scaffold copy path) ✓
- Anti-regression meta-test extended in `removed-methods-anti-regression.test.js` to verify scaffold dir exists at runtime ✓

### Complete (WS-CLI-MESH-ROUTING-GAP — `descix app set-port`)
- `WorkspaceConfig.setMicroservicePort(appId, port)` added — parallel to `setSitePort()`; mutates the live `env.products[]`/`env.platform` entry's `microservice.port`, auto-saves; pass `null` to remove (empty `microservice.{}` cleaned up); hard-fails with the canonical "not mapped in workspace.json" error for an unmapped app ✓
- `descix app set-port -a <id> -p <port>` command added (`bin/descix.js`, in the `app` group next to `set-localpath`/`unmap`) — wired to `setMicroservicePort`; validates port 1-65535; accepts `-p n` to remove; hard-fails clearly on unmapped app / bad port ✓
- This is the canonical write path for the `microservice.port` that `descix microservice init` reads — no more hand-editing workspace.json ✓
- Test coverage in `tests/app-set-port.test.js` (mirrors `site-servelocal.test.js`: happy path, disable/cleanup, disable-no-op, unmapped hard-fail, platform-app, plus a method-exists anti-regression assertion) ✓

### Complete (WS-SSGPOD — `descix app set-site` closes the site.static gap)
- `WorkspaceConfig.setStaticSite(appId, { static, port })` added — parallel to `setSitePort()`/`setMicroservicePort()`; mutates the live `env.products[]`/`env.platform` entry's `site.{}` slot, auto-saves; pass `static: null` / `port: null` to remove a field (empty `site.{}` cleaned up); hard-fails with the canonical "not mapped in workspace.json" error for an unmapped app ✓
- `descix app set-site -a <id> --static <path>` command added (`bin/descix.js`, in the `app` group next to `set-port`/`set-localpath`/`unmap`) — wired to `setStaticSite`; also accepts `--port <n>` (1-65535) and `--unset` to clear `site.{}`; hard-fails clearly on unmapped app / bad port / nothing-to-set ✓
- This is the canonical write path for `site.static` — the relative path (under the app's `localPath`; `.` = the localPath itself) that the dev gateway's `staticSitePlugin` serves at `/p/{appId}/`. It closes the `site.static` workspace gap the same way `set-port` closed `microservice.port`: no more hand-editing workspace.json (the org rule forbids it; CEO-D-2026-06-02-SSGPOD-SITE-PREPROD) ✓
- NOT to be confused with `set-codesite` (which writes the Firestore `ip_site_gcs_path_url` — a prod concern). `set-site` writes ONLY the local workspace.json `site.{}` slot ✓
- Test coverage in `tests/app-set-site.test.js` (mirrors `app-set-port.test.js`: happy path, static+port combined, disable/cleanup, disable-no-op, port-preservation, unmapped hard-fail, platform-app, plus a method-exists anti-regression assertion) ✓

### Complete (WS-SSGPOD — workspace product-map live-refresh (HMR) + `descix app open`)
Two platform/SDK/CLI deliverables under CEO-D-2026-06-02-EVP-NO-APPDEV-CLI-PLUS-DEV-URL. EVP builds + unit-tests these; COS/CEO run app-setup CLI (`set-site` etc.) against real apps as dogfood — EVP never does.

**1 — Live-refresh `__WORKSPACE_PRODUCTS__` in a running app dev server (no restart):**
- **Root cause:** an app dev server (e.g. daita PWA :5174) bakes the product map into a Vite `define` (`__WORKSPACE_PRODUCTS__`) at config-load via `buildWorkspaceProducts()`. A Vite `define` is a compile-time text substitution — it cannot react to a workspace.json change. So `descix app set-site` updated workspace.json but the running PWA kept its stale baked map until restart, and the new app site never showed in the store. The gateway (:5173) already rebuilds its own map (it restarts its Vite server in `gateway.js`) but cannot reach into a SEPARATE app-server process.
- **New SDK plugin `workspaceProductsPlugin(workspaceRoot)`** (`descix-app-sdk/src/dev/workspaceProductsPlugin.js`, exported from `@descix/app-sdk/dev`; `apply:'serve'` so it self-gates to dev). It watches `.descix/workspace.json` and, when the resolved product map changes, sends a custom Vite HMR event `descix:workspace-products` over `server.hot` with the fresh map — no full reload, no dev-server restart. It also exposes a virtual module (`virtual:descix/workspace-products-hmr`) client runtime (auto-injected via `transformIndexHtml`, zero app source change) that listens for the event and calls `AppData.setWorkspaceProducts(map)`. ✓
- **Why minimal blast radius:** `AppData.getProductUrl()` already reads the MUTABLE field `AppData._workspaceProducts` (the `__WORKSPACE_PRODUCTS__` global only SEEDS it once). So updating that field at runtime makes the app store reactive with zero consumer changes — the existing `define` and all `typeof __WORKSPACE_PRODUCTS__` guards stay intact. Added `AppData.setWorkspaceProducts()` (`descix-app-sdk/src/util/AppData.jsx`) + `./AppData` package export. ✓
- **Wired into the daita PWA:** `DeSciX_Cloud/site/vite.config.js` registers `workspaceProductsPlugin(workspaceRoot)` in `plugins[]`. ✓
- **Tested** with a SYNTHETIC temp workspace (NOT descix-ssgpod) in `descix-cli/tests/workspace-products-hmr.test.js`: pushes on product-site ADD, pushes on dev-server port change, does NOT push when the resolved map is unchanged, virtual-module resolveId/load + hot-guard + setWorkspaceProducts wiring. ✓

**2 — `descix app open -a <id>` (dev URL resolver):**
- **New SDK resolver `resolveAppGatewayUrl(workspaceRoot, appId)`** (`descix-app-sdk/src/dev/workspaceProducts.js`, exported from `@descix/app-sdk/dev`) — same workspace.json read path behind `buildWorkspaceProducts()`, returns the LOCAL GATEWAY URL `descix serve` routes the app at: `env.platform` → `https://localhost:{gatewayPort}/`; product (static OR dev-server) → `https://localhost:{gatewayPort}/p/{appId}` (both reach the gateway at `/p/{appId}`; for dev-server that is the proxied origin). Honors `env.gateway.port` (default 5173). Hard-fails on missing workspace.json / unmapped app / no-site app. ✓
- **`descix app open -a <id>`** command (`bin/descix.js`, `app` group next to `set-site`) — prints the URL + kind + via; `--open` launches the browser via the platform-native opener (`open`/`xdg-open`/`start`) with NO new npm dependency and NO hardcoded fallback. Hard-fails (exit 1) clearly on unmapped / no-site. ✓
- **Tested** in `descix-cli/tests/app-open.test.js` (temp workspace): static, dev-server, platform, custom gateway port, unmapped hard-fail, no-site hard-fail, missing-workspace hard-fail. ✓

### WorkspaceConfig — additional canonical method (v2.1)
- **`workspaceConfig.env`** — raw `env` object from workspace.json. Use for reading `env.platform.microservice.port` / `env.products[i].microservice.port` when injecting port into scaffold files. Do not mutate directly — use `setSitePort()` for site port mutations, `setStaticSite()` for `site.static` (static-site) mutations, and `setMicroservicePort()` for microservice port mutations.

### Pending (other)
- ~~`descix-cli/bin/mcp-server.js`: imports non-existent `vendor/mcp/tools.js`~~ — CLOSED (stale, WS-V1-PURGE Phase 2): `mcp-server.js` imports `@modelcontextprotocol/sdk` directly; no `DeSciXMCPServer`/`vendor/mcp/tools.js` exists.
- ~~`descix-cli/tests/mcp-flow.test.js`~~ — CLOSED (stale, WS-V1-PURGE Phase 2): no file imports `vendor/mcp/mcp-server.js`; the test is gone.
- **Port-allocation policy gap (`WS-CLI-MESH-ROUTING-GAP`) — RESOLVED:** `microservice init` requires a `microservice.port` in workspace.json. The canonical way to set one is now `descix app set-port -a <id> -p <port>` (backed by `WorkspaceConfig.setMicroservicePort`, parallel to `setSitePort`). Explicit-only — there is no auto-allocation (a possible future enhancement once port constants are canonical). Hand-editing workspace.json is no longer needed.

---

## Key Patterns

### CLI is HTTP-only
The CLI never imports backend services directly. All operations are `POST /apifront/` calls to a running backend at `https://localhost:4000`. The backend URL is derived automatically from `env.platform.microservice.port` in `workspace.json` — no `DESCIX_API_URL` env var needed in dev.

### CLI testing — use CLI, never curl
After `descix login` / bootstrap, all testing must use `node DeSciX_Core/descix-cli/bin/descix.js [command]`. Curl bypasses session, auth middleware, and entitlement checks — it is not a valid substitute. This is how real bugs in auth and entitlement are caught.

### workspace.json format — v2.1 (canonical)
- **v2.1 format** (current, canonical): `env.platform` + `env.products[]` — app UUIDs in unified product registry. `WorkspaceConfig._buildAppIdMap()` and `getAppByAppId()` read this. **Use this for all CLI workspace resolution.**
- **v1 format** (`communities`-based JSON) is not supported. Loading a v1 workspace.json hard-errors: `"v1 workspace format is not supported. Migrate to v2.1."`
- When reading workspace config in CLI commands: use `WorkspaceConfig` only — `PathContext` is removed.

### WorkspaceConfig — canonical methods (v2.1)
- **`getAppByAppId(appId)`** — primary app lookup. Returns `{ localPath, absolutePath, communityId, kbId }` or `null`. Use this everywhere.
- **`setSitePort(appId, port)`** — mutates the live `env.products[]` (or `env.platform`) entry and calls `save()`. Pass `null` to remove `site.port`; empty `site.{}` is cleaned up. Hard-fails if `appId` is not mapped. Always use this (not direct mutation of `getAppByAppId()` return value, which is a constructed copy).
- **`getSitePath(appId)`** / **`getMicroservicePath(appId)`** — convenience wrappers returning `absolutePath/site` and `absolutePath/microservice` respectively.
- **`setEnvironment(envName)`** — canonical way to persist environment to workspace.json.
- **NEVER call `getApp(communityId, appId)`** — this method was removed in WS-CLI-V2.1-PURGE PR #7. `getAppByAppId(appId)` is the replacement. The meta-test `removed-methods-anti-regression.test.js` enforces this.

### KB Mode — ONE sync surface
- `descix kb corpus sync` is the ONLY KB sync surface: corpus manifest → chunks → Pinecone.
- `descix kb create` creates the KB and is `kb corpus sync`'s dependency — `kb corpus sync` refuses and names it when the KB is not registered.
- `descix kb chunk`, `descix kb sync`, `descix sync kb` and `descix update kb` are REMOVED. Each exits non-zero naming `descix kb corpus sync`. There is no alias and no fallback flag.
- `descix update` covers app and site only. `update all` does app+site and skips the KB; `update auto` REFUSES with a non-zero exit naming `descix kb corpus sync` when run from the app's `kb/` directory, because that is where it would previously have synced a KB.
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
