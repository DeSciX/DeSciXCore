/**
 * Coordination-fabric vocabulary — THE single owner, in the shared package.
 *
 * The BEAST coordination fabric is the app-records collection `egpt-frqtl/coordination`. Every rule
 * that keeps it coherent is server-side, on the `fabric_*` verbs. This module is the vocabulary
 * those rules are written against.
 *
 * WHY IT LIVES IN @descix/platform-api AND NOT IN THE CLOUD MICROSERVICE. There are two consumers
 * in two repositories: DeSciX_Cloud's `fabricStore.js` (which enforces the vocabulary) and
 * DeSciX_Core's `mcp-tools/nativeTools.js` (which PUBLISHES it as tool-schema enums and prose). A
 * copy in each is the mirror-drift bug class — the enum a caller is SHOWN and the enum the server
 * ACCEPTS would disagree silently, and the caller would be refused against a contract it was never
 * given. One export, two importers, and `fabric-vocabulary-conformance.test.js` fails CI if a tool
 * schema's enum stops deep-equalling its source here.
 *
 * PURE DATA + PURE PREDICATES. No I/O, no imports, no dependencies. A vocabulary that needed
 * infrastructure to answer "is this a legal status" could not be asserted in CI, and this module is
 * imported by a package whose other entry points pull in Firestore.
 *
 * The `fabric_vocabulary` verb returns this module's contents over the wire, so a CLIENT (the
 * unkamon-beast plugin's `hooks/lib/vocab.py`) can GENERATE its copy instead of hand-keeping one.
 * A hand-kept client mirror was measured writing four statuses the server refuses and defining a
 * `liveness` model the server did not know (2026-08-24).
 */

// ── The fabric's address ─────────────────────────────────────────────────────────────────────
//
// A record addressed to a seat (`to_agent`) on any OTHER app/kb reaches no sweeper: every sweep
// reads THIS collection and the store answers success:true either way (measured twice on
// 2026-08-23 — a CEO ruling addressed to VISION sat unread in unk-beast/Org for three hours). The
// fabric verbs do not take app_id/kb_id from the caller for exactly that reason.
export const FABRIC_APP = 'egpt-frqtl';
export const FABRIC_KB = 'coordination';

// THERE IS NO ORG-MASTER LABEL CONSTANT HERE, AND THAT IS THE POINT. A seat label names a HOLDER,
// and a holder changes; a literal in a shipped package is a snapshot of who held the org seat on the
// day the package was cut, and it does not update when the holder does. The identical class as
// `CEO`/`master` below: a value that reads authoritative, is wrong, and cannot detect that it is
// wrong. The seat's CURRENT holder has one owner — the BEAST seat surface — so every refusal that
// needs to say "address the org master" says how to LOOK IT UP (`beast_seat_read {seat_id:'org'}`)
// and names no label.

// ── Heartbeat statuses ───────────────────────────────────────────────────────────────────────
//
// WRITE-STRICT, READ-TOLERANT. These are two different questions and they get two different sets.
//
// The WRITE set is a CLOSED ENUM. It is deliberately NARROWER than what is live on the fabric: a
// census of 33 heartbeats found ELEVEN distinct values, and an unbounded vocabulary is why "is this
// seat alive" has no computable answer. `active`, `alive`, `idle` and `in-progress` all mean
// `working`; `complete` and `superseded` mean `done`. Collapsing them is the point.
//
// A heartbeat must never carry a DELIVERY status. `unread` collides with the inbox sweep (which
// carries no type filter, by design) — `heartbeat-RELAY-aeea43e3` sat in VISION's inbox as unread
// mail for 35 hours and RELAY is dead, so nothing will ever clear it. `broadcast` is worse:
// doctrine forbids flipping a broadcast and a heartbeat re-puts itself every beat, so it is
// permanent self-refreshing pollution in every inbox on the fabric (measured 2026-08-22T14:16Z).
// Both are refused BY NAME, citing the collision.
export const WORKING_STATUSES = Object.freeze(['working', 'blocked', 'handing-back']);

// DECLARED stops. A declaration is not a death (CEO-D-2026-08-18-SEATS-STAY-REACHABLE): a liveness
// check must report `declared-stop`, not `stale`, when it sees one of these.
export const DECLARED_STOPS = Object.freeze(['quiesced', 'good-night', 'done']);

/** The closed enum `fabric_beat` accepts. Nothing else may be WRITTEN. */
export const BEAT_STATUSES = Object.freeze([...WORKING_STATUSES, ...DECLARED_STOPS]);

