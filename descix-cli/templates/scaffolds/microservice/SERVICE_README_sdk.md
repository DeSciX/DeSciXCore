# DeSciX SDK - CLI and MCP Tools

## Overview

The DeSciX SDK provides command-line tools and MCP (Model Context Protocol) integration for building applications on the DeSciX platform. The SDK enables developers to authenticate, manage workspaces, create apps, and leverage AI-assisted development through editor MCP integration (Claude Code, Copilot, Cursor, Cline).

**Key capabilities:**
- CLI commands for all platform operations
- MCP server integration for Claude Code, Copilot, Cursor and Cline
- Intelligent tool discovery via `tell_me_how`
- Entitlements-driven workspace setup
- Git-aware project initialization

---

## Installation

```bash
# Global install (recommended)
npm install -g @descix/cli

# Or via npm link during development
cd DeSciX_Core/descix-cli
npm link
```

---

## CLI Commands

### descix quickstart

**Description:** One-command setup: auth → workspace → agent files → MCP config
**Use when:** First time setting up DeSciX in a new workspace
**What it does:**
1. Authenticates via device login if no valid session exists
2. Initializes `.descix/workspace.json` if missing
3. Generates agent instruction files (`CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules`, `.clinerules`) from the workspace's registered app/community
4. Generates `.vscode/mcp.json` for MCP server config (skipped if the DeSciX VS Code extension already handles MCP)
5. Copies SDK assets into `.descix/sdk-assets/`

**Example:**
```bash
cd ~/Projects/MyApp
descix quickstart
# Follow the prompts
```

---

### descix login

**Description:** Authenticate with the DeSciX platform
**Use when:** Session expired or first-time authentication
**Options:**
- (default, no flag needed): Device login — opens a browser for Powch authentication
- `--wallet`: Direct wallet signature authentication (advanced, not yet implemented)
- `-u, --url <url>`: API URL override
- `--no-oauth`: Skip the OAuth long-lived token leg (wallet-signature login only)
- `--scope <scope>`: OAuth scope to request (default: `mcp:read mcp:tools mcp:write mcp:admin`)

**Example:**
```bash
descix login
# Opens browser, complete authentication
# Credentials saved to .descix/wallet.json
```

---

### descix whoami

**Description:** Display current authentication status
**Use when:** Checking if you're logged in and what account you're using

**Example:**
```bash
descix whoami
# Output:
# User: sam@descix.net
# Wallet: 0xe71b412d...
# Session: Valid
```

---

### descix tell-me-how

**Description:** Discover platform tools using natural language
**Use when:** You don't know which command to use for a task

**Options:**
- `--scope project`: Search within current workspace apps
- `--scope entitlements`: Search apps you have access to (default)
- `--scope discovery`: Search all platform tools
- `--json`: Output raw JSON response

**Examples:**
```bash
# Find how to create an app
descix tell-me-how "How do I create a new app?"

# Search within current project
descix tell-me-how --scope project "How do I sync my knowledge base?"

# Discover all available tools
descix tell-me-how --scope discovery "What AI training tools exist?"
```

---

### descix app init

**Description:** Create (if needed) and initialize an app: platform record + default KB + local workspace registration and scaffold. Idempotent.
**Use when:** Starting a new project or hydrating an existing app. This is the single canonical path — the old two-step `app create` then `app init` is deleted; `descix app create` now hard-fails naming this replacement.
**Options:**
- `-a, --app <app_id>` (required): App ID. With `-c` this is the app NAME to create.
- `-c, --community <id>`: Community ID — required to create an app that does not exist yet
- `-s, --short <short_name>`: Short id segment (no hyphens) used when creating; defaults to `--app`
- `--overwrite`: When creating, overwrite an existing app record intentionally
- `--kb <name>`: Knowledge base name (default: `General`)
- `-p, --path <dir>`: Local app directory (default: auto-detected or cwd)

**Example:**
```bash
descix app init -a myapp -c descix
```

---

### descix kb

**Description:** Manage Knowledge Base registration, corpus sync and per-KB configuration
**Use when:** Creating a KB, syncing its corpus to Pinecone, or managing per-KB settings

