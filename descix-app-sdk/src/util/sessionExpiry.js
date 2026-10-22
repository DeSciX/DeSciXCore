/**
 * The ONE handler for SESSION_EXPIRED (fired by makeCommandRequestJSON on a 401, and by
 * clearSessionAndDispatchExpiry). AppContext's state machine calls it; nothing else resets the shell
 * on expiry.
 *
 * Top-level shell: reset, then navigate to the host root (a full reload lands the right app,
 * standalone or platform, in a clean state).
 *
 * Framed shell (window.self !== window.top: the shell inside the Powch iframe, an embedded shell):
 * reset in place and do NOT navigate. A navigation there reloads the frame mid-request, so the host's
 * pending request (e.g. POWCH_LOGIN) never gets a reply and times out instead of the running flow
 * handling the 401 itself.
 */
import { AppData } from './AppData.jsx';
import { isFramedWindow } from './bridgeResolver.js';

/**
 * @param {object} args
 * @param {() => void} args.resetShellState - resets the shell's React mirrors of AppData
 *   (sessionInfo, loginStatus, custodialBalance, userRoles).
 * @param {Window} [args.win] - the shell's window; defaults to the ambient `window`.
 * @returns {{ navigated: boolean }}
 */
export function handleSessionExpired({ resetShellState, win = window }) {
  if (typeof resetShellState !== 'function') {
    throw new Error('handleSessionExpired: resetShellState is required');
  }
  resetShellState();
  AppData.reset();
  if (isFramedWindow(win)) return { navigated: false };
  win.location.href = win.location.origin + '/';
  return { navigated: true };
}
