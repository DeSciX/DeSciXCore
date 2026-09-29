/**
 * EVERY RETIRED CLI VERB REFUSES THROUGH ONE PATH.
 *
 * Three retirement mechanisms grew side by side: retired-kb-sync.js (a list plus its own
 * register/refuse helpers), an inline hidden `config set-url` in bin/descix.js, and a
 * `register-delegate` refusal in microservice-auth-model.js. Each re-derived the same facts:
 * hide the name, swallow its old arguments, exit non-zero, name the replacement. They had
 * already drifted: `config set-url --help` exited 0, because only one of the three disabled
 * commander's help interception.
 *
 * lib/commands/retired-verbs.js is now the one owner: a table (RETIRED_VERBS) and one refusal.
 * This gate checks that no retired verb is registered anywhere else, and that every entry, typed
 * bare or with --help, exits non-zero printing exactly the owner's refusal text.
 *
 * Run: node --test tests/retired-verbs-one-path.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(PKG_ROOT, 'bin', 'descix.js');
const OWNER_REL = 'lib/commands/retired-verbs.js';
const OWNER = path.join(PKG_ROOT, OWNER_REL);

async function loadOwner() {
  assert.ok(fs.existsSync(OWNER), `${OWNER_REL} must exist: it is the one owner of retired verbs`);
  return import(OWNER);
}

function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return jsFiles(p);
    return /\.(js|mjs)$/.test(d.name) ? [p] : [];
  });
}

test('no retired verb is registered outside the owner', () => {
  const offenders = [];
  for (const file of [...jsFiles(path.join(PKG_ROOT, 'bin')), ...jsFiles(path.join(PKG_ROOT, 'lib'))]) {
    const rel = path.relative(PKG_ROOT, file);
    if (rel === OWNER_REL) continue;
    const src = fs.readFileSync(file, 'utf8');
    // A retired verb is a command registered hidden; the CLI hides nothing else.
    for (const m of src.matchAll(/\.command\([^)]*hidden\s*:\s*true/g)) {
      offenders.push(`${rel}: ${m[0]}`);
    }
  }
  assert.deepEqual(offenders, [], `hidden (retired) registrations outside ${OWNER_REL}:\n${offenders.join('\n')}`);

  const bin = fs.readFileSync(CLI, 'utf8');
  assert.equal([...bin.matchAll(/registerAllRetiredVerbs\s*\(/g)].length, 1,
    'bin/descix.js registers the whole table with exactly one registerAllRetiredVerbs call');
});

test('the table holds every retirement the three old mechanisms owned', async () => {
  const { RETIRED_VERBS } = await loadOwner();
  const invocations = RETIRED_VERBS.map((v) => v.invocation);
  for (const inv of ['descix sync', 'descix sync kb', 'descix kb chunk', 'descix kb sync',
    'descix config set-url', 'descix microservice register-delegate']) {
    assert.ok(invocations.includes(inv), `missing retirement: ${inv}`);
  }
});

test('every retired verb, bare or with --help, exits non-zero printing exactly its refusal', async () => {
  const { RETIRED_VERBS, retiredVerbRefusal } = await loadOwner();
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'retired-verbs-')));
  try {
    for (const verb of RETIRED_VERBS) {
      const words = verb.invocation.split(' ').slice(1); // drop the leading `descix`
      for (const args of [words, [...words, '--help']]) {
        let code = 0;
        let out = '';
        try {
          out = execFileSync(process.execPath, [CLI, ...args], {
            cwd: dir, env: { ...process.env, HOME: dir, NO_COLOR: '1', FORCE_COLOR: '0' },
            encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
          });
        } catch (e) {
          code = e.status ?? 1;
          out = `${e.stdout || ''}${e.stderr || ''}`;
        }
        const typed = `descix ${args.join(' ')}`;
        assert.notEqual(code, 0, `${typed}: a retired verb must not exit 0`);
        assert.ok(out.includes(retiredVerbRefusal(verb)), `${typed}: must print its owner refusal; got:\n${out.slice(0, 400)}`);
      }
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
