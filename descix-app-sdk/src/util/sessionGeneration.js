/**
 * sessionGeneration — the one owner of WHICH session an answer belongs to.
 *
 * Every request that can carry a session back (an /apifront command, a Powch bridge request) takes a
 * SEND TICKET when it is sent: its place in send order and the identity of the session the shell held
 * then. An answer is judged by its ticket:
 *
 *   - a session END (AppData.reset, the session set to null, a SESSION_EXPIRED dispatched, a Powch
 *     logout or POWCH_SIGNED_OUT) ends every ticket taken before it: such an answer still reaches its
 *     caller, but its session is never adopted, no sign-in event follows it, nothing derived from it is
 *     written;
 *   - an answer carrying the identity its ticket was sent under is a REFRESH of that session: it is
 *     adopted only while the shell still holds that identity (another account signing in meanwhile ends
 *     it), and only if no answer for that account SENT after it was adopted already (of two refreshes
 *     in flight, the one sent last wins, whatever order they arrive in);
 *   - an answer carrying another identity is a SIGN-IN: of two sign-ins in flight, the one SENT last
 *     wins, whatever order they arrive in. A session set directly (AppData.sessionInfo = another
 *     account's session, a session handed over first-hand) is a sign-in sent now.
 *
 * The held identity is read through the reader AppData registers (the session's one owner); nothing
 * here keeps a copy of it. DOM-free on purpose: the Powch bridge imports it without loading AppData.
 */

let lastSeq = 0;
/** Every ticket with seq <= endedThrough was taken before the last session end. */
let endedThrough = 0;
/** The seq of the latest-SENT sign-in whose session the shell adopted. */
let lastSignInSeq = 0;
/** identity -> the seq of the latest-SENT answer carrying that account's session the shell adopted. */
const lastAdoptedSeqByIdentity = new Map();
let readHeldIdentity = null;

const issued = new WeakSet();
/** Answers the Powch bridge resolved, keyed by the object, valued by their request's ticket. */
const answerTickets = new WeakMap();

/** AppData registers how to read the identity of the session the shell holds (null when none). */
export function registerHeldIdentityReader(reader) {
  if (typeof reader !== 'function') throw new TypeError('registerHeldIdentityReader: a function is required');
  readHeldIdentity = reader;
}

function heldIdentity() {
  if (!readHeldIdentity) {
    throw new Error('sessionGeneration: no held-identity reader is registered (util/AppData.jsx registers it when it loads); a send ticket cannot be judged without the shell session');
  }
  return readHeldIdentity() ?? null;
}

function assertTicket(ticket, fn) {
  if (!ticket || typeof ticket !== 'object' || !issued.has(ticket)) {
    throw new Error(`${fn}: a send ticket from takeSendTicket() is required, got ${JSON.stringify(ticket)}`);
  }
}

/** Take a ticket when a request is SENT (not when its answer arrives). */
export function takeSendTicket() {
  lastSeq += 1;
  const ticket = Object.freeze({ seq: lastSeq, identity: heldIdentity() });
  issued.add(ticket);
  return ticket;
}

/**
 * The ticket of an answer no live request vouches for (a request id the bridge holds no ticket for:
 * never sent, or pruned after a sign-out or past the cap). Taken before every session end, so every
 * judgement refuses it; stamping an answer with it keeps a host page from adopting that answer later.
 */
const REFUSED_TICKET = Object.freeze({ seq: 0, identity: null });
issued.add(REFUSED_TICKET);
export function refusedTicket() {
  return REFUSED_TICKET;
}

/** The shell's session ended: every ticket taken so far is over. Idempotent. */
export function endSession() {
  endedThrough = lastSeq;
  lastAdoptedSeqByIdentity.clear();
}

/** Another account's session was set directly: it is the latest sign-in, every sign-in sent before it loses. */
export function sessionReplacedNow() {
  lastSignInSeq = lastSeq;
}

/**
 * Whether the session `ticket` was sent under is still the shell's session (no end since, the same
 * identity held). For what an answer may do besides adopting a session (a 401 clearing it, an
 * auth_status raise, an expiry's clear).
 */
export function isTicketSessionCurrent(ticket) {
  assertTicket(ticket, 'isTicketSessionCurrent');
  return ticket.seq > endedThrough && ticket.identity === heldIdentity();
}

/** Whether `ticket` was taken before the last session end (its session is over). */
export function isTicketBeforeSessionEnd(ticket) {
  assertTicket(ticket, 'isTicketBeforeSessionEnd');
  return ticket.seq <= endedThrough;
}

/** Whether an answer sent under `ticket`, carrying a session of `identity`, may be adopted now. */
export function mayAdoptAnswerSession(ticket, identity) {
  assertTicket(ticket, 'mayAdoptAnswerSession');
  if (ticket.seq <= endedThrough) return false;
  if (identity === ticket.identity) {
    return heldIdentity() === identity && ticket.seq >= (lastAdoptedSeqByIdentity.get(identity) ?? 0);
  }
  return ticket.seq >= lastSignInSeq;
}

/** Record that the shell adopted the session (of `identity`) an answer sent under `ticket` carried. */
export function noteAnswerSessionAdopted(ticket, identity) {
  assertTicket(ticket, 'noteAnswerSessionAdopted');
  if (identity !== ticket.identity && ticket.seq > lastSignInSeq) lastSignInSeq = ticket.seq;
  if (ticket.seq > (lastAdoptedSeqByIdentity.get(identity) ?? 0)) lastAdoptedSeqByIdentity.set(identity, ticket.seq);
}

/**
 * Record the ticket an answer object was produced under, so whoever adopts it later
 * (window.DeSciX.loginWithSessionToken, called by the host page with the resolved answer) judges it
 * by its request. Stamps the answer and its nested `sessionInfo` object.
 */
export function stampAnswerTicket(answer, ticket) {
  assertTicket(ticket, 'stampAnswerTicket');
  if (answer && typeof answer === 'object') {
    answerTickets.set(answer, ticket);
    if (answer.sessionInfo && typeof answer.sessionInfo === 'object') answerTickets.set(answer.sessionInfo, ticket);
  }
  return answer;
}

/**
 * The ticket an answer was stamped with, or `undefined` for an object no request produced (a session
 * handed over first-hand, e.g. Powch's own document adopting the session its flow just created: a
 * sign-in sent now).
 */
export function answerSendTicket(answer) {
  if (!answer || typeof answer !== 'object') return undefined;
  return answerTickets.get(answer);
}
