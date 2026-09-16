# Workspace Configuration Guide

`.descix/workspace.json` is the CLI's only local configuration file. It is **version 2.1**, it is
written **only by CLI verbs**, and the loader refuses the shapes that hand edits produce. This page
is the schema and the verb that owns each key.

---

## 1. Format (v2.1 — the only format)

```json
{
  "version": "2.1",
  "type": "workspace",
  "workspaceRoot": "/path/to/workspace",
  "env": {
    "environment": "DEV",
    "apiUrl": "https://dev.descix.net",
    "gateway": { "port": 5599 },
    "devCerts": { "dir": "/Users/you/.descix/dev-certs-san" },
    "powchUrl": "https://powch.dev.descix.net",
    "products": [
      { "appId": "egpt-mydocs", "communityId": "egpt", "localPath": ".", "kbId": "General", "site": { "static": "site" } },
      { "appId": "egpt-tool", "communityId": "egpt", "localPath": "tool", "kbId": "General", "site": { "port": 5174 }, "microservice": { "port": 4001 } }
    ]
  },
  "driveConfig": { "base_folder_id": "1ABC..." }
}
```

| Key | Meaning | Owned by |
|---|---|---|
| `env.environment` | `DEV`, `DEMO` or `PROD` | `descix config init --env dev\|demo\|prod` |
| `env.apiUrl` | the API origin this workspace talks to | `descix config init --env …` (known envs) / `descix config set-env <name> --url <origin>` (custom) |
| `env.gateway.port` | the port `descix serve` listens on | `descix config set-gateway-port <port>` |
| `env.devCerts` | `dir`, or `cert` + `key` — the TLS pair for the gateway and every app behind it | `descix config set-dev-certs --dir\|--cert\|--key\|--clear` |
| `env.powchUrl` | Powch's own origin (optional; Powch is cross-origin from the shell by design) | `descix config set-powch-url <url>` |
| `env.siteUrl` | the App Shell origin the gateway proxies `/` to (optional; default is the API origin) | `descix config set-site-url <url>` |
| `env.products[]` | one entry per app in this workspace, see below | `descix app init`, `app set-site`, `app set-port`, `app set-localpath`, `app unmap` |
| `env.platform` | the platform shell's own entry — platform contributors only; an app developer has none | platform runbook |
| `driveConfig.base_folder_id` | the Drive base folder for `descix drive pull/push` | `descix mcp quickstart` |

A product entry:

| Field | Meaning | Written by |
|---|---|---|
| `appId` | the platform app id (`<community>-<short>`) | `descix app init` |
| `communityId` | the app's community; stored so context detection can name it | `descix app init` |
| `localPath` | the app directory, relative to `workspaceRoot` (`.` when the workspace root is the app) | `descix app init -p`, `descix app set-localpath` |
| `kbId` | the default knowledge base (default `General`) | `descix app init --kb` |
| `site.static` | a directory under `localPath` served from disk at `/p/<appId>/` | `descix app set-site --static <dir>` |
| `site.port` | a framework dev server the gateway proxies `/p/<appId>` to (no path rewrite) | `descix app set-site --port <n>` |
| `microservice.port` | the local port the gateway proxies `/s/<appId>` to; `descix microservice init` requires it | `descix app set-port -p <n>` |

Sites and services are started by you (or your framework); the CLI does not store or run a dev command.

### Refused shapes

- A `communities` block with no `env` block — the v1 format — fails on load: `v1 workspace format is
  not supported. Migrate to v2.1.` The file is left untouched; re-create it with `descix config init
  --env …` and `descix app init`.
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
| "base_folder_id missing" | Drive not registered | `descix mcp quickstart` |

The git path (`descix kb corpus sync`) needs none of this.

---

## 6. CLI Context Resolution

`WorkspaceConfig.detectContext()` matches your current directory against every product's resolved
`localPath` (longest match wins) and returns `{ communityId, appId, kbId }` from that entry —
`communityId` is `null` for an entry registered by a CLI that did not yet store it.
`resolveContextWithOptions()` lets explicit `-c` / `-a` / `-k` flags win over detection.

```bash
# From inside an app directory — detected
cd my-app
descix kb corpus sync

# From anywhere — flags
descix kb corpus sync -a egpt-mydocs
descix site status -c egpt -a egpt-mydocs      # site status/list need both when the entry has no communityId
```

---

## 7. File References

| Component | Path | Description |
|-----------|------|-------------|
| WorkspaceConfig | `DeSciX_Core/descix-cli/lib/workspace-config.js` | the loader, the v2.1 writer, `registerApp`, `detectContext` |
| Origin resolution | `DeSciX_Core/descix-cli/lib/origin.js` | flag → `DESCIX_API_URL` → `env.apiUrl` → default |
| GlobalConfig | `DeSciX_Core/descix-cli/lib/global-config.js` | user-level settings (`~/.descixrc`) |
| Config commands | `DeSciX_Core/descix-cli/lib/commands/config.js` | `config init/set-env/set-*` |
| Wallet file | `DeSciX_Core/descix-cli/lib/wallet-file.js` | `.descix/wallet.json` location |
| Corpus sync | `DeSciX_Core/descix-cli/lib/commands/corpus.js` | manifests, sync-state |
