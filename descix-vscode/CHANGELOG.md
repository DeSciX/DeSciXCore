# Changelog

## [0.1.0] - 2026-03-14

### Added
- MCP server registration with VS Code's native MCP API
- Powch authentication flow (passkey-based, zero-knowledge)
- Agent instruction file generation (CLAUDE.md, .cursorrules, copilot-instructions.md)
- Status bar showing connection and workspace state
- Invite detection (.descix/app.json) for onboarding from shared links
- descix_doctor, ask_question_to_app, query_knowledge_base, find_communities, list_apps_for_community, tell_me_how, resolve_invite MCP tools

### Known Issues
- The `@descix/cli` dependency is currently a `file:` reference (`"file:../descix-cli"`), which is incompatible with marketplace publish. Before publishing to the VS Code Marketplace, `@descix/cli` must be published to npm and this dependency updated to a semver version. See the Demo Environment TODO in the project documentation.
