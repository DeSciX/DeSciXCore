# DeSciX Drive Templates

**IMPORTANT:** These templates should be uploaded to Google Drive and are the SINGLE SOURCE OF TRUTH for creating communities and apps.

## Google Drive Location

**Target Folder:** https://drive.google.com/drive/folders/1AcX-YDR5mFQo1QolBgMG7KpX2cTWF0dn  
**Owner:** dip@descix.net

## Template Structure

### `community_template/`

The canonical folder structure for creating new communities:

```
community_template/
├── community_assets/
│   ├── icon.png                    # Required: 512x512 community icon
│   └── community_description.md   # Required: Community description (placeholder)
└── Apps/                           # Empty folder - apps are added here
```

### `agent_app_template/`

The canonical folder structure for creating new agent apps:

```
agent_app_template/
├── assets/
│   ├── app_description.md         # Required: App description (placeholder)
│   ├── system_instructions.md     # Required: AI persona instructions (placeholder)
│   └── icon.png                    # Required: 512x512 app icon
├── kb/
│   └── General/
│       └── README.md               # Starter KB document
├── site/                           # Empty - for static site content
└── microservice/                   # Empty - for backend service code
```

## How Templates Are Used

### Creating a Community

1. Backend calls `copyFolderRecursive(COMMUNITY_TEMPLATE_ID, userBaseFolderId, communityId)`
2. The entire `community_template/` structure is copied to the user's folder
3. Folder is renamed to the `community_id`
4. Firestore `Community` document is created
5. User can then add apps to the community

### Creating an App

1. Backend calls `copyFolderRecursive(AGENT_APP_TEMPLATE_ID, communityFolderId, appId)`
2. The entire `agent_app_template/` structure is copied into the community folder
3. Folder is renamed to the `app_id`
4. Firestore `App` and `KnowledgeBase` documents are created
5. User can then customize assets and add KB content

## Placeholder Variables

Templates contain placeholder variables that can be replaced post-copy:

| Variable | Description |
|----------|-------------|
| `{{COMMUNITY_NAME}}` | The community's display name |
| `{{APP_NAME}}` | The app's display name |

These are NOT automatically replaced - they serve as guidance for the user to edit.

## Uploading to Google Drive

**Status:** ✅ Templates have been uploaded.

If you need to re-upload:
1. Upload the `community_template/` folder to the target Drive folder
2. Upload the `agent_app_template/` folder to the target Drive folder
3. Update folder IDs in `DeSciX_Cloud/defaults-config.json`

**Note:** Default icons are already included (from `DeSciX_PWA/assets/icon.png`).

## Important Notes

- **Do NOT modify templates without updating all consumers**
- **Templates are the SINGLE source for folder structure**
- **All structure validation has been removed from the backend**
- **If template structure is wrong, all new communities/apps will be wrong**

## Configuration

Template folder IDs are stored in `DeSciX_Cloud/defaults-config.json` (not secrets):

```json
"DRIVE_COMMUNITY_TEMPLATE_FOLDER_ID": "1ocVhrODQPGMICWmod3OWSGAj4-t6-o-B",
"DRIVE_AGENT_APP_TEMPLATE_FOLDER_ID": "1ewnvtVG5hhEcRg_rcYmnGiWjTjznu8nu"
```

**Google Drive Links:**
- Community Template: https://drive.google.com/drive/folders/1ocVhrODQPGMICWmod3OWSGAj4-t6-o-B
- Agent App Template: https://drive.google.com/drive/folders/1ewnvtVG5hhEcRg_rcYmnGiWjTjznu8nu

## Related Documentation

- [Template-Based Creation Consolidation](../../../design/proposed/template-based-creation-consolidation.md)
- [Standard Folder Structure](../../agent-assets/instructions/standard-folder-structure.md)
