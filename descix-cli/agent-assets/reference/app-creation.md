# App Creation Guide

**Status:** Implemented  
**Version:** 2.0  
**Last Updated:** January 2026

This document describes how apps and communities are created in the DeSciX platform and how the local workspace for an app is set up.

---

## 1. Core Philosophy

**"One path to an app"**

- **Apps:** `descix app init -a <name> -c <community> -p <dir>` creates the app on the platform (`create_app_for_community`, which composes the id `<community>-<short>` and guarantees the default KB) and registers it in the local workspace in one idempotent step. The PWA creates apps too; both reach the same server command. Entitlement checks run server-side either way.
- **Communities:** created by platform admins only (`descix community create` is `[ADMIN]` and writes live Polygon). A developer builds inside an existing community.
- **Development:** the CLI is the tool for the local workspace, content, and syncing to the cloud.

**Important Distinction:**

| Mode | Users | Tool | Content Management |
|------|-------|------|-------------------|
| **Drive Mode** | Non-developers | PWA only | Server-side pipeline (Drive → GCS → Pinecone) |
| **Git Mode** | Developers | CLI | Local processing (Drive pull → Git → Pinecone) |

All apps start on Drive (users create documents there). Git-mode applies when developers pull content locally and use Git for version control of text/chunks. The CLI **only supports git-mode** operations.

---

## 2. Two-Tier Template Architecture

### Why Two Tiers?

DeSciX uses a **two-tier template system** that separates content from code:

1. **Drive Templates** - Content (assets, KB docs) synced to/from Google Drive
2. **Git Scaffolds** - Code (site, microservice) that lives in Git

This separation ensures:
- Content stays editable in Drive (non-developers can update)
- Code stays version-controlled in Git
- Clear deployment paths for each type
- No code in Drive, no content in Git scaffolds

### Drive Templates

**Location:** Google Drive, owned by `dip@descix.net`  
**SDK Reference:** `DeSciX_Core/descix-cli/templates/drive/`  
**Template IDs:** Configured in `DeSciX_Cloud/microservice/defaults-config.json`

```json
{
  "DRIVE_COMMUNITY_TEMPLATE_FOLDER_ID": "1ABC...",
  "DRIVE_AGENT_APP_TEMPLATE_FOLDER_ID": "1XYZ..."
}
```

**Community Template:**
```
templates/drive/community/
├── community_assets/
│   ├── icon.png                    # Community icon (512x512)
│   └── community_description.md    # Community description
└── Apps/                           # Empty, ready for apps
```

**App Template:**
```
templates/drive/app/
├── assets/
│   ├── app_description.md         # App store listing
│   ├── system_instructions.md     # AI persona instructions
│   └── icon.png                    # App icon (512x512)
└── kb/
    └── General/
        └── README.md               # KB starter doc
```

**Note:** The Drive template does NOT include `site/` or `microservice/` folders. Code scaffolds are added separately via CLI.

### Git Scaffolds

**Location:** microservice — `DeSciX_Core/descix-cli/templates/scaffolds/`;
site — `DeSciX_Core/descix-app-sdk/scaffold/` (owned there, and exported as `SITE_SCAFFOLD_DIR`
from `@descix/app-sdk/scaffold`, so no caller re-derives the path).

**Site Scaffold:**
```
descix-app-sdk/scaffold/site/
├── index.html        # Entry point
├── styles.css        # Basic styling
├── app.js            # Client-side JavaScript
├── DeSciXAppSDK.js   # The DeSciX bridge — GENERATED, do not hand-edit
└── README.md         # Usage instructions
```

`DeSciXAppSDK.js` ships IN the scaffold; it is not something you add afterwards. It is
generated from `descix-app-sdk/templates/DeSciXAppSDK.template.js` (which inlines
`descix-app-sdk/src/util/bridgeResolver.js`, the one owner of frame-level detection) and a
`--check` drift gate keeps the copies identical. Patch the template and regenerate — never
the copy.

