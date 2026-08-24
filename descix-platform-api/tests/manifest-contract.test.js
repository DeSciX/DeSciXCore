/**
 * manifest-contract.test.js — the command contract is ONE owner, and register-time is where
 * an incomplete one dies.
 *
 * Two halves, both RED against origin/main:
 *
 *   A. buildManifestFromHandlers' metaOverlay pass-through. On origin/main the overlay reads
 *      exactly four keys (description, inputSchema, mcp, mutating) and DROPS everything else a
 *      handler declares — including `requiredPermissions`, which is the permission floor the
 *      registered manifest carries and which apiFront enforces from the REGISTERED manifest
 *      (DeSciX_Cloud/microservice/services/apiFront.js:298-311, the call-time gate, and :400-408,
 *      the tools/list mirror). A build that drops the floor therefore publishes a manifest that
 *      opens a gated command to every caller.
 *
 *   B. validateManifest, made STRICT. On origin/main it checks four things and COUNTS missing
 *      descriptions instead of naming them, so a manifest with no inputSchema, no `required`,
 *      no errors[] and no example registers silently.
 *
 * The pass-through and the validator are both driven off ONE exported table,
 * COMMAND_CONTRACT_FIELDS, so "which fields does a command entry carry" is not derived twice.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

// NAMESPACE import, deliberately (design §4): a NAMED import of a missing export is a link
// error that kills the whole file, so the negative control would report one opaque failure
// instead of naming which half of the contract is absent.
import * as manifestOwner from '../src/manifest/index.js';

const { buildManifestFromHandlers, validateManifest } = manifestOwner;
const COMMAND_CONTRACT_FIELDS = manifestOwner.COMMAND_CONTRACT_FIELDS ?? {};
const ERROR_ENTRY_FIELDS = manifestOwner.ERROR_ENTRY_FIELDS ?? [];

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * A throwaway handler dir with one handler file, so buildManifestFromHandlers has something
 * real to read. The JSDoc is deliberately minimal — this suite is about the OVERLAY, which is
 * authoritative over JSDoc.
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
 * VERBATIM from BEAST/microservice/manifest.json at origin/main (f894224), three of the 33
 * commands, byte-for-byte. This is the negative-control fixture: a manifest that registers
 * silently today and must be REFUSED after.
 *
 * Chosen to discriminate three distinct defects:
 *   - beast_list_qa_files       properties:{} with NO `required` at all
 *   - beast_roles_seed          properties:{} WITH required:[] but no additionalProperties:false
 *                               (the near-miss: it is not the parameterless DECLARATION)
 *   - beast_update_stream       a real parameterised command, complete on params, missing
 *                               summary/errors/example
 */
const BEAST_MAIN_FIXTURE = {
    service: {
        name: 'beast',
        version: '3.9.0',
        description: 'BEAST - Business Execution And Status Tracker',
        domain: 'unk-beast.dev.descix.net',
        healthEndpoint: '/health',
        debugPort: 3011,
        community_id: 'unk',
        app_id: 'unk',
    },
    commands: {
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
    },
};

/** A command entry that satisfies the whole contract. The positive control. */
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
        { code: 'STREAM_NOT_FOUND', http: 404, when: 'No stream carries stream_id.', fix: 'Call beast_get_board for the live stream ids.' },
    ],
    example: { params: { stream_id: 'descix', status: 'green' } },
    guestAllowed: false,
    requiredPermissions: ['PLATFORM_MANAGE_COMMUNITIES'],
};

/** The explicit parameterless DECLARATION (VISION, 2026-08-24 22:53Z). */
const PARAMETERLESS_COMMAND = {
    description: 'Read the cached executive summary. No AI call — reads cached data only.',
    summary: 'Read the cached executive summary.',
    inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    errors: [
        { code: 'SUMMARY_ABSENT', http: 404, when: 'No summary has been generated yet.', fix: 'Call beast_render_report first.' },
    ],
    example: { params: {} },
    guestAllowed: false,
};

const validService = { name: 'demo', domain: 'demo.descix.net' };

// ─── A. Overlay pass-through ─────────────────────────────────────────────────

