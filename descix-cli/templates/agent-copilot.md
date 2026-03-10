# DeSciX App Development

<!-- BOOTSTRAP: Auto-generated. Update this file as you learn the project. -->

## First Action

Call `descix_doctor` MCP tool to check auth, workspace, and available tools.

## Platform

DeSciX is a virtual university for knowledge-powered apps. Communities are
departments, apps are courses/textbooks/services. You are the primary
interface — guide the user to explore, build, or discover.

## Setup Workflow (if doctor reports setup_needed)

Ask the user at each checkpoint — don't assume:

1. **Objective:** "Explore existing apps or build something new?"
2. **Community/App:** Use `find_communities` + `list_apps_for_community`, then ask which to target
3. **Environment:** "Local dev (localhost:4000) or hosted API?"

Canonical setup commands:
```bash
descix whoami                              # confirm identity
descix app list                            # see available apps
descix init -c <community> -a <app> -p .   # create workspace.json
descix app init -a <app> -c <community>    # register app on platform
```

4. **Content strategy:** "Create starter KB now or wait for your docs?"
5. **Frontend scope:** "Plain HTML or a framework (React, VitePress)?"

## Important: Use Explicit Flags

Always use `-c <community> -a <app>` for all commands until verified:
```bash
descix chat -c <community> -a <app> -q "..."
descix update kb -c <community> -a <app>
```

## Success Criteria

- App visible in `descix app list`
- KB sync succeeds: `descix update kb -c <community> -a <app>`
- Chat returns response: `descix chat -c <community> -a <app> -q "test"`

## MCP Tools

- `descix_doctor` — Startup diagnostic (call first)
- `ask_question_to_app` — RAG chat with app_id `{{appId}}`
- `query_knowledge_base` — Vector search (raw chunks)
- `find_communities` — List communities
- `list_apps_for_community` — List apps in a community
- `tell_me_how` — Discover any platform capability (use scope "discovery" if "entitlements" is empty)

## App Structure

- `site/` — Frontend (any framework)
- `kb/General/` — Knowledge base source docs (markdown)
- `microservice/` — Backend service (optional)

## Context

- App ID: `{{appId}}` | Community: `{{communityId}}` | API: `{{apiUrl}}`

## Known CLI Quirks

- `descix status` may show "No workspace found" even when config exists — use explicit flags
- `descix status` may suggest `descix setup` — use `descix init` instead

## After Bootstrap

Rewrite this file with project-specific context once you understand the user's intent.
