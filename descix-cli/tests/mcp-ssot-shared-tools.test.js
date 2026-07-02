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
    mutatingNativeToolNames,
    recommendedOAuthReadonlyToolNames,
} from '@descix/platform-api/mcp-tools';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.join(__dirname, '..', 'bin', 'mcp-server.js');

/**
 * EXPECTED_SSOT_TOOLS — the curated HTTP-valid native tool surface, named explicitly and
 * tied 1:1 to the SSOT source (descix-platform-api/src/mcp-tools/nativeTools.js).
 *
 * This is deliberately NOT a bare magic count (which drifted 10->11 when create_app_for_community
 * was legitimately added). Per the canonical-contract / schema-mirror-drift discipline
 * (DeSciX/CLAUDE.md §Engineering Culture): when a native tool is added/removed, a developer
 * makes a CONSCIOUS one-line edit to THIS named set, rather than a silent count drifting unnoticed.
 * The structural conformance asserts below (shape + mutating/oauthReadonly partition) are what
 * actually guard the contract; this set documents intent and catches accidental membership change.
 */
const EXPECTED_SSOT_TOOLS = [
    'query_knowledge_base',
    'ask_question_to_app',
    'list_apps_for_community',
    'find_communities',
    'tell_me_how',
    'resolve_invite',
    'app_records_put',
    'app_records_query',
    'app_records_get',
    'app_records_delete',
    'create_app_for_community',
    // WS-HEADLESS-MVP-A2 (CEO-D-2026-07-01 D2): platform-wide USD AI-credits balance READ.
    // Non-mutating + oauthReadonly (a balance read changes nothing; the commands that
    // change balances — grant_credits/refund_credits/debits — are NOT MCP-advertised).
    'get_credit_balance',
];

test('shared SSOT resolves from the CLI WITHOUT pulling GCP infra (leaf module)', () => {
    assert.ok(Array.isArray(NATIVE_MCP_TOOLS), 'NATIVE_MCP_TOOLS must be an array');

    // Membership is asserted against the explicit named expected-set (not a magic count) so an
    // intentional add/remove is a one-line conscious edit above, never a silent count drift.
    const actualNames = NATIVE_MCP_TOOLS.map(t => t.name);
    assert.deepEqual([...actualNames].sort(), [...EXPECTED_SSOT_TOOLS].sort(),
        'curated HTTP-valid native tool set drifted — reconcile EXPECTED_SSOT_TOOLS with nativeTools.js');

    // Structural conformance — the real drift guard. Each entry must reduce to exactly the
    // MCP tools/list wire shape, and must self-classify so it partitions cleanly into the
    // mutating vs read-only surfaces the SSOT's own helpers derive (no uncategorized tool).
    const shaped = toMcpToolList(NATIVE_MCP_TOOLS);
    for (const t of shaped) {
        assert.deepEqual(Object.keys(t).sort(), ['description', 'inputSchema', 'name']);
    }
    for (const t of NATIVE_MCP_TOOLS) {
        assert.equal(typeof t.mutating, 'boolean',
            `tool ${t.name} must self-declare mutating:boolean (drives the OAuth read-only partition)`);
    }
    // Derived partition must cover the whole surface: every tool is either mutating, or a
    // read-only tool flagged for the OAuth allow-list — the count is DERIVED, never hardcoded.
    const mutating = new Set(mutatingNativeToolNames());
    const readonlyOAuth = new Set(recommendedOAuthReadonlyToolNames());
    for (const t of NATIVE_MCP_TOOLS) {
        const inExactlyOnePartition = mutating.has(t.name) !== readonlyOAuth.has(t.name);
        assert.ok(inExactlyOnePartition,
            `tool ${t.name} must be in exactly one derived partition (mutating XOR oauth-readonly)`);
    }
    assert.equal(mutating.size + readonlyOAuth.size, NATIVE_MCP_TOOLS.length,
        'derived partitions (mutating + oauth-readonly) must exactly cover the curated surface');
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
