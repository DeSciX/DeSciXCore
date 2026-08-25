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
//
// `liveness` SAYS WHO WROTE LAST, AND THAT IS ALL IT SAYS. It is NOT the model's clock: the two
// writers share this one key and the hook writes ~15x more often, so a reader that judged the model
// on it read UNDETERMINED for every correctly-armed seat (measured 2026-08-24T21:37Z). The clocks
// are BEAT_CLOCK_FIELDS below, and the judgement is judgeModelLiveness().
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

/**
 * The REQUIRED sections of a contract envelope's `text` — the closed set every envelope body is
 * checked against, from docs/design/workstream-contract-system-2026-08-25.md §4.1.
 *
 * WHY IT IS A CLOSED SET AND NOT A SUGGESTION. A workstream is a CONTRACT between parties, and a
 * contract missing its Acceptance section is not a terse contract, it is an unenforceable one: the
 * builder has nothing to hand back against and the verifier has nothing to verify. Prose envelopes
 * omitted sections silently and nobody could tell which — "does this envelope state its budget"
 * had no computable answer. As a closed set the question is decidable, and the refusal names
 * EXACTLY which sections are absent instead of asking the caller to re-read a design doc.
 *
 * THE NINTH ROW OF §4.1 — "Phase · Signature" — IS DELIBERATELY NOT HERE. It is lifecycle STATE,
 * not prose the parties author: the server owns it, writes it as the `phase` field and stamps
 * `phase_at` itself. A lifecycle state carried inside the body would be a second derivation of
 * "what phase is this contract in", and the copy that is wrong is always the one in the prose.
 */
export const ENVELOPE_SECTIONS = Object.freeze([
    'objective', 'parties', 'interfaces', 'constraints',
    'knowledge', 'principles_carried', 'acceptance', 'budget',
]);

/**
 * WHAT `text` IS — stated ONCE, quoted by every surface that describes or enforces it.
 *
 * THE DEFECT THIS REPLACES (ws-c3-live-leg / D-22, measured on the served DEV surface 2026-08-25):
 * `fabric_envelope_put` stated this fact in THREE places — its tool `description`, its
 * `properties.text.description`, and the server's refusal in fabricStore's assertSectionedText —
 * and they had drifted. The tool description said "`text` is a JSON OBJECT whose keys are the
 * contract's SECTIONS"; the property description said "a JSON OBJECT serialized to a string"; the
 * schema declares `type: 'string'`. A caller who followed the TOOL description exactly and sent an
 * actual object was refused with FABRIC_ENVELOPE_TEXT_NOT_SECTIONED and the words "it did not
 * parse as a JSON object" — told the opposite of what was wrong, because `String(anObject)` is
 * "[object Object]" and the JSON never survived the wire at all.
 *
 * Two derivations of one fact is the general form of mirror drift, and a docstring is not exempt:
 * the copy that is wrong is the one the caller reads. One owner, three consumers.
 *
 * QUOTED KEY FORM ON PURPOSE. The sections are rendered as `"objective": ...` rather than a bare
 * comma list so this one sentence is directly usable as the refusal's "here is the shape you
 * wanted" — a refusal that names the required set without showing it makes the caller go and
 * find a design doc.
 */
export const ENVELOPE_TEXT_SHAPE = '`text` is a STRING carrying the JSON of an object keyed by SECTION — '
    + 'send JSON.stringify(body), never the object itself (an object arrives as "[object Object]" and its '
    + 'JSON never reaches the server). Every section is REQUIRED and must be non-empty: { '
    + ENVELOPE_SECTIONS.map((k) => `"${k}": ...`).join(', ') + ' }.';

/**
 * The contract lifecycle, as a closed enum. Design → signed → build → accept → closed.
 *
 * A CLOSED SET BECAUSE A PHASE IS READ AS PROGRESS. An unbounded phase vocabulary is the heartbeat
 * failure on the record that says whether a contract may be built against: eleven spellings of
 * "in progress" mean "has this been signed" cannot be answered by a query.
 */
export const ENVELOPE_PHASES = Object.freeze(['design', 'signed', 'build', 'accept', 'closed']);

