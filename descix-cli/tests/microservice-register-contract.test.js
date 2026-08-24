/**
 * `descix microservice register` — the THIRD door validates through the ONE Core validator.
 *
 * WHAT WAS TRUE BEFORE (measured 2026-08-24, origin/main): bin/descix.js hand-rolled its own
 * "Validate required fields" block — a `manifest.service.name` check, then app_id/community_id.
 * That is a second derivation of "what must a manifest carry", and it drifted from the platform's
 * answer in both directions: the CLI demanded app_id/community_id that the Core validator never
 * checks, and the Core validator's checks (service.domain, non-empty commands, per-command
 * completeness) were never applied at the CLI at all. So a manifest could pass `descix microservice
 * register`'s own gate and still be structurally broken — and, until this row, nothing downstream
 * looked either.
 *
 * THE FIX: the CLI calls `validateManifest` from @descix/platform-api/manifest — the same function,
 * with the same call shape, that the register_service door calls. Strictness travels with the
 * MANIFEST via `service.contract` (design §13.3), so both doors necessarily agree.
 *
 * This suite drives the VALIDATOR as the CLI now invokes it, and asserts at the source plane that
 * the hand-rolled block is gone. It deliberately does not spawn the CLI binary: `register` performs
 * auth and a network call immediately after this gate, so an end-to-end run would prove the gate
 * only by breaking on something else.
 *
 * Run: `node --test tests/microservice-register-contract.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { validateManifest } from '@descix/platform-api/manifest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_BIN = path.resolve(__dirname, '../bin/descix.js');

const service = (contract) => ({
    name: 'demo',
    version: '1.0.0',
    description: 'demo service',
    domain: 'demo.dev.descix.net',
    healthEndpoint: '/health',
    app_id: 'demo',
    community_id: 'demo',
    ...(contract ? { contract } : {}),
});

const COMPLETE = {
    description: 'Do the thing the service exists to do.',
    summary: 'Do the thing.',
    inputSchema: {
        type: 'object',
        properties: { target: { type: 'string', description: 'What to act on.' } },
        required: ['target'],
        additionalProperties: false,
    },
    errors: [{ code: 'TARGET_NOT_FOUND', statusCode: 404, when: 'No such target.', fix: 'List targets first.' }],
    example: { params: { target: 'alpha' } },
    requiredPermissions: [],
};

test('the CLI routes through the Core validator, and its hand-rolled block is gone', async () => {
    const src = await fs.readFile(CLI_BIN, 'utf-8');

    // The one gate.
    assert.match(src, /const \{ validateManifest \} = await import\('@descix\/platform-api\/manifest'\)/,
        'the CLI must import the Core validator');
    assert.match(src, /const contractCheck = validateManifest\(manifest\)/,
        'the CLI must call the Core validator with the same one-argument call shape as the door');

    // The second derivation it replaces. `service.name` is the Core validator's job now; the CLI
    // must not re-assert it. (app_id/community_id DO stay — they are the CLI's own context
    // requirement, not part of the published command contract.)
    assert.doesNotMatch(src, /throw new Error\('manifest\.service\.name is required'\)/,
        'the hand-rolled service.name check must be deleted, not left beside the validator');
});

test('a v2 manifest with a complete command passes', () => {
    const { valid, errors, contract } = validateManifest({
        service: service('v2'),
        commands: { do_the_thing: COMPLETE },
    });
    assert.deepEqual(errors, []);
    assert.equal(valid, true);
    assert.equal(contract, 'v2');
});

test('a v2 manifest missing errors[] is refused, naming the command and the field', () => {
    const broken = { ...COMPLETE };
    delete broken.errors;
    const { valid, errors } = validateManifest({ service: service('v2'), commands: { do_the_thing: broken } });
    assert.equal(valid, false);
    const blob = errors.join('\n');
    assert.match(blob, /do_the_thing/);
    assert.match(blob, /errors/);
});

test('SECURITY: a v2 manifest missing requiredPermissions is refused at the CLI too', () => {
    const ungated = { ...COMPLETE };
    delete ungated.requiredPermissions;
    const { valid, errors } = validateManifest({ service: service('v2'), commands: { do_the_thing: ungated } });
    assert.equal(valid, false, 'absence must never mean "no gate", at any door');
    assert.match(errors.join('\n'), /requiredPermissions/);
});

test('the CLI now catches what its own block never looked at: a missing service.domain', () => {
    const svc = service('v1');
    delete svc.domain;
    delete svc.debugPort;
    const { valid, errors } = validateManifest({ service: svc, commands: { do_the_thing: COMPLETE } });
    assert.equal(valid, false, 'the old hand-rolled block only checked service.name');
    assert.match(errors.join('\n'), /service\.domain/);
});

test('an unknown contract token is refused at the CLI, not silently accepted', () => {
    const { valid, errors } = validateManifest({ service: service('v9'), commands: { do_the_thing: COMPLETE } });
    assert.equal(valid, false);
    assert.match(errors.join('\n'), /v9/);
});

test('CONTROL: a v1 manifest still registers from the CLI', () => {
    // The migration population — powch, daita-ssgpod, egpt-godsworld — must keep working.
    const legacy = { description: 'A pre-contract command.', inputSchema: { type: 'object', properties: {} } };
    const { valid, errors, contract } = validateManifest({ service: service(), commands: { legacy_command: legacy } });
    assert.deepEqual(errors, []);
    assert.equal(valid, true);
    assert.equal(contract, 'v1');
});
