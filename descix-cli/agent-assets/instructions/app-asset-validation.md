# App Asset Validation

This document guides the AI agent through validating an app's folder structure and assets before configuration or sync operations.

## Validation Workflow

### Step 1: Check Folder Structure

Verify these folders exist:

```
{app_folder}/
├── assets/           # Required
├── kb/               # Required
│   └── General/      # Required (default KB)
├── site/             # Required (even if placeholder)
└── microservice/     # Required (even if placeholder)
```

**If folders are missing**, offer to create them with appropriate placeholder content.

### Step 2: Check Required Assets

#### `assets/app_description.md`

**Check**: File exists and has meaningful content (> 50 characters)

**If missing or empty**, guide the user:

```
I notice your app is missing a description. Let me help you create one.

Questions to answer:
1. What does this app do in 1-2 sentences?
2. Who is the target audience?
3. What are the key features?

Based on your answers, I'll create assets/app_description.md.
```

#### `assets/icon.png`

**Check**: File exists and is a valid PNG

**If missing**, inform the user:

```
Your app needs an icon (assets/icon.png).

Requirements:
- 512x512 pixels recommended
- PNG format with transparency
- Used in store listing and app header

Would you like me to note this as a TODO, or do you have an icon to add?
```

#### `assets/system_instructions.md`

**Check**: File exists and has meaningful content (> 100 characters)

**If missing**, guide the user:

```
Your app needs AI agent instructions. This defines how the chat 
assistant behaves when users interact with your app.

Questions to consider:
1. What persona should the AI have?
2. What topics should it help with?
3. What should it refuse to do?
4. What tone/style should it use?

I can create a starter template based on your app description.
```

### Step 3: Check Knowledge Base

#### `kb/General/README.md`

**Check**: File exists with overview content

**If missing**, create from app_description or guide:

```
Your knowledge base needs a README. This is the first document
the AI will reference when answering questions.

I can create one based on your app description, or you can
provide specific content for the overview.
```

#### KB Content

**Check**: At least one documentation file in `kb/General/`

**If empty**, suggest:

```
Your knowledge base is empty. The AI can only answer questions
based on content in kb/General/.

Suggestions:
- Move existing documentation here
- Create a getting-started.md
- Add API reference docs
- Include user guides
```

### Step 4: Check Site Folder

**Check**: `site/` exists with `index.html` OR `README.md` placeholder

**If empty**, create placeholder:

```markdown
# Site Folder

This folder is reserved for static site content.

## Current Status
This app does not yet have a web UI.

## To Add a Site
1. Add HTML/CSS/JS files directly here, OR
2. Configure your build tool to output to `site/dist/`
3. Run `descix site upload` to deploy

## Supported Content
- Static HTML files
- Build output from React, Vue, VitePress, etc.
- Assets (images, CSS, JS)
```

### Step 5: Check Microservice Folder

**Check**: `microservice/` exists with `README.md`

**If empty**, create placeholder:

```markdown
# Microservice Folder

This folder is reserved for backend service code.

## Current Status
This app does not have a backend microservice.

## To Add a Service
1. Create command handlers in `handlers/`
2. Add SERVICE_README_*.md for tell_me_how discovery
3. Configure manifest.json at the app root
4. Run `descix microservice register` to register with the platform

## Benefits
- Expose custom MCP tools
- Add backend logic to your AI agent
- Integrate with external services
```

## Pull from Drive Workflow

If the app already exists on Drive, offer to pull existing assets.

### Check if App Exists Remotely

```
Use: validate_app_assets({ community_id, app_id, check_drive: true })

Returns:
{
  "local_assets": { ... },
  "remote_assets": { ... },
  "missing_locally": ["icon.png", "system_instructions.md"],
  "can_pull": true
}
```

### Offer to Pull

```
I found your app already exists on DeSciX Drive with these assets:
- ✓ app_description.md (234 bytes)
- ✓ icon.png (45KB)
- ✓ system_instructions.md (1.2KB)

Your local folder is missing:
- icon.png
- system_instructions.md

Would you like me to pull these from Drive to your local folder?
[Yes, pull missing assets] [No, I'll create new ones]
```

### Execute Pull

```
Use: pull_app_assets_from_drive({
  community_id,
  app_id,
  local_path,
  folders: ["assets", "kb"]  // Optional: specify which folders
})
```

## Validation Results Format

After validation, report status clearly:

```
## App Structure Validation: my-app

### Folder Structure
✓ assets/ exists
✓ kb/General/ exists
✓ site/ exists
✓ microservice/ exists

### Required Assets
✓ assets/app_description.md (523 bytes)
✗ assets/icon.png - MISSING
✓ assets/system_instructions.md (1.2KB)

### Knowledge Base
✓ kb/General/README.md exists
✓ 5 documents found (12.4KB total)

### Site
○ site/ contains placeholder only (no UI)

### Microservice
○ microservice/ contains placeholder only (no service)

### Recommendations
1. Add an icon.png (512x512) to assets/
2. Consider adding a welcome page to site/
```

## Asset Content Guidelines

### app_description.md Template

```markdown
# {App Name}

{One-sentence summary of what the app does.}

## Overview

{2-3 sentences expanding on the summary. What problem does it solve?
Who is it for?}

## Key Features

- {Feature 1}
- {Feature 2}
- {Feature 3}

## Use Cases

- {Use case 1}
- {Use case 2}
```

