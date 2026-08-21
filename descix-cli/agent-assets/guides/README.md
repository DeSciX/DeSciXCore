# App Pattern Guides

These guides describe the four app packaging patterns in DeSciX. Use them to help users choose the right architecture for their needs.

## Patterns Overview

| Pattern | Description | Public URL | MCP Tools |
|---------|-------------|------------|-----------|
| [Knowledge-Only](./knowledge-only-pattern.md) | RAG-indexed docs, no UI | No | No |
| [Static Site](./static-site-pattern.md) | HTML/CSS/JS + RAG docs | Yes | No |
| [Microservice](./microservice-pattern.md) | Backend service + MCP tools | Yes | Yes |
| [Dynamic Site](./dynamic-site-pattern.md) | SSR app + MCP tools | Yes | Yes |

## Decision Tree

```
Does the user need a public website?
│
├── NO → Knowledge-Only
│
└── YES → Does it have backend logic?
    │
    ├── NO → Static Site
    │
    └── YES → Does it need SSR?
        │
        ├── NO → Microservice
        │
        └── YES → Dynamic Site
```

## Quick Reference

### Knowledge-Only
- Just docs/content for RAG search
- No `site/` or `microservice/` folders needed
- Commands: `descix drive pull` / `descix drive push` / `descix kb corpus sync`

### Static Site
- Built HTML/CSS/JS deployed to CDN
- Add `site/` folder with `descix site init`
- Commands: `descix site upload`

### Microservice
- Backend service with MCP-exposed commands
- Add `microservice/` folder with `descix microservice init`
- Commands: `descix microservice register/vectorize`

### Dynamic Site
- SSR app where microservice serves the site
- Everything in `microservice/` (no separate `site/`)
- Commands: `descix microservice deploy` (ADMIN/LOCAL only — public deploy is not open yet)

## Two-Tier Template System

All patterns use the same two-tier template approach:

1. **Drive Templates** - Content (assets, KB) synced to/from Google Drive
2. **Git Scaffolds** - Code (site, microservice) copied from SDK templates

See [templates/drive/](../../templates/drive/) and [templates/scaffolds/](../../templates/scaffolds/) for the actual templates.
