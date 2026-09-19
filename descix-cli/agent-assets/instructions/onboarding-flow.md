# Entitlements-First Onboarding Flow

## Overview

This document guides AI agents through the entitlements-driven onboarding process for DeSciX developers. The key principle: **users purchase apps/communities in the PWA first, then configure local folders**.

## Configuration: workspace.json

DeSciX uses **workspace.json** as the sole configuration file.

### workspace.json (Workspace Root)

Location: `{workspace_root}/.descix/workspace.json`

Purpose: Maps local folders to DeSciX apps and stores all configuration.

```json
{
  "version": "2.1",
  "env": {
    "environment": "DEV",
    "apiUrl": "https://dev.descix.net",
    "products": [
      {
        "appId": "daita-appsdk",
        "communityId": "daita",
        "localPath": "daita/appsdk",
        "kbId": "General"
      }
    ]
  },
  "driveConfig": {
    "base_folder_id": "..."
  }
}
```

A `communities`-keyed block with no `env` block is the removed v1 shape — the loader refuses it:
`v1 workspace format is not supported. Migrate to v2.1.`

**Used for:**
- CLI auto-detection of community/app from current directory
- `tell_me_how --scope project` to discover project-specific tools
- MCP server to know which apps are in scope
- CLI to find the workspace root

### Key Principle

**workspace.json** is the single configuration file that maps local folders to DeSciX apps and contains all sync configuration. It is created once at the workspace root during onboarding.

---

## Prerequisites

Before starting onboarding:
1. User has run `descix login` successfully
2. User has purchased SDK entitlement (descix/sdk or descix/docs)
3. `.descix/wallet.json` exists with valid credentials
4. This file exists at `.descix/sdk-assets/instructions/onboarding-flow.md`

## Onboarding Decision Tree

```
START
│
├── Is this a fresh workspace (no .descix/workspace.json)?
│   └── YES → Run Full Setup Flow
│
├── Does workspace.json exist but has unconfigured apps?
│   └── YES → Run App Configuration Flow
│
└── Is everything configured?
    └── YES → Ready for development
```

## Full Setup Flow

### Step 1: Fetch Entitlements

Always start by checking what the user owns:

```javascript
execute_remote_command({
  command: "fetch_my_purchases",
  params: {}
})
```

This returns:
- `communities`: Communities the user belongs to (with roles)
- `apps`: Apps the user owns or can develop
- `service_slots`: Available service deployment slots

### Step 2: Present Entitlements to User

Format the response clearly:

```
Based on your entitlements, you have access to:

Communities:
1. {community_name} ({community_id}) - {role}
2. ...

Apps you can develop:
- {community_id}/{app_id} ({app_name})
- ...

Service Slots:
- {slot_count} available for microservice deployment
```

### Step 3: Scan Workspace Folders

Identify potential project folders:
- Look for directories with `package.json`, `Cargo.toml`, `requirements.txt`
- Ignore: `node_modules`, `.git`, `dist`, `build`, `.descix`
- Note folders that are already registered in `workspace.json`

### Step 4: Ask User About Folder Mappings

Present options:

```
I see these folders in your workspace:
- frontend/ (React app with build system)
- backend/ (Node.js with Express)
- docs/ (Markdown documentation)

Would you like to map any to your apps?

Suggested mappings based on folder contents:
- frontend/ → {community}/pwa (Static Site)
- backend/ → {community}/api (Microservice)
- docs/ → {community}/docs (Knowledge Only)

Which mappings should I create?
```

### Step 5: Create Configuration Files

For each mapping, create appropriate config:

1. **workspace.json** (root level) — written by CLI verbs, never by hand:
   ```bash
   descix config init --env dev                          # creates workspace.json, pins env.apiUrl
   descix app init -a {app_id} -c {community_id} -p {folder}   # adds env.products[] entry
   ```
   Each mapping becomes one `env.products[]` entry (`appId`, `communityId`, `localPath`, `kbId`).

## App Configuration Flow

For apps that exist in entitlements but aren't configured locally:

### Step 1: Identify Unconfigured Apps

Compare:
- Apps from `fetch_my_purchases`
- Mappings in `workspace.json`

### Step 2: Ask About Each Unconfigured App

```
You have these apps that aren't linked to local folders:
- {community}/{app} - {description}

Would you like to:
1. Link to an existing folder
2. Create a new folder for this app
3. Skip for now
```

### Step 3: Determine Packaging Type

For each folder being configured:

1. Read [guides/README.md](../guides/README.md) for the decision tree (Knowledge-Only / Static
   Site / Microservice / Dynamic Site)
