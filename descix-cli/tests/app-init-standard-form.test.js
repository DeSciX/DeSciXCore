/**
 * `app init` stamps the standard app-repo form (proposal 2026-10-09-standard-app-repo-form,
 * landing-order items 3 and 5): the app-lane CLAUDE.md header, .descix/manifests/site.json,
 * .claude-plugin/plugin.json and the front-page template at site/index.html.
 *
 * Every write is ONLY-IF-ABSENT: a file the developer already holds survives a re-run
 * byte-identical. Drives the REAL runAppInit (like app-init-hardening.test.js).
 *
 * Run: `node --test tests/app-init-standard-form.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAppInit } from '../lib/commands/appInit.js';
import { CLI_VERSION } from '../lib/cli-version.js';

const ORIGINAL_CWD = process.cwd();
const FRONTPAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'scaffolds', 'frontpage');

const apiClient = {
  async invoke(command) {
    if (command === 'get_product_context') return { community_id: 'testcomm' };
    if (command === 'list_knowledge_bases') return { knowledge_bases: [{ name: 'General' }] };
    throw new Error(`unexpected platform call: ${command}`);
  },
};

async function repo(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'descix-stdform-')));
  process.chdir(root);
  t.after(async () => { process.chdir(ORIGINAL_CWD); await fs.rm(root, { recursive: true, force: true }); });
  t.mock.method(console, 'log', () => {});
  return root;
}
const read = (root, rel) => fs.readFile(path.join(root, rel), 'utf8');

test('CLAUDE.md opens with the app-lane header, rendered from the workspace and the generating CLI', async (t) => {
  const root = await repo(t);
  await runAppInit(apiClient, { app: 'myapp' });
  const md = await read(root, 'CLAUDE.md');
  assert.ok(md.startsWith('## DeSciX lane\n'), 'header is at the TOP of the file');
  const header = md.slice(0, md.indexOf('\n# ') > 0 ? md.indexOf('\n# ') : 2000);
  assert.match(header, /^LANE: app\b/m);
  assert.match(header, /ENV: https:\/\/\S+ \(origin source: /, 'ENV states the origin the workspace resolved');
  assert.ok(header.includes(`npx -y -p @descix/cli@${CLI_VERSION} descix`), 'invocation pins the generating CLI version');
  assert.match(header, /without `-p @descix\/cli` resolves the wrong package/);
  assert.ok(!/@descix\/app-sdk@\d/.test(header), 'app-sdk is not pinned');
  assert.ok(header.includes('descix tell-me-how'));
  assert.ok(header.includes('https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html'));
  assert.match(header, /^PLATFORM WALL:/m);
  assert.ok(md.includes('<!-- BOOTSTRAP'), 'existing template body stays below the header');
  assert.ok(!md.includes('{{'), 'no unrendered placeholder');
});

test('stamps site manifest, plugin stub and front page with honest literals', async (t) => {
  const root = await repo(t);
  await runAppInit(apiClient, { app: 'myapp' });
  const site = JSON.parse(await read(root, '.descix/manifests/site.json'));
  assert.deepEqual(site.sources, [{ path: 'site' }]);
  assert.equal(site.buildCommand, null);
  assert.match(site._purpose, /myapp/);
  const plugin = JSON.parse(await read(root, '.claude-plugin/plugin.json'));
  assert.equal(plugin.name, 'myapp');
  assert.equal(plugin.version, '0.1.0');
  assert.deepEqual(plugin.author, { name: 'testcomm' });
  assert.match(plugin.description, /myapp/);
  assert.match(plugin.description, /testcomm/);
  const html = await read(root, 'site/index.html');
  assert.ok(html.includes('myapp') && html.includes('testcomm'));
  assert.ok(!html.includes('{{'), 'no unrendered placeholder');
});

test('the front-page template keeps the structural form build-frontpage.js splits, and no Courant Group content', async () => {
  const tpl = await fs.readFile(path.join(FRONTPAGE_DIR, 'index.html'), 'utf8');
  const body = tpl.slice(tpl.indexOf('>', tpl.indexOf('<body')) + 1);
  for (const re of [/<nav class="nav">[\s\S]*?<\/nav>/, /<header class="hero"[\s\S]*?<\/header>/, /<footer>[\s\S]*?<\/footer>/]) {
    assert.ok(re.test(body), `template lacks ${re}`);
  }
  const sections = [...body.matchAll(/<section class="sec[^"]*" id="([^"]+)">[\s\S]*?<\/section>/g)];
  assert.ok(sections.length >= 1 && sections.length <= 2, 'one or two skeleton sections');
  assert.equal((body.match(/<\/section>/g) || []).length, sections.length, 'sections split cleanly');
  for (const banned of [/courant/i, /maxi/i, /frqtl/i, /GAPI/, /ulam/i, /neumann/i, /egpt/i, /images\//]) {
    assert.ok(!banned.test(tpl), `template must not carry ${banned}`);
  }
});

// Only-if-absent: each scaffold write has an existing-file-survives proof.
for (const rel of ['CLAUDE.md', '.descix/manifests/site.json', '.claude-plugin/plugin.json', 'site/index.html']) {
  test(`only-if-absent: an existing ${rel} survives an app init re-run byte-identical`, async (t) => {
    const root = await repo(t);
    const mine = `mine, different content for ${rel}\n`;
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await fs.writeFile(path.join(root, rel), mine);
    await runAppInit(apiClient, { app: 'myapp' });
    assert.equal(await read(root, rel), mine);
    await runAppInit(apiClient, { app: 'myapp' });
    assert.equal(await read(root, rel), mine, 'and survives the second run too');
  });
}
