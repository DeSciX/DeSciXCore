# Workspace Configuration Guide

**Status:** Implemented  
**Version:** 2.0  
**Last Updated:** January 2026

This document describes how DeSciX workspaces are configured, including workspace modes, configuration files, and sync modes.

---

## 1. Workspace Modes

The DeSciX CLI supports three workspace modes, determined by the structure of `workspace.json`.

### 1.1 Single App Mode

**Use Case:** Dedicated repository for a single app.

```json
{
  "communities": {
    "descix": {
      "apps": {
        "agent": {
          "localPath": ".",
          "sync_mode": "git"
        }
      }
    }
  }
}
```

**Characteristics:**
- Workspace root IS the app folder
- No community subfolder created
- Simplest structure for focused development

**Folder Structure:**
```
[workspace-root]/
├── .descix/
│   └── workspace.json
├── assets/
├── kb/
├── site/
└── microservice/
```

### 1.2 Single Community Mode

**Use Case:** Multiple apps within one community.

```json
{
  "communities": {
    "descix": {
      "apps": {
        "agent": { "localPath": "agent", "sync_mode": "git" },
        "docs": { "localPath": "docs", "sync_mode": "git" }
      }
    }
  }
}
```

**Folder Structure:**
```
[workspace-root]/
├── .descix/
│   └── workspace.json
├── agent/
│   ├── assets/
│   └── kb/
└── docs/
    ├── assets/
    └── kb/
```

### 1.3 Multi-Community Mode

**Use Case:** Working across multiple communities.

```json
{
  "communities": {
    "descix": {
      "apps": {
        "agent": { "localPath": "descix/agent", "sync_mode": "git" }
      }
    },
    "myorg": {
      "apps": {
        "assistant": { "localPath": "myorg/assistant", "sync_mode": "git" }
      }
    }
  }
}
```

**Folder Structure:**
```
[workspace-root]/
├── .descix/
│   └── workspace.json
├── descix/
│   └── agent/
│       ├── assets/
│       └── kb/
└── myorg/
    └── assistant/
        ├── assets/
        └── kb/
```

---

## 2. Configuration Files

### 2.1 `.descix/workspace.json`

**Location:** `[workspace-root]/.descix/workspace.json`  
**Purpose:** Workspace-level configuration

**Schema:**
```json
{
  "communities": {
    "[community_id]": {
      "apps": {
        "[app_id]": {
          "localPath": "path/to/app",
          "sync_mode": "git"
        }
      }
    }
  },
  "driveConfig": {
    "base_folder_id": "1ABC..."
  },
  "environment": "development",
  "apiUrl": "https://localhost:4000"
}
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `communities` | Yes | Map of community IDs to their configuration |
| `communities.[id].apps` | Yes | Map of app IDs to their configuration |
| `communities.[id].apps.[id].localPath` | Yes | Relative path from workspace root |
| `communities.[id].apps.[id].kbId` | No | Default KB folder name (default: `"General"`) |
| `communities.[id].apps.[id].absolutePath` | No | Absolute path to app (auto-set during init) |
| `communities.[id].apps.[id].site.port` | No | Local dev server port for CodeSite |
| `communities.[id].apps.[id].service.port` | No | Local dev server port for Microservice |
| `driveConfig.base_folder_id` | Yes | User's Drive base folder ID |
| `environment` | No | `"development"` or `"production"` |
| `apiUrl` | No | Override API URL (dev mode) |

### 2.2 `.descix/wallet.json`

**Location:** `[workspace-root]/.descix/wallet.json`  
**Purpose:** Authentication credentials (Git-ignored)

**Schema:**
```json
{
  "walletAddress": "0x...",
  "signature": "...",
  "tokenSymbol": "DAITA",
  "communityId": "descix",
  "userId": "user_...",
  "email": "user@example.com",
  "sessionToken": "...",
  "expiresAt": "2026-01-28T00:00:00.000Z"
}
```

**Security:** This file is automatically added to `.gitignore` during setup.

---

## 3. Sync Modes

DeSciX supports two sync modes, determined by how the app is managed:

### 3.1 Git Mode (CLI Developers)

**Source of Truth:** Local Git repository  
**Versioning:** Git  
**Tool:** CLI (`descix kb *` commands)

**Workflow:**
1. User creates/edits documents in Google Drive
2. User runs `descix drive pull` to get text-converted content
3. User edits text files locally (Git version control)
4. User runs `descix kb corpus sync` to generate chunks
5. User runs `descix kb corpus sync` to push chunks to Pinecone
6. User commits changes to Git

**When to Use:**
- Developers with local development environment
- Need for Git version control
- Offline development capability
- Code review workflows
- CodeSite or Microservice development

### 3.2 Drive Mode (PWA Users)

**Source of Truth:** Google Drive  
**Versioning:** GCS/Firestore  
**Tool:** PWA only (no CLI)

**Workflow:**
1. User edits files in Drive or PWA
2. Backend automatically syncs to GCS/Pinecone
3. No local CLI involvement

**When to Use:**
- Non-technical users
- Browser-based editing
- Real-time collaboration
- No local tooling required
- Knowledge-base-only apps (no CodeSite or Microservice)

### 3.3 Mode Determination

**Important:** The CLI only supports git-mode operations. If you're using the CLI, you're in git-mode.

| Tool | Mode | Configuration |
|------|------|---------------|
| CLI | Git mode only | `workspace.json` |
| PWA | Drive mode | Automatic (backend handles) |

There is no CLI command to switch modes - the mode is determined by which tool you use.

---

## 4. Drive Configuration

### 4.1 Base Folder ID

The `base_folder_id` is the root of all DeSciX content in the user's Drive.

**Structure in Drive:**
```
[User's Base Folder]/
├── [community_id]/
│   ├── community_assets/
│   └── [app_id]/
│       ├── assets/
│       ├── kb/
│       │   └── General/
│       ├── site/
│       └── microservice/
└── [other_community]/
```

**Folder Navigation:**
```javascript
// Template-based navigation
const kbPath = `${communityId}/${appId}/kb/${kbId}`;
const folderId = await findFolderByPath(baseFolderId, kbPath);
```

### 4.2 Template-Based Navigation

The SDK navigates Drive using predictable template paths:

| Content | Drive Path |
|---------|------------|
| App folder | `{community}/{app}/` |
| KB folder | `{community}/{app}/kb/{kb_name}/` |
| Assets | `{community}/{app}/assets/` |
| Site | `{community}/{app}/site/` |

---

## 5. ADC Authentication

### Requirements

Google Cloud ADC (Application Default Credentials) is required for Drive access.

**Setup:**
```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive
```

### Verification

The CLI verifies ADC before operations:

```javascript
// google-storage-adc.js
async function verifyDriveAuth() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });
  const response = await drive.about.get({ fields: 'user' });
  return response.data.user;
}
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Could not load default credentials" | ADC not configured | Run `gcloud auth application-default login` |
| "Drive authentication failed" | Scopes missing | Re-run with Drive scopes |
| "base_folder_id missing" | Not setup | Run `descix mcp quickstart` |

