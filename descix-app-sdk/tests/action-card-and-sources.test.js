/**
 * The action card REPORTS what happened, and the sources fold.
 *
 * THE DEFECTS (GODSWORLD-DEV, measured on PROD 2026-09-18, egpt-godsworld):
 *  - the card rendered `Action: previewPath` — an identifier, not an act — and kept a live Run
 *    button on an action that had already run. The CEO, reading his own thread: the cards "are
 *    unintuitive as presented (are they supposed to re-run what Maxi just did?)".
 *  - the Sources block rendered EXPANDED on every AI turn, pushing the answer off screen.
 *
 * Run: node --test tests/action-card-and-sources.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    humaniseActionName, describeActionCard,
} from '../src/util/actionCard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDGET = fs.readFileSync(
    path.resolve(__dirname, '..', 'src', 'components', 'ChatWidget.jsx'), 'utf8');

// ── The label: an act, not an identifier ────────────────────────────────────────────────────

test('a function name becomes a readable phrase', () => {
    assert.equal(humaniseActionName('previewPath'), 'preview path');
    assert.equal(humaniseActionName('recordFlight'), 'record flight');
    assert.equal(humaniseActionName('set_camera'), 'set camera');
    assert.equal(humaniseActionName('look'), 'look');
});

test('an unusable name degrades to a word, never to "undefined" on screen', () => {
    for (const v of [undefined, null, '', '   ', 42]) {
        assert.equal(humaniseActionName(v), 'action', JSON.stringify(v));
    }
});

test('a RAN card reports in the past tense and offers only an explicit re-run', () => {
    const c = describeActionCard({ functionName: 'previewPath', status: 'ran' });
    assert.equal(c.text, 'Ran preview path');
    assert.equal(c.severity, 'success');
    assert.equal(c.action, 'rerun', 'never a bare "run" on an action that already ran');
});

test('each state reads differently — completed is distinguishable from pending', () => {
    const texts = ['idle', 'running', 'ran', 'held']
        .map((status) => describeActionCard({ functionName: 'look', status }).text);
    assert.equal(new Set(texts).size, 4, `states must not collapse: ${texts.join(' | ')}`);
    assert.notEqual(
        describeActionCard({ functionName: 'look', status: 'ran' }).severity,
        describeActionCard({ functionName: 'look', status: 'held' }).severity,
        'ran and held must look different at a glance');
});

test('a RUNNING card offers STOP, never run-again', () => {
    assert.equal(describeActionCard({ functionName: 'look', status: 'running' }).action, 'stop');
});

test('a HELD card carries the page\'s own reason through unchanged', () => {
    const c = describeActionCard({ functionName: 'recordFlight', status: 'held', reason: 'hops budget spent (12/12)' });
    assert.equal(c.reason, 'hops budget spent (12/12)');
    assert.equal(c.action, 'run', 'the human may still choose to run it');
});

// ── The widget consumes the owner, and the sources fold ─────────────────────────────────────

test('the card no longer renders a bare function identifier', () => {
    assert.doesNotMatch(WIDGET, /Action: \{action\.functionName\}/,
        'the identifier label must be gone, not merely supplemented');
    assert.match(WIDGET, /describeActionCard\(\{/, 'the widget consumes the one owner of the label');
});

test('a completed action offers "Run again", never a bare Run', () => {
    assert.match(WIDGET, /card\.action === 'rerun'[\s\S]{0,600}Run again/);
});

test('sources are COLLAPSED by default, per message', () => {
    assert.match(WIDGET, /const \[sourcesOpen, setSourcesOpen\] = useState\(false\)/,
        'default must be closed');
    assert.match(WIDGET, /<Collapse in=\{sourcesOpen\}/);
});

test('NEGATIVE CONTROL: the collapsed disclosure still states the COUNT', () => {
    // Folded is not hidden: a reader must be able to see that sources exist without opening.
    assert.match(WIDGET, /\{sources\.length\} source\{sources\.length === 1 \? '' : 's'\}/);
});