2. Read [app-asset-validation.md](./app-asset-validation.md#folder-analysis-heuristics) for
   detection heuristics
3. Present options to user with recommendations
4. Scaffold with the matching CLI verb: `descix site init` and/or `descix microservice init`
   (there is no `templates/{type}/` to read directly — the CLI copies the right scaffold)

### Step 4: Validate Folder Structure

After determining packaging type, ensure the folder follows the [Standard Folder Structure](./standard-folder-structure.md):

```
{app_folder}/
├── assets/                          # App identity (required)
├── .descix/manifests/<KB>.json      # Corpus manifest — required for RAG, see below
├── site/                            # Static site (required)
└── microservice/                    # Backend service (required)
```

There is no required KB folder — a knowledge base is whatever git-tracked source(s) the corpus
manifest names.

**Validation Steps:**

1. Check if each required folder exists
2. Check if required assets exist (`app_description.md`, `icon.png`, `system_instructions.md`)
3. Check if kb/ has a README.md
4. For missing folders/files, offer to create with placeholders

`validate_app_structure` returns a generic checklist — a folder existing does not mean the KB is
wired up. **The check that actually matters for RAG is `.descix/manifests/<KB>.json` existing with
at least one source**, per [app-asset-validation.md](./app-asset-validation.md#step-3-check-knowledge-base).

### Step 5: Pull from Drive (Optional)

If the app already exists remotely, offer to pull existing content:

```
Your app may already have content on DeSciX Drive.

Would you like me to pull it into your local folder?
[Yes, pull from Drive] [No, I'll create new ones]
```

```bash
descix drive pull -c <community_id> -a <app_id>
```

This downloads and converts Drive content to local markdown and reports what changed. It does not
sync to Pinecone by itself — follow with `descix kb corpus sync` once the pulled files are named
in a corpus manifest.

### Step 6: Create Missing Structure

For any missing folders or files:

1. Create `assets/` with starter `app_description.md` / `system_instructions.md` (or run
   `descix app init`, which scaffolds these for you)
2. Create a `.descix/manifests/<KB>.json` corpus manifest naming wherever the docs will live
3. `descix site init` / `descix microservice init` for the code scaffolds

```
Creating standard folder structure...

Created:
✓ assets/app_description.md (from template)
✓ assets/system_instructions.md (from template)
○ assets/icon.png (TODO: add a 512x512 PNG)
✓ .descix/manifests/General.json (empty — add sources once you have docs)
✓ site/README.md (placeholder)
✓ microservice/README.md (placeholder)

Your app structure is now ready. Run `descix app sync-assets` to sync.
```

## Key Principles

### Never Assume
- Always ask before creating mappings
- Present options, let user choose
- Explain trade-offs of each packaging type

### Entitlements Are Truth
- If user doesn't own an app, they can't configure it locally
- Service slots determine microservice deployment capacity
- Community role affects what operations are allowed

### Local Config Mirrors Remote
- `workspace.json` reflects purchased entitlements and sync configuration
- Changes require re-sync, not re-purchase

## Error Handling

### "No entitlements found"
User hasn't purchased anything yet. Direct them to the PWA store.

### "App not in entitlements"
User is trying to configure an app they don't own. Suggest purchase.

### "Folder already configured"
Check if configuration matches intended app. Offer to update or skip.

### Powch sign-in under `descix serve` fails ("User cancelled", or "WebAuthn is not supported on sites with TLS certificate errors")
The gateway's dev certificate is not trusted. Run `descix dev-certs check`. If it is not trusted,
give the user exactly `descix dev-certs trust` to run (macOS password prompt), tell them to quit
and reopen Chrome, then run `descix dev-certs check` again. Details and Linux/Windows notes:
`reference/local-dev.md` §3.3.

## Next Steps After Onboarding

Once configured, guide user to:

### Sync Commands (in order)

1. **Sync app assets**: `descix app sync-assets`
   - Syncs app_description.md, icon.png, system_instructions.md to the platform (Firestore/GCS) —
     not Google Drive
   
2. **Sync knowledge base**: `descix kb corpus sync`
   - Indexes documents to Pinecone for RAG
   
3. **Deploy static site** (if applicable): `descix site upload`
   - Uploads site/ contents to GCS

4. **Register microservice** (if applicable): `descix microservice register -r SERVICE_README_<name>.md`
   - Registers the service manifest AND vectorizes the README you pass, in one step —
     `tell_me_how` discovery needs no separate developer action

### Ongoing Development

- Use `tell_me_how` for tool discovery and guidance
- Use `ask_question_to_app` (or `descix chat`) to test your AI agent
- Use `validate_app_structure` before syncing to catch issues

---

## Agent Conversation Templates

Use these dialogue patterns when guiding users through onboarding.

### Initial Greeting

```
Welcome! I see you've set up DeSciX in this workspace.

Let me check your entitlements and help you configure your apps...

You have access to:
- **{community_name}** community ({role})
  - {app_1} - {app_1_status}
  - {app_2} - {app_2_status}

Would you like me to help you:
1. Link a folder to one of your apps
2. Explore what you can do with a specific app
3. Something else
```

### Presenting Entitlements

```
Based on your purchases, here's what you can work with:

**Communities:**
| Community | Role | Apps |
|-----------|------|------|
| {name} | {role} | {count} |

**Your Apps:**
| App | Status | Local Folder |
|-----|--------|--------------|
| {app_id} | Configured / Not linked | {folder or "—"} |

Which app would you like to work on?
```

### After Successful Setup

```
All done! Your app is configured.

**Summary:**
- App: {community}/{app}
- Type: {packaging_type}
- Folder: {folder_path}

**What you can do now:**
- Use `tell_me_how` to discover tools
- Ask me to sync content when you make changes
- Run `descix kb corpus sync` to update RAG index

Anything else I can help with?
```

### Error Recovery

```
The command didn't work as expected.

**What I tried:** {command}
**What happened:** {error_summary}

Let me try to fix this:
1. First, I'll check {diagnostic_step}
2. If that's fine, I'll try {alternative_approach}
```

### When User Has No Apps

```
I checked your entitlements, but you don't have any apps yet.

To get started, you'll need to:
1. Visit the DeSciX PWA
2. Create or purchase an app in a community
3. Come back here and I'll help you set it up

Would you like me to explain how app creation works?
```

For pattern-specific guidance, see [guides/](../guides/).
