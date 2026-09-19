/**
 * HOW A DEVELOPER (OR THEIR AI ASSISTANT) RUNS THIS CLI — the one owner.
 *
 * The npm package is `@descix/cli`; the binary it installs is `descix`. There is no npm package
 * named `descix`, so `npx descix …` is a 404 — and it was typed, independently, into the
 * "workspace not configured" remedy, the CLAUDE.md template and the docs (devx review 2026-09-19).
 * The editor MCP config meanwhile used a bare `descix`, which exists only after a GLOBAL install,
 * so an npx user's editor could not start the server.
 *
 * `npx -y -p @descix/cli descix …` works for both: with a global install npx finds the binary, and
 * without one it fetches the package. `-y` stops npx from prompting, which an editor launching an
 * MCP server (or an agent running a command) cannot answer.
 */
export const CLI_PACKAGE = '@descix/cli';
export const CLI_BIN = 'descix';
const NPX_PREFIX = ['-y', '-p', CLI_PACKAGE, CLI_BIN];

/** `npx -y -p @descix/cli descix <args…>` as one string, for a message a person copies. */
export function npxCommand(...args) {
  return ['npx', ...NPX_PREFIX, ...args].join(' ');
}

/** The MCP server entry every editor config uses: VS Code `.vscode/mcp.json`, Claude Code `.mcp.json`. */
export function mcpServerEntry() {
  return { command: 'npx', args: [...NPX_PREFIX, 'mcp-serve'] };
}