/** The phase an envelope carries when nobody has named one. NAMED, never `ENVELOPE_PHASES[0]` —
 *  a position is not a meaning, and a reordering of the list would silently change the default.
 *  A contract that has not been signed is in `design`, which is the honest reading of a record
 *  that has never been through the architect. */
export const ENVELOPE_PHASE_DEFAULT = 'design';

/**
 * The LEGAL next-phases per phase — the whole transition rule, in one owner, so no verb hand-lists
 * it. `ENVELOPE_PHASE_TRANSITIONS[prior].includes(next)` is the complete answer to "may this write
 * move the contract from prior to next"; there is no additional same-phase or terminal special
 * case anywhere else, because a rule split between a table and an `if` is two derivations of one
 * fact and the `if` is the copy that drifts.
 *
 * A PHASE IS IN ITS OWN LEGAL SET, AND THAT IS THE LOAD-BEARING ENTRY. Re-writing an envelope that
 * is already in `build` without moving it must SUCCEED — otherwise a contract becomes unpatchable
 * the moment work starts on it, and the parties go back to editing prose out of band. Every phase
 * therefore permits itself.
 *
 * BACKWARD IS REFUSED. A contract that silently regressed from `build` to `design` would make the
 * phase unreadable as progress, and re-opening a signed contract is not a field edit — design §4.3
 * routes it: "Anything else is a contract change and goes through the architect", who authors a
 * NEW contract rather than rewinding the record its parties already signed.
 *
 * `closed` IS TERMINAL — it permits only itself, so a closed contract can still be patched but can
 * never be re-opened by a write.
 */
export const ENVELOPE_PHASE_TRANSITIONS = Object.freeze({
    design: Object.freeze(['design', 'signed']),
    signed: Object.freeze(['signed', 'build']),
    build: Object.freeze(['build', 'accept']),
    accept: Object.freeze(['accept', 'closed']),
    closed: Object.freeze(['closed']),
});

/**
 * The inter-party record kinds the contract system permits on the fabric.
 *
 * The first three are design §4.3's three messages after signature: a HAND-BACK carries evidence
 * against a named acceptance row, a BLOCKER names the clause it cannot satisfy, a CONTRACT-DEFECT
 * reports an ambiguity or a served surface that does not match its description and goes to the
 * architect. `identity` and `roster` are the contract's own record types — an identity hired from
 * a role (§5) and the roster of identities a contract's Parties section points at.
 *
 * A RECORD WITHOUT A `type` IS A VIOLATION, not a lax record. "Seats do not chat": anything that is
 * none of these kinds is a contract change and belongs to the architect, and a type-less record is
 * precisely the chat that routes to nobody — it matches no kind-filtered sweep, so it is written
 * successfully and read by whoever happens to be looking.
 */
