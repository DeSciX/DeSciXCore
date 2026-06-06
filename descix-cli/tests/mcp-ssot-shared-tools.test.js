/**
 * WS-MCP-SSOT-TIER2 §5.B-1 — the stdio CLI MCP server consumes the SHARED native-tool SSOT
 * from @descix/platform-api/mcp-tools (no separate hand-curated curated list in the CLI).
 *
 * Pure / network-free. Run from descix-cli/:  node --test tests/mcp-ssot-shared-tools.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    NATIVE_MCP_TOOLS,
    toMcpToolList,
} from '@descix/platform-api/mcp-tools';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.join(__dirname, '..', 'bin', 'mcp-server.js');

test('shared SSOT resolves from the CLI WITHOUT pulling GCP infra (leaf module)', () => {
    assert.ok(Array.isArray(NATIVE_MCP_TOOLS) && NATIVE_MCP_TOOLS.length === 10,
        'expected the 10 curated HTTP-valid native tools');
    const shaped = toMcpToolList(NATIVE_MCP_TOOLS);
    for (const t of shaped) {
        assert.deepEqual(Object.keys(t).sort(), ['description', 'inputSchema', 'name']);
    }
});

test('mcp-server.js no longer hand-duplicates the curated tool literals', () => {
    const src = fs.readFileSync(MCP_SERVER, 'utf8');
    // It must import the shared SSOT...
    assert.match(src, /@descix\/platform-api\/mcp-tools/,
        'mcp-server.js must import the shared native-tool SSOT');
    // ...and build TOOLS by concatenating CLI-local diagnostics + the shared list.
    assert.match(src, /const TOOLS = \[\.\.\.CLI_LOCAL_TOOLS, \.\.\.toMcpToolList\(SHARED_NATIVE_TOOLS\)\]/,
        'TOOLS must be CLI-local diagnostics + shared SSOT (no duplicated curated literal)');
    // The old inline app_records_put description literal must be GONE from the CLI file.
    assert.ok(!src.includes('Use your app like a database: store/replace structured records'),
        'the duplicated app_records_put literal must be removed from mcp-server.js');
});

test('CLI-local diagnostics remain stdio-only (not in the shared HTTP SSOT)', () => {
    const ssotNames = new Set(NATIVE_MCP_TOOLS.map(t => t.name));
    assert.ok(!ssotNames.has('descix_doctor'), 'descix_doctor must NOT be in the HTTP SSOT');
    assert.ok(!ssotNames.has('platform_health'), 'platform_health must NOT be in the HTTP SSOT');
});
