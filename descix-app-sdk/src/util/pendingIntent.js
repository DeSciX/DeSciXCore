/**
 * pendingIntent: the ONE owner of "what was this tab in the middle of when sign-in interrupted it".
 *
 * A deep link (/device?code=, /connect?ceremony=, Powch /offer/<id>) names an act that needs a
 * signed-in user. The visitor may be signed out, so the act waits across a Powch sign-in, a reload, or
 * a SESSION_EXPIRED reset. The intent is kept in sessionStorage (per tab, per origin) until it is
 * consumed, ONCE. Each origin keeps its own copy (the shell holds device-login and mcp-connect, Powch
 * holds powch-offer); this module is the one implementation both import.
 *
 * Pure: no React, no AppData, no network. Defects fixed: a device-login, MCP-connect or Powch-offer link lost across sign-in.
 *
 *   capture({ kind, payload, expiresAt? }) -> intent    refuses an unknown kind or a malformed payload
 *   peek()                                 -> intent | null
 *   consume()                              -> intent | null   returns it once, then the slot is empty
 *   createIntentResumer(handlers, { onState }) -> resume()     runs the intent's handler once, signed in
 *
 * intent = { kind, payload, capturedAt, expiresAt, origin } (epoch ms for the two times).
 * A stale intent (now >= expiresAt) is dropped by peek/consume with a console.error naming it.
 * sessionStorage missing or throwing is an error, never a silent in-memory fallback.
 */

/** The kinds of pending intent. Anything else is refused at capture. */
export const PENDING_INTENT_KINDS = Object.freeze({
  DEVICE_LOGIN: 'device-login',
  MCP_CONNECT: 'mcp-connect',
  POWCH_OFFER: 'powch-offer',
});

/** Each kind's payload: the one field it carries, always a non-empty string. */
export const PENDING_INTENT_PAYLOAD_FIELDS = Object.freeze({
  [PENDING_INTENT_KINDS.DEVICE_LOGIN]: 'userCode',
  [PENDING_INTENT_KINDS.MCP_CONNECT]: 'ceremonyId',
  [PENDING_INTENT_KINDS.POWCH_OFFER]: 'offerId',
});

/**
 * Lifetime of an intent whose server gave the browser no expiry (mcp-connect, powch-offer): 15 minutes,
 * the server's own ceremony lifetime (Cloud oauthAsHandlers CEREMONY_TTL_SECONDS). A device login takes
 * its bound from the server instead (device_validate's expires_at), passed to capture as expiresAt.
 */
export const PENDING_INTENT_MAX_AGE_MS = 15 * 60 * 1000;

/** The sessionStorage key. One slot per tab per origin: a new capture replaces the old intent. */
export const PENDING_INTENT_STORAGE_KEY = 'descix.pendingIntent';

const KIND_VALUES = Object.values(PENDING_INTENT_KINDS);

function storage() {
  let s;
  try {
    s = globalThis.sessionStorage;
  } catch (err) {
    throw new Error(`pendingIntent: sessionStorage is not accessible (${err?.message || err}); a pending sign-in intent cannot be kept`);
  }
  if (!s || typeof s.getItem !== 'function' || typeof s.setItem !== 'function' || typeof s.removeItem !== 'function') {
    throw new Error('pendingIntent: sessionStorage is unavailable; a pending sign-in intent cannot be kept');
  }
  return s;
}

function currentOrigin() {
  const origin = globalThis.location?.origin;
  if (typeof origin !== 'string' || !origin) {
    throw new Error('pendingIntent: no window.location.origin to bind the intent to');
  }
  return origin;
}

function assertKind(kind) {
  if (!KIND_VALUES.includes(kind)) {
    throw new Error(`pendingIntent: unknown kind ${JSON.stringify(kind)}; the kinds are ${KIND_VALUES.join(', ')}`);
  }
}

function assertPayload(kind, payload) {
  const field = PENDING_INTENT_PAYLOAD_FIELDS[kind];
  const value = payload?.[field];
  if (typeof value !== 'string' || !value) {
    throw new Error(`pendingIntent: a ${kind} intent needs payload.${field} (a non-empty string); got ${JSON.stringify(payload)}`);
  }
  const extra = Object.keys(payload).filter((k) => k !== field);
  if (extra.length) {
    throw new Error(`pendingIntent: a ${kind} intent carries payload.${field} only; refused ${extra.join(', ')}`);
  }
}

/**
 * Keep an intent until it is consumed. expiresAt (epoch ms) is the server's own bound where the server
 * gave one; without it the intent lives PENDING_INTENT_MAX_AGE_MS from now.
 * @param {{ kind: string, payload: object, expiresAt?: number }} input
 * @returns {{ kind: string, payload: object, capturedAt: number, expiresAt: number, origin: string }}
 */
export function capture({ kind, payload, expiresAt } = {}) {
  assertKind(kind);
  assertPayload(kind, payload);
  const capturedAt = Date.now();
  let bound = capturedAt + PENDING_INTENT_MAX_AGE_MS;
  if (expiresAt !== undefined) {
    if (!Number.isFinite(expiresAt)) {
      throw new Error(`pendingIntent: expiresAt must be epoch milliseconds; got ${JSON.stringify(expiresAt)}`);
    }
    if (expiresAt <= capturedAt) {
      throw new Error(`pendingIntent: refusing to capture a ${kind} intent that expired at ${new Date(expiresAt).toISOString()}`);
    }
    bound = expiresAt;
  }
  const intent = { kind, payload: { ...payload }, capturedAt, expiresAt: bound, origin: currentOrigin() };
  storage().setItem(PENDING_INTENT_STORAGE_KEY, JSON.stringify(intent));
  return intent;
}

