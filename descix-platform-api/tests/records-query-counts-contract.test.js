/**
 * The app_records_query RECEIPT CONTRACT is published here and nowhere else.
 *
 * WHY THIS TEST EXISTS (measured by BEAST on DEV 2026-08-24 17:49Z, one call): the query answered
 * count:1, scanned:2, matched:2 with the message "Matched 2 of 2 record(s)…" while `records` held
 * ONE element — the MATCH set worn as the RETURNED set. The Cloud fix makes truncation a FIELD
 * (`truncated`), and a field the server returns but the tool description never mentions is a fact
 * no agent will look for. This description IS the contract; these assertions make silence in it a
 * test failure rather than a discovery a caller makes the hard way.
 *
 * Deliberately asserts on MEANING (`count` < `matched`), not just the token — a description that
 * merely name-drops `truncated` without saying when it is true teaches nothing.
 *
 * Pure module, zero deps. Run: node --test tests/records-query-counts-contract.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NATIVE_MCP_TOOLS } from '../src/mcp-tools/nativeTools.js';

const tool = NATIVE_MCP_TOOLS.find((t) => t.name === 'app_records_query');

test('app_records_query is advertised at all', () => {
    assert.ok(tool, 'the tool must exist for its contract to mean anything');
    assert.equal(typeof tool.description, 'string');
});

test('the receipt contract names every count the server returns — including `truncated`', () => {
    for (const field of ['scanned', 'matched', 'count', 'truncated']) {
        assert.match(
            tool.description, new RegExp(`\`${field}\``),
            `the description must name \`${field}\` — a returned field the contract omits is a field no caller looks for`
        );
    }
});

test('`truncated` is defined by its MEANING: count < matched', () => {
    assert.match(
        tool.description, /`truncated`[^.]*`count`\s*<\s*`matched`/,
        'naming the field without stating when it is true documents nothing'
    );
    assert.match(
        tool.description, /`limit`\s+CUT the match set/,
        'the contract must say WHAT truncates — the limit — so a caller knows the remedy'
    );
});

test('the contract still pins the ordering invariant the three counts satisfy', () => {
    assert.match(tool.description, /count <= matched <= scanned/);
});