/**
 * The READ set. `fabric_liveness` must interpret records written before this contract existed — 33
 * of them are live right now, none of them ours to rewrite. A reader that treated a legacy `active`
 * beat as uninterpretable would report a healthy seat as defective, which is the cry-wolf failure
 * that trains a master to ignore the instrument. So legacy values are MAPPED on read and never
 * accepted on write.
 */
export const LEGACY_WORKING_STATUSES = Object.freeze(['active', 'alive', 'idle', 'in-progress']);
export const LEGACY_STOP_STATUSES = Object.freeze(['complete', 'superseded']);

/** Every status a READER may encounter and classify. Never use this to validate a write. */
export const READABLE_STATUSES = Object.freeze([
    ...BEAT_STATUSES, ...LEGACY_WORKING_STATUSES, ...LEGACY_STOP_STATUSES,
]);

// The literals the platform's own writers use, named so no consumer retypes one.
export const BEAT_WORKING = 'working';
export const BEAT_SESSION_END = 'good-night';

/** The wake block every beat must carry. A working seat's continuity is exactly as checkable a
 *  fact as a resting seat's, and exempting it is how a seat goes dark while looking busy. */
export const WAKE_FIELDS = Object.freeze(['mechanism', 'survives_death', 'next_fire_at']);

// ── liveness: WHO wrote this beat ────────────────────────────────────────────────────────────
//
// A beat proves something is alive. WHICH thing depends entirely on who wrote it, and the two
// answers are not interchangeable:
//
//   model   — an AGENT wrote it (a seat or its secretary). Proves the MODEL is alive.
//   process — a HOOK wrote it. Proves the PROCESS is alive and says NOTHING about the model.
//
// A hook beating on a dead model is a mask: the process reports health while nobody is home. So
// this is a REQUIRED, closed-enum parameter of `fabric_beat`, not an optional hint. It cannot be
// defaulted and it cannot be inherited: a merge-upsert that omitted it would silently keep the
// PREVIOUS writer's value, so a hook's beat on a seat that last beat as `model` would keep
// claiming a live model. That inheritance was measured in the client mirror.
export const LIVENESS_MODEL = 'model';
export const LIVENESS_PROCESS = 'process';
export const LIVENESS_VALUES = Object.freeze([LIVENESS_MODEL, LIVENESS_PROCESS]);

// ── Delivery statuses: what is WAITING for a seat ────────────────────────────────────────────
export const STATUS_UNREAD = 'unread';
export const STATUS_BROADCAST = 'broadcast';
export const STATUS_READ = 'read';
export const DELIVERY_STATUSES = Object.freeze([STATUS_UNREAD, STATUS_BROADCAST]);

export const ENVELOPE_STATUSES = Object.freeze([
    'assigned', 'dispatched', 'preallocated', 'unassigned',
    'recalled-unassigned', 'accepted', 'rejected',
]);

/** The status `fabric_envelope_put` writes when the caller names none. Named rather than indexed,
 *  because `ENVELOPE_STATUSES[0]` is a position and a position is not a meaning. */
export const ENVELOPE_STATUS_DEFAULT = 'assigned';

/**
 * The envelope's caller-writable payload fields — ONE owner, consumed by the schema and the writer.
 *
 * WHY THE LAST THREE ARE HERE AND NOT IN A PROSE BODY (CEO-D-2026-08-24-ENVELOPES-NAME-KBS-TO-
 * CONSULT-AND-MAINTAIN). An envelope that names the KBs a seat must consult and the KBs it must
 * maintain, and that carries the ruling it was dispatched under VERBATIM, only works if those are
 * FIELDS the server owns. Buried in `text` they are prose: nothing can query "which seats maintain
 * this KB", nothing can check an envelope carries its ruling, and a paraphrase of a ruling acquires
 * the CEO's authority without his words. As fields they are addressable, and `rulings` holds the
 * verbatim text so the vivid clause cannot travel without the ruling behind it.
 *
 * `workstream_id`, `to_agent` and `mode` are NOT here: the first is the KEY's subject, the second
 * is the address (written to both `to_agent` and `seat_label`), and the third is the write mode.
 * All three are owned by the verb itself, the same way `seat_label`/`mode`/`extra` are owned by
 * `fabric_seat_state_put`.
 */
export const ENVELOPE_FIELDS = Object.freeze([
    'text', 'branch', 'initiative_id', 'kbs_consult', 'kbs_maintain', 'rulings', 'status',
]);

