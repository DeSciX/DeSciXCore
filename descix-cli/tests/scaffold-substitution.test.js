/**
 * GATE: a scaffold reaches a developer carrying THEIR identity, not a placeholder and not ours.
 *
 * TWO DEFECTS, ONE MECHANISM. templates/scaffolds/README.md documented the placeholder contract
 * ({{APP_NAME}}, {{APP_ID}}, {{COMMUNITY_ID}}, "replaced during copy") but nothing performed the
 * replacement, so the site scaffold shipped a page titled `{{APP_NAME}}`; and the microservice
 * sample handler carried `community_id: 'descix'`, a community that will not exist after the PROD
 * rebuild. Both are "put real values into shipped scaffolds", so both live in copyScaffold rather
 * than in two per-command injection blocks.
 *
 * SUBSTITUTION, NOT A SECOND LITERAL. The assertions below check that the CALLER's ids appear and
 * that no hardcoded community survives — a fix that swapped 'descix' for 'daita' would fail the
 * caller-id assertions, so this gate cannot be satisfied by picking a new favourite literal.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyScaffold } from '../lib/core/Hydrator.js';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const APP = 'egpt-frqtl';
const COMMUNITY = 'egpt';

async function walk(dir, base = '') {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p, rel)));
    else out.push({ rel, path: p });
  }
  return out;
}

async function materialize(type, opts) {
  const appDir = await mkdtemp(join(tmpdir(), 'descix-scaffold-'));
  await copyScaffold(type, appDir, opts);
  return walk(join(appDir, type));
}

async function textOf(files) {
  const out = {};
  for (const f of files) out[f.rel] = await readFile(f.path, 'utf8');
  return out;
}

for (const type of ['site', 'microservice']) {
  test(`RED CONTROL: ${type} scaffold WITHOUT substitution still ships raw placeholders`, async () => {
    // This is the pre-fix behaviour, kept in-tree deliberately. If it ever stops holding, the
    // GREEN test below has stopped discriminating and would pass for the wrong reason.
    const text = await textOf(await materialize(type, {}));
    const raw = Object.entries(text).filter(([, v]) => /\{\{[A-Z_]+\}\}/.test(v));
    assert.ok(
      raw.length > 0,
      `${type} scaffold has no placeholders at all — this gate is no longer measuring anything`
    );
  });

  test(`GREEN: ${type} scaffold resolves every placeholder to the caller's identity`, async () => {
    const text = await textOf(
      await materialize(type, { substitute: { appId: APP, communityId: COMMUNITY } })
    );

    for (const [rel, body] of Object.entries(text)) {
      const left = body.match(/\{\{[A-Z_]+\}\}/g);
      assert.equal(left, null, `${type}/${rel} still carries ${left && left.join(', ')}`);
    }

    const all = Object.values(text).join('\n');
    assert.ok(all.includes(APP), `${type} scaffold never mentions the caller's app id`);
  });
}

test('GREEN: the microservice scaffold carries the caller community, not a hardcoded one', async () => {
  const text = await textOf(
    await materialize('microservice', { substitute: { appId: APP, communityId: COMMUNITY } })
  );

  const manifest = JSON.parse(text['manifest.json']);
  assert.equal(manifest.service.community_id, COMMUNITY);
  assert.equal(manifest.service.app_id, APP);

  const defaults = JSON.parse(text['defaults-config.json']);
  assert.equal(defaults.community_id, COMMUNITY);
  assert.equal(defaults.app_id, APP);

  // The sample RAG call is the site item 9 named. It must query the developer's own community.
  const sample = text['services/commandHandlers/sampleCommands.js'];
  assert.ok(
    sample.includes(`community_id: '${COMMUNITY}'`),
    'sampleCommands must query the caller community'
  );

  // No hardcoded community may survive ANYWHERE in what the developer receives.
  for (const [rel, body] of Object.entries(text)) {
    assert.ok(!/['"]descix['"]/.test(body), `${rel} still hardcodes a 'descix' community`);
  }
});

test('FAIL LOUD: a partial identity is refused rather than half-substituted', async () => {
  // A scaffold resolved against half an identity is harder to spot than one resolved against
  // none, so this must throw rather than fill in what it has.
  const appDir = await mkdtemp(join(tmpdir(), 'descix-scaffold-partial-'));
  await assert.rejects(
    () => copyScaffold('site', appDir, { substitute: { appId: APP } }),
    /requires both appId and communityId/,
    'copyScaffold accepted a substitute missing communityId'
  );
});

test('CALL SITES: both init commands pass a substitution context', async () => {
  // The behavioural tests prove copyScaffold substitutes; they cannot prove the commands ASK it
  // to. `bin/descix.js` is a 5k-line commander file that does not import cleanly, so this leg is
  // a source assertion by necessity — and it is the leg that would silently regress.
  const src = await readFile(join(PKG_ROOT, 'bin', 'descix.js'), 'utf8');
  const calls = src.match(/copyScaffold\(\s*'(site|microservice)'[\s\S]{0,400}?\)\s*;/g) || [];
  assert.equal(calls.length, 2, 'expected exactly two copyScaffold call sites in bin/descix.js');
  for (const c of calls) {
    assert.ok(
      /substitute\s*:/.test(c),
      'a copyScaffold call site does not pass `substitute`, so its scaffold ships unresolved:\n' + c
    );
  }
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : the BYTES a developer actually receives, by materializing
                     each scaffold into a temp dir with and without a
                     substitution context and reading every file back.
  DEFECT CLASS     : a shipped scaffold carrying an unresolved {{TOKEN}} or a
                     hardcoded community/app that is not the caller's.
  WHAT IT DOES NOT READ:
    - the post-copy port/credential injection in bin/descix.js. Those are
      workspace-derived RUNTIME values with no scaffold token; only identity
      is covered here.
    - whether the resolved ids are CORRECT for the workspace. It proves the
      caller's values arrive, never that the caller passed the right ones.
    - the app-sdk package's own copySiteScaffold() entry point, which is a
      separate caller of the same directory and is NOT exercised here.
    - any published tarball. This runs against the working tree.
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