**Microservice Scaffold:**
```
templates/scaffolds/microservice/
├── app.js                      # Entry point — binds the server, mounts the router
├── package.json
├── Dockerfile
├── app.yaml
├── manifest.json
├── defaults-config.json        # Layered config: committed defaults
├── defaults-config-dev.json
├── setup-schema.json
├── SERVICE_README_sdk.md
├── scripts/
│   └── register.js             # Registers the service MANIFEST (commands) for discovery
├── services/
│   ├── utils.js                # Config bootstrap over @descix/cloud-core — read first
│   ├── apiFront.js
│   ├── mcpClient.js
│   └── commandHandlers/
└── templates/
    └── SERVICE_README_TEMPLATE.md
```

There is no `src/` directory. The entry point is `app.js` at the root and the service code
lives under `services/`. See `guides/microservice-pattern.md` for why `services/utils.js` is
the file to open first.

### Adding Scaffolds to Apps

After `descix app init` (or PWA creation), add code scaffolds via CLI:

```bash
# Add site scaffold
descix site init

# Add microservice scaffold
descix microservice init
```

---

## 3. Creation Flows

### 3.1 Community Creation

**Trigger:** User creates community via PWA  
**Backend Endpoint:** `create_community_with_app`

**Flow:**
```mermaid
sequenceDiagram
    participant PWA
    participant Backend
    participant Drive
    participant Firestore
    
    PWA->>Backend: create_community_with_app(name, token)
    Backend->>Backend: Check entitlements
    Backend->>Drive: copyFolderRecursive(COMMUNITY_TEMPLATE)
    Drive-->>Backend: new_folder_id
    Backend->>Firestore: Create Community doc
    Backend->>Firestore: Create default App doc
    Backend-->>PWA: {community_id, app_id, folder_id}
```

**Backend Implementation:**
```javascript
// communityManagement.js
async function create_community_with_app(params) {
  // 1. Copy community template
  const communityFolderId = await copyFolderRecursive(
    DRIVE_COMMUNITY_TEMPLATE_FOLDER_ID,
    userBaseFolderId,
    params.name
  );
  
  // 2. Copy app template into community
  const appFolderId = await copyFolderRecursive(
    DRIVE_AGENT_APP_TEMPLATE_FOLDER_ID,
    communityFolderId + '/Apps',
    params.app_name
  );
  
  // 3. Create Firestore records
  await createCommunityDoc(communityId, communityFolderId);
  await createAppDoc(appId, appFolderId);
  
  return { community_id, app_id };
}
```

### 3.2 App Creation

**Trigger:** User creates app via PWA (within existing community)  
**Backend Endpoint:** `create_skeleton_app`

**Flow:**
```mermaid
sequenceDiagram
    participant PWA
    participant Backend
    participant Drive
    participant Firestore
    
    PWA->>Backend: create_skeleton_app(community_id, app_name)
    Backend->>Backend: Check entitlements + service slot
    Backend->>Drive: copyFolderRecursive(APP_TEMPLATE)
    Drive-->>Backend: new_folder_id
    Backend->>Firestore: Create App doc
    Backend-->>PWA: {app_id, folder_id}
```

---

## 4. Local Workspace

There is no PWA "workspace builder" hand-off and no hydration step. The local workspace is built by
CLI verbs, each writing one part of `.descix/workspace.json` (v2.1 — see `workspace-config.md`):

```bash
descix config init --env dev                        # creates .descix/workspace.json, pins env.apiUrl
descix login                                        # .descix/wallet.json (add it to .gitignore yourself)
descix app init -a <name> -c <community> -p .       # env.products[] entry + site/ microservice/ assets/ + default KB
descix app set-site -a <app_id> --static site       # what the gateway serves at /p/<app_id>
descix app set-port -a <app_id> -p 4001             # required before descix microservice init
```

