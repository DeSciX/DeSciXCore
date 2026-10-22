/**
 * The shell's pending intents: /device?code=<user_code> (CLI device login) and /connect?ceremony=<id>
 * (MCP connector sign-in). The shell captures them from the URL at boot (AppContext SDK_CHECKED) and
 * resumes them once the user is signed in (AppContext, on loginStatus CONNECTED). The intent itself is
 * held by ./pendingIntent.js; the widgets that show these flows render AppContext's pendingIntentState.
 */
import { PENDING_INTENT_KINDS, capture } from './pendingIntent.js';
import { ResponseStatus } from './AppData.jsx';
import { Api } from './api/index.js';

/**
 * The device request's expiry as epoch ms, from device_validate's expires_at. Accepts the shapes a
 * Firestore Timestamp takes on the wire ({_seconds} or {seconds}), an ISO string, or epoch ms; any
 * other shape is refused by name rather than guessed at.
 */
export function deviceLoginExpiresAt(expiresAt) {
  if (Number.isFinite(expiresAt)) return expiresAt;
  if (typeof expiresAt === 'string') {
    const ms = Date.parse(expiresAt);
    if (Number.isFinite(ms)) return ms;
  }
  const seconds = expiresAt?._seconds ?? expiresAt?.seconds;
  if (Number.isFinite(seconds)) return seconds * 1000;
  throw new Error(`device_validate returned an expires_at this shell cannot read: ${JSON.stringify(expiresAt)}`);
}

const isDevicePath = (path) => path === '/device' || path.startsWith('/device');
const isConnectPath = (path) => path === '/connect' || path.startsWith('/connect');

/**
 * Capture the pending intent this URL carries, if any. Returns { intent, carried } where carried says the
 * URL held a pending-intent link (so the caller strips it: the intent, not the URL, is the carrier now).
 * A device code is validated first; an invalid one captures nothing and is reported.
 * @param {{ pathname: string, search: string }} location
 */
export async function captureShellIntentFromLocation({ pathname, search }) {
  const params = new URLSearchParams(search);
  const deviceCode = params.get('code');
  if (deviceCode || isDevicePath(pathname)) {
    const validation = await Api.validateDeviceLoginRequest(deviceCode);
    if (validation.status !== ResponseStatus.OK) {
      console.error('AppContext: device login code not accepted:', validation.message);
      return { intent: null, carried: true };
    }
    // The browser holds the user_code only: the code the CLI polls with is the requester's secret.
    const intent = capture({
      kind: PENDING_INTENT_KINDS.DEVICE_LOGIN,
      payload: { userCode: validation.message.user_code },
      expiresAt: deviceLoginExpiresAt(validation.message.expires_at),
    });
    return { intent, carried: true };
  }
  if (isConnectPath(pathname)) {
    const ceremonyId = params.get('ceremony');
    if (!ceremonyId) return { intent: null, carried: false };
    const intent = capture({ kind: PENDING_INTENT_KINDS.MCP_CONNECT, payload: { ceremonyId } });
    return { intent, carried: true };
  }
  return { intent: null, carried: false };
}

async function completeDeviceLoginIntent(intent) {
  const result = await Api.completeDeviceLogin({ user_code: intent.payload.userCode, tos_accepted: true });
  if (result?.status !== ResponseStatus.OK) {
    throw new Error(typeof result?.message === 'string' ? result.message : 'Device login completion failed');
  }
  return result.message;
}

async function completeMcpConnectIntent(intent) {
  const result = await Api.completeConnectCeremony({ ceremony_id: intent.payload.ceremonyId });
  if (result?.status !== ResponseStatus.OK || !result?.redirect_url) {
    throw new Error(typeof result?.message === 'string' ? result.message : 'Ceremony completion returned no redirect');
  }
  // Follow the OAuth redirect back to the client that asked (claude.ai): a full navigation.
  globalThis.location.assign(result.redirect_url);
  return { redirect_url: result.redirect_url };
}

/** The shell's resume handlers, one per kind it captures. */
export const SHELL_INTENT_HANDLERS = Object.freeze({
  [PENDING_INTENT_KINDS.DEVICE_LOGIN]: completeDeviceLoginIntent,
  [PENDING_INTENT_KINDS.MCP_CONNECT]: completeMcpConnectIntent,
});