**Subcommands:**
- `create` / `list` / `delete`: Register, list or remove a KB
- `corpus sync`: The one KB sync surface — walks the corpus manifest, chunks in-memory, pushes to Pinecone
- `set-override-model` / `clear-override-model`: Pin or clear a per-KB model override
- `status`: Show corpus sync state (files, chunks, last sync, resolved ref)
- `doctor`: Detect drift between local sync-state and live Pinecone vector count
- `records put|query|get|delete`: Structured record CRUD on a KB

**Drive content authoring is a separate command:** `descix drive pull` / `descix drive push` (not under `kb`) move source documents between Drive and the local working tree.

**Example:**
```bash
# Sync a KB's corpus manifest to Pinecone
descix kb corpus sync -a myapp -k General
```

---

### Calling /apifront from your microservice (data plane)

**The microservice IS the CLI's api-client running in the cloud** (CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG). To call Core commands (`app_records_*`, `get_app_asset`, `get_asset_upload_token`, RAG, ...) the scaffold's `mcpClient` authenticates to `/apifront` **exactly like the CLI**: it holds the **developer's own durable credential** (`wallet_address` + `signature`) and calls `reconnect_by_wallet` to mint a session — then makes calls **as the developer**. There is NO `register-delegate`, NO `SERVICE_KEY`, NO service account, NO OIDC.

**Provide the developer credential (gitignored / secret — never checked in):**
1. Copy `dev-overrides.example.json` → `dev-overrides.json` (this file is `.gitignore`d).
2. Fill in `DEVELOPER_WALLET_ADDRESS` + `DEVELOPER_SIGNATURE` — your own values from `.descix/wallet.json` (the durable `signature`, not the expiring session token).
3. In prod these come from a **secret**, never a checked-in file. They must NOT live in `defaults-config.json` (the signature is a credential).

The scaffold reads them via `utils.DEVELOPER_WALLET_ADDRESS` / `utils.DEVELOPER_SIGNATURE` and HARD-FAILS (no fallback) if absent.

**Canonical microservice onboarding sequence:**
```bash
descix app init      -a <app> -c <community>
descix app set-port  -a <community>-<app> -p <port>
descix microservice register
# then: cp dev-overrides.example.json dev-overrides.json  and fill in the developer credential
```

