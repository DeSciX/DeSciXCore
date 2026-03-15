# DeSciX

Build knowledge-powered apps with AI assistance. DeSciX is a platform for communities that want to package their expertise into interactive applications — courses, simulations, research tools, or anything else that benefits from AI-driven knowledge retrieval.

This extension connects VS Code to the DeSciX platform, registers the MCP server with your AI agent, and handles authentication so your agent can get to work immediately.

## Features

- **MCP server registration** — Automatically registers the DeSciX MCP server with VS Code's native MCP API. Your AI agent (GitHub Copilot, Claude Code, Cline) gets access to platform tools the moment you connect.
- **Powch authentication** — Passkey-based, zero-knowledge login. No passwords. No seed phrases to manage manually. Authentication happens through a secure Powch iframe — your credentials never touch this extension.
- **Agent instruction generation** — Generates `CLAUDE.md`, `.cursorrules`, and `copilot-instructions.md` so your AI agent understands the DeSciX workflow from the first message.
- **Status bar** — Shows your current connection state and workspace context at a glance. Click to connect, disconnect, or check status.
- **Invite detection** — If you receive a DeSciX invite link, the extension detects `.descix/app.json` in your workspace and prompts your agent to run the onboarding flow automatically.

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Open a project folder in VS Code
3. Click "DeSciX: Connect" in the status bar (or run the command from the Command Palette)
4. Complete the Powch authentication flow in the browser panel that opens
5. Your AI agent handles the rest — it will read the generated instructions and guide you through app setup

## Supported AI Agents

- GitHub Copilot (via VS Code's native MCP API)
- Claude Code
- Cline

The extension generates agent-specific instruction files for each. You can use multiple agents in the same workspace.

## Requirements

- VS Code 1.100 or later
- A DeSciX account (created during the Powch auth flow — no separate signup needed)
- Node.js 18 or later (for the DeSciX CLI, installed automatically as a dependency)

## Commands

| Command | Description |
|---------|-------------|
| DeSciX: Connect | Authenticate with Powch and activate the MCP server |
| DeSciX: Disconnect | Sign out and deactivate the MCP server |
| DeSciX: Initialize Workspace | Create a workspace configuration for the current folder |
| DeSciX: Show Status | Display current auth and workspace state |

## How It Works

The extension registers the `@descix/cli` MCP server with VS Code. Once registered, your AI agent can call tools like `descix_doctor`, `ask_question_to_app`, `find_communities`, and `resolve_invite` directly — no terminal required.

Authentication is handled by Powch, DeSciX's zero-knowledge SSO provider. Your passkey authenticates you without a password, and the session is scoped to your device.

## License

MIT
