# Workspace Configuration Guide

`.descix/workspace.json` is the CLI's only local configuration file. It is **version 3.0
(single-app)**: one repo, one app, and the repo root IS the workspace root. It is written **only by
CLI verbs**, and the loader refuses the shapes that hand edits produce. This page is the schema and
the verb that owns each key.

---

## 1. Format (v3 — the only format)

An app repo's workspace holds exactly one app, `env.app`:

```json
{
  "version": "3.0",
  "type": "workspace",
  "workspaceRoot": "/path/to/my-app-repo",
  "env": {
    "environment": "PROD",
    "apiUrl": "https://descix.net",
    "gateway": { "port": 5599 },
    "devCerts": { "dir": "/Users/you/.descix/dev-certs-san" },
    "powchUrl": "https://powch.descix.net",
    "app": {
      "appId": "egpt-mydocs",
      "communityId": "egpt",
      "kbId": "General",
      "site": { "static": "site" },
      "microservice": { "port": 4001 }
    }
  },
  "driveConfig": { "base_folder_id": "1ABC..." }
}
```

Run `descix app init` **from the repo root** — it writes `env.app` and makes that directory the
workspace root. Inside another DeSciX workspace it refuses (`This directory is nested inside another
DeSciX workspace`) rather than registering into the parent: keep app repos as sibling checkouts. A
workspace that already holds a different app refuses a second one — that app gets its own repo.

| Key | Meaning | Owned by |
|---|---|---|
| `env.environment` | `DEV`, `DEMO` or `PROD` | `descix config init --env dev\|demo\|prod` |
| `env.apiUrl` | the API origin this workspace talks to | `descix config init --env …` (known envs) / `descix config set-env <name> --url <origin>` (custom) |
| `env.gateway.port` | the port `descix serve` listens on | `descix config set-gateway-port <port>` |
| `env.devCerts` | `dir`, or `cert` + `key` — the TLS pair for the gateway and every app behind it; unset means the SDK's shipped pair. Passkey sign-in needs it trusted: `descix dev-certs check`, then the human runs `descix dev-certs trust` (see `reference/local-dev.md` §3.3) | `descix config set-dev-certs --dir\|--cert\|--key\|--clear` |
| `env.powchUrl` | Powch's own origin (optional; Powch is cross-origin from the shell by design) | `descix config set-powch-url <url>` |
| `env.siteUrl` | the App Shell origin the gateway proxies `/` to (optional; default is the API origin) | `descix config set-site-url <url>` |
| `env.app` | THE app this repo holds, see below | `descix app init`, `app set-site`, `app set-port` |
| `driveConfig.base_folder_id` | the Drive base folder for `descix drive pull/push` | no verb; set it in `.descix/workspace.json` |

`env.app`:

| Field | Meaning | Written by |
|---|---|---|
| `appId` | the platform app id (`<community>-<short>`) | `descix app init` |
| `communityId` | the app's community; stored so context detection can name it | `descix app init` |
| `kbId` | the default knowledge base (default `General`) | `descix app init --kb` |
| `site.static` | a directory relative to the workspace root (the repo root) served from disk at `/p/<appId>/` — `site`, `site/dist`, `.` (the root itself) or `../scratch`; an absolute path is refused at the write and on read | `descix app set-site --static <dir>` |
| `site.port` | a framework dev server the gateway proxies `/p/<appId>` to (no path rewrite) | `descix app set-site --port <n>` |
| `site.protocol` | `http` or `https` — the dev server's scheme (dev-server mode only; default `https`) | `descix app set-site --port <n> --protocol <scheme>` |
| `microservice.port` | the local port the gateway proxies `/s/<appId>` to; `descix microservice init` requires it | `descix app set-port -p <n>` |

Sites and services are started by you (or your framework); the CLI does not store or run a dev command.

### Gateway workspaces

A workspace that serves several local app repos behind one `descix serve` (platform contributors)
lists them under `env.gateway`, with paths relative to its own root:

```json
"gateway": { "port": 5599, "shell": "../platform-shell", "appRepos": ["../my-app", "../other-app"] }
```

| Key | Meaning | Verb |
|---|---|---|
| `env.gateway.shell` | the repo whose app the gateway serves at `/` | `descix config gateway set-shell <repo\|none>` |
| `env.gateway.appRepos[]` | repos whose apps the gateway serves at `/p/<appId>` | `descix config gateway add-repo <repo>`, `descix config gateway remove-repo <repo>` |

Run the verbs from the gateway workspace's root; `<repo>` is relative to that root. Each listed repo
holds its OWN v3 workspace (`descix app init` in that repo), and that file is the sole authority on
its app's id, site and microservice — the gateway workspace never restates them. The verbs refuse,
writing nothing: a run in a single-app workspace (one that holds `env.app`), an absolute path, a
repo with no `.descix/workspace.json` or no `env.app`, a repo already listed (or already the
shell), one appId listed twice, and `remove-repo` of a repo that is not listed. `descix serve`
applies the same checks when it reads the file.

