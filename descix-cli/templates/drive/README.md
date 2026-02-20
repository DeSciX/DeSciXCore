# Drive Templates

These templates are the canonical source for content that lives in Google Drive. They are uploaded to Drive and used by the backend when creating new communities and apps.

## Template Structure

### Community Template (`community/`)

```
community/
├── community_assets/
│   ├── icon.png              # 512x512 community icon
│   └── community_description.md
└── Apps/                     # Empty folder for apps
```

### App Template (`app/`)

```
app/
├── assets/
│   ├── app_description.md    # App store listing
│   ├── system_instructions.md # AI persona definition
│   └── icon.png              # 512x512 app icon
└── kb/
    └── General/
        └── README.md         # KB starter document
```

## Usage

These templates are:
1. Uploaded to Google Drive (by admin)
2. Referenced by folder ID in `DeSciX_Cloud/defaults-config.json`
3. Copied by the backend when `create_community_with_app` is called

**Note:** Code scaffolds (site, microservice) live in `../scaffolds/`, not here. Drive templates contain only content that syncs to/from Google Drive.

## Placeholder Variables

- `{{APP_NAME}}` - Replaced with the app name during creation
- `{{COMMUNITY_NAME}}` - Replaced with the community name during creation
