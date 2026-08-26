/**
 * Conformance suite for THE ONE OWNER of the platform-injected parameter set and its TWO VIEWS
 * (ws-descix-injected-param-allowlist; CEO ruling 2026-08-26, option B).
 *
 * THE OUTAGE THIS LOCKS DOWN. The owner carried four keys while DeSciX_Cloud's handler-level guard
 * carried twenty-four — two derivations of one fact, so they drifted. The Powch microservice built
 * closed per-command schemas (`additionalProperties:false`, `properties:{}` for the parameterless
 * verbs) against THIS list while its docstring claimed parity with Cloud's, so the platform's own
 * signed `_descix` envelope — injected by serviceManifestManager AFTER every boundary check — was
 * refused at Powch's own door and DEV login went down with:
 *
 *   powch_login_begin: unknown parameters 'email', 'app_id', 'currentLoginStatus',
 *   'source_guild_id', 'server_origin', '_descix'. Accepted parameters: . Rejected at the
 *   Powch /api/:command boundary — the parameter was NOT applied, and no default was substituted.
 *
 * THE HOLE THE FIRST FIX OPENED (measured 2026-08-26, V19). Widening the owner to 21 keys and
 * waving all of them EVERYWHERE fixed Powch and broke the boundary: both MCP doors validate BEFORE
 * injection, so a caller-authored `_descix: { user: { id: 'VICTIM' } }` rode a schema that declares
 * no such property straight through, and `_descix.user` is read AS IDENTITY downstream. The fix is
 * two VIEWS of one list, selected by the door's PHASE — which is what this suite iterates.
 *
 * EVERY ASSERTION IS DRIVEN OFF THE EXPORTED LIST AND THE EXPORTED PHASE TABLE, never a copy. A
 * test that re-listed either would be a third derivation and would stay green through exactly the
 * drift it exists to catch. The negative controls are the other half: each view must still be able
 * to FAIL, and the RED assertion must be shown to be PHASE-SENSITIVE rather than vacuous.
 *
 * Pure module, zero deps. Run: node --test tests/platform-injected-params-owner.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PLATFORM_INJECTED_PARAMS,
    isPlatformInjectedParam,
    validateParamsAgainstSchema,
    VALIDATION_PHASE,
    VALIDATION_PHASES,
    DEFAULT_VALIDATION_PHASE,
    paramWaiverForPhase,
    NATIVE_MCP_TOOLS,
} from '../src/mcp-tools/index.js';

/** A CLOSED schema with no properties — the shape every parameterless mesh verb publishes. */
const CLOSED_EMPTY_SCHEMA = Object.freeze({ type: 'object', properties: {}, required: [], additionalProperties: false });

/** The exact surface string the served refusal carried, so a message assertion is comparable. */
const POWCH_SURFACE = 'Powch /api/:command';

const POST = { commandName: 'powch_login_begin', surface: POWCH_SURFACE, phase: VALIDATION_PHASE.POST_INJECTION };
const PRE = { commandName: 'powch_login_begin', surface: POWCH_SURFACE, phase: VALIDATION_PHASE.PRE_INJECTION };

// ─────────────────────────────────────────────────────────────────────────────
// 0. THE PHASE CONTRACT ITSELF
// ─────────────────────────────────────────────────────────────────────────────

test('the phase table publishes exactly two views, and the default is the STRICT one', () => {
    assert.deepEqual([...VALIDATION_PHASES].sort(), ['post-injection', 'pre-injection']);
    assert.equal(DEFAULT_VALIDATION_PHASE, VALIDATION_PHASE.PRE_INJECTION,
        'a forgotten phase must over-refuse, never under-refuse');
    // The exported word map and the accepted-word list are the same fact; a disagreement means a
    // consumer could name a constant the resolver rejects.
    for (const word of Object.values(VALIDATION_PHASE)) {
        assert.ok(VALIDATION_PHASES.includes(word), `VALIDATION_PHASE names '${word}' but the resolver refuses it`);
    }
});

test('an UNKNOWN phase word is refused BY NAME, not resolved to either view', () => {
    for (const bogus of ['strict', 'PRE-INJECTION', '', null, 0, 'post_injection']) {
        assert.throws(
            () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, {}, { commandName: 'x', phase: bogus }),
            (err) => {
                assert.equal(err.code, 'INVALID_VALIDATION_PHASE');
                assert.equal(err.statusCode, 500);
                assert.deepEqual(err.data.accepted_phases.sort(), ['post-injection', 'pre-injection']);
                assert.match(err.message, /unknown validation phase/);
                return true;
            },
            `phase ${JSON.stringify(bogus)} was accepted`,
        );
    }
});