`descix site upload -a <appId>` run from a gateway workspace's root operates on the listed repo
whose own workspace names that appId: its `.descix/manifests/site.json`, its `buildCommand` (run
in that repo's root) and its sources. The env, API origin and sign-in are the gateway workspace's.
A listed repo with no workspace or no `env.app` is skipped; an appId no listed repo holds is
refused, naming every repo searched. A matched repo with no site manifest is refused unless `-p
<dir>` names the directory to upload. Every run prints `App repo:` and `Site manifest:` first.

### Refused shapes

- A `communities` block with no `env` block — the v1 format — fails on load: `v1 workspace format is
  not supported. Migrate to v3.` The file is left untouched; re-create it with `descix config init
  --env …` and `descix app init`.
- An `env.platform` or `env.products` block — the multi-app format — fails on load: `v2.1 multi-app
  workspace format is not supported. Migrate to v3 (single-app).` The file is left untouched; run
  `descix config init --env …` and `descix app init -a <app_id>` from each app repo's own root.
- A top-level `apiUrl` key is refused by name; the origin lives at `env.apiUrl` and nowhere else.

---

## 2. Other files under `.descix/`

| File | Written by | Notes |
|---|---|---|
| `.descix/wallet.json` | `descix login` — always at `{workspaceRoot}/.descix/wallet.json` | credentials. `descix clone` appends `.descix/wallet.json` and `.descix/repo_key` to the clone's `.gitignore`; `descix login` and `descix init` do **not** touch `.gitignore` — add the entry yourself before the first commit |
| `.descix/manifests/<KB>.json` | you | corpus manifest: the sources `descix kb corpus sync` walks (paths relative to the repository root, at a git ref) |
| `.descix/manifests/site.json` | you (optional) | site manifest consumed by `descix site upload` |
| `.descix/sync-state/<KB>.json` | `descix kb corpus sync` | last sync commit, synced blob SHAs, `total_chunks` (the store's measured live count) |

---

## 3. Sync Modes

### 3.1 Git Mode (CLI developers)

**Source of truth:** the git repository. **Tool:** the CLI.

1. Author markdown in the repo (or pull Drive documents as markdown with `descix drive pull`).
2. Commit.
3. Name the folder(s) in `.descix/manifests/<KB>.json`.
4. `descix kb corpus sync -a <app>` — walks the manifest's sources at the git ref (`main` unless
   `--ref`), chunks what changed, purges what was deleted, upserts to Pinecone.
5. `descix kb corpus status -a <app> -k <KB>` — files tracked, last sync commit, chunk total.

### 3.2 Drive Mode (PWA users)

**Source of truth:** Google Drive. **Tool:** the PWA; the backend's three-stage pipeline
(Drive → GCS → Pinecone) runs server-side. The CLI never triggers it.

### 3.3 Mode determination

The CLI only performs git-mode operations. If you are using the CLI, you are in git mode; there is no
switch.

---

## 4. Drive Configuration

`driveConfig.base_folder_id` is the root of all DeSciX content in the user's Drive:

```
[User's Base Folder]/
├── [community_id]/
│   ├── community_assets/
│   └── [app_id]/
│       ├── assets/
│       ├── kb/
│       │   └── General/
│       ├── site/
│       └── microservice/
└── [other_community]/
```

The SDK navigates Drive by template path: app `{community}/{app}/`, KB `{community}/{app}/kb/{kb}/`,
assets `{community}/{app}/assets/`, site `{community}/{app}/site/`.

---

## 5. ADC Authentication (Drive verbs only)

`descix drive pull` / `descix drive push` need Google Cloud Application Default Credentials with Drive
scopes:

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive
```

| Error | Cause | Remedy |
|-------|-------|--------|
| "Could not load default credentials" | ADC not configured | `gcloud auth application-default login` |
| "Drive authentication failed" | scopes missing | re-run with the Drive scopes above |
| "Drive is not linked" | `driveConfig.base_folder_id` unset | set `driveConfig.base_folder_id` in `.descix/workspace.json`, or pass `--folder <id>` to `descix drive pull` |

The git path (`descix kb corpus sync`) needs none of this.

---

## 6. CLI Context Resolution

`WorkspaceConfig.detectContext()` returns `{ communityId, appId, kbId }` from `env.app` when your
current directory is the workspace root or anywhere below it.
`resolveContextWithOptions()` lets explicit `-c` / `-a` / `-k` flags win over detection.

```bash
# From inside the app repo — detected
cd my-app-repo
descix kb corpus sync

# From anywhere — flags
descix kb corpus sync -a egpt-mydocs
descix site status -c egpt -a egpt-mydocs      # site status/list need both when the entry has no communityId
```

---

## 7. Where each concept lives (conceptual, not a file map)

| Concept | Owner |
|---|---|
| Workspace loading, the v3 writer, app registration, context detection | `WorkspaceConfig`, internal to `@descix/cli` |
| Origin resolution precedence | flag → `DESCIX_API_URL` → `env.apiUrl` → default (`descix config` commands) |
| User-level settings (`~/.descixrc`) | `GlobalConfig`, internal to `@descix/cli` |
| `.descix/wallet.json` | written by `descix login` |
| Corpus manifests, sync-state | `descix kb corpus` commands, internal to `@descix/cli` |
