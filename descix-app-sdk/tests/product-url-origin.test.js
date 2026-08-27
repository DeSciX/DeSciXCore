/**
 * GAP-4: the code-site URL must resolve against the CURRENT origin, never the host the app
 * record happens to have pinned. Same-origin by construction is what makes the CEO's
 * same-domain interframe scripting possible from the subdomain as well as from the store.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { resolveAgainstCurrentOrigin } from '../src/util/productUrl.js';

const PINNED = 'https://dev.descix.net/dev/egpt-godsworld/site/index.html';

test('opened at the app subdomain, the pinned host is replaced by the current origin', () => {
    const out = resolveAgainstCurrentOrigin(PINNED, 'https://egpt-godsworld.dev.descix.net');
    assert.strictEqual(out, 'https://egpt-godsworld.dev.descix.net/dev/egpt-godsworld/site/index.html');
    assert.ok(!out.includes('//dev.descix.net'), 'the pinned host must not survive');
});

test('launched from the store, the result is unchanged (this path always worked)', () => {
    const out = resolveAgainstCurrentOrigin(PINNED, 'https://dev.descix.net');
    assert.strictEqual(out, PINNED);
});

test('NEGATIVE CONTROL: returning the stored value verbatim would be cross-origin', () => {
    // The pre-fix behaviour, stated as a test so the defect cannot quietly return.
    const shellOrigin = 'https://egpt-godsworld.dev.descix.net';
    assert.notStrictEqual(new URL(PINNED).origin, shellOrigin,
        'fixture must actually differ in origin, or this test measures nothing');
    const fixed = resolveAgainstCurrentOrigin(PINNED, shellOrigin);
    assert.strictEqual(new URL(fixed).origin, shellOrigin, 'resolved URL must be same-origin with the shell');
});

test('query and hash survive the origin swap', () => {
    const out = resolveAgainstCurrentOrigin('https://dev.descix.net/a/b?x=1#frag', 'https://other.example');
    assert.strictEqual(out, 'https://other.example/a/b?x=1#frag');
});

test('empty or missing input is returned unchanged, never an invented host', () => {
    assert.strictEqual(resolveAgainstCurrentOrigin('', 'https://x.example'), '');
    assert.strictEqual(resolveAgainstCurrentOrigin(undefined, 'https://x.example'), undefined);
});

// NOTE: the workspaceProducts-wins path is exercised through AppData (JSX) and is not
// re-tested here — this file drives the ORIGIN RULE, which is the thing GAP-4 got wrong.
