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
    declaredTypesOf,
    suggestParam,
    validateParamsAgainstSchema,
    validateToolParams,
    toolAcceptsParam,
} from '../src/mcp-tools/index.js';
import {
    BEAT_CLOCK_FIELD_NAMES, BEAT_CLOCK_AGE_FIELDS, ENVELOPE_SECTIONS, fabricVocabulary,
} from '../src/fabric/index.js';

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

/**
 * A value that SATISFIES a property's declared type, chosen from the owner's type vocabulary so
 * an unknown type word fails loud instead of silently sampling `undefined`.
 *
 * WHY THE FIXTURE NEEDS THIS: the allow-list waves an injected key past the UNKNOWN check, never
 * past the TYPE check — and some injected keys ARE declared on some commands (`streaming` is
 * `boolean` on ask_question_to_app). A fixture that stamped the string 'injected' onto every key
 * was therefore testing the type gate, not the unknown gate, and would fail for a reason that has
 * nothing to do with what the test claims to measure.
 */
const TYPE_SAMPLES = { string: 's', number: 1, integer: 1, boolean: true, array: [], object: {}, null: null };
function conformingSample(propertySchema) {
    const [declared] = declaredTypesOf(propertySchema || {});
    if (!declared) return 'injected';
    assert.ok(declared in TYPE_SAMPLES, `no sample value for declared type '${declared}'`);
    return TYPE_SAMPLES[declared];
}

