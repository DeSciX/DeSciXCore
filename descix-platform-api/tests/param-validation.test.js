/**
 * Unit tests for @descix/platform-api/mcp-tools — strict MCP parameter validation
 * (ws-mcp-surface-basics, CEO-D-2026-08-14-MCP-BASICS).
 *
 * The regression these lock down is the SILENT-IGNORE class: a wrong-but-plausible parameter
 * used to ride through tools/call and get dropped by the handler's destructuring, so the call
 * ran against the DEFAULT and failed with a message naming something the caller never asked for.
 *
 * Pure module, zero deps. Run: node --test tests/param-validation.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    NATIVE_MCP_TOOLS,
    PARAM_ALIASES,
    PLATFORM_INJECTED_PARAMS,
    suggestParam,
    validateParamsAgainstSchema,
    validateToolParams,
    toolAcceptsParam,
} from '../src/mcp-tools/index.js';

const askSchema = NATIVE_MCP_TOOLS.find(t => t.name === 'ask_question_to_app').inputSchema;

test('THE regression: kb_id on ask_question_to_app is REJECTED, not ignored', () => {
    assert.throws(
        () => validateParamsAgainstSchema(askSchema,
            { app_id: 'unk-beast', kb_id: 'Org', user_input: 'hi' },
            { commandName: 'ask_question_to_app' }),
        (err) => {
            assert.equal(err.code, 'INVALID_PARAMS');
            // names the offending param
            assert.match(err.message, /kb_id/);
            // suggests the canonical one
            assert.match(err.message, /knowledgebase_name/);
            // machine-readable payload for connector clients
            assert.deepEqual(err.data.unknown_parameters, ['kb_id']);
            return true;
        },
    );
});

test('the reverse confusion is caught too (knowledgebase_name on query_knowledge_base)', () => {
    const qkbSchema = NATIVE_MCP_TOOLS.find(t => t.name === 'query_knowledge_base').inputSchema;
    assert.throws(
        () => validateParamsAgainstSchema(qkbSchema,
            { app_id: 'x', query: 'q', knowledgebase_name: 'Org' },
            { commandName: 'query_knowledge_base' }),
        (err) => err.code === 'INVALID_PARAMS' && /kb_id/.test(err.message),
    );
});

test('a valid call passes untouched', () => {
    assert.doesNotThrow(() => validateParamsAgainstSchema(askSchema, {
        app_id: 'unk-beast',
        knowledgebase_name: 'EVP-DeSciX',
        user_input: 'hi',
        previous_interaction_id: 'dsx1.abc',
    }, { commandName: 'ask_question_to_app' }));
});

test('missing required params fail loud', () => {
    assert.throws(
        () => validateParamsAgainstSchema(askSchema, { app_id: 'unk-beast' }, { commandName: 'ask_question_to_app' }),
        (err) => err.code === 'INVALID_PARAMS' && /user_input/.test(err.message) && err.data.missing_parameters.includes('user_input'),
    );
});

test('platform-injected params are never treated as unknown', () => {
    const bag = { app_id: 'x', user_input: 'q' };
    for (const p of PLATFORM_INJECTED_PARAMS) bag[p] = 'injected';
    assert.doesNotThrow(() => validateParamsAgainstSchema(askSchema, bag, { commandName: 'ask_question_to_app' }));
});

test('no declared schema => no claim (we do not invent a contract)', () => {
    assert.doesNotThrow(() => validateParamsAgainstSchema(undefined, { anything: 1 }, { commandName: 'x' }));
    assert.doesNotThrow(() => validateParamsAgainstSchema({ type: 'object' }, { anything: 1 }, { commandName: 'x' }));
});

test('suggestParam: curated aliases beat edit distance', () => {
    assert.equal(suggestParam('kb_id', ['knowledgebase_name', 'app_id', 'user_input']), 'knowledgebase_name');
    assert.equal(suggestParam('kb_ids', ['knowledgebase_names', 'app_id']), 'knowledgebase_names');
    assert.equal(suggestParam('question', ['user_input', 'app_id']), 'user_input');
});

test('suggestParam: catches case mismatch and near typos', () => {
    assert.equal(suggestParam('App_Id', ['app_id', 'user_input']), 'app_id');
    assert.equal(suggestParam('user_inpu', ['user_input', 'app_id']), 'user_input');
});

test('suggestParam: stays silent rather than sending the caller somewhere unrelated', () => {
    assert.equal(suggestParam('completely_unrelated_thing', ['app_id']), null);
});

test('toolAcceptsParam drives schema-aware context injection', () => {
    // The stdio server used to inject these blindly; it must now ask first.
    assert.equal(toolAcceptsParam(NATIVE_MCP_TOOLS, 'ask_question_to_app', 'kb_id'), false);
    assert.equal(toolAcceptsParam(NATIVE_MCP_TOOLS, 'ask_question_to_app', 'knowledgebase_name'), true);
    assert.equal(toolAcceptsParam(NATIVE_MCP_TOOLS, 'query_knowledge_base', 'kb_id'), true);
    assert.equal(toolAcceptsParam(NATIVE_MCP_TOOLS, 'find_communities', 'app_id'), false);
});

test('validateToolParams is a no-op for a tool that is not in the list', () => {
    assert.doesNotThrow(() => validateToolParams(NATIVE_MCP_TOOLS, 'not_a_real_tool', { whatever: 1 }));
});

/**
 * CONFORMANCE, driven off the exported list rather than a hand-written mirror: every native
 * tool's advertised schema must be well-formed enough to validate against, and every `required`
 * entry must actually be a declared property. A schema whose required names drift from its
 * properties would reject every call with a nonsense message.
 */
test('conformance: every native tool schema is self-consistent', () => {
    for (const tool of NATIVE_MCP_TOOLS) {
        assert.ok(tool.inputSchema, `${tool.name}: missing inputSchema`);
        const props = tool.inputSchema.properties || {};
        for (const req of tool.inputSchema.required || []) {
            assert.ok(
                Object.prototype.hasOwnProperty.call(props, req),
                `${tool.name}: required param '${req}' is not a declared property`,
            );
        }
    }
});

/**
 * Anti-drift: the two adjacent retrieval tools name the same concept differently. That is
 * allowed (they are different surfaces) but each MUST point at the other, or the next caller
 * walks into the same trap. Pin it so a description edit cannot quietly drop the warning.
 */
test('anti-drift: the ask/query tools disclose each other\'s parameter naming', () => {
    const ask = NATIVE_MCP_TOOLS.find(t => t.name === 'ask_question_to_app');
    const qkb = NATIVE_MCP_TOOLS.find(t => t.name === 'query_knowledge_base');
    assert.match(ask.description, /kb_id/, 'ask_question_to_app must warn about kb_id');
    assert.match(ask.description, /knowledgebase_name/);
    assert.match(qkb.description, /knowledgebase_name/, 'query_knowledge_base must point at the ask-family name');
    assert.match(qkb.description, /kb_id/);
    // and the alias table must carry the mapping the messages promise
    assert.ok(PARAM_ALIASES.kb_id.includes('knowledgebase_name'));
});
