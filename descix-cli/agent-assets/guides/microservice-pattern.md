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
├── .descix/
│   └── manifests/
│       └── General.json        # Corpus manifest — names the docs `kb corpus sync` publishes
├── site/                       # Optional frontend
│   └── ...
├── microservice/
│   ├── app.js                  # Entry point — binds the server, mounts the router
│   ├── manifest.json           # Command registration
│   ├── SERVICE_README_myapp.md # Tool discovery docs
│   ├── package.json
│   ├── Dockerfile
│   ├── app.yaml
│   ├── defaults-config.json    # Layered config: committed defaults
│   ├── defaults-config-dev.json
│   ├── scripts/
│   │   └── register.js         # Registers the service MANIFEST (commands) for discovery
│   └── services/
│       ├── utils.js            # Config bootstrap — see below, read this first
│       ├── apiFront.js
│       ├── mcpClient.js
│       └── commandHandlers/
│           └── myCommands.js
└── package.json
```

## The bootstrap — why a service inherits instead of implements

**Read `services/utils.js` before you write a line of your own.** It is a thin wrapper
over `@descix/cloud-core` (`createCloudConfig`, `getCloudConfig`, `initializeCloudConfig`)
and it carries the layered config chain — environment, then `.env`, then
`workspace.json` — along with Secret Manager resolution and dev port detection. `app.js`
reaches it through `initializeServiceConfig`.

Its own header states the rule, and the rule is the point:

> This is the ONLY path to config values. Never use process.env directly.
> Never add fallback values to utils.CONFIG_VALUE — nulls surface misconfigurations.

That is not house style. It is what makes a service **inherit** its platform behaviour
rather than reimplement it: a service that bootstraps correctly gets the shared
infrastructure for free, and a service that hand-rolls its own config or reads
`process.env` opts itself out of it silently — nothing fails at startup, and the gap
only shows up later, in the environment where it matters.

**This is also why your service is called at its own Cloud Run instance rather than
through an extra hop at the DeSciX router** — direct routing is by design.
Direct routing is the intended path *because* a service built on the SDK already carries
the infrastructure the extra hop would otherwise have to add. Read a direct call as the
architecture working, not as a bypass — the correctness precondition is that the service
was built this way.

The corollary is worth stating plainly: **correct bootstrap usage is self-enforcing and
self-extending.** Services that inherit gain new platform behaviour as the SDK gains it.
A service that forked the mechanism keeps whatever it forked, forever, and no one finds
out until something depends on the difference.

## Configuration (`workspace.json`)

One `env.products[]` entry, written by `descix app init`, `descix app set-port` and (for the optional
frontend) `descix app set-site` — never by hand:

```json
{
  "appId": "my-community-my-service",
  "communityId": "my-community",
  "localPath": "my-service",
  "kbId": "General",
  "site": { "static": "site" },
  "microservice": { "port": 4001 }
}
```

`descix microservice init` refuses to run until `microservice.port` is set: the gateway routes
`/s/<app_id>` to that port and the service must start on it.

## CLI Workflow

```bash
# 1. Create microservice scaffold
descix microservice init

# 2. Implement your commands in commandHandlers/

# 3. Publish the service MANIFEST and vectorize its SERVICE_README in one step
descix microservice register -r SERVICE_README_myapp.md

# 4. Sync KB
descix kb corpus sync -c <community> -a <app>
```

**What registration is, and is not.** It publishes your `manifest.json` — the command list —
and vectorizes the README you pass with `-r`, so `tell_me_how` can discover your tools.
`scripts/register.js` writes that manifest and logs the commands it published. There is no
separate developer-facing vectorize step — `descix microservice vectorize` exists but is an
admin-only utility (for re-vectorizing without re-registering), not part of the normal flow.
It is a DISCOVERY step.

It is not how your service becomes reachable, and nothing here asks you to declare a route or
a URL. Do not read this step as wiring up addressing.

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| RAG chat (`ask_question_to_app`) | Yes |
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
