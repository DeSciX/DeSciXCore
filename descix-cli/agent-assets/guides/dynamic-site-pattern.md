# Dynamic Site App Pattern

## Overview

A Dynamic Site app is a server-rendered application where the microservice handles both API and HTML rendering (SSR).

## When to Use

Choose this pattern when the user wants to:
- Build a full web application with server-side rendering
- Create apps requiring real-time server logic
- Implement multi-tenant platforms
- Build complex apps where client-side isn't sufficient

**Key Questions:**
1. "Does it need server-side rendering?" → Yes
2. "Is the site content dynamically generated?" → Yes

## Structure

```
my-dynamic-app/
├── assets/
│   ├── app_description.md
│   ├── icon.png
│   └── system_instructions.md
├── docs/                        # Your RAG content — any location works
│   └── user-guide.md            # named in a corpus manifest (.descix/manifests/General.json)
├── site/
│   └── README.md               # "Site served by microservice"
├── microservice/
│   ├── app.js                  # Entry point (from the scaffold)
│   ├── manifest.json
│   ├── SERVICE_README_myapp.md
│   ├── package.json
│   ├── Dockerfile
│   ├── app.yaml
│   ├── services/               # From the scaffold — NOT src/
│   │   ├── utils.js            # Config bootstrap over @descix/cloud-core
│   │   ├── apiFront.js
│   │   └── commandHandlers/
│   ├── pages/                  # YOU add these: SSR routes
│   │   ├── index.js
│   │   └── dashboard.js
│   ├── api/                    # YOU add these: API routes
│   │   └── ...
│   └── views/                  # YOU add these: templates
│       └── ...
└── package.json
```

The first group comes from the scaffold and should not be reshaped: `app.js` is the entry
point and service code lives under `services/` — **there is no `src/` directory**. The
`pages/`, `api/` and `views/` directories are yours; the layout inside them is your call.
Keeping the scaffold's shape is what lets the service keep inheriting platform behaviour
(see `guides/microservice-pattern.md`).

## Configuration (`workspace.json`)

One `env.products[]` entry, written by `descix app init` and `descix app set-port` (never by hand):

```json
{
  "appId": "my-community-my-dynamic-app",
  "communityId": "my-community",
  "localPath": "my-dynamic-app",
  "kbId": "General",
  "microservice": { "port": 4001 }
}
```

`descix microservice init` refuses to run until `microservice.port` is set: the gateway routes
`/s/<app_id>` to that port and the service must start on it.

## CLI Workflow

```bash
# 1. Create microservice scaffold
descix microservice init

# 2. Add SSR routes to your service, run it locally behind the gateway
descix serve

# 3. Register (after the service is deployed — see Deployment). This also vectorizes the
#    README you pass with -r, so tell_me_how can discover the service's tools.
descix microservice register -r SERVICE_README_myapp.md

# 4. Sync KB
descix kb corpus sync -c <community> -a <app>
```

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| RAG chat (`ask_question_to_app`) | Yes |
| Public URL | Yes |
| MCP tools | Yes |
| tell_me_how discovery | Yes |
| SSR/Dynamic content | Yes |

## Key Differences from Static + Microservice

1. **No separate site deployment** - The microservice serves the site
2. **SSR routes** - HTML generated on the server per request
3. **Single deployment** - Everything deploys together to Cloud Run
4. **Real-time capabilities** - WebSockets, streaming, etc.

## Example Use Cases

1. **Dashboard App** - Admin panel with real-time data
2. **Multi-tenant Platform** - Each user sees personalized content
3. **Streaming App** - Real-time data visualization
4. **Complex Web App** - E-commerce, social platforms

## Deployment

Dynamic sites deploy to Google Cloud Run as a single container. The service handles both API requests and page rendering.

> **Public microservice deploy is not open.** The CLI has no deploy verb for developers; a
> microservice reaches Cloud Run only through the platform team. Build and run it locally
> with `descix serve`.
