/**
 * There is ONE way this CLI tells anyone to invoke it, and every editor config uses it.
 *
 * Measured 2026-09-19 (devx review): `npx descix …` — a 404, there is no npm package `descix` — was
 * printed by the "workspace not configured" remedy and written into the CLAUDE.md template; the
 * VS Code MCP config used a bare `descix`, which exists only after a global install; and nothing
 * wrote Claude Code's `.mcp.json` at all.
 *
 * Run: node --test tests/cli-invocation-owner.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { npxCommand, mcpServerEntry, CLI_PACKAGE } from '../lib/invocation.js';
import { generateClaudeCodeMcpConfig } from '../lib/agent-files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8');

test('the owner names the REAL package, never a bare `descix` package', () => {
    assert.equal(CLI_PACKAGE, '@descix/cli');
    assert.equal(npxCommand('init'), 'npx -y -p @descix/cli descix init');
    assert.deepEqual(mcpServerEntry(), { command: 'npx', args: ['-y', '-p', '@descix/cli', 'descix', 'mcp-serve'] });
});

test('no shipped instruction or message tells anyone to run `npx descix`', () => {
    for (const f of ['templates/agent-claude.md', 'lib/agent-files.js', 'bin/descix.js']) {
        assert.doesNotMatch(read(f), /npx descix\b/, f);
    }
    assert.match(read('lib/workspace-config.js'), /Run "\$\{npxCommand\('init'\)\}" first/);
});

test('the Claude Code template states EXACTLY the owner\'s MCP entry, in .mcp.json', () => {
    const t = read('templates/agent-claude.md');
    assert.match(t, /\*\*`\.mcp\.json`\*\* at the project root/);
    assert.ok(t.includes(`"args": ${JSON.stringify(mcpServerEntry().args).replace(/,/g, ', ')}`),
        'template args must equal mcpServerEntry().args');
    // The settings.json CODE BLOCK itself must carry no mcpServers (the prose may name both files).
    const start = t.indexOf('**`.claude/settings.json`**');
    const block = t.slice(t.indexOf('```json', start), t.indexOf('```\n', t.indexOf('```json', start) + 7));
    assert.ok(start > 0 && block.length > 0, 'the settings.json block exists');
    assert.doesNotMatch(block, /mcpServers/, 'mcpServers never goes in .claude/settings.json');
});

test('.mcp.json is written with the owner\'s entry and PRESERVES other servers', async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descix-mcpjson-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'x' } } }));
    await generateClaudeCodeMcpConfig(dir);
    const got = JSON.parse(fs.readFileSync(path.join(dir, '.mcp.json'), 'utf8'));
    assert.deepEqual(got.mcpServers.descix, mcpServerEntry());
    assert.deepEqual(got.mcpServers.other, { command: 'x' }, 'an existing server is kept');
});
