# Knowledge-Only App Pattern

## Overview

A Knowledge-Only app is pure documentation/content that gets indexed for semantic search. No public URL, no executable code.

## When to Use

Choose this pattern when the user wants to:
- Make documentation searchable via RAG
- Create a reference library for AI agents
- Index research notes or papers
- Build training data for AI assistants

**Key Question:** "Do you need a public website or backend logic?"
- If NO → Knowledge-Only is the right choice

## Structure

```
my-docs/
├── assets/
│   ├── app_description.md      # Required
│   ├── icon.png                # Required (512x512)
│   └── system_instructions.md  # Required
├── docs/                       # Your content — any location works
│   ├── getting-started.md
│   ├── api-reference.md
│   └── tutorials/
│       └── ...
└── .descix/
    └── manifests/
        └── General.json        # Corpus manifest — names the docs source(s) above
```

**Note:** No `site/` or `microservice/` folders needed. There is no required KB folder — the
corpus manifest names whichever git-tracked directory holds your docs (`docs/` above is just an
example; `kb/General/` also works if that's where content ends up, e.g. from `descix drive pull`).

## Configuration (`workspace.json`)

One `env.products[]` entry, written by `descix app init` (never by hand); no `site` and no
`microservice` slot:

```json
{
  "appId": "my-community-my-docs",
  "communityId": "my-community",
  "localPath": "my-docs",
  "kbId": "General"
}
```

## CLI Workflow

```bash
# 1. Pull content from Drive (if any)
descix drive pull -c <community> -a <app>

# 2. Add local files to staging
cp my-new-doc.pdf kb/staging/

# 3. Push to Drive (converts to text)
descix drive push -c <community> -a <app>

# 4. Pull converted text back
descix drive pull -c <community> -a <app>

# 5. Commit the pulled markdown, name its folder in .descix/manifests/<KB>.json, then chunk + sync to Pinecone in one pass
descix kb corpus sync -a <app>
```

The git path needs no Drive at all: commit markdown, name it in the manifest, run step 5.

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| RAG chat (`ask_question_to_app`) | Yes |
| Public URL | No |
| MCP tools | No |
| tell_me_how discovery | No |

## Example Use Cases

1. **Research Library** - Index academic papers for semantic search
2. **Internal Docs** - Make company documentation searchable by AI
3. **Training Data** - Build a knowledge base for fine-tuning AI models
4. **Reference Materials** - API docs, specifications, standards
