/**
 * manifest-contract.test.js — the command contract has ONE owner, and register-time is where an
 * incomplete one dies.
 *
 * Built to design §13 (CEO-D-25, 2026-08-24), which is binding over §§0-12.
 *
 *   A. buildManifestFromHandlers' metaOverlay pass-through. On origin/main the overlay reads
 *      exactly four keys (description, inputSchema, mcp, mutating) and DROPS everything else a
 *      handler declares — including `requiredPermissions`, which is the authoritative EXTERNAL
 *      permission gate: apiFront enforces it FROM THE REGISTERED MANIFEST at call time
 *      (DeSciX_Cloud/microservice/services/apiFront.js:298-314) and mirrors it at advertisement
 *      (:391-410). A build that drops the floor publishes an UNGATED command. §13.2 therefore
 *      makes the field REQUIRED with an explicit `[]` meaning "no gate" — absence is refused,
 *      never defaulted.
 *
 *   B. validateManifest. §13.3: strictness travels with the MANIFEST, not with the door.
 *      `manifest.service.contract` declares the tier; ONE function with ONE call shape at every
 *      door branches on it. v2 enforces the full §13.2 field set; v1 keeps today's four checks
 *      so Cloud's boot self-registration, powch, daita-ssgpod and egpt-godsworld register
 *      unchanged; an unknown token is REFUSED (no silent leniency).
 *
 * Both halves are driven off ONE exported table, COMMAND_CONTRACT_FIELDS, so "which fields does a
 * command entry carry" is never derived twice.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

// NAMESPACE import, deliberately (design §4): a NAMED import of a missing export is a link error
// that kills the whole file, so the negative control would report one opaque failure instead of
// naming which half of the contract is absent.
import * as manifestOwner from '../src/manifest/index.js';

const { buildManifestFromHandlers, validateManifest } = manifestOwner;
const COMMAND_CONTRACT_FIELDS = manifestOwner.COMMAND_CONTRACT_FIELDS ?? {};
const ERROR_ENTRY_FIELDS = manifestOwner.ERROR_ENTRY_FIELDS ?? [];
const CONTRACT_TIERS = manifestOwner.CONTRACT_TIERS ?? [];
const V1_MIGRATION_OWNERS = manifestOwner.V1_MIGRATION_OWNERS ?? {};

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * A throwaway handler dir with one handler file, so buildManifestFromHandlers has something real
 * to read. The JSDoc is deliberately minimal — this suite is about the OVERLAY, which is
 * authoritative over JSDoc (manifest/index.js:229-236).
 */
function makeHandlerDir(fnName = 'demo_command') {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-contract-'));
    fs.writeFileSync(
        path.join(dir, 'demoCommands.js'),
        `/**\n * JSDoc description that the overlay must beat.\n */\nasync function ${fnName}(params) { return params; }\n`,
        'utf8'
    );
    return dir;
}

const BASE_BUILD = (handlerDir, cmd, metaOverlay) => ({
    name: 'demo',
    version: '1.0.0',
    description: 'demo service',
    domain: 'demo.descix.net',
    handlers: { [cmd]: 'demoCommands.js' },
    handlerDir,
    metaOverlay,
});

/**
 * VERBATIM from BEAST/microservice/manifest.json at origin/main (f894224) — three of the 33
 * commands, byte-for-byte, with `service` carrying no `contract` token (as it does today).
 *
 * This fixture is the v1-tier control AND the v2 negative control: the SAME commands are re-tiered
 * to v2 in B1 to show the refusal. Chosen to discriminate three distinct defects:
 *   - beast_list_qa_files   properties:{} with NO `required` at all
 *   - beast_roles_seed      properties:{} WITH required:[] but no additionalProperties:false
 *                           (the near-miss — it is not the parameterless DECLARATION)
 *   - beast_update_stream   a real parameterised command, complete on params, missing
 *                           summary / errors / example
 */
const BEAST_MAIN_SERVICE = {
    name: 'beast',
    version: '3.9.0',
    description: 'BEAST - Business Execution And Status Tracker',
    domain: 'unk-beast.dev.descix.net',
    healthEndpoint: '/health',
    debugPort: 3011,
    community_id: 'unk',
    app_id: 'unk',
};

