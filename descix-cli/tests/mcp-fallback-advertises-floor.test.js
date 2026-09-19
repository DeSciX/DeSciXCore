/**
 * An UNAUTHENTICATED MCP session is shown the ratified discovery-core floor — never the internal
 * coordination fabric.
 *
 * Measured 2026-09-19 (devx review, then reproduced): with no session, `descix mcp-serve`
 * answered tools/list with 37 tools, 18 of them fabric_* — BEAST's internal coordination plane —
 * because a failed permission-filtered backend list fell back to the WHOLE static catalogue. The
 * floor was already owned and CEO-ratified (platform-api DISCOVERY_CORE_TOOL_NAMES); the fallback
 * simply did not consume it. After: 8 tools, 0 fabric_*.
 *
 * Run: node --test tests/mcp-fallback-advertises-floor.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NATIVE_MCP_TOOLS, isDiscoveryCoreTool } from '@descix/platform-api/mcp-tools';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = fs.readFileSync(path.resolve(__dirname, '..', 'bin', 'mcp-server.js'), 'utf8');

test('the fallback advertises the discovery-core floor, consumed from its owner', () => {
    assert.match(SERVER, /SHARED_NATIVE_TOOLS\.filter\(\(t\) => isDiscoveryCoreTool\(t\.name\)\)/);
    assert.match(SERVER, /return \{ tools: FALLBACK_ADVERTISED_TOOLS \};/);
    assert.doesNotMatch(SERVER, /falling back to static curated core[\s\S]{0,120}return \{ tools: TOOLS \};/,
        'the whole static catalogue must never be advertised');
});

test('the floor contains no fabric_* tool', () => {
    const floor = NATIVE_MCP_TOOLS.filter((t) => isDiscoveryCoreTool(t.name)).map((t) => t.name);
    assert.ok(floor.length >= 5, `floor: ${floor.join(', ')}`);
    assert.deepEqual(floor.filter((n) => n.startsWith('fabric_')), []);
});

test('NEGATIVE CONTROL: the whole static catalogue DOES carry fabric_* tools', () => {
    // If this ever stops holding, the test above proves nothing about filtering.
    assert.ok(NATIVE_MCP_TOOLS.some((t) => t.name.startsWith('fabric_')));
});
