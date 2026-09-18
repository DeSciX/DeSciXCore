/**
 * chatLayout — the app's view request and the human's toggle, resolved once.
 *
 * THE DEFECT (measured by reading, GODSWORLD-DEV + DEVPLANE 2026-09-17):
 * CodeSiteWidget read "is the chat showing" two different ways — `chatOpen` alone in the width
 * maths, `enableChat && chatOpen` in the render guards. `chatOpen` is seeded from the prop at
 * mount and was never re-synced, and AppSurfaceWidget renders the same component type at the
 * same tree position with no key, so a DeSciX.view.set() flip changes the prop while the state
 * persists. The two readings then disagreed, in both directions:
 *
 *   SplitView -> CodeSite: pane stops rendering, width still reserves 25% -> the app that
 *                          asked for the whole frame gets 75% and a blank strip.
 *   CodeSite -> SplitView: the app asks for chat back and the stale toggle keeps it hidden.
 *
 * The first is fixed by DERIVING (this module) — correct on the first render, before any
 * effect runs. The second is fixed in the widget by a sync effect on `enableChat`; the last
 * test here pins the contract that effect relies on.
 *
 * Run: node --test tests/chat-layout-view-flip.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatLayout } from '../src/util/chatLayout.js';

/** AppSurfaceWidget's own value — the fraction that went missing in the measured defect. */
const CHAT_WIDTH = 0.25;

// ── The two ordinary states ─────────────────────────────────────────────────────────────────

test('SplitView with the chat open: the pane takes its share and the app takes the rest', () => {
    const l = chatLayout({ enableChat: true, chatOpen: true, chatWidth: CHAT_WIDTH });
    assert.equal(l.chatVisible, true);
    assert.equal(l.codesiteWidth, 0.75);
    assert.equal(l.chatPanelWidth, 0.25);
});

test('SplitView with the human having hidden the chat: the app takes the whole surface', () => {
    // The toggle must still work — this is the negative control for the fix, which must not
    // become "the chat is always visible whenever the app allows it".
    const l = chatLayout({ enableChat: true, chatOpen: false, chatWidth: CHAT_WIDTH });
    assert.equal(l.chatVisible, false);
    assert.equal(l.codesiteWidth, 1);
    assert.equal(l.chatPanelWidth, 0);
});

// ── THE DEFECT: a mode flip carries stale toggle state ──────────────────────────────────────

test('SplitView -> CodeSite with a STALE chatOpen=true: the app gets the WHOLE frame, no blank strip', () => {
    // The exact measured state: enableChat has just gone false, chatOpen is still true because
    // useState seeded it at mount. Before the fix this returned codesiteWidth 0.75 while the
    // pane no longer rendered — 25% of the surface reserved for nothing.
    const l = chatLayout({ enableChat: false, chatOpen: true, chatWidth: CHAT_WIDTH });
    assert.equal(l.chatVisible, false, 'the app disallowed chat, so nothing shows');
    assert.equal(l.codesiteWidth, 1, 'THE defect: this was 0.75, leaving a blank quarter');
    assert.equal(l.chatPanelWidth, 0, 'no space is reserved for a pane that does not render');
});

test('CodeSite mode never shows chat, whatever the toggle says — the app has the final no', () => {
    for (const chatOpen of [true, false]) {
        const l = chatLayout({ enableChat: false, chatOpen, chatWidth: CHAT_WIDTH });
        assert.equal(l.chatVisible, false, `chatOpen=${chatOpen}`);
        assert.equal(l.codesiteWidth, 1, `chatOpen=${chatOpen}`);
    }
});

test('the width is always the complement of the pane — the two can never disagree', () => {
    // The structural property the two-readings bug violated: whatever is not the chat pane is
    // the app pane, in every combination of the two inputs.
    for (const enableChat of [true, false]) {
        for (const chatOpen of [true, false]) {
            const l = chatLayout({ enableChat, chatOpen, chatWidth: CHAT_WIDTH });
            assert.equal(l.codesiteWidth + l.chatPanelWidth, 1,
                `enableChat=${enableChat} chatOpen=${chatOpen} left ${1 - (l.codesiteWidth + l.chatPanelWidth)} of the surface unaccounted for`);
        }
    }
});

test('a non-default chatWidth is honoured rather than assumed to be 0.25', () => {
    const l = chatLayout({ enableChat: true, chatOpen: true, chatWidth: 0.4 });
    assert.equal(l.codesiteWidth, 0.6);
    assert.equal(l.chatPanelWidth, 0.4);
});

// ── The contract the widget's sync effect depends on ────────────────────────────────────────

test('CodeSite -> SplitView: once the toggle is re-synced to the new prop, the chat returns', () => {
    // chatLayout cannot bring the chat back by itself — with a stale chatOpen=false it correctly
    // reports hidden. That is why the widget re-seeds chatOpen from enableChat on a prop change;
    // this pins both halves so neither can be removed believing the other covers it.
    const stale = chatLayout({ enableChat: true, chatOpen: false, chatWidth: CHAT_WIDTH });
    assert.equal(stale.chatVisible, false, 'derivation alone does NOT restore the chat');

    const synced = chatLayout({ enableChat: true, chatOpen: true, chatWidth: CHAT_WIDTH });
    assert.equal(synced.chatVisible, true, 'the sync effect is what restores it');
    assert.equal(synced.codesiteWidth, 0.75);
});