const BEAST_MAIN_COMMANDS = {
    beast_list_qa_files: {
        handler: 'qaCommands.listQAFiles',
        mutating: false,
        description: 'List all Q&A training pair JSON files in the repo. Returns file paths, target agent IDs, categories, and stats summaries for each file. Used by the Q&A editor to populate the file selector.',
        guestAllowed: false,
        inputSchema: { type: 'object', properties: {} },
        requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
    },
    beast_roles_seed: {
        handler: 'roleCommands.rolesSeed',
        mutating: true,
        description: 'ONE-SHOT BOOTSTRAP: write the seven roles of the BEAST design and bind the seats that already exist to theirs.',
        guestAllowed: false,
        inputSchema: { type: 'object', properties: {}, required: [] },
        requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
    },
    beast_update_stream: {
        handler: 'streamCommands.updateStream',
        mutating: true,
        description: 'Update a workstream status stream.',
        guestAllowed: false,
        inputSchema: {
            type: 'object',
            properties: {
                stream_id: { type: 'string', description: 'The stream to update.' },
                status: { type: 'string', enum: ['red', 'yellow', 'green'], description: 'R/Y/G.' },
            },
            required: ['stream_id', 'status'],
        },
        requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
    },
};

const beastManifest = (contract) => ({
    service: contract ? { ...BEAST_MAIN_SERVICE, contract } : { ...BEAST_MAIN_SERVICE },
    commands: structuredClone(BEAST_MAIN_COMMANDS),
});

/** A command entry that satisfies the whole v2 contract. The positive control. */
const COMPLETE_COMMAND = {
    description: 'Update a workstream status stream so the board reflects reality.',
    summary: 'Update a workstream status stream.',
    inputSchema: {
        type: 'object',
        properties: {
            stream_id: { type: 'string', description: 'The stream to update.' },
            status: { type: 'string', enum: ['red', 'yellow', 'green'], description: 'R/Y/G.' },
        },
        required: ['stream_id', 'status'],
        additionalProperties: false,
    },
    errors: [
        { code: 'STREAM_NOT_FOUND', statusCode: 404, when: 'No stream carries stream_id.', fix: 'Call beast_get_board for the live stream ids.' },
    ],
    example: { params: { stream_id: 'descix', status: 'green' } },
    requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
};

/** The explicit parameterless DECLARATION (VISION, 2026-08-24 22:53Z). */
const PARAMETERLESS_COMMAND = {
    description: 'Read the cached executive summary. No AI call — reads cached data only.',
    summary: 'Read the cached executive summary.',
    inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    errors: [
        { code: 'SUMMARY_ABSENT', statusCode: 404, when: 'No summary has been generated yet.', fix: 'Call beast_render_report first.' },
    ],
    example: { params: {} },
    requiredPermissions: [],
};

const v2Service = { name: 'demo', domain: 'demo.descix.net', contract: 'v2' };
const v1Service = { name: 'demo', domain: 'demo.descix.net' };

const v2 = (commands) => validateManifest({ service: v2Service, commands });

// ─── A. Overlay pass-through ─────────────────────────────────────────────────

