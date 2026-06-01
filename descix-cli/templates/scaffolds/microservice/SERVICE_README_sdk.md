# DeSciX SDK - CLI and MCP Tools

## Overview

The DeSciX SDK provides command-line tools and MCP (Model Context Protocol) integration for building applications on the DeSciX platform. The SDK enables developers to authenticate, manage workspaces, create apps, and leverage AI-assisted development through Cursor IDE integration.

**Key capabilities:**
- CLI commands for all platform operations
- MCP server for Cursor IDE integration
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

### descix setup

**Description:** One-time workspace configuration wizard
**Use when:** First time setting up DeSciX in a new workspace or Cursor project
**What it does:**
1. Prompts for API endpoint (production/local/custom)
2. Runs device authentication (opens browser)
3. Creates `.cursor/mcp.json` for MCP server
4. Creates `.cursor/rules/descix_mcp.mdc` for AI agent instructions
5. Creates `.descix/workspace.json` with initial configuration

**Example:**
```bash
cd ~/Projects/MyApp
descix setup
# Follow the prompts
# Restart Cursor after completion
```

---

### descix login

**Description:** Authenticate with the DeSciX platform
**Use when:** Session expired or first-time authentication
**Options:**
- `--device` (default): Opens browser for Powch authentication
- `--wallet`: Direct wallet signature authentication

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

### descix app create

**Description:** Create or hydrate an app using the interactive wizard
**Use when:** Starting a new project or hydrating an existing app
**Options:**
- `-c, --community <id>`: Community ID
- `-a, --app <name>`: App name
- `--wizard`: Interactive wizard mode
- `--quick`: Skip optional prompts

**Note:** New apps should primarily be provisioned via the PWA. This command can hydrate a local workspace from an existing app or create a skeleton if permitted.

**Example:**
```bash
# Interactive wizard
descix app create --wizard
```

---

### descix kb

**Description:** Manage Knowledge Base content (Git Mode)
**Use when:** Processing KB documents locally

**Subcommands:**
- `pull`: Download source documents from Drive to `kb/src/`
- `chunk`: Process source files into chunks in `kb/chunks/`
- `sync`: Push chunks to the platform (Pinecone)
- `build`: Run the full pipeline (Pull -> Chunk -> Sync)

**Example:**
```bash
# Full build pipeline
descix kb build -c descix -a myapp
```

---

### descix microservice register-delegate

**Description:** Provision the service's delegate key (`SERVICE_KEY`) so it can authenticate mesh/loopback calls
**Use when:** Your microservice calls Core Tools or other services via the `/apifront` broker — REQUIRED before any loopback call, or you will get HTTP 401
**What it does:**
1. Generates an EC (secp256k1) key pair
2. Registers the public key with Core against one of your service slots (Runner NFT / subscription)
3. Writes `SERVICE_KEY` into `dev-overrides.json` — the scaffold `mcpClient` signs every mesh call with it

**Options:**
- `-c, --community <id>`: Community ID (auto-detects from context/manifest.json)
- `-a, --app <id>`: App ID (auto-detects from context/manifest.json)
- `-s, --slot <id>`: Service slot ID (uses first available if not provided)

**Canonical mesh microservice onboarding sequence:**
```bash
descix app create   -c <community> -a <app>
descix app init      -a <community>-<app>
descix app set-port  -a <community>-<app> -p <port>
descix microservice register
descix microservice register-delegate   # <-- the mesh-auth step; without it loopback calls return 401
```

**Note:** The pre-stored `OWNER_SIGNATURE` in the scaffold is NOT a valid mesh credential — it returns 401 for live loopback calls. `register-delegate` is the canonical fix.

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

## MCP Tools (for Cursor AI)

After running `descix setup` and restarting Cursor, these MCP tools are available to the AI agent:

### tell_me_how

