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
└── kb/
    ├── staging/                # New files to push
    ├── General/                # Text-converted content
    │   ├── README.md
    │   ├── getting-started.md
    │   ├── api-reference.md
    │   └── tutorials/
    │       └── ...
    └── chunks/                 # Processed chunks (JSON)
```

**Note:** No `site/` or `microservice/` folders needed.

## Configuration (`workspace.json`)

```json
{
  "communities": {
    "my-community": {
      "apps": {
        "my-docs": {
          "localPath": "my-community/my-docs",
          "sync_mode": "git"
        }
      }
    }
  }
}
```

## CLI Workflow

```bash
# 1. Pull content from Drive (if any)
descix kb pull -c <community> -a <app>

# 2. Add local files to staging
cp my-new-doc.pdf kb/staging/

# 3. Push to Drive (converts to text)
descix kb push -c <community> -a <app>

# 4. Pull converted text back
descix kb pull -c <community> -a <app>

# 5. Chunk for RAG
descix kb chunk -c <community> -a <app>

# 6. Sync to Pinecone
descix kb sync -c <community> -a <app>
```

## Capabilities

| Capability | Enabled |
|------------|---------|
| RAG search | Yes |
| chat_with_kb | Yes |
| Public URL | No |
| MCP tools | No |
| tell_me_how discovery | No |

## Example Use Cases

1. **Research Library** - Index academic papers for semantic search
2. **Internal Docs** - Make company documentation searchable by AI
3. **Training Data** - Build a knowledge base for fine-tuning AI models
4. **Reference Materials** - API docs, specifications, standards