describe('A. buildManifestFromHandlers — the overlay carries the WHOLE declared contract', () => {

    test('A1 NEGATIVE CONTROL: the permission floor survives the build', async () => {
        // apiFront enforces requiredPermissions from the REGISTERED manifest (apiFront.js:298-314).
        // A build that drops it publishes an ungated command — this is a security assertion, not
        // a completeness one.
        const dir = makeHandlerDir('gated_command');
        const manifest = await buildManifestFromHandlers(BASE_BUILD(dir, 'gated_command', {
            gated_command: {
                description: 'A gated command.',
                requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
            },
        }));
        assert.deepEqual(
            manifest.commands.gated_command.requiredPermissions,
            ['PLATFORM_MANAGE_COMMUNITIES'],
            'the build DROPPED the permission floor the handler declared'
        );
    });

    test('A1b: an EXPLICIT empty gate survives as an empty array, not as absence', async () => {
        // §13.2: `[]` means "no gate" and must be written explicitly. If the builder elided a
        // falsy/empty value, "declared open" and "forgot to declare" would become the same bit —
        // and the validator could no longer tell them apart.
        const dir = makeHandlerDir('open_command');
        const manifest = await buildManifestFromHandlers(BASE_BUILD(dir, 'open_command', {
            open_command: { description: 'An ungated command.', requiredPermissions: [] },
        }));
        assert.deepEqual(manifest.commands.open_command.requiredPermissions, []);
        assert.ok(
            'requiredPermissions' in manifest.commands.open_command,
            'an explicit empty gate must be EMITTED, not elided'
        );
    });

    test('A2: every overlay-owned field in the contract table is carried through', async () => {
        const dir = makeHandlerDir('full_command');
        const overlay = {
            description: 'A fully declared command.',
            summary: 'A fully declared command.',
            inputSchema: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
            errors: [{ code: 'X_FAILED', statusCode: 400, when: 'a is blank.', fix: 'Pass a non-empty a.' }],
            example: { params: { a: 'hello' } },
            visibility: 'admin',
            requiredPermissions: ['PLATFORM_MANAGE_APPS'],
            requires_seat: { label: 'DEVPLANE', token_param: 'seat_token' },
            scope: { communities: ['unk'] },
            mcp: true,
            mutating: true,
            serviceAccountOnly: false,
            isProxy: true,
        };
        const manifest = await buildManifestFromHandlers(
            BASE_BUILD(dir, 'full_command', { full_command: overlay })
        );
        const entry = manifest.commands.full_command;

        // Driven off the EXPORTED table, so adding a field to the contract without teaching the
        // builder to carry it is a CI failure, not a silent drop.
        const overlayOwned = Object.entries(COMMAND_CONTRACT_FIELDS)
            .filter(([, spec]) => spec.overlay)
            .map(([k]) => k);
        assert.ok(overlayOwned.length > 4, 'the contract table must own more than the legacy four keys');
        for (const field of overlayOwned) {
            if (!(field in overlay)) continue;
            assert.deepEqual(entry[field], overlay[field], `overlay field '${field}' was dropped by the build`);
        }
    });

    test('A3: opaque service-declared meta (requires_seat / scope) is passed through untouched', async () => {
        const dir = makeHandlerDir('seated_command');
        const requires_seat = { label: 'DEVPLANE', token_param: 'seat_token', nested: { deep: [1, 2, 3] } };
        const manifest = await buildManifestFromHandlers(BASE_BUILD(dir, 'seated_command', {
            seated_command: { description: 'Seated.', requires_seat, scope: 'org' },
        }));
        assert.deepEqual(manifest.commands.seated_command.requires_seat, requires_seat);
        assert.equal(manifest.commands.seated_command.scope, 'org');
    });

    test('A4: the overlay still beats JSDoc, and builder-owned fields stay builder-owned', async () => {
        const dir = makeHandlerDir('guest_command');
        const manifest = await buildManifestFromHandlers({
            ...BASE_BUILD(dir, 'guest_command', {
                guest_command: { description: 'Overlay wins.', guestAllowed: false },
            }),
            guestCommands: new Set(['guest_command']),
        });
        const entry = manifest.commands.guest_command;
        assert.equal(entry.description, 'Overlay wins.');
        // guestAllowed has ONE owner: the guestCommands set the service passes in. An overlay key
        // of the same name must not become a second derivation of the same fact (§13.2).
        assert.equal(entry.guestAllowed, true, 'guestAllowed must come from guestCommands, not the overlay');
        assert.equal(COMMAND_CONTRACT_FIELDS.guestAllowed.overlay, false);
    });

    test('A5: `handler` is NOT part of the command contract', () => {
        // §13.2, measured 2026-08-24: zero readers. Written at
        // DeSciX_Cloud/microservice/services/serviceManifestManager.js:157 into a registry entry
        // nothing reads; BEAST's own router dispatches from COMMAND_MAP. Deleted, not fenced.
        assert.ok(!('handler' in COMMAND_CONTRACT_FIELDS), '`handler` has no reader; it must not be in the contract');
    });
});

// ─── B. The tier contract ────────────────────────────────────────────────────

