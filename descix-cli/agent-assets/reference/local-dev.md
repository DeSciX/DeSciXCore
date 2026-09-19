# Local Development Architecture: The "Local Mesh" Proxy

## 1. Overview

This document outlines the unified architecture for local development of DeSciX Apps (CodeSites and Microservices). The core design principle is to treat the local development environment as a **Local Load Balancer** that mirrors the production routing topology.

**Important**: This document applies to **git-mode** developers who use the CLI for app development. For **drive-mode** users (non-developers using the PWA), app management is handled entirely through the web interface with server-side processing.

This approach unifies three distinct scenarios:
1.  **Platform Dev**: Developing the core platform (PWA + API) locally.
2.  **End-User Dev**: Developing a single App against the production platform.
3.  **Production**: Running live on `*.descix.net`.

## 1.1. Git Mode vs Drive Mode

| Aspect | Git Mode (CLI) | Drive Mode (PWA) |
|--------|---------------|-----------------|
| **User Type** | Developers | Non-technical users |
| **Content Source** | Local git repo (MD exports pulled from Drive via `descix drive pull`) | Google Drive |
| **Version Control** | Git | Drive/GCS/Firestore |
| **KB Processing** | `descix kb corpus sync` — manifest-driven git-aware sync → Pinecone | Server-side pipeline (Drive → GCS → Pinecone) — PWA users only |
| **Configuration** | `workspace.json` | N/A (PWA handles) |
| **Tools** | CLI, VSCode, Git | PWA only |

## 2. The Canonical Routing Model

Instead of exposing implementation details (like GCS bucket URLs or specific port numbers) to the client, the platform uses **Canonical Paths** for all resources.

### 2.1. Route Patterns

| Canonical Path | Production Target (LB) | Local Target (Gateway) |
| :--- | :--- | :--- |
| `/apifront`, `/api`, `/mcp`, `/oauth`, `/.well-known/oauth-*` | Core API | the resolved **API origin** (see §3.2) |
| `/powch` | Powch PWA | the origin the workspace names. **No route at all when unset** — there is no default wallet origin |
| `/s/{appId}` | service | `http://localhost:{microservice.port}` — prefix **stripped** |
| `/p/{appId}` | app site | `{proto}://localhost:{site.port}` (**no** path rewrite), or served from disk when the product has `site.static` |
| `/Community`, `/.proxy/gcs_media` | GCS public bucket | proxied to `storage.googleapis.com` |
| `/__descix/app-binding.json` | (not served in production) | answered by the gateway itself |
| `/` | PWA bucket | the resolved **Shell origin** (see §3.2) — always matched **last** |

## 3. The "Local Mesh" Proxy

`descix serve` spins up a **Local Gateway**: one HTTPS origin that proxies the whole mesh. It is a Vite server used only as proxy + static + TLS, and it **starts nothing else** — no backend, no app dev server. An unreachable target surfaces as a 502/`ECONNREFUSED`; nothing is masked or retried against a fallback.

**Port:** `--port` → `env.gateway.port` → built-in `5173`, with `strictPort` on. The resolved port and **its source** are printed at startup. Do not assume `:5173`; give a checkout its own with `descix config set-gateway-port <n>`.

**It serves ONE app, standalone — the shell opens ON your app instead of the store.** (Standalone is the INITIAL VIEW, not a reduced mode: the platform views stay reachable by navigation.) The app is detected from the directory you are standing in (the product whose `localPath` contains your cwd; longest match wins), or named with `--app <id>`. Nothing is persisted to `workspace.json`. When it cannot name an app it fails loud and lists the workspace's apps rather than falling back to the store.

The binding is **served, not compiled**: the gateway answers `GET /__descix/app-binding.json` on the shell's own origin with `{mode:'standalone', appId, appUrl, source}`, and the shell reads it before it mounts. One pre-built cloud shell bundle therefore boots as the store on `descix.net` and as your app locally, with no rebuild. No binding (or a timeout, or a malformed body) means the store — the safe degradation. There is no `__STANDALONE_APP_ID__` build define; an app that builds itself standalone declares it at its own mount, `<AppShell appId="..." standalone>`.