test('a PROTOTYPE key name is not a phase (the waiver table is a Map, not an object literal)', () => {
    // On a plain object literal `PHASE_WAIVERS['constructor']` returns a truthy inherited function,
    // which would make these strings resolve to a "valid" waiver. That is a gate that cannot fail
    // on the one input class designed to attack it.
    for (const proto of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
        assert.throws(() => paramWaiverForPhase(proto), (err) => err.code === 'INVALID_VALIDATION_PHASE',
            `'${proto}' resolved to a waiver`);
    }
});

test('an unknown phase is refused even when the command declares NO schema', () => {
    // The no-schema early return must not be a bypass for the wiring check: a gate that can be
    // skipped by the shape of its input is not a gate.
    assert.throws(() => validateParamsAgainstSchema({}, { anything: 1 }, { commandName: 'x', phase: 'nope' }),
        (err) => err.code === 'INVALID_VALIDATION_PHASE');
    assert.throws(() => validateParamsAgainstSchema(null, { anything: 1 }, { commandName: 'x', phase: 'nope' }),
        (err) => err.code === 'INVALID_VALIDATION_PHASE');
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE TWO VIEWS — the SAME list, iterated for BOTH, one key at a time
// ─────────────────────────────────────────────────────────────────────────────

test('POST-INJECTION: every platform-injected key alone passes a closed, property-less schema', () => {
    assert.ok(PLATFORM_INJECTED_PARAMS.length > 0, 'the owner must not be empty');
    for (const key of PLATFORM_INJECTED_PARAMS) {
        assert.doesNotThrow(
            () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { [key]: 'injected' }, POST),
            `'${key}' is declared platform-injected but is refused in the post-injection view`,
        );
    }
});

test('PRE-INJECTION: every platform-injected key alone is REFUSED, by name', () => {
    // The whole point of the two views. Before the injector runs, an owner key in the bag is
    // CALLER-AUTHORED — the platform has not written anything yet — so it is not a framework key,
    // it is a forgery attempt against whatever reads that key downstream.
    for (const key of PLATFORM_INJECTED_PARAMS) {
        assert.throws(
            () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { [key]: 'caller-authored' }, PRE),
            (err) => {
                assert.equal(err.code, 'INVALID_PARAMS');
                assert.deepEqual(err.data.unknown_parameters, [key]);
                assert.deepEqual(err.data.platform_injected_parameters, [key]);
                assert.equal(err.data.validation_phase, VALIDATION_PHASE.PRE_INJECTION);
                assert.match(err.message, /PLATFORM-INJECTED/);
                return true;
            },
            `'${key}' passed the pre-injection door — a caller may not author it`,
        );
    }
});

test('OMITTED phase behaves EXACTLY like the pre-injection view, key for key', () => {
    // Two derivations of "what does the default mean" is the same bug class as two derivations of
    // the list. Asserted as IDENTITY against the strict view, not as a separately restated rule.
    for (const key of PLATFORM_INJECTED_PARAMS.concat(['not_injected_zzz'])) {
        const run = (opts) => {
            try { validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { [key]: 1 }, opts); return null; }
            catch (e) { return { code: e.code, unknown: e.data.unknown_parameters }; }
        };
        assert.deepEqual(run({ commandName: 'c' }), run({ commandName: 'c', phase: VALIDATION_PHASE.PRE_INJECTION }),
            `omitted phase and the strict view disagree about '${key}'`);
    }
});

test('POST-INJECTION: the WHOLE injected set at once passes a closed, property-less schema', () => {
    // One at a time proves each key; all at once proves there is no interaction between them
    // (a bag carrying the full envelope is what a real mesh call actually delivers).
    const bag = Object.fromEntries(PLATFORM_INJECTED_PARAMS.map((k) => [k, 'injected']));
    assert.doesNotThrow(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, bag, POST));
});

