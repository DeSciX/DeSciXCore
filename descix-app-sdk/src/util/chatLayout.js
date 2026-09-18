/**
 * chatLayout — THE owner of "is the chat on screen, and how wide is everything".
 *
 * ── Why this is a module and not three expressions in CodeSiteWidget ─────────
 * Two parties have a say in whether the chat pane shows: the APP, through
 * `DeSciX.view.set()` (which reaches the widget as `enableChat`), and the HUMAN,
 * through the floating toggle (`chatOpen`). The widget used to read those two
 * facts differently in different places — `chatOpen` alone in the width maths,
 * `enableChat && chatOpen` in the render guards — which is the general form of
 * mirror drift, and it produced a visible defect the moment the two disagreed:
 *
 *   An app in SplitView calls DeSciX.view.set('CodeSite'). `enableChat` goes
 *   false; `chatOpen` is component state seeded once at mount and stays TRUE.
 *   The chat pane stops rendering (guard reads both) while the width still
 *   reserves its share (maths read only chatOpen) — so the app that asked for
 *   the whole frame got 75% of it and a blank strip where the chat had been.
 *
 * The reverse flip failed too: state seeded from the prop at mount is never
 * re-seeded, so an app asking for SplitView after the human had hidden the chat
 * got no chat back. That half is fixed in the widget (a sync effect on
 * `enableChat`); this module fixes the half that state alone cannot, because the
 * derived answer is correct on the very first render, before any effect runs.
 *
 * Pure and React-free on purpose: the failure above is arithmetic over two
 * booleans, so it is provable without a DOM.
 */

/**
 * @param {Object} args
 * @param {boolean} args.enableChat - does the APP allow chat in the current view
 * @param {boolean} args.chatOpen - has the HUMAN left the pane open
 * @param {number} args.chatWidth - the pane's fraction of the surface when shown (0..1)
 * @returns {{chatVisible: boolean, codesiteWidth: number, chatPanelWidth: number}}
 *   fractions, not percentages — the caller renders them
 */
export function chatLayout({ enableChat, chatOpen, chatWidth }) {
  // BOTH parties must agree before the pane takes any space. Every consumer reads this one
  // value; none re-derives it from the two inputs.
  const chatVisible = !!enableChat && !!chatOpen;
  return {
    chatVisible,
    codesiteWidth: chatVisible ? 1 - chatWidth : 1,
    chatPanelWidth: chatVisible ? chatWidth : 0,
  };
}
