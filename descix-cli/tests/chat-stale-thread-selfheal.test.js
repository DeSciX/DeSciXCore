/**
 * ws-cli-stale-thread-selfheal — the CLI's stale-conversation-thread self-heal.
 *
 * Conversation state lives server-side at the model provider; the CLI holds only an opaque
 * interaction token per app. When a stored token is no longer resumable (provider retention
 * elapsed, or the token predates the current format) the backend refuses to answer statelessly
 * and raises a typed 400 `INTERACTION_THREAD_INVALID`. The CLI drops the dead pointer, retries
 * ONCE with no thread, and tells the user continuity was lost.
 *
 * ⚠️ THE ASYMMETRY IS THE POINT, AND IT IS WHAT THESE TESTS EXIST TO PROTECT.
 * The sibling error `INTERACTION_THREAD_DENIED` (403) means the presented token was forged,
 * tampered with, or belongs to a DIFFERENT caller. Self-healing it would clear the session and
 * silently succeed on a fresh thread — turning a deliberate security denial into a no-op the
 * user never sees. A 403 must propagate untouched: no clear, no retry, no notice.
 *
 * Run: `node --test tests/chat-stale-thread-selfheal.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const {
    isStaleThreadError,
    clearAppSessions,
    INTERACTION_THREAD_INVALID,
} = await import('../lib/chat-session.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN_SRC = fs.readFileSync(path.join(HERE, '..', 'bin', 'descix.js'), 'utf-8');
const MODULE_SRC = fs.readFileSync(path.join(HERE, '..', 'lib', 'chat-session.js'), 'utf-8');
// Assert against CODE, not prose: both files DOCUMENT the 403 by name in their comments, and a
// naive whole-file grep would match that documentation and mask a real reintroduction.
//
// Strip LINE-WISE, NOT with a lazy block-comment regex. That regex is a trap on this file:
// bin/descix.js contains glob strings whose closing-comment character pair terminates a phantom
// comment, and the regex silently swallowed 82KB (39%) of real executable code — which would
// have made every "must be absent" assertion below pass VACUOUSLY. The sentinel test guards
// exactly that failure mode. (This very comment is line-style for the same reason.)
const stripComments = (s) => s
    .split('\n')
    .filter(l => { const t = l.trim(); return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')); })
    .join('\n');
const BIN_CODE = stripComments(BIN_SRC);
const MODULE_CODE = stripComments(MODULE_SRC);

test('SENTINEL: comment-stripping preserved the executable source (guards vacuous negatives)', () => {
    // A "code X is absent" assertion is only meaningful if the haystack survived stripping.
    assert.match(BIN_CODE, /apiClient\.invoke\('ask_question_to_app'/, 'bin code survived stripping');
    assert.match(MODULE_CODE, /export function isStaleThreadError/, 'module code survived stripping');
    assert.ok(BIN_CODE.length > BIN_SRC.length * 0.6, 'stripping removed comments, not code');
});

const TOKEN = 'dsx1.djFfQ2hkUlpsb3dZWEpUU0V4T0xYWnFja1ZR.cI6VpptkfrWIN8JwhcqbzA';
const err = (code, statusCode) => Object.assign(new Error(`synthetic ${code}`), { code, statusCode });

// ─── the heal rule ───────────────────────────────────────────────────────────────────────

test('HEALS: a typed INTERACTION_THREAD_INVALID with a token presented', () => {
    assert.equal(isStaleThreadError(err(INTERACTION_THREAD_INVALID, 400), TOKEN), true);
});

test('DOES NOT HEAL: INTERACTION_THREAD_DENIED (403) — a 403 must never be retried or session-cleared', () => {
    // THE critical negative. Auto-retrying a 403 would silently succeed on a fresh thread and
    // thereby MASK the security signal that someone presented a token that is not theirs.
    assert.equal(isStaleThreadError(err('INTERACTION_THREAD_DENIED', 403), TOKEN), false);
});

test('DOES NOT HEAL: no token was presented — there is no thread to heal', () => {
    assert.equal(isStaleThreadError(err(INTERACTION_THREAD_INVALID, 400), null), false);
    assert.equal(isStaleThreadError(err(INTERACTION_THREAD_INVALID, 400), ''), false);
    assert.equal(isStaleThreadError(err(INTERACTION_THREAD_INVALID, 400), undefined), false);
});

test('DOES NOT HEAL: any other backend error keeps its own failure mode', () => {
    for (const code of ['CREDITS_REQUIRED', 'PERMISSION_DENIED', 'UPSTREAM_SERVICE_ERROR', undefined]) {
        assert.equal(isStaleThreadError(err(code, 402), TOKEN), false, `must not heal ${code}`);
    }
    assert.equal(isStaleThreadError(new Error('network down'), TOKEN), false);
    assert.equal(isStaleThreadError(null, TOKEN), false, 'a null error must not throw or heal');
});

test('the match is on the typed CODE, never a message substring (anti-pattern #6)', () => {
    const lookalike = Object.assign(new Error('INTERACTION_THREAD_INVALID: thread is gone'), { code: 'SOMETHING_ELSE' });
    assert.equal(isStaleThreadError(lookalike, TOKEN), false, 'message text must not drive the heal');
});

// ─── the clear path ──────────────────────────────────────────────────────────────────────

test('clearAppSessions removes the exact key when the community is known', async (t) => {
    const dir = path.join(process.env.HOME, '.descix', 'sessions');
    fs.mkdirSync(dir, { recursive: true });
    const app = `selfheal-test-${Date.now()}`;
    const target = path.join(dir, `testcomm_${app}.json`);
    const other = path.join(dir, `othercomm_${app}.json`);
    fs.writeFileSync(target, JSON.stringify({ interaction_id: TOKEN, updated: Date.now() }));
    fs.writeFileSync(other, JSON.stringify({ interaction_id: TOKEN, updated: Date.now() }));
    t.after(() => { for (const f of [target, other]) if (fs.existsSync(f)) fs.unlinkSync(f); });

    assert.equal(await clearAppSessions('testcomm', app), 1);
    assert.ok(!fs.existsSync(target), 'the addressed session is gone');
    assert.ok(fs.existsSync(other), 'a different community key is untouched');
});

test('clearAppSessions with no community clears every session file for the app', async (t) => {
    const dir = path.join(process.env.HOME, '.descix', 'sessions');
    fs.mkdirSync(dir, { recursive: true });
    const app = `selfheal-test-all-${Date.now()}`;
    const files = ['aa', 'bb'].map(c => path.join(dir, `${c}_${app}.json`));
    for (const f of files) fs.writeFileSync(f, JSON.stringify({ interaction_id: TOKEN, updated: Date.now() }));
    t.after(() => { for (const f of files) if (fs.existsSync(f)) fs.unlinkSync(f); });

    assert.equal(await clearAppSessions(null, app), 2);
    for (const f of files) assert.ok(!fs.existsSync(f), `${f} cleared`);
});

test('clearAppSessions on a nonexistent session is a no-op returning 0', async () => {
    assert.equal(await clearAppSessions('nope', `no-such-app-${Date.now()}`), 0);
    assert.equal(await clearAppSessions(null, `no-such-app-${Date.now()}`), 0);
});

// ─── structural conformance ──────────────────────────────────────────────────────────────

test('the 403 code appears NOWHERE in the executable source of either file', () => {
    assert.ok(!/INTERACTION_THREAD_DENIED/.test(BIN_CODE), 'bin/descix.js must not reference the 403 code');
    assert.ok(!/INTERACTION_THREAD_DENIED/.test(MODULE_CODE), 'lib/chat-session.js must not reference the 403 code');
    // …but it IS documented, so a future reader understands why it is absent.
    assert.match(MODULE_SRC, /INTERACTION_THREAD_DENIED|403/, 'the asymmetry must be explained in prose');
});

test('SINGLE retry, no loop: exactly one extra invoke on the heal path', () => {
    const invokes = BIN_CODE.match(/apiClient\.invoke\('ask_question_to_app'/g) || [];
    assert.equal(invokes.length, 2, 'exactly one initial call plus one retry — never a loop');
    // Anchor the END relative to the START — `const result = response.message` also occurs
    // earlier, in the multi-app (--apps) path, which would yield an empty (vacuous) slice.
    const healStart = BIN_CODE.indexOf('let healedFromInteractionId');
    assert.ok(healStart > 0, 'the heal block was located');
    const healBlock = BIN_CODE.slice(healStart, BIN_CODE.indexOf('const result = response.message', healStart));
    assert.ok(healBlock.length > 0, 'the heal block slice is non-empty');
    assert.ok(!/\b(while|for)\s*\(/.test(healBlock), 'no loop construct in the heal path');
    assert.match(healBlock, /if \(!isStaleThreadError\(error, previousInteractionId\)\) throw error;/,
        'anything not a stale-thread error is rethrown BEFORE any clear or retry happens');
    // The rethrow must be the first statement in the catch — nothing may run ahead of it.
    const catchBody = healBlock.slice(healBlock.indexOf('} catch (error) {'));
    const firstStatement = catchBody.split('\n').map(l => l.trim()).filter(Boolean)[1];
    assert.match(firstStatement, /^if \(!isStaleThreadError/,
        'the guard is the FIRST thing in the catch — a 403 never reaches clearAppSessions');
});

test('the retry drops the thread rather than resending it', () => {
    assert.match(BIN_CODE, /invokeParams\.previous_interaction_id = null;/,
        'the retry must send no previous_interaction_id — equivalent to --new');
});

test('the notice goes to stderr so stdout stays machine-readable', () => {
    const noticeIdx = BIN_CODE.indexOf('was no longer available');
    assert.ok(noticeIdx > 0, 'a user-visible notice exists');
    const line = BIN_CODE.slice(BIN_CODE.lastIndexOf('console.', noticeIdx), noticeIdx);
    assert.match(line, /console\.error/, 'the notice must be written to stderr, not stdout');
});

test('SUPER-DRY: session clearing has ONE owner — no hand-copied unlink loops remain in the bin', () => {
    assert.ok(!/for \(const st of await findSessionsForApp\(appId\)\)/.test(BIN_CODE),
        'the hand-copied clear loop must be gone; clearAppSessions is the one owner');
    assert.ok(!/clearSession\(/.test(BIN_CODE), 'the low-level primitive is encapsulated, not called from the bin');
});

test('SUPER-DRY: no tolerance branch for the retired hash:timestamp id format', () => {
    assert.ok(!/\d\{8\}:\|hash:timestamp|legacyInteractionId|isLegacyInteractionId/.test(BIN_CODE),
        'stale ids must be healed by the server-typed error, never client-sniffed');
    assert.ok(!/startsWith\('dsx1/.test(BIN_CODE + MODULE_CODE),
        'the CLI must not parse the token format — it is opaque to the client');
});
