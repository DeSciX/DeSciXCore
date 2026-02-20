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
| **Content Source** | Local git repo (after initial pull from Drive) | Google Drive |
| **Version Control** | Git | Drive/GCS/Firestore |
| **KB Processing** | Local chunking via `kb build/sync` | Server-side pipeline |
| **Configuration** | `workspace.json` | N/A (PWA handles) |
| **Tools** | CLI, VSCode, Git | PWA only |

## 2. The Canonical Routing Model

Instead of exposing implementation details (like GCS bucket URLs or specific port numbers) to the client, the platform uses **Canonical Paths** for all resources.

### 2.1. Route Patterns

| Resource Type | Canonical Path | Production Target (LB) | Local Target (Proxy) |
| :--- | :--- | :--- | :--- |
| **CodeSite** | `/apps/{community}/{app_id}/*` | `gs://bucket/...` | `http://localhost:{port}/*` |
| **Microservice** | `/api/apps/{community}/{app_id}/*` | `k8s-service:8080` | `http://localhost:{port}/*` |
| **Core API** | `/api/core/*` | `core-service:4000` | `https://api.descix.net/*` |
| **PWA Assets** | `/*` | `gs://pwa-bucket/*` | `https://app.descix.net/*` |

## 3. The "Local Mesh" Proxy

The `descix dev` command (or `vite` in Platform Dev) spins up a **Local Proxy** on port `5173`. This proxy acts as the router, intercepting traffic and directing it based on the **Workspace Configuration**.

### 3.1. Configuration: `.descix/workspace.json`
The `workspace.json` file is the **single source of truth** for local routing and app configuration. This is the only configuration methodology - `.descix.app/context.json` files are no longer used.

**Key Features:**
- Workspace root detection (searches upward for `.descix/`, `.cursor/`, or `.vscode/`)
- App context autodiscovery (CLI commands auto-detect community/app from cwd)
- Port registration for local dev servers
- Drive folder configuration for `kb pull/push`

```json
{
  "communities": {
    "descix": {
      "apps": {
        "appsdk": {
          "localPath": "descix/appsdk",
          "kbId": "General",
          "absolutePath": "/path/to/workspace/descix/appsdk",
          "site": {
            "port": 3000,
            "devCommand": "npm run docs:dev"
          },
          "service": {
            "port": 4001,
            "devCommand": "npm run start"
          }
        }
      }
    }
  },
  "driveConfig": {
    "base_folder_id": "...",
    "base_folder_name": "..."
  }
}
```

### 3.2. Proxy Logic (Pattern Matching)
The Proxy applies the following logic to every request:

1.  **Parse Path**: Extract `community` and `app_id` from the URL (e.g., `/apps/descix/appsdk/...`).
2.  **Check Config**: Look up the app in `workspace.json`.
3.  **Route**:
    *   **Match Found**: Proxy the request to `http://localhost:{port}`.
    *   **No Match**: Proxy the request to the Production upstream (e.g., `app.descix.net` or `api.descix.net`).

## 4. Scenarios

### Scenario 1: Platform Dev ("Dogfooding")
*   **User**: Core Team.
*   **Setup**: Full repo checkout. `workspace.json` maps core apps to local ports.
*   **Result**: The Proxy routes `/apps/descix/appsdk` to the local VitePress instance, and `/api/core` to the local Node server.

### Scenario 2: End-User Dev (Hybrid)
*   **User**: App Developer.
*   **Setup**: `descix init` creates a `workspace.json` mapping *only* their specific app.
*   **Result**:
    *   `/apps/my-community/my-app` -> **Localhost** (User's Dev Server).
    *   `/apps/other-app` -> **Production** (Live GCS).
    *   `/api/core` -> **Production** (Live API).
    *   `/*` (PWA Shell) -> **Production** (Live PWA).

### Scenario 3: Production
*   **User**: End User.
*   **Setup**: No Local Proxy.
*   **Result**: Traffic hits the Cloud Load Balancer, which applies the same routing rules to direct traffic to GCS buckets and Kubernetes services.

## 5. Client-Side Implications

*   **"Dumb" Client**: The PWA Client (`AppData.js`) no longer needs complex logic to rewrite GCS URLs. It simply constructs the canonical path: `/apps/{community}/{app_id}/index.html`.
*   **Embedded Mode**: For embedded scenarios (e.g., iframes), we may retain some legacy rewrite logic as a fallback, but the primary development flow relies on the Proxy.
