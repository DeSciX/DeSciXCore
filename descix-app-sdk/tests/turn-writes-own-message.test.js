/**
 * A turn writes ONLY to the message it created, and an action waits for its turn to settle.
 *
 * THE DEFECT (measured on PROD, egpt-godsworld, 2026-09-18). A DOM observer the CEO ran during
 * one signed-in turn found ONE widget, no remount, and a second action card appearing in a
 * DIFFERENT message 0.5–0.9s after the first, each firing the op once. A read-only probe then
 * showed every action result had been sent back as a turn TWICE, with the originating answer
 * copied into the next message.
 *
 * The mechanism: every write a turn made to its answer targeted "the last message". A
 * self-guided action fired the moment its block had streamed in, its result went out as a new
 * turn in milliseconds, and that APPENDED a message while the first turn was still streaming.
 * The first turn's next chunk landed in the new message. One requested act spent the page's
 * entire 24-hop budget, half of it on copies, and every copy was a billed model turn.
 *
 * Run: node --test tests/turn-writes-own-message.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mintMessageId, patchMessageById } from '../src/util/threadMessages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET = fs.readFileSync(
    path.resolve(__dirname, '..', 'src', 'components', 'ChatWidget.jsx'), 'utf8');

const ANSWER_WITH_ACTION = 'I will look first.\n```json:call:look\n{}\n```\nThen I will report.';

/** Replays the measured interleaving through a given "write my answer" strategy. */
function replayRace(writeAnswer) {
    let messages = [{ id: 'A', question: 'Fly in close to the detector', answer: '' }];
    // Turn A streams in far enough to complete its action block...
    messages = writeAnswer(messages, 'A', ANSWER_WITH_ACTION.slice(0, 40));
    // ...the action fires, and its result is sent as turn B, which APPENDS a message...
    messages = [...messages, { id: 'B', question: '[CodeSite action result — `look`]', answer: '' }];
    // ...and turn A's stream is still open: its next chunk arrives.
    messages = writeAnswer(messages, 'A', ANSWER_WITH_ACTION);
    return messages;
}

// ── The race, replayed ──────────────────────────────────────────────────────────────────────

test('NEGATIVE CONTROL: the OLD "last message" write copies A\'s answer into B', () => {
    // This is the pre-fix strategy, verbatim in effect. If this stops reproducing the copy, the
    // replay no longer models the defect, and the test below it proves nothing.
    const lastMessage = (messages, _id, answer) => {
        const next = [...messages];
        next[next.length - 1] = { ...next[next.length - 1], answer };
        return next;
    };
    const after = replayRace(lastMessage);
    assert.equal(after[1].answer, ANSWER_WITH_ACTION,
        'the old write puts A\'s answer, action block included, into the result message B');
    assert.match(after[1].answer, /json:call:look/, 'so B renders a second look card');
});

test('THE FIX: a turn writes to its own message by id, whatever was appended since', () => {
    const after = replayRace((messages, id, answer) => patchMessageById(messages, id, { answer }));
    assert.equal(after[0].answer, ANSWER_WITH_ACTION, 'A\'s answer lands in A');
    assert.equal(after[1].answer, '', 'B is untouched: no copied action block, so no second card');
});

// ── patchMessageById ────────────────────────────────────────────────────────────────────────

test('a missing id writes NOTHING rather than falling back to another message', () => {
    const messages = [{ id: 'A', answer: 'a' }, { id: 'B', answer: 'b' }];
    const original = console.error;
    let said = '';
    console.error = (m) => { said = m; };
    try {
        const after = patchMessageById(messages, 'GONE', { answer: 'stray' });
        assert.equal(after, messages, 'same array back — nothing written');
        assert.ok(!after.some((m) => m.answer === 'stray'));
        assert.match(said, /DROPPED rather than written to another message/, 'and it says so');
    } finally {
        console.error = original;
    }
});

test('a function patch can decline — the error path must not overwrite a real answer', () => {
    const messages = [{ id: 'A', answer: 'partial answer already shown' }];
    const after = patchMessageById(messages, 'A', (m) => (m.answer ? {} : { answer: '**Error:** x' }));
    assert.equal(after[0].answer, 'partial answer already shown');
});

test('the patch never mutates the array it was given', () => {
    const messages = [{ id: 'A', answer: '' }];
    const frozen = JSON.stringify(messages);
    patchMessageById(messages, 'A', { answer: 'x' });
    assert.equal(JSON.stringify(messages), frozen);
});

test('message ids stay unique inside one millisecond — the race mints two back to back', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => mintMessageId()));
    assert.equal(ids.size, 1000, 'Date.now() alone collided when two turns minted together');
});

// ── The widget consumes the owner ───────────────────────────────────────────────────────────

test('no answer write in the widget targets "the last message" any more', () => {
    assert.doesNotMatch(WIDGET, /lastIdx/, 'every positional write must be gone, not supplemented');
    assert.doesNotMatch(WIDGET, /`msg_\$\{Date\.now\(\)\}`/, 'the collidable id must be gone');
});

test('every answer write addresses the turn\'s own message id', () => {
    const writes = WIDGET.match(/patchMessageById\(prev\.messages, turnMessageId,/g) || [];
    assert.equal(writes.length, 4, 'stream chunk, stream final, non-stream final, and error path');
    assert.match(WIDGET, /const turnMessageId = mintMessageId\(\);[\s\S]{0,400}try \{/,
        'minted BEFORE the try, so the error path can address it');
});

test('an action waits for its turn to SETTLE before it auto-fires', () => {
    assert.match(WIDGET, /if \(!selfGuidance \|\| !settled \|\| firedRef\.current\) return;/);
    assert.match(WIDGET, /\}, \[action\.functionName, settled\]\);/, 'and re-checks when it settles');
});

test('an ERRORED turn is settled but never auto-acts', () => {
    assert.match(WIDGET, /settled=\{!!item\.checked && !item\.error\}/);
});
