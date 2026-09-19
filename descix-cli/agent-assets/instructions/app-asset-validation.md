# App Asset Validation

This document guides the AI agent through validating an app's folder structure and assets before configuration or sync operations.

## Validation Workflow

### Step 1: Check Folder Structure

Verify these exist:

```
{app_folder}/
├── assets/                          # Required
├── .descix/manifests/<KB>.json      # Required — the corpus manifest (see Step 3)
├── site/                            # Required (even if placeholder)
└── microservice/                    # Required (even if placeholder)
```

There is no required KB folder. A knowledge base is whatever git-tracked source(s) the corpus
manifest names — `kb/General/` is one common convention (especially if the app also uses `descix
drive pull`), but any path works.

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

#### `.descix/manifests/<KB>.json`

**Check**: A corpus manifest exists at `{app_folder}/.descix/manifests/<KB-name>.json` (default KB
name is `General`) and its `sources` array names at least one git-tracked path.

**This is the real check** — the manifest is what `descix kb corpus sync` reads. There is no
folder-existence check to run instead of it: a `kb/General/` folder with files in it does nothing
for RAG until a manifest names it.

**If missing**, guide the user:

```
Your app doesn't have a knowledge base manifest yet. This file
(.descix/manifests/General.json) tells `descix kb corpus sync` which
of your git-tracked files to index for RAG.

Minimal shape:
{
  "kb_name": "General",
  "sync_mode": "local",
  "sources": [
    { "path": "docs", "ref": "main", "tier": 1, "doc_type": "documentation" }
  ]
}

Which folder(s) in your repo should I name as sources?
```

#### Manifest Sources

**Check**: `descix kb corpus status -a <app_id> -k <KB>` reports at least one tracked file (or run
`descix kb corpus sync --dry-run --show-walk` to preview the walk before syncing).

**If empty**, suggest:

```
Your knowledge base manifest has no sources yet (or its sources walk to zero files).
The AI can only answer questions based on content the manifest names.

Suggestions:
- Point a source at existing documentation
- Create a getting-started.md and name its folder
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

If the app already exists on Drive (Drive-mode authoring), offer to pull existing content.
**There is no dedicated "check what's on Drive" command** — the canonical tool is `descix drive
pull` itself, which downloads and converts in one step (nothing to plan around a separate check
command that doesn't exist).

### Offer to Pull

```
Your app may already have content on DeSciX Drive.

Would you like me to pull it into your local folder?
[Yes, pull from Drive] [No, I'll create new ones]
```

### Execute Pull

```bash
descix drive pull -c <community_id> -a <app_id>
```

This downloads and converts Drive content to local markdown (default KB `General`; pass `-k
<name>` for another) and reports what it pulled, converted, skipped or left unchanged. Follow up
with `descix kb corpus sync -a <app_id>` once the pulled files are named in a corpus manifest —
`descix drive pull` never syncs to Pinecone by itself.

## Validation Results Format

After validation, report status clearly:

```
## App Structure Validation: my-app

### Folder Structure
✓ assets/ exists
✓ .descix/manifests/General.json exists
✓ site/ exists
✓ microservice/ exists

### Required Assets
✓ assets/app_description.md (523 bytes)
✗ assets/icon.png - MISSING
✓ assets/system_instructions.md (1.2KB)

### Knowledge Base
✓ .descix/manifests/General.json names 1 source
✓ 5 documents tracked (`descix kb corpus status -a my-app -k General`)

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

### KB Overview Doc Template

Place this wherever your corpus manifest points (e.g. `docs/README.md`):

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
2. Run `descix quickstart` to configure the entire workspace
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

1. Check `.descix/manifests/<KB>.json` exists
2. Run `--dry-run --show-walk` and confirm the manifest's sources resolve to at least one file
3. Warn if no overview doc is named among the sources
4. Report total document count from the dry-run output

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