test('platform-injected params are never treated as unknown', () => {
    const bag = { app_id: 'x', user_input: 'q' };
    for (const p of PLATFORM_INJECTED_PARAMS) bag[p] = conformingSample(askSchema.properties[p]);
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
 * CEO-D-2026-08-14 (FLAG-1 ruling): "the contract is wrong if it doesn't declare the parameters
 * correctly because the docstrings are supposed to be the self-describing feed into MCP."
 *
 * These are the params the ask_question_to_app HANDLER actually reads — the generation knobs
 * destructured in ragCommands.js and the document-scoping ones read by prepare_chat_context.
 * Strict validation makes an under-declared schema user-visible (a genuine param gets rejected),
 * so the schema must keep up with the handler. Pinned here.
 */
test('ask_question_to_app declares every param its handler honors', () => {
    const props = Object.keys(askSchema.properties);
    for (const p of [
        // generation knobs (ragCommands.js:394)
        'intelligence_level', 'model', 'thinking_budget', 'temperature', 'max_output_tokens', 'streaming',
        // document scoping (communityManagement.js prepare_chat_context:1493)
        'file_id', 'ipdoc_file_id', 'doc_ids',
        // multimodal attachments (ws-chat-multimodal-image-attach): prepare_chat_context
        // normalizes+resolves them, geminiInteractions encodes them as provider blocks
        'media',
        // core
        'app_id', 'user_input', 'knowledgebase_name', 'knowledgebase_names', 'previous_interaction_id',
    ]) {
        assert.ok(props.includes(p), `ask_question_to_app schema is missing '${p}' — the handler reads it, so a caller passing it would be wrongly rejected`);
    }
});

test('every declared param carries a description (the schema IS the MCP-facing doc)', () => {
    for (const tool of NATIVE_MCP_TOOLS) {
        for (const [name, spec] of Object.entries(tool.inputSchema.properties || {})) {
            assert.ok(
                spec && typeof spec.description === 'string' && spec.description.length > 0,
                `${tool.name}.${name} has no description`,
            );
        }
    }
});

test('the CLI tuning knobs that used to be silently dropped now validate', () => {
    assert.doesNotThrow(() => validateParamsAgainstSchema(askSchema, {
        app_id: 'unk-beast', user_input: 'q',
        intelligence_level: 3, model: 'gemini-3.1-flash-lite', thinking_budget: -1, streaming: false,
    }, { commandName: 'ask_question_to_app' }));
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

/**
 * THE file_filter regression (MEMORIES red-team 2026-08-20, DEVPLANE triage).
 *
 * query_knowledge_base's own description said "Scope to a single source with file_filter",
 * the setup playbook told callers to pass it, and the handler destructured and honored it
 * (ragCommands.js `const { app_id, query, limit, file_filter } = params` -> queryRAG) — but the
 * schema never declared it. Strict validation therefore rejected -32602 a caller who followed
 * the tool's own instructions, on BOTH doors (tools/call and the execute_remote_command
 * gateway; they validate against the same commandMeta, which derives from this list).
 *
 * Worse, the PLATFORM emits it: every citation carries a read_command of the shape
 * { command: 'query_knowledge_base', params: { ..., file_filter: file_id } }
 * (ipStorageUtils.js buildRetrievableCitations), so the platform was handing agents a
 * dereference command its own validator refused.
 */
test('query_knowledge_base declares every param its handler honors', () => {
    const qkbSchema = NATIVE_MCP_TOOLS.find(t => t.name === 'query_knowledge_base').inputSchema;
    const props = Object.keys(qkbSchema.properties);
    for (const p of [
        // destructured by the handler (ragCommands.js query_knowledge_base)
        'app_id', 'query', 'limit', 'file_filter',
        // KB scoping, resolved via resolveKbNameScope
        'kb_id', 'kb_ids',
    ]) {
        assert.ok(props.includes(p), `query_knowledge_base schema is missing '${p}' — the handler reads it, so a caller passing it would be wrongly rejected`);
    }
});

test('the citation read_command shape validates against the schema it targets', () => {
    // The exact params the platform puts on a citation's read_command. If this throws, the
    // platform is emitting a dereference command its own gateway rejects.
    assert.doesNotThrow(() => validateToolParams(NATIVE_MCP_TOOLS, 'query_knowledge_base', {
        app_id: 'egpt-frqtl', kb_id: 'General', query: '<your question>', file_filter: 'corpus:3e1d5aa3',
    }, { surface: 'citation read_command' }));
});

/**
 * CLASS GUARD — a tool may not DOCUMENT a parameter it does not DECLARE.
 *
 * This is the general form of the file_filter bug: prose and schema drifted, and strict
 * validation turned the drift from "silently ignored" into "rejected outright". Driven off the
 * exported list, so it covers tools that do not exist yet.
 *
 * Descriptions legitimately name three kinds of snake_case identifier that are NOT input params
 * of the tool being described: other tools' names, remote command names reachable through
 * execute_remote_command, and RESPONSE fields the caller reads back. The third kind is the only
 * one needing a list, and it is a named category — not a junk drawer. Adding an entry is a claim
 * that the identifier is something the caller RECEIVES, never something it PASSES.
 */
const NON_PARAM_IDENTIFIERS = new Set([
    // response fields
    'ai_credits', 'amount_usd', 'daily_free_credit_available_today', 'daily_free_credit_usd',
    'purchase_type', 'interaction_id', 'created_at', 'received_at', 'chunk_idx',
    'current_holder_hint', 'agent_hint',
    // fabric heartbeat record fields — SERVER-written and read back, never passed. `occurred_at`
    // is the beat's server clock; the two beat clocks are BEAT_CLOCK_FIELDS, and they are named
    // here from the vocabulary so a rename in the table cannot leave a stale literal behind.
    'occurred_at', ...BEAT_CLOCK_FIELD_NAMES,
    // fabric RESPONSE fields — every one is something the caller READS BACK, never passes. The
    // fabric verbs derive their keys, clocks and selectors server-side precisely so a caller cannot
    // send these, which is why each is documented and none is declared.
    'judged_on', 'wake_overdue', 'wake_next_fire_at', 'next_fire_at',
    // fabric_liveness reports one age per clock, each named FROM the clock it ages by
    // beatClockAgeField — registered through that same derivation, so a rename in BEAT_CLOCK_FIELDS
    // cannot leave a stale literal here. (`age_seconds` is deliberately ABSENT: it was deleted, not
    // re-pointed, and nothing may document it again.)
    'received_at_age_seconds', ...BEAT_CLOCK_AGE_FIELDS,
    'selector_applied', 'census_truncated', 'empty_reason', 'no_unread', 'unknown_seat',
    'key_discriminated', 'already_seen', 'cleared_fields',
    // EVERY KEY OF THE fabric_vocabulary PAYLOAD is a response field BY CONSTRUCTION — that verb
    // takes no parameters at all, so anything it publishes is something the caller receives.
    // Derived from the payload rather than listed, so a set added to the vocabulary can never
    // arrive here as a stale literal (which is the drift the vocabulary itself exists to close).
    ...Object.keys(fabricVocabulary()),
    // The CONTRACT SECTIONS. These are keys INSIDE fabric_envelope_put's `text` body, named by its
    // description so a caller knows what to compose — never parameters of the tool. Derived from
    // ENVELOPE_SECTIONS for the same reason: the description interpolates that list, so a
    // hand-copy here would drift from the prose it is registering.
    ...ENVELOPE_SECTIONS,
    // REFUSED parameters, named by the refusals so a caller knows what not to send. Declaring one
    // would make it look accepted, which is the opposite of what the description says.
    'seat_token',
    // `phase_at` is BOTH: server-stamped and echoed on the response, and refused by name when a
    // caller sends it.
    'phase_at',
    // commands reached through execute_remote_command / the BEAST surface, not native tools
    'beast_rag_ingest', 'beast_seat_read',
    // commands reached through execute_remote_command, not native tools
    'beast_get_dashboard', 'create_stripe_checkout_session', 'fetch_my_purchases',
]);

test('class guard: no tool documents a parameter it does not declare', () => {
    const toolNames = new Set(NATIVE_MCP_TOOLS.map(t => t.name));
    const declaredAnywhere = new Set(
        NATIVE_MCP_TOOLS.flatMap(t => Object.keys(t.inputSchema?.properties || {})),
    );
    // EVERY offender, not the first. Failing on the first made this guard report one identifier per
    // run, so registering N of them took N runs — an accurate gate that is expensive to satisfy
    // gets satisfied by deleting the prose instead.
    const offenders = [];
    for (const tool of NATIVE_MCP_TOOLS) {
        const identifiers = new Set((tool.description || '').match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) || []);
        for (const id of identifiers) {
            if (toolNames.has(id) || declaredAnywhere.has(id) || NON_PARAM_IDENTIFIERS.has(id)) continue;
            offenders.push(`${tool.name}: '${id}'`);
        }
    }
    assert.deepEqual(offenders, [],
        `These descriptions name identifiers no native tool declares as a parameter:\n  ${offenders.join('\n  ')}\n` +
        `Either declare each in its tool's inputSchema.properties, or — if it is a response field ` +
        `or a remote command name — add it to NON_PARAM_IDENTIFIERS. Documenting a param the ` +
        `schema omits makes strict validation reject a caller who followed the instructions.`);
});
