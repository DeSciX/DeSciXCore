# Code Scaffolds

These templates contain **code** that must live in Git (not Google Drive). They are copied by the CLI when a user needs to add a site or microservice to their app.

## Why Scaffolds?

DeSciX uses a two-tier template system:

1. **Drive Templates** (`../drive/`) - Content (assets, KB docs) synced to/from Google Drive
2. **Git Scaffolds** (this folder) - Code that lives in Git, deployed separately

Code cannot live in Drive because:
- Code needs version control (Git)
- Code is deployed to Cloud Run / GCS (not synced to Drive)
- Code has dependencies (package.json, Dockerfile)

## Available Scaffolds

### Site (`site/`)

A hello-world static site with:
- `index.html` - Main entry point
- `styles.css` - Basic styling
- `app.js` - Client-side JavaScript
- `README.md` - Usage instructions

**Install with:**
```bash
descix site init
```

### Microservice (`microservice/`)

A complete Express microservice with:
- `app.js` - Server entry point
- `manifest.json` - Command registration
- `services/` - API handlers
- `Dockerfile` - Container build
- `SERVICE_README_TEMPLATE.md` - Tool discovery docs

**Install with:**
```bash
descix microservice init
```

## Usage

Run scaffold commands from your app directory (auto-detects context):

```bash
cd my-app/
descix site init          # Copies site/ scaffold
descix microservice init  # Copies microservice/ scaffold
```

## Placeholder Variables

Scaffolds use these placeholders (replaced during copy):

- `{{APP_NAME}}` - App display name
- `{{APP_ID}}` - App identifier (lowercase)
- `{{COMMUNITY_ID}}` - Community identifier
