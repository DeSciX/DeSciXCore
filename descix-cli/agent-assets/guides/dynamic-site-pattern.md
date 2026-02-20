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
├── kb/
│   ├── staging/
│   ├── General/
│   │   ├── README.md
│   │   └── user-guide.md
│   └── chunks/
├── site/
│   └── README.md               # "Site served by microservice"
├── microservice/
│   ├── manifest.json
│   ├── SERVICE_README_myapp.md
│   ├── package.json
│   ├── Dockerfile
│   ├── app.yaml
│   └── src/
│       ├── index.js
│       ├── pages/              # SSR routes
│       │   ├── index.js
│       │   └── dashboard.js
│       ├── api/                # API routes
│       │   └── ...
│       └── views/              # Templates
│           └── ...
└── package.json
```

## Configuration (`workspace.json`)

```json
{
  "communities": {
    "my-community": {
      "apps": {
        "my-dynamic-app": {
          "localPath": "my-community/my-dynamic-app",
          "sync_mode": "git",
          "service": {
            "port": 4000,
            "devCommand": "npm run dev"
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

# 2. Add SSR routes to your service

# 3. Deploy to Cloud Run
descix deploy service

# 4. Register and vectorize
descix microservice register
descix microservice vectorize

# 5. Sync KB
descix kb sync -c <community> -a <app>
```

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| chat_with_kb | Yes |
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

```bash
# Deploy the microservice (includes site)
descix deploy service
```