test('PRE-INJECTION: the whole set at once is refused, naming EVERY key', () => {
    const bag = Object.fromEntries(PLATFORM_INJECTED_PARAMS.map((k) => [k, 'caller-authored']));
    assert.throws(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, bag, PRE), (err) => {
        assert.equal(err.code, 'INVALID_PARAMS');
        assert.deepEqual([...err.data.unknown_parameters].sort(), [...PLATFORM_INJECTED_PARAMS].sort());
        return true;
    });
});

test('the list and the membership predicate answer the same question', () => {
    // The predicate is the contract consumers use; the array is what this suite iterates. If they
    // could disagree, the suite would be testing a list nothing reads.
    for (const key of PLATFORM_INJECTED_PARAMS) {
        assert.ok(isPlatformInjectedParam(key), `${key} is in the list but the predicate denies it`);
    }
    assert.equal(isPlatformInjectedParam('not_injected_zzz'), false);
});

test('the waiver predicates ARE the two views of the one list — not a copy of it', () => {
    const pre = paramWaiverForPhase(VALIDATION_PHASE.PRE_INJECTION);
    const post = paramWaiverForPhase(VALIDATION_PHASE.POST_INJECTION);
    for (const key of PLATFORM_INJECTED_PARAMS.concat(['not_injected_zzz', 'kb_id'])) {
        assert.equal(pre(key), false, `pre-injection waived '${key}'`);
        assert.equal(post(key), isPlatformInjectedParam(key), `post-injection view disagrees with the owner on '${key}'`);
    }
});

test('the owner is frozen and free of duplicates', () => {
    assert.ok(Object.isFrozen(PLATFORM_INJECTED_PARAMS));
    assert.equal(new Set(PLATFORM_INJECTED_PARAMS).size, PLATFORM_INJECTED_PARAMS.length,
        'a duplicated key means two groups both claim it — reconcile the injector, do not list it twice');
});