describe('A. buildManifestFromHandlers — the overlay carries the WHOLE declared contract', () => {

    test('A1 NEGATIVE CONTROL: the permission floor survives the build', async () => {
        // apiFront enforces requiredPermissions from the REGISTERED manifest
        // (apiFront.js:298-311). A build that drops it publishes an ungated command.
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

    test('A2: every overlay-owned field in the contract table is carried through', async () => {
        const dir = makeHandlerDir('full_command');
        const overlay = {
            description: 'A fully declared command.',
            summary: 'A fully declared command.',
            inputSchema: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
            errors: [{ code: 'X_FAILED', http: 400, when: 'a is blank.', fix: 'Pass a non-empty a.' }],
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

        // Driven off the EXPORTED table, so adding a field to the contract without teaching
        // the builder to carry it is a CI failure, not a silent drop.
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
        // guestAllowed has ONE owner: the guestCommands set the service passes in. An overlay
        // key of the same name must not become a second derivation of the same fact.
        assert.equal(entry.guestAllowed, true, 'guestAllowed must come from guestCommands, not the overlay');
        assert.equal(COMMAND_CONTRACT_FIELDS.guestAllowed.overlay, false);
    });

    test('A5: `handler` is NOT part of the command contract', () => {
        // Measured 2026-08-24: the only site that ever touched it is
        // DeSciX_Cloud/microservice/services/serviceManifestManager.js::buildExternalCommandEntry,
        // which copies it into a registry entry that nothing reads. Zero readers => not a contract
        // field. Deleted, not fenced.
        assert.ok(!('handler' in COMMAND_CONTRACT_FIELDS), '`handler` has no reader; it must not be in the contract');
    });
});

// ─── B. The strict validator ─────────────────────────────────────────────────

describe('B. validateManifest is STRICT, and it LISTS', () => {

    test('B1 NEGATIVE CONTROL: the BEAST origin/main manifest is REFUSED', () => {
        const { valid, errors } = validateManifest(BEAST_MAIN_FIXTURE);
        assert.equal(valid, false, 'the pre-fix BEAST manifest must not validate');

        const blob = errors.join('\n');
        // Named per command — not counted.
        for (const cmd of Object.keys(BEAST_MAIN_FIXTURE.commands)) {
            assert.match(blob, new RegExp(cmd), `refusal does not name the failing command '${cmd}'`);
        }
        // The three missing contract fields are each named.
        for (const field of ['summary', 'errors', 'example']) {
            assert.match(blob, new RegExp(`\\b${field}\\b`), `refusal does not name the missing field '${field}'`);
        }
    });

    test('B2: failures are LISTED, never counted', () => {
        const { errors } = validateManifest(BEAST_MAIN_FIXTURE);
        const blob = errors.join('\n');
        assert.doesNotMatch(
            blob,
            /\d+\s+command\(s\)/,
            'the validator is still COUNTING failures; a count cannot be acted on'
        );
    });

    test('B3 POSITIVE CONTROL: a complete entry passes', () => {
        const { valid, errors } = validateManifest({
            service: validService,
            commands: { beast_update_stream: COMPLETE_COMMAND },
        });
        assert.deepEqual(errors, [], 'a complete manifest must not be refused — a gate that refuses everything is a wall');
        assert.equal(valid, true);
    });

    test('B4: the explicit parameterless DECLARATION passes', () => {
        // VISION 2026-08-24 22:53Z, verbatim: "a genuinely parameterless command declares that
        // explicitly (properties:{} + additionalProperties:false + required:[] is the declaration)"
        const { valid, errors } = validateManifest({
            service: validService,
            commands: { beast_get_executive_summary: PARAMETERLESS_COMMAND },
        });
        assert.deepEqual(errors, []);
        assert.equal(valid, true);
    });

    test('B5: properties:{} WITHOUT the declaration is refused as loudly as an absent schema', () => {
        // The near-miss: required:[] present, additionalProperties:false absent.
        const nearMiss = {
            ...PARAMETERLESS_COMMAND,
            inputSchema: { type: 'object', properties: {}, required: [] },
        };
        const { valid, errors } = validateManifest({
            service: validService,
            commands: { near_miss: nearMiss },
        });
        assert.equal(valid, false);
        const blob = errors.join('\n');
        assert.match(blob, /near_miss/);
        assert.match(blob, /additionalProperties/, 'the refusal must name the declaration it wants');

        // And the same loudness as an ABSENT inputSchema.
        const absent = { ...PARAMETERLESS_COMMAND };
        delete absent.inputSchema;
        const absentResult = validateManifest({
            service: validService,
            commands: { near_miss: absent },
        });
        assert.equal(absentResult.valid, false);
    });

    test('B6: a missing `required` array is refused on a command that declares properties', () => {
        const noRequired = {
            ...COMPLETE_COMMAND,
            inputSchema: { type: 'object', properties: { a: { type: 'string' } } },
        };
        const { valid, errors } = validateManifest({
            service: validService,
            commands: { no_required: noRequired },
        });
        assert.equal(valid, false);
        assert.match(errors.join('\n'), /no_required.*required/s);
    });

    test('B7: errors[] entries are structurally checked against ERROR_ENTRY_FIELDS', () => {
        assert.deepEqual(ERROR_ENTRY_FIELDS, ['code', 'http', 'when', 'fix']);
        for (const missing of ERROR_ENTRY_FIELDS) {
            const entry = { code: 'X', http: 400, when: 'w', fix: 'f' };
            delete entry[missing];
            const { valid, errors } = validateManifest({
                service: validService,
                commands: { bad_errors: { ...COMPLETE_COMMAND, errors: [entry] } },
            });
            assert.equal(valid, false, `an errors[] entry missing '${missing}' must be refused`);
            assert.match(errors.join('\n'), new RegExp(missing), `the refusal must name the missing key '${missing}'`);
        }
    });

    test('B8: an empty errors[] is refused — every command has at least one refusal mode', () => {
        const { valid } = validateManifest({
            service: validService,
            commands: { no_errors: { ...COMPLETE_COMMAND, errors: [] } },
        });
        assert.equal(valid, false);
    });

    test('B9: the service-level checks it already had still fire', () => {
        assert.match(validateManifest({ commands: {} }).errors.join('\n'), /service\.name/);
        assert.match(
            validateManifest({ service: { name: 'x' }, commands: {} }).errors.join('\n'),
            /service\.domain/
        );
        assert.match(
            validateManifest({ service: validService, commands: {} }).errors.join('\n'),
            /No commands/
        );
    });

    test('B10: a built manifest validates end to end (builder and validator agree)', async () => {
        const dir = makeHandlerDir('round_trip');
        const manifest = await buildManifestFromHandlers(
            BASE_BUILD(dir, 'round_trip', { round_trip: COMPLETE_COMMAND })
        );
        const { valid, errors } = validateManifest(manifest);
        assert.deepEqual(errors, [], 'the builder emitted something its own validator refuses');
        assert.equal(valid, true);
    });
});