**Description:** Primary discovery tool - finds relevant commands for any task
**Use first:** Always use this before attempting platform operations

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
  command: "create_app",
  params: {
    community_id: "descix",
    app_name: "My New App"
  }
})
```

---

### descix_init

**Description:** Initialize a local project for DeSciX deployment
**Use when:** Setting up a new project folder

```javascript
descix_init({
  projectPath: "/Users/dev/Projects/MyApp",
  appName: "my-app",
  communityId: "descix"
})
```

**Creates:**
- `.descix/workspace.json` or `.descix/context.json`
- `app_description.md` from README if missing
- Folder structure for knowledge base

---

### descix_wizard_step

**Description:** Execute multi-step wizard workflows
**Use when:** Creating apps, communities, or complex operations

```javascript
descix_wizard_step({
  wizard_type: "create_app",
  step: "init",
  params: {
    community_id: "descix",
    app_name: "My App"
  }
})
```

**Wizard types:**
- `create_app`: App creation with folder setup
- `create_community`: Community creation with token
- `publish_kb`: Knowledge base sync and publish

---

### git_sync_ops

**Description:** Git operations with auto-generated commit messages
**Use when:** Committing changes, checking status

```javascript
git_sync_ops({
  operation: "status",  // or "commit", "diff", "sync_info"
  projectPath: "/Users/dev/Projects/MyApp"
})
```

---

### search_knowledge_base

**Description:** Search a specific knowledge base via RAG
**Use when:** You know the exact KB to search

```javascript
search_knowledge_base({
  communityId: "descix",
  appId: "docs",
  kbId: "sdk",
  query: "How do I authenticate?"
})
```

---

### chat_with_kb

**Description:** Conversational RAG with knowledge base context
**Use when:** Complex questions requiring AI reasoning

```javascript
chat_with_kb({
  communityId: "descix",
  appId: "docs",
  kbId: "sdk",
  message: "Explain the authentication flow step by step"
})
```

---

## Workspace Configuration

### workspace.json (Monorepo)

For multi-app workspaces, create `.descix/workspace.json`:

```json
{
  "version": "2.0",
  "primaryCommunity": "descix",
  "directoryMappings": {
    "frontend": { "communityId": "descix", "appId": "pwa", "kbId": "General" },
    "backend": { "communityId": "descix", "appId": "cloud", "kbId": "General" },
    "docs": { "communityId": "descix", "appId": "docs", "kbId": "sdk" }
  },
  "defaultContext": {
    "communityId": "descix",
    "appId": "docs",
    "kbId": "sdk"
  }
}
```

### context.json (Single App)

For individual app folders, create `.descix/context.json`:

```json
{
  "version": "2.0",
  "type": "app",
  "community_id": "descix",
  "app_id": "myapp",
  "app_name": "My Application",
  "folders": {
    "app": { "local_path": ".", "sync_type": "assets" },
    "kb": { "local_path": "docs", "sync_type": "rag" }
  }
}
```

---

## Common Workflows

### New Developer Onboarding (Cursor IDE)

1. Install CLI: `npm install -g @descix/cli`
2. Run setup: `descix setup`
3. Restart Cursor (Cmd+Shift+P → "Reload Window")
4. AI agent can now use MCP tools
5. Ask: "How do I create an app?"
6. AI uses `tell_me_how` → `execute_remote_command`

### Entitlements-First App Creation

1. AI calls `execute_remote_command({ command: "fetch_my_purchases" })`
2. AI presents user's communities and apps
3. User selects community (or creates new)
4. AI calls `descix_wizard_step` for app creation
5. AI creates local `.descix/context.json`

### Monorepo Setup

1. AI calls `fetch_my_purchases` to get entitlements
2. AI scans workspace folders
3. AI asks user: "Map `frontend/` to which app?"
4. AI creates `.descix/workspace.json` with mappings
5. `tell_me_how --scope project` now uses these mappings

---

## Troubleshooting

### "MCP tools not available"
1. Run `descix setup` in workspace root
2. Restart Cursor completely
3. Check `.cursor/mcp.json` exists with `descix` server

### "401 Unauthorized on a loopback / mesh call"
Your service has no provisioned delegate key. The scaffold's `OWNER_SIGNATURE` fallback is not a valid mesh credential.
Run `descix microservice register-delegate` (writes `SERVICE_KEY` to `dev-overrides.json`). Then restart the service.
Discover it via `descix tell-me-how "my service gets 401 on a loopback call"`.

### "Session expired"
Run `descix reconnect` or `descix login`

### "No results from tell_me_how"
Service READMEs may not be vectorized. Ask admin to run `descix microservice vectorize` for relevant services.

### "workspace.json not found" for project scope
Run `descix init` or let AI create workspace.json via `descix_init` MCP tool.

---

*SDK Version: 2.0.0*
*Package: @descix/cli*
