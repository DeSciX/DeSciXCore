/**
 * Two small defects that told a developer something false (measured 2026-09-18, daita-docs,
 * an app registered at ../daita):
 *  - `app init` printed "Create a corpus manifest at apps/daita-docs/.descix/manifests/..." — a
 *    path that exists for no app registered anywhere but apps/.
 *  - `site upload` stamped the deploy with the git commit of the CALLER'S cwd (the Unkamon repo),
 *    not of the repository the files came from (DeSciX/daita).
 *
 * Run: node --test tests/cli-hint-and-provenance.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = fs.readFileSync(path.resolve(__dirname, '..', 'bin', 'descix.js'), 'utf8');
// `app init` lives in its one owner, shared with quickstart.
const APP_INIT = fs.readFileSync(path.resolve(__dirname, '..', 'lib', 'commands', 'appInit.js'), 'utf8');

test('the app init hint names the app\'s REGISTERED directory, not a guessed apps/<id>/', () => {
    assert.doesNotMatch(APP_INIT, /Create a corpus manifest at apps\/\$\{appId\}/);
    assert.match(APP_INIT, /const manifestPath = path\.join\(appPath, '\.descix', 'manifests', `\$\{kbId\}\.json`\);/);
});

test('site upload reads provenance from where the FILES come from, never the caller\'s cwd', () => {
    const upload = CLI.slice(CLI.indexOf("const siteManifest = await loadSiteManifest(appRoot);"),
                             CLI.indexOf("let fileList;"));
    assert.doesNotMatch(upload, /new GitUtils\(process\.cwd\(\)\)/);
    assert.match(upload, /const provenanceDir = siteManifest \? appRoot : path\.resolve\(options\.path\);/);
    assert.match(upload, /new GitUtils\(provenanceDir\)/);
});

test('app init refuses an unusable -p BEFORE creating anything server-side', () => {
    // Refusing only at local registration came after `-c` had created the app, leaving a platform
    // app with no local registration (measured 2026-09-18, daita-docs with an absolute -p).
    const init = APP_INIT.slice(APP_INIT.indexOf('export async function runAppInit'), APP_INIT.indexOf('App created:'));
    const check = init.indexOf('resolveWorkspacePath(workspaceConfig?.workspaceRoot || process.cwd(), options.path, appId);');
    const create = init.indexOf("apiClient.invoke('create_app_for_community'");
    assert.ok(check > 0, 'app init must validate -p with the loader\'s own resolver');
    assert.ok(create > 0 && check < create, 'and do it before the server-side create');
});
