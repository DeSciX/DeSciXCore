# Microservice App Pattern

## Overview

A Microservice app is a backend service that exposes commands via MCP, plus optional frontend and documentation.

## When to Use

Choose this pattern when the user wants to:
- Create API endpoints callable via MCP
- Build tools discoverable via `tell_me_how`
- Add backend logic to their app
- Integrate with external services

**Key Questions:**
1. "Does it have backend logic (API endpoints, commands)?" → Yes
2. "Should AI agents be able to discover and use its tools?" → Yes

## Structure

```
my-service/
├── assets/
│   ├── app_description.md
│   ├── icon.png
│   └── system_instructions.md
├── kb/
│   ├── staging/
│   ├── General/
│   │   ├── README.md
│   │   └── api-reference.md
│   └── chunks/
├── site/                       # Optional frontend
│   └── ...
├── microservice/
│   ├── manifest.json           # Command registration
│   ├── SERVICE_README_myapp.md # Tool discovery docs
│   ├── package.json
│   ├── Dockerfile
│   ├── app.yaml
│   └── src/
│       ├── index.js
│       ├── apiFront.js
│       └── commandHandlers/
│           └── myCommands.js
└── package.json
```

## Configuration (`workspace.json`)

```json
{
  "communities": {
    "my-community": {
      "apps": {
        "my-service": {
          "localPath": "my-community/my-service",
          "sync_mode": "git",
          "service": {
            "port": 4000,
            "devCommand": "npm run start"
          }
        }
      }
    }
  }
}
```

## CLI Workflow

```bash
# 1. Create microservice scaffold
descix microservice init

# 2. Implement your commands in commandHandlers/

# 3. Register service with gateway
descix microservice register

# 4. Vectorize SERVICE_README for discovery
descix microservice vectorize

# 5. Sync KB
descix kb sync -c <community> -a <app>
```

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| chat_with_kb | Yes |
| Public URL | Yes (via service) |
| MCP tools | Yes |
| tell_me_how discovery | Yes |

## Key Files

### manifest.json

Defines commands exposed to MCP:

```json
{
  "service_id": "my-service",
  "version": "1.0.0",
  "commands": [
    {
      "name": "my_command",
      "description": "What this command does",
      "parameters": {
        "param1": { "type": "string", "required": true }
      }
    }
  ]
}
```

### SERVICE_README_{app_id}.md

Documentation for `tell_me_how` discovery:

```markdown
# My Service

## Overview
What this service does and when to use it.

## Commands

### my_command
**Description:** What it does
**Use when:** Scenarios when appropriate
**Parameters:**
- param1 (required): Description
```

## Microservice Scaffold

To add the microservice folder to an existing app:

```bash
descix microservice init
```

This copies the full Express microservice template with:
- `app.js` - Server entry point
- `manifest.json` - Command registration
- `services/` - API handlers and utilities
- `Dockerfile` - Container build
- `SERVICE_README_TEMPLATE.md` - Discovery docs template