// ── to_agent: the ONLY delivery selector ─────────────────────────────────────────────────────
//
// ONE LIST. A record is delivered by `to_agent` + `status`, and the addresses a seat actually
// sweeps are composed by `inboxAddresses()` below: its own label, `seat-<session8>`, and these
// sentinels. A sentinel that is NOT in the composed set is written successfully and read by
// nobody, so the two lists must be the same list — they were not, and `CEO`/`master` were the
// difference. See RETIRED_SENTINELS.
export const TO_AGENT_SENTINELS = Object.freeze(['all', 'ALL']);

/**
 * Sentinels that were accepted and delivered to NOBODY. `CEO` and `master` are ROLES, and
 * `inboxAddresses()` has never composed either: a beat or message addressed to one was written,
 * returned success, and no sweep on the fabric could ever select it. They are refused BY NAME, and
 * the refusal says how to FIND the org master's current seat label (`beast_seat_read
 * {seat_id:'org'}`) rather than naming one — a label names a holder, and a literal here would be a
 * snapshot that goes wrong silently the first time the seat changes hands. A refusal that does not
 * say what to say instead is an invitation to work around it.
 */
export const RETIRED_SENTINELS = Object.freeze(['CEO', 'master']);

// Role names that cannot be a seat address. DELIBERATELY NARROW: roles are not swept, seats are.
// "JARVIS" and "VISION" are NOT here — they are real seat names the master's alias set polls, and
// refusing them would block real mail. Refuse only on certainty.
export const FORBIDDEN_ROLE_ADDRESSES = Object.freeze([
    'cos', 'coo', 'evp', 'evp-descix', 'evp-egpt', 'evp-fraqtl', 'evp-ssg',
    'chief-of-staff', 'orchestrator',
]);

// ── Record types the verbs own ───────────────────────────────────────────────────────────────
// `type` is a PAYLOAD CLASSIFIER and NEVER a delivery selector. These constants exist so the verbs
// stamp a consistent classifier; no read path may filter an inbox on them.
export const TYPE_HEARTBEAT = 'heartbeat';
export const TYPE_MESSAGE = 'message';
export const TYPE_ENVELOPE = 'envelope';
export const TYPE_SEAT_STATE = 'seat-state';
export const TYPE_WATERMARK = 'watermark';
export const TYPE_SEAT_NAME = 'seat-name';
export const TYPE_LEASE = 'lease';

// ── Key prefixes ─────────────────────────────────────────────────────────────────────────────
export const KEY_HEARTBEAT = 'heartbeat-';
export const KEY_MESSAGE = 'msg-';
export const KEY_SEAT_STATE = 'seat-state-';
export const KEY_WATERMARK = 'watermark-';
export const KEY_LEASE = 'lease-';
/** `envelope-<workstream_id>` — composed by `fabric_envelope_put`, never by a caller. */
export const KEY_ENVELOPE = 'envelope-';
/** `seat-name-<LABEL>` — the roster record. No fabric verb WRITES one yet; the prefix is here
 *  because the raw-surface guard must recognise a roster read, and a prefix known in one place and
 *  hand-typed in the other is the mirror this module exists to close. */
export const KEY_SEAT_NAME = 'seat-name-';

// ── Write modes ──────────────────────────────────────────────────────────────────────────────
//
// A partial `app_records_put` MERGES: send `status` alone and the store keeps every other field
// from the prior write under a fresh `received_at`. Measured three times in one night; the worst
// carried a stale `plugin_version` and an hours-old `text` describing a superseded release, all
// looking current. Get-after-put is STRUCTURALLY BLIND to it — you read back the fields you sent,
// and the fields you failed to send are never examined. So the keyed-record verbs REQUIRE an
// explicit mode and have no default.
//
//   patch   — merge these fields into the record, leave the rest alone.
//   replace — this record IS the record. Every field the prior version carried and this one does
//             not is explicitly CLEARED, in one atomic put.
export const WRITE_MODES = Object.freeze(['replace', 'patch']);

// ── Numeric defaults — the SERVER owns every one ─────────────────────────────────────────────
//
// Each of these is returned on the response that used it, so no client needs its own copy and no
// tool description hand-types the number. The plugin's BEAT_TTL is retired against
// DEFAULT_LIVENESS_THRESHOLD_S, not mirrored from it.

/** The beat cadence a working seat is held to is ~15 minutes; this allows one miss. */
export const DEFAULT_LIVENESS_THRESHOLD_S = 1200;

/** Records `fabric_inbox_sweep` returns when the caller names no limit. */
export const DEFAULT_INBOX_LIMIT = 200;

/** Lifetime of a lease claimed without an explicit ttl_s. */
export const DEFAULT_LEASE_TTL_S = 3600;

