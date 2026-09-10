# DeSciX CLI

The official command-line interface for the DeSciX platform.

## Installation

```bash
npm install -g @descix/cli
```

## Quick Start

1.  **Login to DeSciX**:
    ```bash
    descix login
    ```

2.  **Initialize your workspace**:
    ```bash
    descix init
    ```
    This writes `.descix/workspace.json` for the current project. Pass `-c <community_id> -a <app_id>`
    to pre-fill the app context, or `--from-invite <token>` to resolve an invite token.

    **Choosing an environment**:
    The `--dev` flag has been REMOVED. Its absence silently meant production, so the most common
    invocation targeted PROD without saying so. Name the environment instead:
    ```bash
    descix config init --env dev      # or demo, or prod
    ```
    An unconfigured workspace resolves to the declared default, PROD, and every network-bound
    command prints the environment, origin and source it resolved on stderr. For a local backend,
    name the URL: `descix config set-env dev --url https://localhost:4000`.

3.  **Check your status**:
    ```bash
    descix status
    ```

## Workspace Modes

The CLI supports three workspace modes to accommodate different development needs:

### 1. Single App Mode (`single_app`)
Best for individual developers working on one app.
- **Structure**: The root folder is your app folder.
- **Drive Path**: `{community_id}/{app_id}/`

### 2. Single Community Mode (`single_community`)
Best for teams managing multiple apps within one community.
- **Structure**: The root folder is the community folder, containing subfolders for each app.
- **Drive Path**: `{community_id}/`

### 3. Multi-Community Mode (`multi_community`)
Best for platform admins or agencies managing multiple communities.
- **Structure**: The root folder contains subfolders for each community.
- **Drive Path**: `/` (Root of your base folder)

## Core Commands