describe('B. validateManifest — strictness travels with the MANIFEST (§13.3)', () => {

    test('B0: the tier vocabulary is published, and v1 names its migration owners', () => {
        assert.deepEqual(CONTRACT_TIERS, ['v1', 'v2']);
        // §13.3: "Each v1 service gets a named migration owner in the same change — a board row per
        // service, or the tier is a fence rather than a stage." The fence is only legitimate while
        // it is a stage, so the stage is stated IN CODE and this test is what deletes it: when the
        // last service migrates, V1_MIGRATION_OWNERS empties and the v1 branch goes with it.
        assert.ok(Object.keys(V1_MIGRATION_OWNERS).length > 0,
            'v1 is still accepted, so every v1 service must name its migration owner');
        for (const [service, owner] of Object.entries(V1_MIGRATION_OWNERS)) {
            assert.ok(typeof owner === 'string' && owner.length > 0, `v1 service '${service}' names no migration owner`);
        }
    });

    test('B1 NEGATIVE CONTROL: the BEAST manifest re-tiered to v2 is REFUSED', () => {
        const { valid, errors } = validateManifest(beastManifest('v2'));
        assert.equal(valid, false, 'a v2 manifest missing the contract field set must not validate');

        const blob = errors.join('\n');
        // Named per command — not counted.
        for (const cmd of Object.keys(BEAST_MAIN_COMMANDS)) {
            assert.match(blob, new RegExp(cmd), `refusal does not name the failing command '${cmd}'`);
        }
        for (const field of ['summary', 'errors', 'example']) {
            assert.match(blob, new RegExp(`\\b${field}\\b`), `refusal does not name the missing field '${field}'`);
        }
    });

    test('B2: failures are LISTED, never counted', () => {
        const blob = validateManifest(beastManifest('v2')).errors.join('\n');
        assert.doesNotMatch(blob, /\d+\s+command\(s\)/,
            'the validator is still COUNTING failures; a count cannot be acted on');
    });

    test('B3 POSITIVE CONTROL: a complete v2 entry passes', () => {
        const { valid, errors } = v2({ beast_update_stream: COMPLETE_COMMAND });
        assert.deepEqual(errors, [], 'a complete manifest must not be refused — a gate that refuses everything is a wall');
        assert.equal(valid, true);
    });

    test('B4: the explicit parameterless DECLARATION passes under v2', () => {
        // VISION 2026-08-24 22:53Z, verbatim: "a genuinely parameterless command declares that
        // explicitly (properties:{} + additionalProperties:false + required:[] is the declaration)"
        const { valid, errors } = v2({ beast_get_executive_summary: PARAMETERLESS_COMMAND });
        assert.deepEqual(errors, []);
        assert.equal(valid, true);
    });

    test('B5: properties:{} WITHOUT the declaration is refused as loudly as an absent schema', () => {
        const nearMiss = { ...PARAMETERLESS_COMMAND, inputSchema: { type: 'object', properties: {}, required: [] } };
        const { valid, errors } = v2({ near_miss: nearMiss });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /near_miss/);
        assert.match(errors.join('\n'), /additionalProperties/, 'the refusal must name the declaration it wants');

        const absent = { ...PARAMETERLESS_COMMAND };
        delete absent.inputSchema;
        assert.equal(v2({ near_miss: absent }).valid, false);
    });

    test('B6: a missing `required` array is refused on a command that declares properties', () => {
        const noRequired = { ...COMPLETE_COMMAND, inputSchema: { type: 'object', properties: { a: { type: 'string' } } } };
        const { valid, errors } = v2({ no_required: noRequired });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /no_required.*required/s);
    });

    test('B7: errors[] entries are checked against ERROR_ENTRY_FIELDS — statusCode, not http', () => {
        // §13.2: the platform has ONE structured-error contract {code, statusCode, data}
        // (apiFront.js:244,251,334,340). Publishing the same fact as `http` would be the
        // mirror-drift class this row exists to close.
        assert.deepEqual(ERROR_ENTRY_FIELDS, ['code', 'statusCode', 'when', 'fix']);
        for (const missing of ERROR_ENTRY_FIELDS) {
            const entry = { code: 'X', statusCode: 400, when: 'w', fix: 'f' };
            delete entry[missing];
            const { valid, errors } = v2({ bad_errors: { ...COMPLETE_COMMAND, errors: [entry] } });
            assert.equal(valid, false, `an errors[] entry missing '${missing}' must be refused`);
            assert.match(errors.join('\n'), new RegExp(missing), `the refusal must name the missing key '${missing}'`);
        }
    });

    test('B7b: `http` is refused by name, pointing at statusCode', () => {
        // The old spelling must not pass silently as an unknown extra key.
        const { valid, errors } = v2({
            legacy_error: { ...COMPLETE_COMMAND, errors: [{ code: 'X', http: 400, when: 'w', fix: 'f' }] },
        });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /statusCode/);
    });

    test('B8: an empty errors[] is refused — every command has at least one refusal mode', () => {
        assert.equal(v2({ no_errors: { ...COMPLETE_COMMAND, errors: [] } }).valid, false);
    });

    test('B9 SECURITY: an ABSENT requiredPermissions is refused; it never means "no gate"', () => {
        const noGate = { ...COMPLETE_COMMAND };
        delete noGate.requiredPermissions;
        const { valid, errors } = v2({ ungated: noGate });
        assert.equal(valid, false, 'absence must be refused, never defaulted to open');
        assert.match(errors.join('\n'), /ungated.*requiredPermissions/s);

        // ...and the explicit empty gate is ACCEPTED, so the refusal is about silence, not policy.
        assert.equal(v2({ ungated: { ...noGate, requiredPermissions: [] } }).valid, true);
    });

    test('B10: the published example must satisfy the command\'s OWN inputSchema', () => {
        // One owner of "is this bag valid for this schema": the boundary validator
        // (mcp-tools/paramValidation.js::validateParamsAgainstSchema). A published example the
        // boundary would reject is a documented lie.
        const badExample = { ...COMPLETE_COMMAND, example: { params: { stream_id: 'descix', stauts: 'green' } } };
        const { valid, errors } = v2({ typo_example: badExample });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /stauts/, 'the refusal must name the offending example key');

        const missingRequired = { ...COMPLETE_COMMAND, example: { params: { stream_id: 'descix' } } };
        assert.equal(v2({ short_example: missingRequired }).valid, false);
    });

    test('B11: an example carrying the reserved `_descix` envelope is refused (§13.14)', () => {
        // _descix is injected by the mesh proxy (serviceManifestManager.js:830-851) and is a
        // reserved key at the boundary — it is never a caller-supplied param.
        const leaky = {
            ...COMPLETE_COMMAND,
            example: { params: { stream_id: 'descix', status: 'green', _descix: { user: { id: 'u1' } } } },
        };
        const { valid, errors } = v2({ leaky_example: leaky });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /_descix/);
    });

    test('B12 CONTROL: a v1 manifest still registers unchanged', () => {
        // Cloud's boot self-registration, powch, daita-ssgpod and egpt-godsworld all ride this
        // branch. If this goes RED the tier ruling has become a breaking change.
        const { valid, errors } = validateManifest(beastManifest(undefined));
        assert.deepEqual(errors, [], 'a v1 manifest must keep the lenient path');
        assert.equal(valid, true);
        assert.equal(validateManifest(beastManifest('v1')).valid, true, 'an EXPLICIT v1 token is also accepted');
    });

    test('B13: an unknown tier token is REFUSED — no silent leniency', () => {
        const { valid, errors } = validateManifest(beastManifest('v3'));
        assert.equal(valid, false);
        const blob = errors.join('\n');
        assert.match(blob, /v3/);
        for (const t of CONTRACT_TIERS) assert.match(blob, new RegExp(t), `the refusal must name the accepted tier '${t}'`);
    });

    test('B14: the validated tier is REPORTED, so a door can never validate leniently in silence', () => {
        assert.equal(validateManifest(beastManifest('v2')).contract, 'v2');
        assert.equal(validateManifest(beastManifest(undefined)).contract, 'v1');
    });

    test('B15: the service-level checks it already had still fire, on both tiers', () => {
        assert.match(validateManifest({ commands: {} }).errors.join('\n'), /service\.name/);
        assert.match(validateManifest({ service: { name: 'x' }, commands: {} }).errors.join('\n'), /service\.domain/);
        assert.match(validateManifest({ service: v1Service, commands: {} }).errors.join('\n'), /No commands/);
        assert.match(validateManifest({ service: v2Service, commands: {} }).errors.join('\n'), /No commands/);
    });

    test('B16: a built v2 manifest validates end to end (builder and validator agree)', async () => {
        const dir = makeHandlerDir('round_trip');
        const manifest = await buildManifestFromHandlers({
            ...BASE_BUILD(dir, 'round_trip', { round_trip: COMPLETE_COMMAND }),
            contract: 'v2',
        });
        assert.equal(manifest.service.contract, 'v2', 'the builder must emit the declared tier into the artifact');
        const { valid, errors } = validateManifest(manifest);
        assert.deepEqual(errors, [], 'the builder emitted something its own validator refuses');
        assert.equal(valid, true);
    });
});