### system_instructions.md Template

```markdown
# System Instructions for {App Name}

## Persona

You are an AI assistant for {App Name}. {One sentence describing the
assistant's role and expertise.}

## Core Responsibilities

1. {Primary responsibility}
2. {Secondary responsibility}
3. {Tertiary responsibility}

## Knowledge Domain

You have access to documentation about:
- {Topic 1}
- {Topic 2}
- {Topic 3}

## Response Guidelines

- {Guideline 1: e.g., "Be concise and technical"}
- {Guideline 2: e.g., "Provide code examples when relevant"}
- {Guideline 3: e.g., "Ask clarifying questions before complex tasks"}

## Constraints

Do NOT:
- {Constraint 1: e.g., "Make up information not in the knowledge base"}
- {Constraint 2: e.g., "Provide advice outside the domain"}
- {Constraint 3: e.g., "Execute commands without user confirmation"}

## Tone

{Describe the desired tone: professional, friendly, technical, etc.}
```

### kb/README.md Template

```markdown
# {App Name} Knowledge Base

Welcome to the {App Name} documentation.

## Contents

- [Getting Started](./getting-started.md)
- [User Guide](./user-guide.md)
- [API Reference](./api-reference.md)

## Quick Start

{Brief instructions to get started with the app}

## Need Help?

{Instructions for getting support or asking questions}
```

## Error Recovery

### Missing .descix/ Folder

```
This folder doesn't appear to be configured as a DeSciX app.

Options:
1. Run `descix init` to configure this folder as a new app
2. Run `descix mcp quickstart` to configure the entire workspace
3. Check if this is the correct folder

Which would you like to do?
```

### Corrupted workspace.json

```
The .descix/workspace.json file appears to be invalid.

I can:
1. Back up the current file and create a new one
2. Attempt to repair the existing file
3. Show you the error for manual fixing

Error: {JSON parse error message}
```

### Permission Errors

```
I couldn't access {folder/file}. This might be a permissions issue.

Please check:
1. You have read/write access to this folder
2. The folder isn't locked by another process
3. The path exists: {full path}
```

## Integration with Workflows

### Before `descix app sync-assets`

Always run validation:
1. Check `assets/` folder structure
2. Verify all required files exist
3. Warn about missing icon
4. Confirm app_description has meaningful content

### Before `descix kb corpus sync`

1. Check `kb/General/` exists
2. Verify at least one document exists
3. Warn if no README.md
4. Report total document count and size

### Before `descix site upload`

1. Check `site/` exists
2. Verify either index.html or dist/index.html exists
3. Warn if only placeholder README

### Before `descix microservice register`

1. Check `microservice/` exists
2. Verify manifest.json exists (root or microservice/)
3. Check for SERVICE_README_*.md
4. Warn if no command handlers found

---

## Folder Analysis Heuristics

Use these patterns to automatically detect project type and recommend appropriate packaging.

### Detection Priority

1. **Existing DeSciX config** - Already configured?
2. **Service indicators** - Has backend logic?
3. **Static site indicators** - Has build output?
4. **Knowledge indicators** - Has documentation?

### Service Indicators (Backend Logic)

| Pattern | Indicates | Packaging Type |
|---------|-----------|----------------|
| `manifest.json` with `commands` | DeSciX microservice | Microservice/Dynamic |
| `app.yaml` + `Dockerfile` | Cloud deployment | Dynamic Site |
| `express`, `fastify` in package.json | Node.js server | Microservice |
| `api/` or `routes/` directory | API structure | Microservice |
| `SERVICE_README*.md` | Documented service | Microservice |

### Static Site Indicators

| Pattern | Indicates | Packaging Type |
|---------|-----------|----------------|
| `dist/index.html` | Built static site | Static Site |
| `build/index.html` | Built static site | Static Site |
| `vite.config.*` | Vite project | Static Site |
| `.vitepress/` | VitePress docs | Static Site |
| `docusaurus.config.js` | Docusaurus | Static Site |

### Knowledge Indicators

| Pattern | Indicates | Packaging Type |
|---------|-----------|----------------|
| `docs/` directory | Documentation folder | Knowledge-Only |
| Multiple `*.md` files | Markdown docs | Knowledge-Only |
| `*.pdf` files | PDF documents | Knowledge-Only |

### Analysis Algorithm

```
1. Check workspace.json for app registration
   - If app exists, read current config
   
2. Check for service indicators
   - manifest.json with commands → Microservice
   - Dockerfile + app.yaml → Dynamic Site
   - Server files (app.js, server.js) → Microservice
   
3. Check for static site indicators
   - Build output (dist/, build/) → Static Site
   - Build config (vite, webpack) → Static Site
   
4. Check for knowledge indicators
   - docs/ folder → Knowledge-Only
   - Multiple .md files → Knowledge-Only
   
5. Default to Knowledge-Only if no other indicators
```

### Presenting Analysis Results

```
**Analysis Results for '{folder_name}':**

I found:
├── **Framework:** {framework_name}
├── **Build System:** {build_tool}
├── **Backend:** {yes/no}
└── **Documentation:** {count} files

**Recommended Packaging Type:** {Type}
**Why:** {reason}

Should I set up '{folder_name}' as a **{Type}** app?
```

For detailed pattern guides, see [guides/](../guides/).
