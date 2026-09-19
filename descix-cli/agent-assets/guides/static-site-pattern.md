# Static Site App Pattern

## Overview

A Static Site app is a built website (HTML/CSS/JS) deployed to CDN, plus documentation indexed for RAG. No backend logic.

## When to Use

Choose this pattern when the user wants to:
- Deploy a documentation site (VitePress, Docusaurus)
- Host a landing page or portfolio
- Create a marketing site with searchable content
- Build a client-side-only web app

**Key Questions:**
1. "Do you need a public website?" → Yes
2. "Does it have backend logic?" → No

## Structure

```
my-site/
├── assets/
│   ├── app_description.md
│   ├── icon.png
│   └── system_instructions.md
├── docs/                       # Your RAG content — any location works
│   └── ... (markdown, named in a corpus manifest)
├── site/                       # Static files to deploy
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── DeSciXAppSDK.js         # The DeSciX bridge — GENERATED, see below
│   ├── README.md
│   └── dist/                   # Build output (if using bundler)
├── src/                        # Source files (not deployed)
│   └── ...
├── .descix/
│   └── manifests/
│       └── General.json        # Corpus manifest — names docs/ as the sync source
├── package.json
└── vite.config.js
```

## Configuration (`workspace.json`)

One `env.products[]` entry, written by `descix app init` and `descix app set-site` (never by hand):

```json
{
  "appId": "my-community-my-site",
  "communityId": "my-community",
  "localPath": "my-site",
  "kbId": "General",
  "site": { "static": "site" }
}
```

For a framework dev server instead of files on disk, `descix app set-site -a <app_id> --port 3000`
writes `"site": { "port": 3000 }`; the gateway proxies `/p/<app_id>` to it without rewriting paths,
so the framework's base path must be `/p/<app_id>/`.

## CLI Workflow

```bash
# 1. Create site scaffold (if starting fresh)
descix site init

# 2. Build your site
npm run build

# 3. Upload site to GCS
descix site upload
```

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| RAG chat (`ask_question_to_app`) | Yes |
| Public URL | Yes |
| MCP tools | No |
| tell_me_how discovery | No |

## Example Use Cases

1. **Documentation Site** - VitePress/Docusaurus docs with searchable content
2. **Landing Page** - Marketing site for a project or product
3. **Portfolio** - Personal or company portfolio
4. **Client-Side App** - React/Vue app with no backend

## Site Scaffold

To add the site folder to an existing app:

```bash
descix site init
```

This copies the site template with:
- `index.html` - Main entry point
- `styles.css` - Basic styling
- `app.js` - Client-side JavaScript
- `DeSciXAppSDK.js` - The DeSciX bridge: reaches `DeSciX.view`, `DeSciX.chat` and the rest
  of the shell's bus, resolving the frame level for you. **Do not hand-edit it.** It is
  GENERATED from `descix-app-sdk/templates/DeSciXAppSDK.template.js`, which inlines the one
  owner of level detection (`descix-app-sdk/src/util/bridgeResolver.js`); a `--check` drift
  gate keeps the copies identical. Edit the template, regenerate — a local patch forks the
  bridge and silently stops inheriting its fixes.
- `README.md` - Usage instructions

## Deployment

`descix site upload -a <app_id>` uploads the files (delta) to the app's site prefix in Google Cloud Storage and records the deploy manifest. The app is then served on its own host, `https://<app_id>.dev.descix.net/` on DEV and `https://<app_id>.descix.net/` on PROD; `descix site status -c <community> -a <app_id>` shows the deployed manifest.