/** Read the stored intent, dropping (loudly) one that is stale, foreign or malformed. */
function readLive() {
  const s = storage();
  const raw = s.getItem(PENDING_INTENT_STORAGE_KEY);
  if (raw === null) return null;
  let intent;
  try {
    intent = JSON.parse(raw);
  } catch (err) {
    s.removeItem(PENDING_INTENT_STORAGE_KEY);
    throw new Error(`pendingIntent: the stored intent is not JSON and was dropped (${err.message}): ${raw.slice(0, 120)}`);
  }
  try {
    assertKind(intent?.kind);
    assertPayload(intent.kind, intent.payload);
    if (!Number.isFinite(intent.capturedAt) || !Number.isFinite(intent.expiresAt)) {
      throw new Error('capturedAt/expiresAt are not epoch milliseconds');
    }
  } catch (err) {
    s.removeItem(PENDING_INTENT_STORAGE_KEY);
    throw new Error(`pendingIntent: the stored intent is malformed and was dropped (${err.message}): ${raw.slice(0, 120)}`);
  }
  if (intent.origin !== currentOrigin()) {
    s.removeItem(PENDING_INTENT_STORAGE_KEY);
    throw new Error(`pendingIntent: the stored ${intent.kind} intent belongs to ${intent.origin}, not ${currentOrigin()}; dropped`);
  }
  if (Date.now() >= intent.expiresAt) {
    s.removeItem(PENDING_INTENT_STORAGE_KEY);
    console.error(
      `pendingIntent: dropped a stale ${intent.kind} intent (${PENDING_INTENT_PAYLOAD_FIELDS[intent.kind]}=${intent.payload[PENDING_INTENT_PAYLOAD_FIELDS[intent.kind]]}), ` +
      `captured ${new Date(intent.capturedAt).toISOString()}, expired ${new Date(intent.expiresAt).toISOString()}`,
    );
    return null;
  }
  return intent;
}

/** The pending intent, left in place. */
export function peek() {
  return readLive();
}

/** The pending intent, returned once: the slot is empty afterwards. */
export function consume() {
  const intent = readLive();
  if (intent) storage().removeItem(PENDING_INTENT_STORAGE_KEY);
  return intent;
}

// ── resume ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Run the pending intent's completion ONCE, when the user is signed in.
 *
 * createIntentResumer(handlers, { onState }) returns resume(). The owner of "the user became signed in"
 * calls resume() on that event (and at boot when already signed in); widgets render onState's reports
 * and never complete an intent themselves. resume():
 *   - consumes the intent BEFORE running its handler, so a second sign-in event, a re-render or a
 *     concurrent call finds an empty slot and runs nothing;
 *   - on a handler failure puts the intent back (same expiresAt) so a retry can resume it, unless the
 *     handler marked the error terminal (err.terminal === true);
 *   - leaves an intent of a kind it has no handler for in place: on one origin two resumers may run (the
 *     shell's AppProvider and, on the Powch site, Powch's own), and each takes only its own kinds. An
 *     intent nobody takes is dropped loudly by peek() once it is stale.
 */
export const PENDING_INTENT_STATUS = Object.freeze({
  PENDING: 'pending', // captured, waiting for the user to be signed in
  RESUMING: 'resuming',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

/**
 * @param {Record<string, (intent: object) => Promise<any>>} handlers  one per kind this origin resumes
 * @param {{ onState?: (state: { intent: object, status: string, result?: any, error?: Error, retryable?: boolean }) => void }} [opts]
 * @returns {() => Promise<{ intent: object, status: string, result?: any, error?: Error } | null>}
 */
export function createIntentResumer(handlers, { onState } = {}) {
  if (!handlers || typeof handlers !== 'object') {
    throw new Error('createIntentResumer: handlers must be an object keyed by intent kind');
  }
  for (const [kind, fn] of Object.entries(handlers)) {
    if (!KIND_VALUES.includes(kind)) {
      throw new Error(`createIntentResumer: unknown kind ${JSON.stringify(kind)}; the kinds are ${KIND_VALUES.join(', ')}`);
    }
    if (typeof fn !== 'function') {
      throw new Error(`createIntentResumer: the ${kind} handler is not a function`);
    }
  }
  const report = (state) => {
    if (onState) onState(state);
    return state;
  };

  return async function resume() {
    const pending = peek();
    if (!pending || !handlers[pending.kind]) return null;
    // peek and consume run back to back with no await between them: nothing else can take it.
    const intent = consume();
    const handler = handlers[intent.kind];
    report({ intent, status: PENDING_INTENT_STATUS.RESUMING });
    try {
      const result = await handler(intent);
      return report({ intent, status: PENDING_INTENT_STATUS.COMPLETED, result });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      let retryable = error.terminal !== true;
      if (retryable) {
        try {
          capture({ kind: intent.kind, payload: intent.payload, expiresAt: intent.expiresAt });
        } catch (restoreErr) {
          console.error(`pendingIntent: the failed ${intent.kind} intent could not be kept for a retry: ${restoreErr.message}`);
          retryable = false;
        }
      }
      console.error(`pendingIntent: resuming the ${intent.kind} intent failed: ${error.message}`);
      return report({ intent, status: PENDING_INTENT_STATUS.FAILED, error, retryable });
    }
  };
}
