/**
 * service.runtime — the app's declared runtime needs, owned by the manifest module.
 *
 *   "service": { ..., "runtime": { "profile": "media", "system_packages": ["ffmpeg"] } }
 *
 * SERVICE_RUNTIME_PROFILES and SERVICE_SYSTEM_PACKAGES are the ONE vocabulary: validateManifest
 * refuses anything outside it, and the Cloud deploy lane consumes resolveServiceRuntime() rather
 * than keeping a list of its own.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as manifestMod from '../src/manifest/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const m = (runtime) => ({
    service: { name: 'x', version: '1.0.0', ...(runtime === undefined ? {} : { runtime }) },
    commands: { a: { description: 'a' } },
});

test('the vocabulary is exported: a default and a media profile, ffmpeg as a system package', () => {
    const P = manifestMod.SERVICE_RUNTIME_PROFILES;
    assert.ok(P?.default && P?.media, 'profiles default + media');
    for (const k of ['memory', 'cpu', 'timeout', 'maxOldSpaceMb']) assert.ok(P.default[k] && P.media[k], k);
    assert.deepEqual([...manifestMod.SERVICE_SYSTEM_PACKAGES], ['ffmpeg']);
});

test('resolveServiceRuntime: no declaration -> default profile, no packages', () => {
    const r = manifestMod.resolveServiceRuntime(m(undefined));
    assert.equal(r.profileName, 'default');
    assert.equal(r.profile, manifestMod.SERVICE_RUNTIME_PROFILES.default);
    assert.deepEqual(r.systemPackages, []);
});

test('resolveServiceRuntime: a declaration resolves to its profile and packages', () => {
    const r = manifestMod.resolveServiceRuntime(m({ profile: 'media', system_packages: ['ffmpeg'] }));
    assert.equal(r.profile, manifestMod.SERVICE_RUNTIME_PROFILES.media);
    assert.deepEqual(r.systemPackages, ['ffmpeg']);
});

for (const [label, runtime, name] of [
    ['unknown profile', { profile: 'turbo' }, 'turbo'],
    ['unknown system package', { system_packages: ['imagemagick'] }, 'imagemagick'],
    ['unknown runtime key', { profil: 'media' }, 'profil'],
    ['non-object runtime', 'media', 'runtime'],
    ['non-array system_packages', { system_packages: 'ffmpeg' }, 'system_packages'],
]) {
    test(`validateManifest refuses an ${label}, by name`, () => {
        const v = manifestMod.validateManifest(m(runtime));
        assert.equal(v.valid, false);
        assert.ok(v.errors.some((e) => e.includes(name)), `errors must name '${name}': ${JSON.stringify(v.errors)}`);
    });
    test(`resolveServiceRuntime throws on an ${label}, by name`, () => {
        assert.throws(() => manifestMod.resolveServiceRuntime(m(runtime)), (err) => err.message.includes(name));
    });
}

test('validateManifest accepts a valid runtime and no runtime', () => {
    assert.deepEqual(manifestMod.validateManifest(m({ profile: 'media', system_packages: ['ffmpeg'] })).errors, []);
    assert.deepEqual(manifestMod.validateManifest(m(undefined)).errors, []);
});

test('the microservice scaffold manifest declares a runtime the validator accepts', () => {
    const scaffold = path.join(here, '..', '..', 'descix-cli', 'templates', 'scaffolds', 'microservice', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(scaffold, 'utf8'));
    assert.ok(manifest.service?.runtime, 'scaffold must show service.runtime so developers can find it');
    assert.doesNotThrow(() => manifestMod.resolveServiceRuntime(manifest));
});
