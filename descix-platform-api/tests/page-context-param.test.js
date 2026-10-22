/**
 * ask_question_to_app's `page_context` parameter (the chat pane's page context).
 *
 * The fields and limits are owned by @descix/app-sdk/chat-context and checked in the Cloud
 * handler with that module. Here the tool contract only has to ADMIT the parameter as an object:
 * before it was declared, the strict validator refused every turn that carried page context.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { NATIVE_MCP_TOOLS, validateToolParams } from '../src/mcp-tools/index.js';
import { withChatContext, normalizeChatContext } from '@descix/app-sdk/chat-context';

const TOOL = 'ask_question_to_app';
const turn = () => withChatContext(
  { app_id: 'egpt', user_input: 'Who is Rota?' },
  normalizeChatContext({ sourceUrl: 'https://egpt.descix.net/library/p', data: { title: 'The EGPT paper', kbNames: ['Corpus'] } }),
);

test('a turn the chat pane builds passes strict validation', () => {
  const params = turn();
  assert.ok(params.page_context, 'the fixture carries page_context');
  assert.doesNotThrow(() => validateToolParams(NATIVE_MCP_TOOLS, TOOL, params));
});

test('NEGATIVE CONTROL: a page_context that is not an object is refused, by name', () => {
  assert.throws(
    () => validateToolParams(NATIVE_MCP_TOOLS, TOOL, { ...turn(), page_context: 'https://egpt.descix.net/library/p' }),
    (e) => e.code === 'INVALID_PARAMS' && /'page_context' is declared type 'object' but received string/.test(e.message),
  );
});

test('NEGATIVE CONTROL: an undeclared sibling is still refused', () => {
  assert.throws(
    () => validateToolParams(NATIVE_MCP_TOOLS, TOOL, { ...turn(), page_script: 'x' }),
    (e) => e.code === 'INVALID_PARAMS' && /unknown parameter 'page_script'/.test(e.message),
  );
});
