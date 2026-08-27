# Site Folder

This folder contains your app's static site files that are deployed to the web.

## Structure

```
site/
├── index.html    # Main entry point
├── styles.css    # Stylesheet
├── app.js        # Client-side JavaScript
└── README.md     # This file
```

## Deployment

Your site is deployed when you run:

```bash
descix site upload
```

The site files are uploaded to Google Cloud Storage and served within the DeSciX PWA.

## Using the DeSciX SDK

The DeSciX SDK is automatically injected into your CodeSite when running within the PWA App Shell. You can access it via the global `DeSciX` object.

```javascript
// 1. Access global application data
const stats = await DeSciX.AppData.getCommunityStats();

// 2. Call DeSciX API (uses parent PWA session)
const result = await DeSciX.call('ask_question_to_app', {
  community_id: 'egpt',
  app_id: 'agent',
  user_input: 'Explain the platform architecture'
});
```

## Adding More Files

Add any static assets (images, fonts, additional JS/CSS) to this folder. All files in `site/` are deployed together.

## Local Development

To test your site within the DeSciX PWA, use the `servelocal` command:

```bash
descix site servelocal 3000
```
