# {{appName}} — Built on DeSciX

## Platform

This project is an app on the DeSciX platform. You have MCP tools for all
platform operations. If a tool you need isn't in your current tool list,
call `tell_me_how` with a natural language question — it searches the entire
service mesh and returns the right tool.

## App Structure

```
{{appId}}/
├── site/           ← Frontend (any framework)
├── kb/General/     ← Knowledge base source docs (markdown → Pinecone vectors)
└── microservice/   ← Backend service (optional)
```

## Key Workflows

- **Add knowledge:** Put `.md` files in `kb/General/`, then use the `kb_sync` MCP tool
- **Ask questions:** Use the `ask_question_to_app` MCP tool with app_id `{{appId}}`
- **Deploy site:** Build in `site/`, then use the `site_deploy` MCP tool
- **Discover capabilities:** Use `tell_me_how` to find any platform service

## Context

- App ID: `{{appId}}`
- Community: `{{communityId}}`
- API: `{{apiUrl}}`
