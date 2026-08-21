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

**It serves ONE app, standalone, with no store chrome.** The app is detected from the directory you are standing in (the product whose `localPath` contains your cwd; longest match wins), or named with `--app <id>`. Nothing is persisted to `workspace.json`. When it cannot name an app it fails loud and lists the workspace's apps rather than falling back to the store.

The binding is **served, not compiled**: the gateway answers `GET /__descix/app-binding.json` on the shell's own origin with `{mode:'standalone', appId, appUrl, source}`, and the shell reads it before it mounts. One pre-built cloud shell bundle therefore boots as the store on `descix.net` and as your app locally, with no rebuild. No binding (or a timeout, or a malformed body) means the store — the safe degradation. There is no `__STANDALONE_APP_ID__` build define; an app that builds itself standalone declares it at its own mount, `<AppShell appId="..." standalone>`.

### `/p/<appId>` is a LOCAL route only

The gateway serves your app at `/p/<appId>`. **That path does not exist in the cloud.** Deployed
apps are served on their own host, `{appId}.{env}.descix.net`. Measured against dev:

```
https://egpt-godsworld.dev.descix.net/       -> 200   (the deployed app)
https://dev.descix.net/p/egpt-godsworld/     -> 404   (local-only route)
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

`descix kb chunk`, `descix kb sync` and `descix update kb` still run but are **superseded
duplicates** — each names `kb corpus sync` as its replacement in its own `--help` and is slated
for removal. Do not put them in new instructions.

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

| Target | 1. flag | 2. workspace | 3. derived | 4. default |
|---|---|---|---|---|
| **API** | `--api-url` / `DESCIX_API_URL` | `env.apiUrl` | `env.platform.microservice.port` | **PROD** (`https://descix.net`) |
| **Shell** (`/`) | `--site-url` | `env.siteUrl` | **the API origin, when the API is remote** | `env.platform.site.port`, else fail loud |

The derived Shell rule is the important one: point the API at a cloud environment and the shell comes from that same origin, so one origin carries shell + app + `/apifront` with nothing else configured. A stale `env.platform.site` block does not hijack the root once the API is remote. Platform developers opt IN to a local shell by naming it (`--site-url https://localhost:5174` or `env.siteUrl`).

## 4. Scenarios

### Scenario 1: App Dev (the common case)
*   **User**: App developer. No platform checkout.
*   **Setup**: `descix config set-env dev`, `descix app init`, `descix app set-site`, then `cd my-app && descix serve`.
*   **Result**: one HTTPS origin. `/` → the cloud App Shell, `/apifront` → the cloud API, `/p/my-app` → your app, and the shell boots **standalone into your app** with no store chrome.

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

## 6. Running from a git worktree

`.descix/workspace.json` is gitignored, so no worktree has one. The gateway walks **up** from cwd to find it, so an in-repo worktree silently inherits the **main checkout's** workspace — its port, its products, its `localPath`s. Copying the file into a worktree does not help: a saved workspace bakes an absolute `workspaceRoot` and prefers it over the discovered root, pointing back at the original checkout. Out-of-repo worktrees fail earlier and more confusingly: a credential-loading command reports **"Authentication required… Run: descix login"** when the real cause is a missing workspace file.

Rules of thumb: run the CLI from the canonical checkout, and treat an auth error raised from a worktree as a workspace-resolution suspect *before* re-authenticating.

### Deploying: probe the credential the action actually uses

`deploy-env.sh` will refuse to start rather than fail halfway:

```
gcloud credentials are NOT usable (expired user session, or no active account)...
Refusing to start a real deploy that would fail partway through.
```

That refusal is the script working correctly, and **an expired gcloud user session alongside live
ADC is a normal steady state**, not a broken machine. The two are different credentials behind one
word: the deploy path needs the **user session**, while most quick probes reach for **ADC**.

This is the trap: `gcloud auth application-default print-access-token` returns a token, you record
"gcloud is fine", and that observation is *true and irrelevant*. **Probe the credential the action
actually uses, not an adjacent one that happens to answer.**

The remedy is one line, needs no re-auth prompt, and the script prints it itself:

```bash
export CLOUDSDK_AUTH_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"
[ -n "$CLOUDSDK_AUTH_ACCESS_TOKEN" ] || { echo "empty token"; exit 1; }
```

Assert it non-empty before launching — an empty token reproduces the same refusal one layer later,
where it is harder to recognise.

**Why this is written down rather than left to be rediscovered:** without it, the next agent reads
a correct fail-loud refusal as *platform unreachable* and stops under the platform-reachability
rule — halting a lane and escalating, over a one-line export the script had already told it. A
fail-loud message nobody knows how to act on still costs a lane.

### Exit codes from wrappers are not evidence

A deploy wrapper ending in `| tail` returns **tail's** status, not the deploy's. A run can report
exit 0 while the deploy correctly returned 1. Capture the real status *before* anything pipes it:

```bash
deploy-env.sh dev; rc=$?          # capture FIRST
deploy-env.sh dev 2>&1 | tail -40 # then look at output separately
```

To confirm a deploy succeeded, **read the log, not the exit code** — and where the artifact is
observable (a served object's timestamp, a string in the shipped bundle), check that instead. A
pipe silently drops information in both directions: `| tail` hides a failure, and `| head` hides
later matches from a search that looks complete.

### The SDK you edit is not always the SDK you serve

A second, sharper worktree trap, and it is silent. `DeSciX_Cloud/site/node_modules/@descix/app-sdk`
is a **symlink into the canonical Core checkout**:

```
$ readlink DeSciX_Cloud/site/node_modules/@descix/app-sdk
../../../../DeSciX_Core/descix-app-sdk
```

and `@descix/app-sdk` has **no build step** — its `main` and its `.` export both point straight at
`./src/index.js`, so Vite serves the package source as-is. Put those two facts together: **`descix
serve` serves whatever the CANONICAL Core working tree contains**, no matter which worktree you are
editing in. Change `app-sdk` on a branch, reload, and you are still running canonical `main` — your
edit is not in the page, nothing errors, and the obvious conclusion ("my change had no effect") is
wrong.

Verify what is actually being served before you conclude anything about a change:

```bash
readlink DeSciX_Cloud/site/node_modules/@descix/app-sdk       # where the symlink points
node -p "require.resolve('@descix/app-sdk')"                  # from the site directory
```

If it resolves to the canonical checkout and you are editing elsewhere, you are measuring the wrong
tree. Re-point the symlink at your worktree for the measurement **and restore it afterwards** — it
is untracked, so nothing will remind you.
