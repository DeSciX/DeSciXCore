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

2.  **Setup your workspace**:
    ```bash
    descix setup
    ```
    This will guide you through connecting your Google Drive and setting up your local environment.

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
- `descix setup`: Initialize or repair your workspace configuration.
- `descix status`: View your current environment status and workspace mode.
- `descix init`: Create `.descix/workspace.json` for the current project.
- `descix app create`: Show instructions; use `--quick -c <community> -a <name>` for template-only app creation, or use PWA / `descix-admin app create`.
- `descix sync`: Sync content to the platform (Site, Assets).
- `descix kb`: Manage Knowledge Base content (Pull -> Chunk -> Sync).

## Knowledge Base Management (Git Mode)

For apps managed via CLI (Git Mode), use the following commands to process your Knowledge Base locally:

1.  **Pull**: Fetch source documents from Drive.
    ```bash
    descix kb pull
    ```
2.  **Chunk**: Process documents into chunks locally.
    ```bash
    descix kb chunk
    ```
3.  **Sync**: Push chunks to the platform (Pinecone).
    ```bash
    descix kb sync
    ```
4.  **Build**: Run the full pipeline (Pull -> Chunk -> Sync).
    ```bash
    descix kb build
    ```

## Provisioning

**Communities and apps are created in the PWA** (Workspace Config / Device Setup / App Manager) or via **Admin CLI** (`descix-admin community create`, `descix-admin app create`) for platform admins. The user CLI does not create communities or full app structures; use `descix init` to write `.descix/workspace.json` and PWA or Admin CLI to create entities.

1.  Create your App in the PWA (Workspace Builder).
2.  Run `descix setup` to hydrate your local folder structure.

## Airdrop Admin Operations (WS-ADMIN-B1)

Admin-only commands for triggering airdrop migration batch runs. Per CEO-D-MANUAL-TRIGGER-NO-CRON (2026-04-20), Cloud Scheduler cron was dropped from Round B in favor of operator-invoked manual triggers via this CLI.

**Access:** requires platform-admin membership (enforced server-side via `isPlatformAdmin(user)`).

### `descix airdrop execute-queue`

Manually trigger the server-side `airdrop_execute_queue` command on the target environment. Assembles `pending_migrations` rows into per-community batches and (when `BATCH_UPDATE_BALANCES_BROADCAST_ENABLED=true`) broadcasts to the Powch HD wallet. When the broadcast flag is off (default for DEV), batches are assembled but the downstream Powch handler returns `stopped_at_broadcast_boundary` — useful for verifying queue shape without spending MATIC.

**Options:**

- `--batch-size <n>`: Cap on users processed this run (server caps at `AIRDROP_MAX_RUN_USERS`; a larger `--batch-size` is clamped).
- `--dry-run`: Assemble batches but skip the broadcast call entirely. Emits an `on_chain_log` row with `status: dry_run` for audit.

**Examples:**

```bash
# Dry run against DEV — safe to run repeatedly; no broadcast, no MATIC
descix airdrop execute-queue --env dev --dry-run

# Execute a capped real run (10 users max this invocation)
descix airdrop execute-queue --env dev --batch-size 10

# Execute a full queue run (still gated by BATCH_UPDATE_BALANCES_BROADCAST_ENABLED)
descix airdrop execute-queue --env dev
```

**Audit trail:** every invocation (dry-run or real) writes one `on_chain_log` row with `op.kind = "airdrop_execute_queue_trigger"` and `caller.operator_email = <invoking admin email>`.

**Testing:**

```bash
cd DeSciX_Core/descix-cli && npm test
```

## Documentation

For full documentation, please refer to the [DeSciX SDK Documentation](../../SERVICE_README_sdk.md).