### `/p/<appId>` is a LOCAL route only

The gateway serves your app at `/p/<appId>`. **That path does not exist in the cloud.** Deployed
apps are served on their own host, `{appId}.{env}.descix.net`. Measured against dev:

```
# LOCAL — the /p/ form, served by your own gateway
https://localhost:5173/p/egpt-godsworld/       works   (gateway port varies)

# CLOUD — measured against dev
https://egpt-godsworld.dev.descix.net/         -> 200  (the deployed app, per-app host)
https://dev.descix.net/p/egpt-godsworld/       -> 404  (the /p/ form does not exist here)
```

So a URL that works all through local development 404s the moment you point it at a deployed
environment. If you are writing a link, a redirect, or a test that must survive deployment, use
the per-app host; keep `/p/` for the local gateway, where it is the correct and necessary form.

**Every app the shell iframes is on the GATEWAY origin** — `/p/{appId}`, never the app's own dev-server port. The shell dispatches chat action blocks by reaching straight into `iframe.contentWindow.DeSciX_Actions` (direct interframe scripting, no postMessage bridge), so a cross-origin iframe kills SplitView with a `SecurityError`. **Powch is the deliberate exception** and stays cross-origin: it holds passkeys and the HD wallet, and same-origin would expose it to that same reach.

Typical app-dev session, in full:

```bash
descix config set-env dev
descix app init -a <app-id> -p ./my-app
descix app set-site -a <app-id> --static .
cd my-app && descix serve
```

### 3.1. Configuration: `.descix/workspace.json`
The `workspace.json` file is the **single source of truth** for local routing and app configuration. This is the only configuration methodology - `.descix.app/context.json` files are no longer used.

**Key Features:**
- Workspace root detection (walks upward looking for `.descix/workspace.json`)
- App context autodiscovery (CLI commands auto-detect community/app from cwd)
- Explicit port registration for local dev servers — there is **no auto-allocation**
- Drive folder configuration for `descix drive pull` / `descix drive push`

**Author it with CLI verbs, never by hand:**

| Key | Verb |
|---|---|
| `env.apiUrl` | `descix config set-env <dev\|demo\|prod> [--url <url>]` (env is positional) |
| `env.gateway.port` | `descix config set-gateway-port <n\|none>` |
| `env.devCerts` | `descix config set-dev-certs --dir\|--cert\|--key\|--clear` |
| `env.powchUrl` | `descix config set-powch-url <url\|none>` |
| `env.siteUrl` | `descix config set-site-url <url\|none>` |
| `env.products[]` | `descix app init` / `app set-site` / `app set-port` / `app set-localpath` / `app unmap` |

#### Format (v2.1 — the only format)

```json
{
  "version": "2.1",
  "env": {
    "environment": "DEV",
    "apiUrl": "https://dev.descix.net",
    "gateway": { "port": 5599 },
    "devCerts": { "dir": "/Users/you/.descix/dev-certs-san" },
    "powchUrl": "https://powch.dev.descix.net/",
    "platform": {
      "appId": "daita",
      "localPath": "DeSciX_Cloud",
      "site": { "port": 5174 },
      "microservice": { "port": 4000 }
    },
    "products": [
      { "appId": "my-app", "localPath": "my-app", "site": { "static": "." } },
      { "appId": "other-app", "localPath": "other", "site": { "port": 5599 }, "microservice": { "port": 4001 } }
    ]
  }
}
```

`env.platform` is optional — an app developer has no platform checkout and needs none. A top-level `apiUrl` key (the v1 shape) fails loud naming its replacement.

#### KB sync is manifest-driven

`descix kb corpus sync -a <app-id> [-k <KB>]` is the KB sync. It is **git-aware**: it walks the
sources named in a manifest at `<checkout>/.descix/manifests/<KB>.json`, resolves them at a git
ref (`main` unless `--ref` overrides), and upserts only what changed — stale blob SHAs are purged
in the same pass. **No manifest means nothing to sync**, so the manifest is the first thing a new
KB needs, not an optimisation.

