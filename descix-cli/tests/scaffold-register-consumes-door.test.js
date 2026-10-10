#!/usr/bin/env node
/**
 * ws-c4-platform P1-R (3) — the SCAFFOLD is the ROOT.
 *
 * `descix-cli/templates/scaffolds/microservice/scripts/register.js` is the file every new
 * microservice inherits. It used to open a Firestore client and `set()` the manifest verbatim into
 * `ServiceManifests`, bypassing `register_service` — the ONLY door that derives a service's domain.
 * The stored `service.domain` was then undefined and the router composed the literal string
 * `https://undefined/api` without throwing. Fixing the two services generated from this template
 * without fixing the template leaves the generator minting more of them.
 *
 * This pins the GENERATOR, not an instance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD = path.resolve(__dirname, '../templates/scaffolds/microservice');
const registerSrc = fs.readFileSync(path.join(SCAFFOLD, 'scripts/register.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(SCAFFOLD, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(SCAFFOLD, 'manifest.json'), 'utf8'));

describe('scaffold microservice — scripts/register.js consumes the registration door', () => {
    it('does NOT open a datastore client of its own', () => {
        assert.doesNotMatch(registerSrc, /@google-cloud\/firestore/, 'scaffold must not import the Firestore SDK');
        assert.doesNotMatch(registerSrc, /new Firestore\(/, 'scaffold must not construct a Firestore client');
        assert.doesNotMatch(registerSrc, /collection\(['"]ServiceManifests['"]\)/, 'scaffold must not write ServiceManifests directly');
    });

    it('registers through @descix/platform-api/service-bootstrap (the one owner)', () => {
        assert.match(registerSrc, /from '@descix\/platform-api\/service-bootstrap'/);
        assert.match(registerSrc, /createServiceBootstrap\(/);
    });

    it('the scaffold package.json declares platform-api and no longer declares the Firestore SDK', () => {
        assert.ok(pkg.dependencies['@descix/platform-api'], 'platform-api must be a declared dependency');
        assert.equal(
            pkg.dependencies['@google-cloud/firestore'],
            undefined,
            'the direct-write register script was its only consumer'
        );
    });

    it('the scaffold manifest declares NO service.domain — the platform derives it', () => {
        assert.equal(manifest.service.domain, undefined);
    });

    it('passes meshSelfUrl derived from utils.PORT (the config owner), with no port literal', () => {
        // register() self-tests the RUNNING service; the origin must come from the same config
        // the listener binds (app.js uses utils.PORT), never a literal.
        assert.match(registerSrc, /meshSelfUrl:\s*`http:\/\/127\.0\.0\.1:\$\{utils\.PORT\}`/);
        assert.doesNotMatch(registerSrc, /127\.0\.0\.1:\d+/, 'no literal port');
        assert.doesNotMatch(registerSrc, /localhost:\d+/, 'no literal port');
    });

    it('the failure path prints the remedy: start the service, then re-run register', () => {
        assert.match(registerSrc, /start the service \(npm run dev\), then re-run npm run register/);
    });

    it('NEGATIVE CONTROL: this suite detects a reintroduced direct write', () => {
        // The same assertions, run against the shape they are meant to catch. Without this, a
        // regex that silently stopped matching anything would still report green.
        const reintroduced = "import { Firestore } from '@google-cloud/firestore';\nnew Firestore().collection('ServiceManifests').doc(x).set(m);";
        assert.match(reintroduced, /@google-cloud\/firestore/);
        assert.match(reintroduced, /new Firestore\(/);
        assert.match(reintroduced, /collection\(['"]ServiceManifests['"]\)/);
        assert.doesNotMatch(reintroduced, /createServiceBootstrap\(/);
    });
});
