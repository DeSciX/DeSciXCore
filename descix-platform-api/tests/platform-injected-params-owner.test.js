/**
 * Conformance suite for THE ONE OWNER of the platform-injected parameter set
 * (ws-descix-injected-param-allowlist).
 *
 * THE OUTAGE THIS LOCKS DOWN. This list carried four keys while DeSciX_Cloud's handler-level
 * guard carried twenty-four — two derivations of one fact, so they drifted. The Powch
 * microservice built closed per-command schemas
 * (`additionalProperties:false`, `properties:{}` for the parameterless verbs) against THIS list
 * while its docstring claimed parity with Cloud's, so the platform's own signed `_descix`
 * envelope — injected by serviceManifestManager AFTER every boundary check — was refused at
 * Powch's own door and DEV login went down with:
 *
 *   powch_login_begin: unknown parameters 'email', 'app_id', 'currentLoginStatus',
 *   'source_guild_id', 'server_origin', '_descix'. Accepted parameters: . Rejected at the
 *   Powch /api/:command boundary — the parameter was NOT applied, and no default was substituted.
 *
 * EVERY ASSERTION IS DRIVEN OFF THE EXPORTED LIST, never a copy of it. A test that re-listed the
 * keys would be a third derivation and would stay green through exactly the drift it exists to
 * catch. The negative control is the other half: the suite must still be able to FAIL, so an
 * un-injected key is asserted to be refused BY NAME.
 *
 * Pure module, zero deps. Run: node --test tests/platform-injected-params-owner.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PLATFORM_INJECTED_PARAMS,
    isPlatformInjectedParam,
    validateParamsAgainstSchema,
} from '../src/mcp-tools/index.js';

/** A CLOSED schema with no properties — the shape every parameterless mesh verb publishes. */
const CLOSED_EMPTY_SCHEMA = Object.freeze({ type: 'object', properties: {}, required: [], additionalProperties: false });

/** The exact surface string the served refusal carried, so a message assertion is comparable. */
const POWCH_SURFACE = 'Powch /api/:command';

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE CONTRACT — every injected key survives a closed schema, one at a time
// ─────────────────────────────────────────────────────────────────────────────

test('every platform-injected key alone passes a closed, property-less schema', () => {
    assert.ok(PLATFORM_INJECTED_PARAMS.length > 0, 'the owner must not be empty');
    for (const key of PLATFORM_INJECTED_PARAMS) {
        assert.doesNotThrow(
            () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { [key]: 'injected' },
                { commandName: 'powch_login_begin', surface: POWCH_SURFACE }),
            `'${key}' is declared platform-injected but is refused by the boundary validator`,
        );
    }
});

test('the WHOLE injected set at once passes a closed, property-less schema', () => {
    // One at a time proves each key; all at once proves there is no interaction between them
    // (a bag carrying the full envelope is what a real mesh call actually delivers).
    const bag = Object.fromEntries(PLATFORM_INJECTED_PARAMS.map((k) => [k, 'injected']));
    assert.doesNotThrow(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, bag,
        { commandName: 'powch_login_begin', surface: POWCH_SURFACE }));
});

test('the list and the membership predicate answer the same question', () => {
    // The predicate is the contract consumers use; the array is what this suite iterates. If they
    // could disagree, the suite would be testing a list nothing reads.
    for (const key of PLATFORM_INJECTED_PARAMS) {
        assert.ok(isPlatformInjectedParam(key), `${key} is in the list but the predicate denies it`);
    }
    assert.equal(isPlatformInjectedParam('not_injected_zzz'), false);
});

test('the owner is frozen and free of duplicates', () => {
    assert.ok(Object.isFrozen(PLATFORM_INJECTED_PARAMS));
    assert.equal(new Set(PLATFORM_INJECTED_PARAMS).size, PLATFORM_INJECTED_PARAMS.length,
        'a duplicated key means two groups both claim it — reconcile the injector, do not list it twice');
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

test('the injected half of the served defect bag is now ACCEPTED', () => {
    const injectedHalfOfDefectBag = {
        app_id: 'powch',
        currentLoginStatus: 'NOT_AUTHENTICATED',
        source_guild_id: null,
        server_origin: 'https://dev.descix.net',
        _descix: { user: null, entitlements: [], serviceId: 'powch', timestamp: 1 },
    };
    assert.doesNotThrow(() => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, injectedHalfOfDefectBag,
        { commandName: 'powch_login_begin', surface: POWCH_SURFACE }));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEGATIVE CONTROL — the gate must still be able to fail
// ─────────────────────────────────────────────────────────────────────────────

test('NEGATIVE CONTROL: an un-injected key is STILL refused, by name', () => {
    assert.throws(
        () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, { not_injected_zzz: 1 },
            { commandName: 'powch_login_begin', surface: POWCH_SURFACE }),
        (err) => {
            assert.equal(err.code, 'INVALID_PARAMS');
            assert.deepEqual(err.data.unknown_parameters, ['not_injected_zzz']);
            assert.match(err.message, /unknown parameter 'not_injected_zzz'/);
            assert.match(err.message, /Rejected at the Powch \/api\/:command boundary/);
            return true;
        },
    );
});

test('NEGATIVE CONTROL: an un-injected key riding WITH the full injected envelope is still refused', () => {
    // The dangerous shape: a real bag, plus one key that does not belong. Waving the envelope
    // through must not wave through its passenger.
    const bag = Object.fromEntries(PLATFORM_INJECTED_PARAMS.map((k) => [k, 'injected']));
    bag.not_injected_zzz = 1;
    assert.throws(
        () => validateParamsAgainstSchema(CLOSED_EMPTY_SCHEMA, bag,
            { commandName: 'powch_login_begin', surface: POWCH_SURFACE }),
        (err) => err.code === 'INVALID_PARAMS' && err.data.unknown_parameters.length === 1
            && err.data.unknown_parameters[0] === 'not_injected_zzz',
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE RULE THAT KEEPS THE LIST HONEST — it is not a parking space
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

test('a declared property beats the allow-list: an injected key that IS declared still type-checks', () => {
    // `community_id` is injected, but a command that declares it must still get the declared
    // type enforced — the allow-list is a bypass of the UNKNOWN check only, never of the type check.
    const schema = { type: 'object', properties: { community_id: { type: 'string' } }, required: [] };
    assert.throws(
        () => validateParamsAgainstSchema(schema, { community_id: 42 }, { commandName: 'update_app' }),
        (err) => err.code === 'INVALID_PARAMS' && /wrong parameter type/.test(err.message),
    );
});
