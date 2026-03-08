# {{appName}} — Built on DeSciX

This project is an app on the DeSciX platform. Use MCP tools for all
platform operations. Call `tell_me_how` to discover any platform capability
not in the current tool list.

## App Structure

- `site/` — Frontend (any framework)
- `kb/General/` — Knowledge base source docs (markdown → Pinecone vectors)
- `microservice/` — Backend service (optional)

## Workflows

- Add knowledge: put `.md` files in `kb/General/`, call `kb_sync`
- Ask questions: call `ask_question_to_app` with app_id `{{appId}}`
- Deploy site: build in `site/`, call `site_deploy`
- Discover: call `tell_me_how` with a natural language question

## Context

- App ID: `{{appId}}`
- Community: `{{communityId}}`
- API: `{{apiUrl}}`
