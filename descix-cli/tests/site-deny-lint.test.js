/**
 * A site upload refuses to publish backend source, an agent's persona, credentials or workspace
 * state — and still publishes a real site untouched.
 *
 * THE INCIDENT (measured 2026-09-18): egpt-godsworld's DEV site was publicly serving
 * `assets/system_instructions.md` and its whole `microservice/` tree, left by an earlier upload
 * with a broad manifest. The list below is those files, verbatim in shape.
 *
 * Run: node --test tests/site-deny-lint.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSiteFiles, assertSitePublishable, SITE_DENY_PATH_PATTERNS } from '../lib/core/SiteDenyLint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = fs.readFileSync(path.resolve(__dirname, '..', 'bin', 'descix.js'), 'utf8');

const EXPOSED_2026_09_18 = [
    'assets/system_instructions.md',
    'microservice/app.js',
    'microservice/app.yaml',
    'microservice/Dockerfile',
    'microservice/package-lock.json',
    'microservice/services/flightService.js',
    'microservice/scripts/seed.mjs',
    'microservice/dev-overrides.example.json',
];

test('THE INCIDENT: every file DEV was serving on 2026-09-18 is refused', () => {
    const v = lintSiteFiles(EXPOSED_2026_09_18);
    assert.deepEqual(v.map((x) => x.path).sort(), [...EXPOSED_2026_09_18].sort(),
        'each one must be caught, not most of them');
});

test('credentials are refused wherever they sit, whatever their case', () => {
    for (const p of ['.descix/wallet.json', 'wallet.json', 'config/.env', '.env.production',
                     'dev-overrides.json', 'Secret.Example.JSON', 'certs/server.key', 'tls/cert.pem',
                     'gcp/service-account-prod.json', 'credentials.json', '.ssh/id_rsa']) {
        assert.equal(lintSiteFiles([p]).length, 1, p);
    }
});

test('agent and VCS internals are refused', () => {
    for (const p of ['.claude/settings.json', 'sub/.claude/x.md', '.git/config']) {
        assert.equal(lintSiteFiles([p]).length, 1, p);
    }
});

// ── NEGATIVE CONTROLS: real sites must still publish ────────────────────────────────────────

test('NEGATIVE CONTROL: the files godsworld actually publishes pass', () => {
    const godsworld = ['index.html', 'frqtl-3d-poc.html', 'shell-harness.html', 'DeSciXAppSDK.js'];
    assert.deepEqual(lintSiteFiles(godsworld), []);
});

test('NEGATIVE CONTROL: look-alike names that are not private pass', () => {
    // Each of these shares a substring with a deny glob, and must not be caught by it.
    for (const p of ['assets/key-art.png', 'monkey.png', 'environment.js', 'keys.html',
                     'docs/secrets-management.md', 'assets/app_description.md', 'microservices.html',
                     'wallet-guide.html', 'vendor/three.module.js', 'flight-encoder.mjs', 'tests/index.html']) {
        assert.deepEqual(lintSiteFiles([p]), [], p);
    }
});

test('NEGATIVE CONTROL: the real platform shell build (88 files) passes untouched', () => {
    const dist = path.resolve(__dirname, '..', '..', '..', 'DeSciX_Cloud', 'site', 'dist');
    if (!fs.existsSync(dist)) return; // a clean checkout has no build; the synthetic controls above still run
    const files = [];
    (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full); else files.push(path.relative(dist, full).split(path.sep).join('/'));
        }
    })(dist);
    assert.ok(files.length > 20, `expected a real build, found ${files.length} files`);
    assert.deepEqual(lintSiteFiles(files), [], 'the shell must publish exactly as before');
});

// ── The refusal ─────────────────────────────────────────────────────────────────────────────

test('the refusal names every offending file, its class, and the repair', () => {
    assert.throws(() => assertSitePublishable(['index.html', 'microservice/app.js', 'assets/system_instructions.md']),
        (err) => err.code === 'SITE_DENY_PATH'
            && /2 file\(s\) must never be publicly served/.test(err.message)
            && /microservice\/app\.js\s+\[app-source\]/.test(err.message)
            && /assets\/system_instructions\.md\s+\[agent-persona\]/.test(err.message)
            && /Nothing was uploaded/.test(err.message)
            && /\.descix\/manifests\/site\.json/.test(err.message));
});

test('a clean list does not throw', () => {
    assert.doesNotThrow(() => assertSitePublishable(['index.html', 'assets/app.js']));
});

test('the upload lints BEFORE requesting a deploy token, so a dry run refuses too', () => {
    const lint = CLI.indexOf('assertSitePublishable(fileList.map((f) => f.path));');
    const token = CLI.indexOf("apiClient.invoke('get_site_deploy_token'");
    const dryRun = CLI.indexOf('if (options.dryRun) {', token);
    assert.ok(lint > 0, 'the upload must call the lint');
    assert.ok(lint < token && token < dryRun, 'lint → token → dry-run, in that order');
});

test('there is no exemption flag — the repair is always to not name the file', () => {
    assert.ok(SITE_DENY_PATH_PATTERNS.every((p) => !('exempt' in p)));
    assert.doesNotMatch(CLI, /--allow-private|--skip-deny|SITE_DENY_EXEMPT/);
});
