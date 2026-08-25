/**
 * ws-c4-platform P4 (D-22 self-description) — the SERVED docstrings of ask_question_to_app's
 * generation knobs must state the ACTUAL (model, thinking) precedence chain.
 *
 * WHY THIS GATE EXISTS. The served text and the code had already drifted in opposite directions:
 * `model`'s docstring said the chain was "level -> KB override -> app default -> platform default"
 * while Cloud's resolver ranked the KB override ABOVE the level and resolved the thinking setting
 * through a SECOND chain entirely. A caller reading the tool schema was told something the server
 * did not do. Three separate sentences describing one chain is the mechanism of that drift, so the
 * chain is stated ONCE (MODEL_THINKING_CHAIN) and interpolated — and this file asserts the
 * interpolation, not a copy of the words.
 *
 * Run: `node --test tests/model-thinking-chain-selfdescription.test.js` from descix-platform-api/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NATIVE_MCP_TOOLS } from '../src/mcp-tools/nativeTools.js';

const SRC = fs.readFileSync(
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'mcp-tools', 'nativeTools.js'),
    'utf8');

const ask = NATIVE_MCP_TOOLS.find((t) => t.name === 'ask_question_to_app');
const PROPS = ask?.inputSchema?.properties ?? {};
/** Every param that participates in the pair chain. */
const CHAIN_PARAMS = ['intelligence_level', 'model', 'thinking_budget'];

test('P4 fixture check: the tool and all three knobs are actually served', () => {
    assert.ok(ask, 'ask_question_to_app is in NATIVE_MCP_TOOLS');
    for (const k of CHAIN_PARAMS) {
        assert.ok(PROPS[k]?.description, `${k} is declared with a description — otherwise every assertion below is vacuous`);
    }
});

test('P4/D-22: the chain is stated ONCE in the source and INTERPOLATED, not retyped per param', () => {
    assert.equal((SRC.match(/const MODEL_THINKING_CHAIN\b/g) || []).length, 1,
        'exactly one owner for the chain text');
    for (const k of CHAIN_PARAMS) {
        const re = new RegExp(`${k}: \\{[^}]*MODEL_THINKING_CHAIN`);
        assert.ok(re.test(SRC), `${k}'s description must be BUILT from MODEL_THINKING_CHAIN, not a hand copy of it`);
    }
});

test('P4/D-22: every chain param SERVES the four tiers, in order', () => {
    // The ORDER matters: this is precisely what was wrong before (KB override outranked the level).
    for (const k of CHAIN_PARAMS) {
        const d = PROPS[k].description;
        const iLevel = d.indexOf('intelligence_level named on THIS request');
        const iKb = d.indexOf('the KB model override');
        const iApp = d.indexOf('the app default model');
        const iPlat = d.indexOf('the platform default');
        assert.ok(iLevel > -1 && iKb > -1 && iApp > -1 && iPlat > -1,
            `${k} names all four tiers; got: ${d}`);
        assert.ok(iLevel < iKb && iKb < iApp && iApp < iPlat,
            `${k} states the tiers in precedence order (level before KB override — the exact inversion this row fixed)`);
    }
});

test('P4/D-22: every chain param states the PAIR invariant — one tier supplies both halves', () => {
    for (const k of CHAIN_PARAMS) {
        const d = PROPS[k].description;
        assert.match(d, /ONE pair and always come from the SAME tier/,
            `${k} must say the model and the thinking setting travel together`);
        assert.match(d, /never inherited onto a model it was not declared with/,
            `${k} must say a thinking setting does not cross a tier boundary`);
    }
});

test('P4/D-22: the superseded text — "Omit to inherit: KB intelligence_level, then the platform default" — is GONE', () => {
    for (const k of CHAIN_PARAMS) {
        assert.ok(!/Omit to inherit: KB intelligence_level/.test(PROPS[k].description),
            `${k} still serves the pre-P4 chain description`);
    }
    assert.ok(!/overriding the whole inheritance chain \(level -> KB override/.test(SRC),
        'the old chain sentence is deleted, not left beside the new one');
});

test('P4 fixture check: this gate can distinguish the old text from the new', () => {
    // NEGATIVE CONTROL — run the order assertion against the SUPERSEDED string and prove it fails.
    const OLD = 'Explicit model name, overriding the whole inheritance chain (level -> KB override -> app default -> platform default).';
    assert.equal(OLD.indexOf('intelligence_level named on THIS request'), -1,
        'the old text does NOT contain the tier phrasing this gate requires, so the gate would have failed on it');
    assert.equal(OLD.indexOf('ONE pair and always come from the SAME tier'), -1,
        'and it does not state the pair invariant');
});