---

## 6. Workspace Detection

### Algorithm

```javascript
function detectWorkspaceMode(workspaceConfig) {
  const communities = Object.keys(workspaceConfig.communities || {});
  
  if (communities.length === 0) {
    throw new Error('No communities configured');
  }
  
  if (communities.length === 1) {
    const apps = Object.keys(workspaceConfig.communities[communities[0]].apps);
    if (apps.length === 1) {
      const app = workspaceConfig.communities[communities[0]].apps[apps[0]];
      if (app.localPath === '.' || app.localPath === '') {
        return 'single_app';
      }
    }
    return 'single_community';
  }
  
  return 'multi_community';
}
```

### Mode-Specific Behavior

| Mode | Community Folder | App Folder | Context Inference |
|------|-----------------|------------|-------------------|
| single_app | Workspace root | Workspace root | Full (community + app) |
| single_community | Workspace root | `./[app]/` | Community only |
| multi_community | `./[community]/` | `./[community]/[app]/` | None |

---

## 7. CLI Context Resolution

The CLI auto-detects app context from the current working directory:

```javascript
// WorkspaceConfig.detectContext() matches cwd against registered app paths
detectContext(startDir = process.cwd()) {
  const cwd = path.resolve(startDir);
  for (const [commId, comm] of Object.entries(this.communities || {})) {
    for (const [appId, app] of Object.entries(comm.apps || {})) {
      if (app.absolutePath && cwd.startsWith(app.absolutePath)) {
        return { communityId: commId, appId, kbId: app.kbId || 'General' };
      }
    }
  }
  return null;
}

// resolveContextWithOptions() combines CLI flags with autodiscovery
resolveContextWithOptions(options = {}) {
  // 1. Try explicit flags first
  if (options.community && options.app) {
    return { communityId: options.community, appId: options.app, ... };
  }
  
  // 2. Fall back to autodiscovery from cwd
  const detected = this.detectContext();
  if (detected) {
    return {
      communityId: options.community || detected.communityId,
      appId: options.app || detected.appId,
      kbId: options.kb || detected.kbId
    };
  }
  
  return null;
}
```

**Usage Pattern:**
```bash
# From within an app directory - auto-detects community/app
cd descix/appsdk
descix kb corpus sync           # Works without -c/-a flags

# From workspace root - requires flags
cd /workspace
descix kb corpus sync -c descix -a appsdk
```

---

## 8. File References

| Component | Path | Description |
|-----------|------|-------------|
| WorkspaceConfig | `DeSciX_Core/descix-cli/lib/workspace-config.js` | Sole configuration class for CLI |
| GlobalConfig | `DeSciX_Core/descix-cli/lib/global-config.js` | User-level settings (~/.descix) |
| Workspace Utils | `DeSciX_Core/descix-cli/lib/workspace-utils.js` | Helper utilities |
| Setup Command | `DeSciX_Core/descix-cli/lib/wizard/setup.js` | Initial workspace setup |
| Config Commands | `DeSciX_Core/descix-cli/lib/commands/config.js` | Configuration management |