Check before you write: `--dry-run` enumerates would-be upserts and purges with **no** Pinecone
writes (exit 0 = no drift, 1 = drift), and `--show-walk` prints the resolved ref and the walked
files. `descix kb corpus status` shows files, chunks, last sync and resolved ref.

**Only text extensions are ingested.** The corpus walk takes `.md .txt .js .mjs .cjs .ts .tsx .jsx .py .rs .go .sol .lean .json .jsonl .yaml .yml .toml .csv .tex .sh .bash` (`PROCESSABLE_EXTENSIONS` in `lib/core/CorpusWalker.js`); any other file in a manifest source, `.mdc` included, never enters a knowledge base.

#### What you put in a KB changes what comes out of it

Retrieval is **vocabulary-dominated**, and when it goes wrong it does so silently. Measured against
a live KB of primary papers: a domain-plausible paraphrase of a paper's thesis returned a *sibling*
paper at 0.469 and never surfaced the correct one at all; rephrasing the same question in the
paper's own wording returned it at 0.575. Same KB, same document, correctly indexed the whole time.

Neither failure looked like a failure. Both returned confident, on-topic prose scoring in the same
0.45–0.58 band as the right answer, so nothing in the response told the caller they had the wrong
document.

For callers:
- Phrase queries in the **source's own vocabulary**; quote a distinctive phrase where you can.
- Never treat rank-1 as authoritative alone. Pull `limit >= 3` and **check `fileName`**.
- A confident, well-scored answer is not evidence the right document was retrieved. Verify by
  **document identity**, not by score.

For curators, which is the part that bites: **mixing overview or summary documents into a KB with
the primary sources they describe systematically shadows those primaries.** Overviews are written in
general vocabulary, so they match paraphrases *better* than the specific documents they summarise —
the survey outranks the paper for exactly the reader who does not yet know the paper's terms.

### 3.2. Target resolution (one owner, explicit-first)

| Target | 1. flag / env | 2. workspace | 3. global | 4. default |
|---|---|---|---|---|
| **API** | `--api-url` / `--env` / `DESCIX_API_URL` | `env.apiUrl`, then the legacy top-level `apiUrl` | `~/.descix/config.json` `api_url` | **the declared default: PROD** |
| **Shell** (`/`) | `--site-url` | `env.siteUrl` | **the API origin, when the API is remote** | `env.platform.site.port`, else fail loud |

**There is no port-derived step for the API.** An environment NAME never becomes an origin, and
`env.platform.microservice.port` is not consulted: a local backend is a URL you name
(`descix config set-env dev --url https://localhost:4000`, or `env.apiUrl` direct). **This is
platform-dev mode** — running your own local backend (Scenario 2 below), not part of standard app
development, which targets a hosted environment (`descix config set-env dev` with no `--url`, or
`demo`/`prod`). The single owner of this order is `lib/origin.js::PRECEDENCE`; this table is a
description of it, not a second copy of the rule.

**Every resolution carries its SOURCE, and every network-bound command prints it on stderr** —
always, not only when it lands on the default:

```
env: prod (default — no workspace config; `descix config init --env dev` targets DEV) <prod origin>
env: dev (.descix/workspace.json env.apiUrl) https://dev.descix.net
```

An unconfigured workspace resolving to PROD is the shipped product's declared target, not a
fallback; what makes it legitimate is that it is announced. A configured-but-unusable origin is
a different case and FAILS LOUD naming the remedy, rather than quietly becoming the default.

The derived Shell rule is the important one: point the API at a cloud environment and the shell comes from that same origin, so one origin carries shell + app + `/apifront` with nothing else configured. A stale `env.platform.site` block does not hijack the root once the API is remote. Platform developers opt IN to a local shell by naming it (`--site-url https://localhost:5174` or `env.siteUrl`).

### 3.3. The dev certificate and passkey sign-in

The gateway's HTTPS uses one certificate: the pair named by `env.devCerts`
(`descix config set-dev-certs`), else the SDK's shipped self-signed pair (SAN `localhost`,
`127.0.0.1`, `::1`). The same pair serves every app dev server behind the gateway.