- `descix login`: Authenticate with the platform.
- `descix status`: View your current environment status and workspace mode.
- `descix init`: Initialize workspace for DeSciX app development (Git-aware) — writes `.descix/workspace.json`.
- `descix app init`: Create (when it does not exist yet) and initialize an app — the one path to an app. See [Creating an App](#creating-an-app).
- `descix site init` / `descix site upload`: Scaffold an app's site, then build and deploy it. See [Deploying a Site](#deploying-a-site).
- `descix app sync-assets`: Sync local assets (`system_instructions.md`, `app_description.md`, `icon.png`) to the platform.
- `descix drive pull` / `descix drive push`: Drive content authoring — pull from Drive to local markdown, push staging back to Drive.
- `descix kb`: Manage Knowledge Bases (`list`, `create`, `delete`, and `corpus sync`).

## Knowledge Base Management (Git Mode)

The CLI exposes exactly ONE knowledge-base sync surface: `descix kb corpus sync`, driven by a
git-tracked corpus manifest. The older four-step local pipeline has been REMOVED — its invocations
now exit non-zero and name this replacement.

1.  **Create** the knowledge base (once per KB):
    ```bash
    descix kb create -c <community_id> -a <app_id> -k <kb_name>
    ```
2.  **Author** a corpus manifest at `.descix/manifests/<kb_name>.json` describing the sources to sync.
3.  **Sync** the corpus to the platform (Pinecone):
    ```bash
    descix kb corpus sync -a <app_id> [-k <kb_name>]
    ```
    It walks the git blobs at the manifest's ref, so only changed files are re-vectorized. Useful
    flags: `--dry-run` (report drift, write nothing), `--show-walk` (print the resolved ref and the
    files it would walk), `--ref <ref>` (override the git ref for all manifest sources).

To fetch source documents from Google Drive into local markdown, use `descix drive pull`.

## Creating an App

`descix app init` is the one path to an app. It creates the app on the platform when it does not
exist yet, then registers and scaffolds it locally — one command, not two.

```bash
descix app init -a <name> -c <community>
```

Pass `-c` to create a new app in that community. **Omit `-c` to initialize an app that already
exists** — the CLI resolves the app from the Products registry and only does the local half.

The command is idempotent, so re-running it on a half-made app finishes the job.

**Options:**

- `-a, --app <app_id>` (required): the app ID. With `-c`, this is the app NAME to create.
- `-c, --community <id>`: the community to create the app in. It must already be materialized in
  this environment. Required only for creation.
- `-s, --short <short_name>`: the short id segment (no hyphens). The `app_id` is composed
  **server-side** as `{community}-{short}`; defaults to `--app`.
- `--overwrite`: when creating, overwrite an existing app record intentionally.
- `--kb <name>`: knowledge base name (default: `General`).
- `-p, --path <dir>`: local app directory (default: auto-detected, else the current directory).

**What it does, in order:**

1.  **Creates the app** (only when `-c` is given and the app does not exist): the server composes
    the unique `app_id` and writes `Products/{app_id}` and `Community/{community}/Apps/{app_id}`.
    Every app is guaranteed a default knowledge base at creation.
2.  **Registers it in `.descix/workspace.json`** if it is not already mapped.
3.  **Scaffolds the app folder**: creates `site/`, `microservice/` and `assets/`, and writes
    `assets/system_instructions.md` and `assets/app_description.md` when they do not exist.
4.  **Creates the knowledge base record** for Git-mode sync.

It fails loud rather than guessing: initializing an app that does not exist without `-c` names the
`-c` invocation that would create it; a `-c` that disagrees with the app's real community is
refused; and `-p` against an already-mapped app names `descix app set-localpath` instead.

**Next step** — author a corpus manifest at `.descix/manifests/<kb_name>.json`, then
`descix kb corpus sync -a <app_id>`.

Creating a **community** is a separate, admin-only operation: `descix community create` requires
platform-admin membership and deploys a real ERC-20 token contract to live Polygon. App developers
work inside a community that already exists.

## Deploying a Site

An app's site is scaffolded, then uploaded. `descix site upload` is the deploy verb — there is no
`descix site deploy`.

```bash
descix site init      # scaffold site/ (optional — upload works on any site directory)
descix site upload --env dev
```

### `descix site init`

Copies the site scaffold — `index.html`, `app.js`, `styles.css`, `DeSciXAppSDK.js`, `README.md` —
into the app's `site/` directory. The app must already be mapped in `.descix/workspace.json`.

- `-f, --force`: overwrite an existing `site/` folder.
- `-c, --community <id>` / `-a, --app <id>`: auto-detected from context when omitted.

It scaffolds site content only; it writes no manifest. Skip it entirely if you already have a site.

### `descix site upload`

Builds (when a manifest declares a build) and uploads the site to GCS, then updates the app's
metadata. Files are uploaded straight to GCS with short-lived **signed URLs** issued by
`get_site_deploy_token`; `confirm_site_deploy` then records the deploy and returns the site URL.

- `-p, --path <localPath>`: directory to deploy (default `./site`). **Ignored when a site manifest
  exists.**
- `--preview`: deploy to the preview path.
- `--full`: force a full upload, ignoring the unchanged-file delta.
- `--dry-run`: show what would be deployed.
- `--no-cache`: set `Cache-Control: no-cache`.
- `-c, --community <id>` / `-a, --app <id>`: auto-detected from context when omitted.

**Site deploys target a cloud environment.** An upload that resolves to a local backend without
this invocation naming its target is refused — pass `--env <dev|demo|prod>`.

**Manifest-driven builds.** When `{app_root}/.descix/manifests/site.json` exists it takes over from
`-p`. Author it yourself; nothing generates it for you. It declares the sources to walk and,
optionally, a `buildCommand`, which runs in the app root with the environment-specific `VITE_*`
build variables the server returns injected into its environment:

```json
{
  "sources": [{ "path": "site/dist", "include": ["**/*"] }],
  "buildCommand": "npm run build --prefix site"
}
```

## Airdrop Admin Operations (WS-ADMIN-B1)

Admin-only commands for triggering airdrop migration batch runs. Per CEO-D-MANUAL-TRIGGER-NO-CRON (2026-04-20), Cloud Scheduler cron was dropped from Round B in favor of operator-invoked manual triggers via this CLI.

**Access:** requires platform-admin membership (enforced server-side via `isPlatformAdmin(user)`).

### `descix airdrop execute-queue`

Manually trigger the server-side `airdrop_execute_queue` command on the target environment. Assembles `pending_migrations` rows into per-community batches and (when `BATCH_UPDATE_BALANCES_BROADCAST_ENABLED=true`) broadcasts to the Powch HD wallet. When the broadcast flag is off (default for DEV), batches are assembled but the downstream Powch handler returns `stopped_at_broadcast_boundary` — useful for verifying queue shape without spending MATIC.

**Read-only is the default.** Without `--apply`, the command runs as a dry run.

**Options:**

- `--dry-run`: Read-only preview — encode calldata, estimate gas, validate the net-zero invariant. No PK, no transaction, no state mutation. Mutually exclusive with `--apply`.
- `--apply`: Live execution. Requires `--signer-pk-file` or the interactive prompt, and requires `--community`.
- `--community <slug>`: Community slug for per-community batch scoping. **Required for `--apply`**; optional in dry-run mode, where omitting it returns an aggregate preview across communities.
- `--signer-pk-file <path>`: Path to a file containing the admin signer PK (`0x` + 64 hex). Used for `--apply`; when omitted, the PK is requested at an interactive no-echo prompt. Inline PK flags and environment variables are rejected on security grounds (process-listing leak).
- `--batch-size <n>`: Cap on users processed this run (server caps at `AIRDROP_MAX_RUN_USERS`; a larger `--batch-size` is clamped).

**Examples:**

```bash
# Dry run against DEV — safe to run repeatedly; no PK, no tx, no state mutation
descix airdrop execute-queue --env dev --dry-run

# Dry run scoped to one community
descix airdrop execute-queue --env dev --dry-run --community smile

# Live execution, capped at 10 users this invocation (prompts for the signer PK)
descix airdrop execute-queue --env dev --apply --community smile --batch-size 10

# Live execution reading the signer PK from a file
descix airdrop execute-queue --env dev --apply --community smile --signer-pk-file ./signer.key
```

**Testing:**

```bash
cd DeSciX_Core/descix-cli && npm test
```

## Documentation

For full documentation, please refer to the [DeSciX SDK Documentation](./SERVICE_README_sdk.md).