/**
 * The cap on any heartbeat CENSUS (a `{type:"heartbeat"}` scan with no key predicate).
 *
 * A census is the only probe that can see a beat whose key converged on nothing, so it cannot be
 * removed — but unbounded it grows with every seat that has ever beaten, on a query the store
 * answers by scanning. Bounded, the diagnostic keeps working and the cost stops being a function
 * of the fabric's whole history. See the contract's Open calls for the pushdown that removes the
 * scan entirely.
 */
export const HEARTBEAT_CENSUS_LIMIT = 500;

export const VERDICT = Object.freeze({
    ALIVE: 'alive',
    STALE: 'stale',
    DECLARED_STOP: 'declared-stop',
    NONE: 'none',
});

/** The watermark's per-seat delivery ledger. Named so a writer cannot invent a sixth field that no
 *  reader consults, and so fabric_watermark_put can refuse an unknown one instead of storing it
 *  where it will never be read. */
export const WATERMARK_FIELDS = Object.freeze([
    'broadcast_seen', 'delivered', 'resolved', 'held', 'awaiting',
]);

// ── Predicates ───────────────────────────────────────────────────────────────────────────────

/** Case-folded membership. The fabric is written by shells, Python hooks and models alike; a
 *  vocabulary check that is case-sensitive refuses `Working` while meaning to accept it. */
function has(list, value) {
    if (typeof value !== 'string') return false;
    const v = value.trim().toLowerCase();
    return list.some((x) => x.toLowerCase() === v);
}

/** WRITE validation: is this a value fabric_beat may accept? Closed enum, nothing else. */
export const isBeatStatus = (v) => has(BEAT_STATUSES, v);

/** WRITE validation: is this a legal `liveness` value? Closed enum; absence is not a value. */
export const isLivenessValue = (v) => has(LIVENESS_VALUES, v);

/** READ classification: does this status — canonical OR legacy — mean the seat declared a stop? */
export const isDeclaredStop = (v) => has(DECLARED_STOPS, v) || has(LEGACY_STOP_STATUSES, v);

/** READ classification: is this a status a reader can interpret at all? */
export const isReadableStatus = (v) => has(READABLE_STATUSES, v);

/** READ classification: a legacy value is interpretable but was written before the closed enum. */
export const isLegacyStatus = (v) => has(LEGACY_WORKING_STATUSES, v) || has(LEGACY_STOP_STATUSES, v);
export const isDeliveryStatus = (v) => has(DELIVERY_STATUSES, v);
export const isEnvelopeStatus = (v) => has(ENVELOPE_STATUSES, v);
export const isForbiddenRoleAddress = (v) => has(FORBIDDEN_ROLE_ADDRESSES, v);
export const isWriteMode = (v) => WRITE_MODES.includes(v);

/** A sentinel is matched EXACTLY (`all` / `ALL`), not case-folded, because these strings appear
 *  verbatim in the `$in` list of every live sweep. */
export const isSentinelAddress = (v) => TO_AGENT_SENTINELS.includes(v);

/** A retired sentinel is matched exactly for the same reason: it is the literal a caller typed. */
export const isRetiredSentinel = (v) => RETIRED_SENTINELS.includes(v);

/** A workstream id is not an address. No seat sweeps on it. */
export const isWorkstreamId = (v) => typeof v === 'string' && v.trim().toLowerCase().startsWith('ws-');

/**
 * The session discriminator used in `heartbeat-<LABEL>-<session8>`.
 *
 * TWO spellings of a session id are live on the fabric simultaneously — bare `de6593f4` and
 * prefixed `seat-a0893295`, on the same seat's records (census 2026-08-22: 14 seat-name records, 3
 * prefixed). A resolver that knows only one returns ZERO for the other half and reports it as
 * "this session is UNNAMED". So the prefix is stripped, then the first 8 characters are taken —
 * which is what every live heartbeat key already carries.
 */
export function session8(session_id) {
    const raw = String(session_id ?? '').trim();
    const bare = raw.startsWith('seat-') ? raw.slice(5) : raw;
    return bare.slice(0, 8);
}

/** Both live spellings of a session id, for a `$in` that covers the whole fabric. */
export function sessionSpellings(session_id) {
    const s = session8(session_id);
    const raw = String(session_id ?? '').trim();
    const bare = raw.startsWith('seat-') ? raw.slice(5) : raw;
    return [...new Set([bare, s, `seat-${bare}`, `seat-${s}`])].filter(Boolean);
}

