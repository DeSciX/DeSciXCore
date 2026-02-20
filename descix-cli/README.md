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

    **Development Mode**:
    If you are developing locally or against a test environment, you can use the `--dev` flag:
    ```bash
    npx descix setup --dev
    ```
    This defaults to `https://localhost:4000` unless configured otherwise.

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

## Documentation

For full documentation, please refer to the [DeSciX SDK Documentation](../../SERVICE_README_sdk.md).
