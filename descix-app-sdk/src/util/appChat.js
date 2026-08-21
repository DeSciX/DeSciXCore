/**
 * appChat — the app-facing CHAT handle, reached from an embedded app as `DeSciX.chat`.
 *
 * (Published on the SHELL's own window. An app never names that window: the app-side
 * SDK resolves the frame level for it — see `util/bridgeResolver.js`.)
 *
 * ── The defect this closes (ws-c3-bridge-media-handle) ───────────────────────
 * Every piece of the media lane already existed and was already canonical:
 *   chatIngress.mediaContribution()  builds a `media_attachment` contribution
 *   ChatWidget.contribute()          THE ingress (WS-B8's one-owner rule)
 *   collectTurnMedia()               pools it into the turn
 *   ask_question_to_app `media`      carries it to the provider, server-validated
 *
 * and CodeSiteWidget's `deliverToChat` reached all of it — from the SHELL side only.
 * NOTHING published that reach to the embedded app. An app in the iframe could be
 * CALLED (the shell dispatches `DeSciX_Actions`), but could not CALL OUT with pixels.
 * That absence was the entire defect. This module is therefore an EXPOSURE of
 * existing machinery, not a new pipe — there is exactly one media path and this is
 * the door to it.
 *
 * ── Validation is NOT duplicated here, deliberately ──────────────────────────
 * The MIME vocabulary, the byte caps and the wire shape are owned by
 * `@descix/platform-api/mcp-tools/chatMedia.js`. This is a BROWSER package that must
 * not depend on that server-side one, and restating its rules here would be exactly
 * the schema-mirror drift the engineering-culture mandate forbids — two derivations
 * of one fact, guaranteed to disagree the day a MIME type is added. So an
 * inadmissible attachment is refused BY THE SERVER, loudly, naming the limit it
 * broke. This module adds no second opinion about what media is legal.
 *
 * What it does own is the one failure the server can never see: the chat pane is
 * closed, so there is no ingress to deliver to.
 *
 * ── Errors: caller bugs THROW, environment reports ──────────────────────────
 * A malformed argument is a programming error at the call site and throws (via
 * mediaContribution/normalizeContribution) so the app author sees it immediately.
 * An unavailable ingress is NOT a programming error — the user closed the chat pane
 * — so it resolves `{ delivered: false, reason }` and logs loudly. A throw there
 * would kill a running world for a condition the app cannot prevent, which is the
 * loud-but-not-fatal precedent this bridge is held to.
 */

import { mediaContribution } from './chatIngress.js';
import { publishBridgeMember, retractBridgeMember } from './appBridge.js';

/** Bus member name. Stated once so publisher and retractor cannot drift. */
export const CHAT_MEMBER = 'chat';

/**
 * Publish the chat handle.
 *
 * @param {object} host
 * @param {(contribution: object) => any} host.deliver - the host's `deliverToChat`
 * @param {() => boolean} host.isAvailable - is the ingress mounted RIGHT NOW
 */
export function publishChatApi({ deliver, isAvailable }) {
  if (typeof deliver !== 'function' || typeof isAvailable !== 'function') {
    throw new TypeError('[DeSciX.chat] publishChatApi requires { deliver, isAvailable } functions');
  }

  return publishBridgeMember(CHAT_MEMBER, {
    /**
     * Hand an image or video to the model on this conversation.
     *
     *     await DeSciX.chat.sendMedia(
     *       { mime_type: 'image/png', data: base64, label: 'flyby' },
     *       { note: 'what do you see?' }
     *     );
     *
     * @param {object} media - { mime_type, data | asset_ref, label?, truncated?, track? }
     *   Supply EXACTLY ONE of `data` (raw base64, no `data:` URL prefix) or
     *   `asset_ref` (this app's own GCS asset space). The server enforces that.
     * @param {object} [opts]
     * @param {'stage'|'send'} [opts.disposition='stage'] - 'stage' rides into the next
     *   turn the user types (what an attachment wants); 'send' submits its own turn
     *   immediately, which costs one metered turn.
     * @param {string} [opts.note] - model-visible text alongside the attachment.
     * @returns {Promise<{delivered: boolean, reason?: string, contribution?: object}>}
     */
    sendMedia: async (media, opts = {}) => {
      // Throws on a malformed bag — a caller bug, surfaced at the call site.
      const contribution = mediaContribution(media, opts);

      if (!isAvailable()) {
        const reason =
          'the chat pane is not mounted (closed, or this host renders no chat), so there is ' +
          'no ingress to receive the attachment';
        console.error(`[DeSciX.chat] sendMedia dropped "${contribution.label}": ${reason}.`);
        return { delivered: false, reason };
      }

      await deliver(contribution);
      return { delivered: true, contribution };
    },

    /**
     * Can chat take an attachment RIGHT NOW? Live, not a boot-time fact — the user
     * can close the chat pane at any moment. This is the honest answer RT-1 found
     * missing from the view API, which reported success for a call nothing received.
     */
    available: () => {
      try {
        return !!isAvailable();
      } catch {
        return false;
      }
    },
  });
}

/** Retract the handle when the host unmounts. */
export function retractChatApi() {
  retractBridgeMember(CHAT_MEMBER);
}