**Chrome refuses WebAuthn on a tab whose certificate is untrusted, and it judges the whole tab.**
The Powch sign-in iframe on `powch.descix.net` therefore fails inside an untrusted
`https://localhost:<port>` tab, even though Powch's own origin is trusted.

| Symptom | Meaning |
|---|---|
| Powch/ChatWidget log shows only `User cancelled` on sign-in | Powch's panel-close rejection; the real error is in the browser console |
| Browser console: `NotAllowedError: WebAuthn is not supported on sites with TLS certificate errors` | the gateway certificate is not trusted (or has expired) |
| `descix serve` banner: `Passkey sign-in will fail: <reason>. Run: descix dev-certs trust` | same, detected before the browser opens |
| `descix doctor` row "Dev certificate" not passing | same |

| Command | Who runs it | Effect |
|---|---|---|
| `descix dev-certs check [--json]` | the assisting agent | resolves the cert the gateway uses; exits 0 only when it is trusted; reports `unverifiable` with the reason on Linux and Windows |
| `descix doctor` | the assisting agent | includes the same result as the "Dev certificate" check |
| `descix dev-certs trust` | **the human** | macOS: trusts that cert in the login keychain (password prompt), re-checks, and says to quit and reopen Chrome |

**Assisting-agent flow:**

1. Run `descix doctor` (or `descix dev-certs check`).
2. If the dev certificate is trusted, continue. Passkey failures then have another cause.
3. If it is not trusted, hand the human exactly one command to run in their own terminal:
   `descix dev-certs trust`. It needs their macOS login password, so the agent does not run it.
4. When they report it succeeded, tell them to **quit Chrome completely and reopen it** (a running
   Chrome keeps its old verdict), reload the `descix serve` URL, and sign in again.
5. Run `descix dev-certs check` again and confirm exit 0 before calling sign-in fixed.

**Linux and Windows:** the check reports `unverifiable`, and `descix dev-certs trust` is macOS-only.
Trusting the cert is a manual step that has not been verified on DeSciX: import the gateway's
`cert.pem` into the store Chrome reads (Linux: the NSS database,
`certutil -d sql:$HOME/.pki/nssdb -A -t "P,," -n descix-localhost -i <cert.pem>`; Windows: the
Current User "Trusted Root Certification Authorities" store), then restart the browser. Tell the
human it is unverified.

## 4. Scenarios

### Scenario 1: App Dev (the common case)
*   **User**: App developer. No platform checkout.
*   **Setup**: `descix config set-env dev`, `descix app init`, `descix app set-site`, `descix dev-certs check` (if not trusted, the human runs `descix dev-certs trust` once — §3.3), then `cd my-app && descix serve`.
*   **Result**: one HTTPS origin. `/` → the cloud App Shell, `/apifront` → the cloud API, `/p/my-app` → your app, and the shell boots **standalone into your app** — its INITIAL VIEW is your app rather than the store, with the platform views still reachable from there.

### Scenario 2: Platform Dev ("Dogfooding")
*   **User**: Core team, full repo checkout.
*   **Setup**: start the backend (`:4000`), the platform site (`:5174`), Powch site/service as needed, then `descix serve --site-url https://localhost:5174`.
*   **Result**: the gateway routes `/` to the local shell, `/apifront` to the local Core, `/powch` to the configured Powch origin, `/s/*` to microservices, `/p/{appId}` to product sites.

### Scenario 3: Production
*   **User**: End User.
*   **Setup**: No Local Proxy.
*   **Result**: Traffic hits the Cloud Load Balancer, which applies the same routing rules to direct traffic to GCS buckets and Kubernetes services.

## 5. Client-Side Implications

*   **"Dumb" client**: the shell constructs a canonical relative path and lets the gateway (locally) or the LB (in production) resolve it. No GCS-URL rewriting in client code.
*   **The credential is a body field**, not a cookie and not a header: every call is a relative `POST /apifront/` with the token in the JSON body. There is no `SameSite` problem, no credentialed CORS preflight, and the browser origin is irrelevant to the mesh — same-origin is required for *frame scripting*, not for auth.
*   **Set your framework's base path to `/p/{appId}`.** The gateway does not rewrite paths, so assets requested at `/` will 404.

