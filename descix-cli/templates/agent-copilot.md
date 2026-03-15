# DeSciX App Development

<!-- BOOTSTRAP: Auto-generated. Update this file as you learn the project. -->

## First Action

Call `descix_doctor` MCP tool to check auth, workspace, and available tools.

## Platform

DeSciX is a virtual university for knowledge-powered apps. Communities are
departments, apps are courses/textbooks/services. You are the primary
interface — guide the user to explore, build, or discover.

## Pre-Step 0: Check for Invite Config

Before scanning the repo, check if `.descix/app.json` exists.

If it does:
1. Read it — extract `app_id`, `community_id`, `agent_hint`, `kb_ready`, `has_repo`
2. If it contains `invite_token`, call `resolve_invite` with that token to get live context
3. **Read `agent_hint` carefully** — it was written by the app creator specifically for you.
   It describes this user's skill level and goals. Let it override default checkpoints.
   For example, if the hint says "no coding background", do not ask technical questions.
4. If `kb_ready` is true, skip KB setup and demonstrate value immediately:
   `descix chat -a <app_id> "What is this about?"` — show the user what the AI knows
5. If `kb_ready` is false, skip the chat demo — the KB is not populated yet.
   Proceed to setup (`descix init`, `app init`, `update kb`), then demo afterward.
   Frame it as: "Let's get this set up so you can start exploring."
6. If `has_repo` is true and no source code is present locally, offer `descix clone -a <app_id>`.
   For non-technical users (infer from `agent_hint`): "Want to run this on your own machine?"
   For developers: "I'll clone the source code so you can build on it."
7. If `app.json` contains `api_url`, use it as the backend target — skip Checkpoint 3 (environment).
8. After the demo and clone, check if `workspace.json` exists. If not, run standard setup
   (`descix init`, `app init`). If it does, setup is already done — proceed to development.
9. If `descix_doctor` shows an existing workspace with a **different** `app_id` than the invite,
   ask the user: "You have an existing workspace for [X]. Add the invited app, or switch context?"

**Important:** If `app.json` is present, Step 0's empty-repo detection does NOT mean "scaffold from scratch."
The project context comes from the invite, not the file structure.

## Step 0: Scan the Repo

Before asking questions, list the working directory and check for:
- Existing content: `docs/`, `src/`, `README.md`, `package.json`
- Existing DeSciX structure: `kb/`, `site/`, `microservice/`, `.descix/`
- Existing frameworks: `vite.config.*`, `next.config.*`, `tsconfig.json`

Tailor your questions based on what you find (e.g., offer to use existing docs
as KB, configure an existing site, skip starter content if KB is already populated).

## Setup Workflow (if doctor reports setup_needed)

Ask the user at each checkpoint — don't assume:

1. **Objective:** "Explore existing apps or build something new?"
2. **Community/App:** Use `find_communities` + `list_apps_for_community`, then ask which to target
3. **Environment:** "Local dev (localhost:4000) or hosted API?" (Skip if `app.json` has `api_url`)

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

## Local Development

| Goal | Command |
|------|---------|
| Serve `site/` locally | `npx serve site/` or `python3 -m http.server -d site/` on any port |
| Register port with DeSciX | `descix site servelocal <port> -c <community> -a <app>` |
| Run full gateway (multi-app) | `descix serve` (reverse proxy on :5173) |

Single-app dev: a static server is sufficient. Gateway is for multi-app or
platform routing tests.

## MCP Tools

- `descix_doctor` — Startup diagnostic (call first)
- `ask_question_to_app` — RAG chat with app_id `{{appId}}`
- `query_knowledge_base` — Vector search (raw chunks)
- `find_communities` — List communities
- `list_apps_for_community` — List apps in a community
- `tell_me_how` — Discover any platform capability (use scope "discovery" if "entitlements" is empty)
- `resolve_invite` — Exchange an invite token for app context + agent hint

## Integrating Existing Content

**NEVER copy existing project files into `site/` or `kb/`.** Integrate in place:

- **Existing HTML/JS app:** Serve as-is. Add `DeSciXAppSDK.js` for DeSciX integration.
- **React/Vite app:** Wrap root in `<AppShell appId="{{appId}}">` from `@descix/app-sdk/AppShell`.
- **Auth only (no DeSciX UI):** Use `PowchClient` from `@descix/app-sdk/powch-client`.
- **Existing docs:** Copy `docs/*.md` to `kb/General/` for sync. Keep originals as source of truth.
- **Empty repo:** Scaffold from scratch.

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