`descix app init` creates `site/`, `microservice/` and `assets/` (with starter
`system_instructions.md` and `app_description.md`) under the app directory. Knowledge-base content
is whatever your corpus manifest names (`.descix/manifests/<KB>.json`); Drive content arrives via
`descix drive pull -c <community> -a <app_id>` into `kb/<KB>/` and goes back via `descix drive push`.
The CLI auto-detects the app from the directory you are standing in; `-c`/`-a` flags win over
detection.

---

## 5. Folder Structure Standards

### App Folders

| Folder | Purpose | Sync Direction |
|--------|---------|----------------|
| `assets/` | App metadata (icon, description) | Bidirectional |
| `kb/staging/` | Local files to push to Drive | Local → Drive |
| `kb/General/` | Text-converted files from Drive | Drive → Local |
| `kb/chunks/` | JSON chunks for Pinecone | Local only |
| `site/` | Static site files | Local → GCS |
| `microservice/` | Service code | Local → GCS |

### Required Files

**`assets/` folder:**
- `icon.png` - App icon (square, PNG, 512x512 recommended)
- `app_description.md` - Markdown description for App Store
- `system_instructions.md` - AI agent persona and instructions

**`kb/General/` folder:**
- Contains reference documents for RAG
- All formats converted to Markdown/text

---

## 6. Entitlement Checks

App creation requires appropriate entitlements:

| Resource | Entitlement Required |
|----------|---------------------|
| Community | Community Creation NFT or Subscription |
| App | Service Slot (Runner NFT/Subscription) |
| KB Storage | Included with app |
| Pinecone Vectors | Metered by plan |

The PWA and backend enforce these checks before template copying.

---

## 7. Key Backend Functions

### Template Copying

```javascript
// googleStorageService.js
async function copyFolderRecursive(sourceFolderId, destParentId, newName) {
  // Recursively copies folder structure
  // Maintains all files and subfolders
  // Returns new folder ID
}
```

### Creation Endpoints

| Endpoint | Description |
|----------|-------------|
| `create_community_with_app` | Create community + default app + token |
| `create_skeleton_app` | Create app from template in existing community |
| `create_kb_subfolder` | Add KB subfolder to existing app |

---

## 8. CLI Commands

### App Creation

```bash
descix config init --env dev                       # pin the environment first (no default)
descix login                                       # device-code sign-in
descix app init -a <name> -c <community> -p .      # create on the platform + register locally + default KB
```

An app created in the PWA is initialized locally with the same verb, minus `-c`:
`descix app init -a <app_id> -p .`.

### Post-Creation Commands

```bash
descix kb corpus sync -a <app_id>      # chunk + sync the manifest's sources to Pinecone
descix site upload -a <app_id>         # deploy the static site
```

---

## 9. File References

| Component | Path | Description |
|-----------|------|-------------|
| Community Management | `DeSciX_Cloud/microservice/services/communityManagement.js` | Community/App creation |
| App Commands | `DeSciX_Cloud/microservice/services/commandHandlers/appCommands.js` | Server-side app ops |
| Google Storage Service | `DeSciX_Cloud/microservice/services/googleStorageService.js` | Drive/GCS operations |
| Template Config | `DeSciX_Cloud/microservice/defaults-config.json` | Template folder IDs |
| Drive Templates | `DeSciX_Core/descix-cli/templates/drive/` | Content templates |
| Git Scaffolds | `DeSciX_Core/descix-cli/templates/scaffolds/` | Code scaffolds |
| Hydrator | `DeSciX_Core/descix-cli/lib/core/Hydrator.js` | `copyScaffold` — copies the site / microservice scaffold into an app |
| WorkspaceConfig | `DeSciX_Core/descix-cli/lib/workspace-config.js` | CLI configuration |
| Setup Command | `DeSciX_Core/descix-cli/lib/wizard/setup.js` | Initial setup |
| Scaffold Command | `DeSciX_Core/descix-cli/bin/descix.js` | CLI scaffolds |
