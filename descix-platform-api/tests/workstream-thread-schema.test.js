/**
 * ws-c3-librarian — the SERVED contract for workstream-owned chat threads.
 *
 * CEO-D-2026-08-14 FLAG-1: the schema IS the self-describing feed into MCP, so an under-declared
 * contract is the bug, not the caller who passes a param the command genuinely honors. The Cloud
 * derives `ask_question_to_app`'s boundary contract from THIS list (ragCommands.js commandMeta is
 * built from NATIVE_MCP_TOOLS), so a param missing here is refused at both MCP doors however
 * faithfully the handler implements it.
 *
 * The description is pinned VERBATIM: two parties quote this string, and a reworded copy is the
 * schema-mirror drift this file exists to prevent.
 *
 * Pure module, zero deps. Run: node --test tests/workstream-thread-schema.test.js (from descix-platform-api/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NATIVE_MCP_TOOLS, validateParamsAgainstSchema, toolAcceptsParam } from '../src/mcp-tools/index.js';

const ask = NATIVE_MCP_TOOLS.find(t => t.name === 'ask_question_to_app');
const askSchema = ask.inputSchema;

const WORKSTREAM_ID_DESCRIPTION = "The workstream this question belongs to. When present, the answer runs on a thread OWNED BY THAT WORKSTREAM rather than by the calling user: the server derives the thread owner as roomThreadKey({surface:'workstream', room_id:workstream_id, app_id}) - e.g. 'unk-beast:workstream-ws-c3-librarian' - and stores continuity server-side in the InteractionRooms collection. Send the SAME workstream_id every turn and omit previous_interaction_id; the response's interaction_id is an ECHO for observability, not a handle to resend. A workstream thread is SHARED BY DESIGN: every caller naming the same workstream on the same app continues the same conversation. It is NOT a private per-user conversation and carries no per-user privacy property. A client-supplied interaction_owner_id remains stripped at the door and is not a substitute for this param.";

test('ask_question_to_app DECLARES workstream_id as an optional string', () => {
    const prop = askSchema.properties.workstream_id;
    assert.ok(prop, 'workstream_id must be declared — an undeclared param is REFUSED at the MCP boundary');
    assert.equal(prop.type, 'string');
    assert.ok(!(askSchema.required || []).includes('workstream_id'), 'it is optional: the per-user thread stays the default');
});

test('the workstream_id description is the ratified string, VERBATIM', () => {
    assert.equal(askSchema.properties.workstream_id.description, WORKSTREAM_ID_DESCRIPTION);
});

test('the description tells the caller the four load-bearing facts', () => {
    const d = askSchema.properties.workstream_id.description;
    assert.match(d, /roomThreadKey\(\{surface:'workstream', room_id:workstream_id, app_id\}\)/, 'how the owner is derived');
    assert.match(d, /omit previous_interaction_id/, 'what NOT to resend');
    assert.match(d, /SHARED BY DESIGN/, 'that it is not a private conversation');
    assert.match(d, /interaction_owner_id remains stripped at the door/, 'that the strip still holds');
});

test('the boundary validator now ADMITS workstream_id instead of refusing it', () => {
    assert.equal(toolAcceptsParam(NATIVE_MCP_TOOLS, 'ask_question_to_app', 'workstream_id'), true);
    assert.doesNotThrow(() => validateParamsAgainstSchema(
        askSchema,
        { app_id: 'unk-beast', user_input: 'what is the state of play?', workstream_id: 'ws-c3-librarian' },
        { commandName: 'ask_question_to_app' },
    ));
});

test('interaction_owner_id is NOT a declared param — it is server-derived, never caller-supplied', () => {
    assert.equal(askSchema.properties.interaction_owner_id, undefined);
    assert.throws(
        () => validateParamsAgainstSchema(askSchema,
            { app_id: 'unk-beast', user_input: 'hi', interaction_owner_id: 'victim:workstream-secret' },
            { commandName: 'ask_question_to_app' }),
        (err) => { assert.equal(err.code, 'INVALID_PARAMS'); assert.match(err.message, /interaction_owner_id/); return true; },
    );
});