test('the 24 -> 21 narrowing holds: three CALLER-SENT reads are NOT in the owner', () => {
    // apiFront.js:1150 reads `params.user_id || params.target_user_id || params.reactor_id` and
    // :1234 reads `params.community_id || params.target_community_id` off the DISCORD BOT'S OWN
    // BAG. The platform READS them; it never WRITES them. Listing them would wave three
    // caller-authored keys past every command's published contract, in both views.
    for (const key of ['target_community_id', 'target_user_id', 'reactor_id']) {
        assert.equal(isPlatformInjectedParam(key), false,
            `'${key}' is a caller-sent fallback READ, not a platform write — it has no injector site`);
    }
    assert.equal(PLATFORM_INJECTED_PARAMS.length, 21,
        'the owner is 21 keys: 24 minus the three caller-sent reads. Changing it needs an injector site.');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. THE OUTAGE — the exact keys the served refusal named
// ─────────────────────────────────────────────────────────────────────────────

test('RED CONTROL: the five platform keys the served powch_login_begin refusal named are covered', () => {
    // Named individually ON PURPOSE. This is the one place a literal key set is justified: these
    // are the keys a PRODUCTION refusal actually printed, so they are evidence, not a mirror. If
    // a future edit removes one from the owner, this goes red and names the outage it reopens.
    for (const key of ['app_id', 'currentLoginStatus', 'source_guild_id', 'server_origin', '_descix']) {
        assert.ok(isPlatformInjectedParam(key),
            `'${key}' was named in the served powch_login_begin refusal — dropping it re-opens the DEV login outage`);
    }
});

test('the injected half of the served defect bag is ACCEPTED post-injection and REFUSED pre-injection', () => {
    const injectedHalfOfDefectBag = {
        app_id: 'powch',
        currentLoginStatus: 'NOT_AUTHENTICATED',
        source_guild_id: null,
        server_origin: 'https://dev.descix.net',
        _descix: { user: null, entitlements: [], serviceId: 'powch', timestamp: 1 },
    };
    // Powch's door stands AFTER Cloud's injector: this is the bag it actually receives.
    assert.doesNotThrow(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, injectedHalfOfDefectBag, POST));
    // The same bytes arriving at a caller-facing door are a forgery, and are refused there.
    assert.throws(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, injectedHalfOfDefectBag, PRE),
        (err) => err.code === 'INVALID_PARAMS');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. V19's IDENTITY-FORGERY VECTOR — permanent, driven off the SERVED schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reproduction of the hole option B closes, kept as a permanent test rather than a scratch script.
 *
 * Measured 2026-08-26 against the 21-key single-view branch: `fabric_beat`'s published schema
 * declares no `_descix`, both MCP doors validate the CALLER'S bag, and the single view waved
 * `_descix` — so this exact object reached leaseAuthority.js:244
 * `params?.user || params?._descix?.user`, which reads it AS THE CALLER'S IDENTITY.
 *
 * Fixture is built FROM the served inputSchema (required keys, sampled by declared type) so it
 * cannot drift out of exhibiting the failure when fabric_beat's schema changes.
 */
const FABRIC_BEAT = NATIVE_MCP_TOOLS.find((t) => t && t.name === 'fabric_beat');

const sampleForType = (propSchema) => {
    const declared = Array.isArray(propSchema?.type) ? propSchema.type[0] : propSchema?.type;
    switch (declared) {
        case 'object': return {};
        case 'array': return [];
        case 'number': case 'integer': return 1;
        case 'boolean': return true;
        default: return 'x';
    }
};

function validFabricBeatBag() {
    const props = FABRIC_BEAT.inputSchema.properties;
    const bag = {};
    for (const name of FABRIC_BEAT.inputSchema.required || []) bag[name] = sampleForType(props[name]);
    return bag;
}

const FORGED_IDENTITY = Object.freeze({ user: { id: 'VICTIM-USER-ID', email: 'victim@x' } });

test('V19 VECTOR — fabric_beat publishes no _descix, so the fixture CAN exhibit the forgery', () => {
    // A fixture that cannot exhibit the failure does not measure it, however green the suite runs.
    assert.ok(FABRIC_BEAT, 'fabric_beat is not in NATIVE_MCP_TOOLS — this vector no longer measures anything');
    assert.ok(!('_descix' in FABRIC_BEAT.inputSchema.properties),
        'fabric_beat now DECLARES _descix — the vector is measuring a declared property, not the waiver');
    assert.ok(Object.keys(validFabricBeatBag()).length > 0, 'the valid half of the bag is empty');
});

test('V19 VECTOR — a caller-authored _descix is REFUSED at a pre-injection door, by name', () => {
    const evil = { ...validFabricBeatBag(), _descix: FORGED_IDENTITY };
    assert.throws(
        () => validateParamsAgainstSchema(FABRIC_BEAT.inputSchema, evil, {
            commandName: 'fabric_beat',
            surface: 'execute_remote_command gateway',
            phase: VALIDATION_PHASE.PRE_INJECTION,
        }),
        (err) => {
            assert.equal(err.code, 'INVALID_PARAMS');
            assert.deepEqual(err.data.unknown_parameters, ['_descix']);
            assert.deepEqual(err.data.platform_injected_parameters, ['_descix']);
            assert.match(err.message, /unknown parameter '_descix'/);
            assert.match(err.message, /PLATFORM-INJECTED/);
            return true;
        },
        'a caller-authored _descix reached leaseAuthority as identity — the V19 hole is open',
    );
});

test('V19 VECTOR — the SAME bag is ACCEPTED at a post-injection door', () => {
    // The other half of the ruling: downstream of the injector that same key IS the platform's own
    // signed envelope, and refusing it there is the outage this workstream started from.
    const injected = { ...validFabricBeatBag(), _descix: FORGED_IDENTITY };
    assert.doesNotThrow(() => validateParamsAgainstSchema(FABRIC_BEAT.inputSchema, injected, {
        commandName: 'fabric_beat', surface: 'Powch /api/:command', phase: VALIDATION_PHASE.POST_INJECTION,
    }));
});

test('V19 VECTOR NEGATIVE CONTROL: the refusal is PHASE-SENSITIVE, not vacuous', () => {
    // The assertion above must be capable of failing. Proven by running the IDENTICAL fixture
    // through the other view and observing that it does NOT refuse: if the pre-injection door were
    // re-wired to the permissive view, the RED test goes green and the hole reopens.
    //
    // NOTE the asymmetry, and it is deliberate: REMOVING the phase argument does NOT make this
    // test fail, because omitted resolves to the strict view. Strictness is the safe default, so
    // the mutation that can break the gate is a phase SWAP, never a phase omission.
    const evil = { ...validFabricBeatBag(), _descix: FORGED_IDENTITY };
    const run = (opts) => { try { validateParamsAgainstSchema(FABRIC_BEAT.inputSchema, evil, opts); return 'ACCEPTED'; } catch (e) { return e.code; } };
    assert.equal(run({ commandName: 'fabric_beat', phase: VALIDATION_PHASE.PRE_INJECTION }), 'INVALID_PARAMS');
    assert.equal(run({ commandName: 'fabric_beat' }), 'INVALID_PARAMS', 'omitted phase must be strict');
    assert.equal(run({ commandName: 'fabric_beat', phase: VALIDATION_PHASE.POST_INJECTION }), 'ACCEPTED',
        'the two views are indistinguishable on this fixture — the RED test proves nothing');
});

test('V19 CONTROL — a NON-injected key is refused in BOTH views', () => {
    const bag = { ...validFabricBeatBag(), not_injected_zzz: 1 };
    for (const phase of VALIDATION_PHASES) {
        assert.throws(
            () => validateParamsAgainstSchema(FABRIC_BEAT.inputSchema, bag, { commandName: 'fabric_beat', phase }),
            (err) => err.code === 'INVALID_PARAMS' && err.data.unknown_parameters.includes('not_injected_zzz'),
            `not_injected_zzz passed in the '${phase}' view`,
        );
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. NEGATIVE CONTROLS — each view must still be able to fail
// ─────────────────────────────────────────────────────────────────────────────

test('NEGATIVE CONTROL: an un-injected key is STILL refused, by name, in BOTH views', () => {
    for (const phase of VALIDATION_PHASES) {
        assert.throws(
            () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { not_injected_zzz: 1 },
                { commandName: 'powch_login_begin', surface: POWCH_SURFACE, phase }),
            (err) => {
                assert.equal(err.code, 'INVALID_PARAMS');
                assert.deepEqual(err.data.unknown_parameters, ['not_injected_zzz']);
                assert.match(err.message, /unknown parameter 'not_injected_zzz'/);
                assert.match(err.message, /Rejected at the Powch \/api\/:command boundary/);
                return true;
            },
            `not_injected_zzz passed in the '${phase}' view`,
        );
    }
});

test('NEGATIVE CONTROL: an un-injected key riding WITH the full injected envelope is still refused', () => {
    // The dangerous shape: a real bag, plus one key that does not belong. Waving the envelope
    // through must not wave through its passenger.
    const bag = Object.fromEntries(PLATFORM_INJECTED_PARAMS.map((k) => [k, 'injected']));
    bag.not_injected_zzz = 1;
    assert.throws(
        () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, bag, POST),
        (err) => err.code === 'INVALID_PARAMS' && err.data.unknown_parameters.length === 1
            && err.data.unknown_parameters[0] === 'not_injected_zzz',
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. THE RULE THAT KEEPS THE LIST HONEST — it is not a parking space
// ─────────────────────────────────────────────────────────────────────────────

test('keys the platform deliberately REFUSES from callers are NOT in the owner', () => {
    // `interaction_owner_id` is written into params by the room adapter, so it meets the
    // "platform writes it" half of the rule — but Cloud strips it from every caller-authored bag
    // (interactionSession.stripClientRoomOwner) specifically SO the boundary can refuse it by
    // name. Allow-listing it here would pre-empt that refusal and hand a caller-chosen key into
    // somebody else's conversation. `previous_interaction_id` and `knowledgebase_names` are
    // likewise platform-written but are DECLARED caller params on the RAG commands, so waving
    // them past every command's schema would restore the silent-drop this module exists to kill.
    for (const key of ['interaction_owner_id', 'previous_interaction_id', 'knowledgebase_names']) {
        assert.equal(isPlatformInjectedParam(key), false,
            `'${key}' must stay refusable: the owner is not a parking space for caller-facing params`);
    }
});

test('a declared property beats the waiver: an injected key that IS declared still type-checks', () => {
    // `community_id` is injected, but a command that declares it must still get the declared type
    // enforced — the waiver bypasses the UNKNOWN check only, never the type check, in either view.
    const schema = { type: 'object', properties: { community_id: { type: 'string' } }, required: [] };
    for (const phase of VALIDATION_PHASES) {
        assert.throws(
            () => validateParamsAgainstSchema(schema, { community_id: 42 }, { commandName: 'update_app', phase }),
            (err) => err.code === 'INVALID_PARAMS' && /wrong parameter type/.test(err.message),
            `the type gate was skipped in the '${phase}' view`,
        );
    }
});
