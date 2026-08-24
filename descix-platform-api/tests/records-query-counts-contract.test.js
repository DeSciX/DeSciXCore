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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RESIDUAL 16 (seat DEVPLANE, measured by BEAST on DEV 2026-08-24 21:29Z): app_records_query
// with {"tags":"handoff"} over records whose `tags` is an ARRAY answered matched:0 / success:true
// while {"note_tag":"handoff"} on the SAME records answered 1. The store had no array operator
// and the description hand-typed "Supports $eq/$in/$ne". Fixing the evaluator without the
// description would leave callers unable to discover the operator that now works; hand-typing
// the new one into the description would re-create the mirror. The clause is therefore GENERATED
// from the operator vocabulary, and these assertions drive off that same exported vocabulary.
//
// NEGATIVE CONTROL: on the pre-fix description ("Supports $eq/$in/$ne + field projection.")
// the `$contains` assertion below FAILS — the token is absent. Reverting filterOperatorClause()
// to a hand-typed string that omits or misnames an operator fails it again.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import {
    SUPPORTED_FILTER_OPERATORS,
    SCALAR_FILTER_OPERATORS,
    ARRAY_FILTER_OPERATORS,
    filterOperatorClause,
} from '../src/mcp-tools/recordFilter.js';

test('the vocabulary has ONE owner, is frozen, and partitions cleanly into scalar + array', () => {
    assert.ok(Object.isFrozen(SUPPORTED_FILTER_OPERATORS));
    assert.deepEqual(
        [...SUPPORTED_FILTER_OPERATORS],
        [...SCALAR_FILTER_OPERATORS, ...ARRAY_FILTER_OPERATORS],
        'the complete set must BE the two halves — not a third hand-kept list'
    );
    assert.ok(ARRAY_FILTER_OPERATORS.includes('$contains'), 'the array operator the residual exists to add');
    assert.equal(
        SCALAR_FILTER_OPERATORS.filter((op) => ARRAY_FILTER_OPERATORS.includes(op)).length, 0,
        'an operator cannot be in both halves — the type refusal would have no rule to apply'
    );
});

test('the advertised description names EVERY supported operator', () => {
    for (const op of SUPPORTED_FILTER_OPERATORS) {
        assert.match(
            tool.description, new RegExp(op.replace('$', '\\$')),
            `the description must name ${op} — an operator the server accepts but never advertises `
            + `is an operator no caller will use`
        );
    }
});

test('THE MIRROR GATE: the description names NO operator outside the vocabulary', () => {
    // Any `$token` in the published description must be an operator this store actually
    // implements. A hand-typed `$gt`, a stale `$exists`, or a typo'd `$contain` fails here.
    const advertised = [...new Set(tool.description.match(/\$[a-zA-Z]+/g) || [])];
    assert.ok(advertised.length > 0, 'the description must advertise operators at all');
    for (const token of advertised) {
        assert.ok(
            SUPPORTED_FILTER_OPERATORS.includes(token),
            `the description advertises '${token}', which is not in SUPPORTED_FILTER_OPERATORS `
            + `[${SUPPORTED_FILTER_OPERATORS.join(', ')}]. Either the vocabulary owner is missing it `
            + `or the description was hand-edited — the second is the drift this gate exists to catch.`
        );
    }
});

test('the contract states the TYPE rule, and names the remedy operator', () => {
    assert.match(
        tool.description, /FILTER_UNSUPPORTED/,
        'the refusal has a code; a caller that cannot name the error cannot branch on it'
    );
    assert.match(
        tool.description, /ARRAY/,
        'the description must say WHICH stored shape breaks a scalar comparison'
    );
    assert.ok(
        tool.description.includes(ARRAY_FILTER_OPERATORS[0]),
        'stating the refusal without the remedy leaves the caller stuck'
    );
});

test('the clause is GENERATED — the description embeds it verbatim', () => {
    assert.ok(
        tool.description.includes(filterOperatorClause()),
        'if these ever differ, the description was hand-edited and the mirror is back'
    );
});