> `descix microservice register-delegate` still exists for genuine **service-slot** mesh calls (one service calling another's tools as a delegate). It is NOT used for the app **data plane** — that authenticates as the developer per the model above.

---

### descix microservice vectorize

**Description:** Vectorize a SERVICE_README for tell_me_how discovery
**Use when:** Adding or updating service documentation
**Options:**
- `-n, --name <name>`: Service name
- `-c, --community <id>`: Community ID
- `-a, --app <id>`: App ID
- `-r, --readme <path>`: Path to README file

**Example:**
```bash
descix microservice vectorize -r ./SERVICE_README_myservice.md
```

---

### descix purchases

**Description:** List your entitlements (communities, apps, service slots)
**Use when:** Checking what resources you have access to

**Example:**
```bash
descix purchases
# Output shows communities, apps, and service slots
```

---

## MCP Tools

After running `descix quickstart` and reloading your editor/session, these MCP tools are available to the AI agent. `descix quickstart` authenticates via device login as its first step (opens a browser device-code flow) before it writes workspace, agent-instruction and MCP config files; there is no unauthenticated form of any of this.

### tell_me_how

**Description:** Primary discovery tool - finds relevant commands for any task
**Prerequisite:** the caller is signed in — it returns caller-specific context and is refused loud (`Authentication required`, exit 1) for a credential-free caller, never a silent partial answer
**Use first:** Once signed in, always use this before attempting platform operations

```javascript
tell_me_how({ 
  question: "How do I deploy my app?",
  scope: "entitlements"
})
```

**Scope options:**
- `project`: Uses `.descix/workspace.json` mappings
- `entitlements`: Only tools you have access to (default)
- `discovery`: All platform tools (may require purchase)

---

### execute_remote_command

**Description:** Execute any backend command discovered via tell_me_how
**Use after:** tell_me_how returns recommended commands

```javascript
execute_remote_command({
  command: "create_app_for_community",
  params: {
    community_id: "descix",
    app_name: "My New App"
  }
})
```

---

### query_knowledge_base

**Description:** Vector-similarity search over a knowledge base — returns raw source chunks with dereferenceable citations (retrieval, no synthesis, stateless)
**Use when:** You want primary-source passages/citations, or to ground/check an `ask_question_to_app` answer

```javascript
query_knowledge_base({
  app_id: "docs",
  kb_id: "sdk",
  query: "How do I authenticate?"
})
```

---

### ask_question_to_app

**Description:** Ask a natural-language question against an app's knowledge base and get a synthesized, cited answer (stateful — pass `previous_interaction_id` to continue a thread)
**Use when:** Complex questions requiring AI reasoning over a community's own sources

```javascript
ask_question_to_app({
  app_id: "docs",
  knowledgebase_name: "sdk",
  user_input: "Explain the authentication flow step by step"
})
```

---

## Workspace Configuration

### workspace.json (v2.1 — canonical)

`.descix/workspace.json` is written and mutated by `descix init` / `descix app init` / `descix app set-*` — never hand-edited. The v2.1 format is `env.platform` (the shell/store app, served at root) plus `env.products[]` (apps hosted inside the shell); the older `communities`-based v1 format is not supported and hard-errors on load ("v1 workspace format is not supported. Migrate to v2.1."):

```json
{
  "version": "2.1",
  "env": {
    "platform": { "appId": "daita", "communityId": "descix", "localPath": ".", "kbId": "General" },
    "products": [
      { "appId": "docs", "communityId": "descix", "kbId": "sdk", "localPath": "descix-docs" }
    ]
  }
}
```

A single-app (non-monorepo) workspace uses the same v2.1 shape with only `env.platform` set and an empty (or omitted) `env.products[]` — there is no separate single-app file format.

---

## Common Workflows

### New Developer Onboarding

1. Install CLI: `npm install -g @descix/cli`
2. Run quickstart: `descix quickstart` — authenticates, initializes `.descix/workspace.json`, generates agent instruction files (`CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules`, `.clinerules`) for Claude Code, Copilot, Cursor and Cline, and writes `.vscode/mcp.json` (skipped if the DeSciX VS Code extension is installed — it registers MCP natively)
3. Reload the editor/session so it picks up the generated files
4. AI agent can now use MCP tools
5. Ask: "How do I create an app?"
6. AI uses `tell_me_how` → `execute_remote_command`

### Entitlements-First App Creation

1. AI calls `fetch_my_purchases()` directly (it is its own MCP tool, not an `execute_remote_command` target)
2. AI presents user's communities and apps
3. User selects community (or creates new)
4. AI calls `execute_remote_command({ command: "create_app_for_community", params: {...} })` for app creation
5. AI runs `descix app init` to register the local workspace mapping in `.descix/workspace.json`

### Monorepo Setup

1. AI calls `fetch_my_purchases` to get entitlements
2. AI scans workspace folders
3. AI asks user: "Map `frontend/` to which app?"
4. AI creates `.descix/workspace.json` with mappings
5. `tell_me_how --scope project` now uses these mappings

---

## Troubleshooting

### "MCP tools not available"
1. Run `descix quickstart` in workspace root
2. Reload your editor/session completely
3. Check `.vscode/mcp.json` exists with a `descix` server (this file is skipped, by design, if the DeSciX VS Code extension is installed — it registers MCP natively)

### "401 Unauthorized on a loopback / mesh call"
For the app data plane, your service authenticates AS the developer (wallet_address + signature). A 401 means the
developer credential is missing or wrong: check `DEVELOPER_WALLET_ADDRESS` + `DEVELOPER_SIGNATURE` in the gitignored
`dev-overrides.json` (dev) / the secret (prod). Then restart the service.
Discover it via `descix tell-me-how "my service gets 401 on a loopback call"`.

### "Session expired"
Run `descix reconnect` or `descix login`

### "No results from tell_me_how"
Service READMEs may not be vectorized. Ask admin to run `descix microservice vectorize` for relevant services.

### "workspace.json not found" for project scope
Run `descix init` (or `descix quickstart`, which runs it for you if missing).

---

*SDK Version: 2.0.0*
*Package: @descix/cli*