/** The addresses a seat answers to. This is the inbox's `to_agent` set and it has ONE definition —
 *  which is the same definition TO_AGENT_SENTINELS is validated against, so nothing addressable is
 *  unsweepable and nothing sweepable is unaddressable. */
export function inboxAddresses(label, session_id) {
    const out = [];
    if (label) out.push(String(label));
    if (session_id) out.push(`seat-${session8(session_id)}`);
    out.push(...TO_AGENT_SENTINELS);
    return [...new Set(out)];
}

/**
 * The whole vocabulary as one plain object — what `fabric_vocabulary` returns over the wire.
 *
 * This exists so a client GENERATES its copy rather than keeping one. Every set a client needs in
 * order to validate a call before making it is here; anything absent from this bag is a set the
 * client would have to hand-type, which is the drift this module was moved to close.
 *
 * THREE THINGS ARE DELIBERATELY NOT IN THIS PAYLOAD, and each absence is load-bearing:
 *
 *   · `fabric_app_id` / `fabric_kb_id` — the raw-path COORDINATES. No `fabric_*` verb accepts
 *     either (both are refused with FABRIC_PLANE_NOT_CALLER_CHOSEN), so a client has nothing to do
 *     with them except hand-compose the `app_records_*` call this surface exists to replace and
 *     stage 3 refuses. Publishing them here would be the vocabulary handing out the address of the
 *     door it just locked.
 *
 *     AND NO `fabric_*` RESPONSE ECHOES THEM EITHER — the withholding is ONE story across the whole
 *     surface, not a rule this payload keeps while every success response breaks it. There is a
 *     single named exception and it is the refusal ABOUT the address: a caller told
 *     FABRIC_PLANE_NOT_CALLER_CHOSEN is being told to STOP aiming at a plane, and the refusal names
 *     the collection so the caller can see it did not need to choose one. A refusal that cannot be
 *     acted on is a refusal that gets worked around.
 *   · `org_master_seat_label` — a seat label names a HOLDER and holders change. A literal returned
 *     by a compile-time payload is a snapshot that goes wrong silently the first time the org seat
 *     changes hands, and a client that cached it would address mail to a label nobody sweeps —
 *     which is exactly the RETIRED_SENTINELS failure in newer clothes. The seat's current holder has
 *     one owner: `beast_seat_read {seat_id:'org'}`.
 */
export function fabricVocabulary() {
    return {
        beat_statuses: [...BEAT_STATUSES],
        working_statuses: [...WORKING_STATUSES],
        declared_stops: [...DECLARED_STOPS],
        legacy_working_statuses: [...LEGACY_WORKING_STATUSES],
        legacy_stop_statuses: [...LEGACY_STOP_STATUSES],
        readable_statuses: [...READABLE_STATUSES],
        liveness_values: [...LIVENESS_VALUES],
        delivery_statuses: [...DELIVERY_STATUSES],
        status_read: STATUS_READ,
        envelope_statuses: [...ENVELOPE_STATUSES],
        envelope_status_default: ENVELOPE_STATUS_DEFAULT,
        envelope_fields: [...ENVELOPE_FIELDS],
        to_agent_sentinels: [...TO_AGENT_SENTINELS],
        retired_sentinels: [...RETIRED_SENTINELS],
        forbidden_role_addresses: [...FORBIDDEN_ROLE_ADDRESSES],
        write_modes: [...WRITE_MODES],
        watermark_fields: [...WATERMARK_FIELDS],
        wake_fields: [...WAKE_FIELDS],
        record_types: {
            heartbeat: TYPE_HEARTBEAT, message: TYPE_MESSAGE, envelope: TYPE_ENVELOPE,
            seat_state: TYPE_SEAT_STATE, watermark: TYPE_WATERMARK, seat_name: TYPE_SEAT_NAME,
            lease: TYPE_LEASE,
        },
        key_prefixes: {
            heartbeat: KEY_HEARTBEAT, message: KEY_MESSAGE, seat_state: KEY_SEAT_STATE,
            watermark: KEY_WATERMARK, lease: KEY_LEASE, envelope: KEY_ENVELOPE,
            seat_name: KEY_SEAT_NAME,
        },
        verdicts: { ...VERDICT },
        defaults: {
            liveness_threshold_s: DEFAULT_LIVENESS_THRESHOLD_S,
            inbox_limit: DEFAULT_INBOX_LIMIT,
            lease_ttl_s: DEFAULT_LEASE_TTL_S,
            heartbeat_census_limit: HEARTBEAT_CENSUS_LIMIT,
        },
    };
}