export const FABRIC_RECORD_KINDS = Object.freeze([
    'handback', 'blocker', 'contract-defect', 'identity', 'roster',
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

// ── THE BEAT CLOCK PAIR: two writers, two clocks, ONE owner ──────────────────────────────────
//
// MEASURED DEFECT (BEAST, 2026-08-24T21:37Z). The record `heartbeat-<LABEL>-<session8>` has TWO
// writers on ONE key — the seat's AGENT (liveness `model`) and the plugin's doorbell hook every
// 60 seconds (liveness `process`). Both wrote the same field, `liveness`, and the reader judged
// the MODEL on whichever value was current. The hook writes 15x more often than the agent, so the
// current value is almost always `process`, and EVERY correctly-armed seat read UNDETERMINED. The
// process beat did not merely fail to prove the model alive: it ERASED the proof.
//
// A second measurement (18:25Z, 20:42Z) found the mirror failure on the write side: `fabric_beat`
// with liveness=model CLEARED `model_beat_at`, because the whole-state rule ("a beat is not a
// diff") swept it up as "a field the previous beat left behind".
//
// THE FIX IS NOT A THIRD FIELD, IT IS TWO CLOCKS. "When did an agent last prove itself alive" and
// "when did a process last prove itself alive" are TWO FACTS. One field cannot hold two facts, and
// two writers sharing one field is the general form of mirror drift — the copies WILL disagree
// silently, and here the disagreement is invisible because the loser is overwritten rather than
// contradicted. So each writer gets its OWN clock, and neither may touch the other's.
//
// `liveness` REMAINS, and it still means what it meant: WHO wrote the most recent beat. It is no
// longer the model's clock and no reader may use it as one.
//
// THIS TABLE IS THE CONTRACT. It is exported so the plugin reader (unkamon-beast
// `hooks/lib/fabric_read.py`), the secretary definition and DeSciX_Cloud's `fabricStore.js` consume
// ONE description instead of three hand-listed field sets — the schema-mirror-drift rule in
// Unkamon/CLAUDE.md §Engineering Culture. `projectable: true` is load-bearing: both fields are
// FLAT top-level record fields, so a raw reader may name them in a `fields` projection. A nested
// clock block would be unprojectable AND unfilterable, and the raw reader would have to fetch the
// whole record to answer one question.
export const BEAT_CLOCK_FIELDS = Object.freeze([
    Object.freeze({
        field: 'model_beat_at',
        meaning: 'The server clock at the last beat an AGENT wrote. THE ONLY evidence a model is alive.',
        written_by: LIVENESS_MODEL,
        preserved_by: LIVENESS_PROCESS,
        projectable: true,
    }),
    Object.freeze({
        field: 'process_beat_at',
        meaning: 'The server clock at the last beat a HOOK wrote. Proves a process is alive and says '
            + 'NOTHING about the model.',
        written_by: LIVENESS_PROCESS,
        preserved_by: LIVENESS_MODEL,
        projectable: true,
    }),
]);

/** The two clock field NAMES, DERIVED from the table above — never a second hand-typed list. Every
 *  consumer that needs "which fields are the beat clocks" (the store's never-cleared set, a
 *  projection, a conformance test) reads this rather than retyping two strings. */
export const BEAT_CLOCK_FIELD_NAMES = Object.freeze(BEAT_CLOCK_FIELDS.map((f) => f.field));

/** Which clock a beat of this `liveness` WRITES. Derived from the table, so a third liveness value
 *  added to the table gets its clock for free and one added without a clock is visibly absent. */
export function beatClockFieldFor(liveness) {
    const v = typeof liveness === 'string' ? liveness.trim().toLowerCase() : null;
    return BEAT_CLOCK_FIELDS.find((f) => f.written_by === v)?.field ?? null;
}

/**
 * normalize(partial) -> FULL BAG. The canonical reader of a heartbeat's clock pair.
 *
 * Every key of the contract is present on the result, `null` where the record carries nothing
 * readable. A consumer that destructures this can never be surprised by an absent key, and — the
 * point of the exercise — it never re-enumerates the field list to find them.
 *
 * `null` IS NOT `0` AND IS NOT `now`. An absent model clock means UNKNOWN (a pre-contract record,
 * or a seat only its hook has ever beaten for). Substituting any instant here would manufacture the
 * exact claim — "an agent is alive" — that this pair exists to make falsifiable.
 *
 * `liveness` is carried through the same normalization because it is read from the same record by
 * the same consumers, and because a reader that took it raw would re-open the case-and-vocabulary
 * question this module answers once.
 */
export function normalizeBeatClocks(record) {
    const r = (record && typeof record === 'object') ? record : {};
    const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
    const out = {};
    for (const { field } of BEAT_CLOCK_FIELDS) out[field] = str(r[field]);
    const lv = str(r.liveness);
    out.liveness = (lv && isLivenessValue(lv)) ? lv.toLowerCase() : null;
    return out;
}

/**
 * THE liveness judgement, as ONE exported rule.
 *
 * The plugin reader and `fabricStore.liveness()` are two consumers in two repositories asking one
 * question. Two derivations of one fact is the bug class this whole module exists to close, and
 * the two-writers defect above is what it costs when the copies disagree.
 *
 * JUDGED ON `model_beat_at` AND NOTHING ELSE. Not on `liveness` (that says who wrote LAST, and a
 * hook writes 15x more often), not on `received_at` (that is the record's clock, which a process
 * beat refreshes — the mask), not on `occurred_at`.
 *
 *   none   — no readable model clock. The record has never carried proof an agent was alive. This
 *            is UNKNOWN, and it is deliberately NOT `stale`: "nobody has ever beaten as a model"
 *            and "an agent beat and then went quiet" are different facts for a master.
 *   stale  — a model clock exists and is older than the threshold, OR is present but unreadable.
 *            An unreadable instant must never read alive; it is the friendliest possible lie.
 *   alive  — a model clock exists, is readable, and is within the threshold.
 *
 * A FUTURE model clock is `alive`, not an error: this rule reads only the server's own stamps
 * (`fabric_beat` refuses a caller-asserted clock), so a future value cannot be a forgery — it can
 * only be clock skew, and refusing on it would take a live seat dark. Detecting skew is the
 * caller's job and it has the two instants to do it with.
 *
 * DECLARED STOPS ARE NOT JUDGED HERE. A declaration is not a death
 * (CEO-D-2026-08-18-SEATS-STAY-REACHABLE) and it is judged on `status`, not on a clock. The caller
 * applies that precedence over this verdict; folding it in would make this rule need a status it
 * has no business reading.
 *
 * `threshold_s` HAS NO DEFAULT HERE. The platform default is `DEFAULT_LIVENESS_THRESHOLD_S` and it
 * is the CALLER's to pass, so a caller that forgot one fails loudly instead of silently being
 * judged against a number it never chose.
 *
 * THE ARGUMENT IS THE NORMALIZED BAG PLUS THE TWO SCALARS, and callers are meant to SPREAD
 * `normalizeBeatClocks(record)` into it (`{...clocks, now, threshold_s}`) rather than pick
 * `model_beat_at` out and re-label it. Extra keys from the bag are ignored. That is not cosmetic:
 * a call site that names the field is a second place the string lives, which is the drift this
 * whole contract exists to close — DeSciX_Cloud's conformance gate refuses a hand-typed clock name
 * in `fabricStore.js` on exactly that ground.
 *
 * @param {{model_beat_at: ?string, now: string, threshold_s: number}} args
 * @returns {'alive'|'stale'|'none'}
 */
export function judgeModelLiveness({ model_beat_at, now, threshold_s } = {}) {
    if (typeof threshold_s !== 'number' || !Number.isFinite(threshold_s) || threshold_s <= 0) {
        throw new TypeError('judgeModelLiveness: threshold_s must be a positive finite number of seconds '
            + `(got ${JSON.stringify(threshold_s)}). There is no default here — pass `
            + 'DEFAULT_LIVENESS_THRESHOLD_S, so a caller judged against a number it never chose is impossible.');
    }
    const nowMs = Date.parse(now);
    if (!Number.isFinite(nowMs)) {
        throw new TypeError(`judgeModelLiveness: 'now' must be a readable ISO-8601 instant (got ${JSON.stringify(now)}). `
            + 'An unreadable now would silently make every seat look fresh or every seat look dead.');
    }
    if (model_beat_at === null || model_beat_at === undefined || model_beat_at === '') return VERDICT.NONE;
    const beatMs = Date.parse(model_beat_at);
    // Present but unreadable: STALE, never ALIVE and never NONE. It is not "no beat" — a value IS
    // there — and it must not be credited as fresh.
    if (!Number.isFinite(beatMs)) return VERDICT.STALE;
    return ((nowMs - beatMs) / 1000) > threshold_s ? VERDICT.STALE : VERDICT.ALIVE;
}

/**
 * The RESPONSE FIELD NAME that carries a beat clock's age — derived FROM the clock it ages.
 *
 * `fabric_liveness` reports one age per clock, and a hand-typed age field is the same mirror as a
 * hand-typed clock: rename `model_beat_at` in the table above and a literal `model_beat_age_seconds`
 * elsewhere goes quietly wrong, still passing every test that also hand-typed it. So the name has
 * ONE derivation, here, and the server, the published tool description and the MCP class guard all
 * read it from this function.
 *
 * The trailing `_at` is dropped because it is the CLOCK's tense, not the AGE's — `model_beat_at` is
 * an instant, `model_beat_age_seconds` is a duration, and `model_beat_at_age_seconds` reads as the
 * age of an instant-named-thing rather than the age of the beat.
 */
export function beatClockAgeField(clockField) {
    const f = typeof clockField === 'string' ? clockField.trim() : '';
    if (!f) return null;
    return `${f.replace(/_at$/, '')}_age_seconds`;
}

/** Every beat-clock age field, DERIVED — what a consumer (the MCP class guard) registers instead of
 *  listing two more literals beside the two it already had to stop listing. */
export const BEAT_CLOCK_AGE_FIELDS = Object.freeze(BEAT_CLOCK_FIELD_NAMES.map(beatClockAgeField));

/** Age in seconds of a beat clock against `now`, or null when either instant is unreadable —
 *  NEVER 0, which reads as "brand new" and is the friendliest possible lie for a liveness check.
 *  Exported beside the rule that consumes the same two instants, so a caller reporting the age it
 *  was judged on cannot compute it a second way. */
export function beatClockAgeSeconds(beatIso, nowIso) {
    const a = Date.parse(beatIso);
    const b = Date.parse(nowIso);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return (b - a) / 1000;
}

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
export const isEnvelopePhase = (v) => has(ENVELOPE_PHASES, v);
export const isFabricRecordKind = (v) => has(FABRIC_RECORD_KINDS, v);
/**
 * How a STORED phase is READ — WRITE-STRICT, READ-TOLERANT, the same split the beat statuses hold.
 *
 * A record whose `phase` is absent (every envelope written before this contract existed) or outside
 * the enum (nothing this verb can produce — a raw `app_records_put` can) is READ as the default. A
 * reader that treated it as uninterpretable would answer "no transition is legal from here" and
 * leave that contract permanently unmovable with a refusal naming an empty set, which is a dead end
 * a caller cannot act on. Tolerated on READ, never accepted on WRITE, and the verb REPORTS the
 * substitution instead of performing it silently.
 */
export const readEnvelopePhase = (v) => (isEnvelopePhase(v) ? v : ENVELOPE_PHASE_DEFAULT);

/** The transition rule itself, read from its ONE owner, through the one reader above. */
export const isLegalPhaseTransition = (from, to) =>
    (ENVELOPE_PHASE_TRANSITIONS[readEnvelopePhase(from)] || []).includes(to);
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
        envelope_sections: [...ENVELOPE_SECTIONS],
        envelope_phases: [...ENVELOPE_PHASES],
        envelope_phase_default: ENVELOPE_PHASE_DEFAULT,
        // Deep-copied, not handed out by reference: the payload is a plain object a client
        // serialises, and a frozen nested list published by reference invites a consumer to
        // read it as mutable state.
        envelope_phase_transitions: Object.fromEntries(
            Object.entries(ENVELOPE_PHASE_TRANSITIONS).map(([k, v]) => [k, [...v]])),
        record_kinds: [...FABRIC_RECORD_KINDS],
        to_agent_sentinels: [...TO_AGENT_SENTINELS],
        retired_sentinels: [...RETIRED_SENTINELS],
        forbidden_role_addresses: [...FORBIDDEN_ROLE_ADDRESSES],
        write_modes: [...WRITE_MODES],
        watermark_fields: [...WATERMARK_FIELDS],
        wake_fields: [...WAKE_FIELDS],
        // The beat-clock contract, so the plugin reader GENERATES its copy of "which field is the
        // model's clock" instead of hand-typing it — the exact mirror that made the two-writers
        // defect invisible for a day. The names are derived from the table, not listed beside it.
        beat_clock_fields: BEAT_CLOCK_FIELDS.map((f) => ({ ...f })),
        beat_clock_field_names: [...BEAT_CLOCK_FIELD_NAMES],
        beat_clock_age_fields: [...BEAT_CLOCK_AGE_FIELDS],
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
