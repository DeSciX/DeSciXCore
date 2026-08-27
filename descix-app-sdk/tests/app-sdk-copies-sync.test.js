/**
 * Conformance: `DeSciXAppSDK.js` is GENERATED, and a hand-edit fails loud.
 *
 * The file exists at three paths across three repos. It used to be hand-maintained at
 * all three, so it drifted silently: when `.chat` / `.view` / `ready()` landed, only
 * the CLI scaffold got them, and the other two sat byte-identical to each other and
 * stale against the one that mattered. Nobody found out until an app used the API.
 *
 * Copies stay in sync because a gate fails, not because someone remembers. That gate
 * is `scripts/generate-app-sdk-copies.js --check`, and this test is what runs it.
 *
 * Run: `node --test tests/app-sdk-copies-sync.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_SCAFFOLD_BRIDGE } from '../scaffold/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const GENERATOR = path.join(SDK_ROOT, 'scripts', 'generate-app-sdk-copies.js');
// The path comes from its OWNER, never re-spelled here: a test that hand-derives the
// location it is guarding stops guarding the moment the directory moves.
const SCAFFOLD = SITE_SCAFFOLD_BRIDGE;

/**
 * Sibling repos are pinned OUT by default (they resolve to a path that does not exist, which
 * the generator reports as SKIP). A test about THIS package's generated copy must not go red
 * because someone else's checkout of DeSciX_Powch drifted — a fixture whose result depends on
 * unrelated repositories is not measuring what the test claims, in either direction: it can
 * fail on a correct tree, and it can only ever pass by accident on a partial checkout. Pass
 * explicit roots to opt a sibling back in.
 */
const NO_SIBLINGS = path.join(os.tmpdir(), 'descix-no-such-repo-fixture');

function runCheck(extraArgs = [`--powch-root=${NO_SIBLINGS}`, `--apps-root=${NO_SIBLINGS}`]) {
  try {
    return { code: 0, out: execFileSync('node', [GENERATOR, '--check', ...extraArgs], { encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('every generated copy this checkout can see is in sync with its source', () => {
  const { code, out } = runCheck();
  assert.equal(code, 0,
    `generated copies have drifted from their source. Run:\n` +
    `  node descix-app-sdk/scripts/generate-app-sdk-copies.js\n\n${out}`);
  assert.match(out, /OK\s+@descix\/app-sdk/,
    'the site scaffold is owned by THIS package, so it must always be checked — never skipped');
});

test('a hand-edited copy FAILS the check, naming the file and the fix', () => {
  // The whole point of the gate: prove it actually catches an edit rather than
  // reporting a comforting "in sync" for a file nobody verified.
  const original = fs.readFileSync(SCAFFOLD, 'utf8');
  try {
    fs.writeFileSync(SCAFFOLD, `${original}\n// a well-meaning hand-edit\n`);
    const { code, out } = runCheck();
    assert.equal(code, 1, 'a drifted copy must fail, not warn');
    assert.match(out, /DRIFT/);
    assert.match(out, /do not hand-edit/i);
    assert.match(out, /generate-app-sdk-copies\.js/, 'the failure must name the way to fix it');
  } finally {
    fs.writeFileSync(SCAFFOLD, original);
  }
  assert.equal(runCheck().code, 0, 'the fixture must leave the tree clean');
});

test('an absent sibling repo is SKIPPED, not a false failure', () => {
  // Partial checkouts are normal: DeSciX_Core is cloned without Powch or Unkamon all
  // the time. A missing copy is unknowable, not drift — reporting it as failure would
  // train people to ignore the gate.
  const nowhere = path.join(os.tmpdir(), 'descix-no-such-repo-fixture');
  const { code, out } = runCheck([`--powch-root=${nowhere}`, `--apps-root=${nowhere}`]);
  assert.equal(code, 0);
  assert.match(out, /SKIP\s+DeSciX_Powch/);
  assert.match(out, /repo not present/);
});

test('the generated scaffold carries the resolver, not a reimplementation of it', () => {
  const scaffold = fs.readFileSync(SCAFFOLD, 'utf8');
  const resolver = fs.readFileSync(path.join(SDK_ROOT, 'src', 'util', 'bridgeResolver.js'), 'utf8');

  assert.match(scaffold, /function resolveBridge\(/,
    'the scaffold must contain the resolver inline — it is a plain browser script and cannot import');
  assert.doesNotMatch(scaffold, /^\s*export\s/m,
    '`export` is module-only syntax and would be a SyntaxError in a <script src> load');

  // A line unique to the resolver's body must appear in both — the inline is a copy of
  // THE owner, so a change there cannot fail to reach the scaffold.
  const marker = 'const bus = w && w.DeSciX;';
  assert.ok(resolver.includes(marker), 'resolver fixture line moved — update this test');
  assert.ok(scaffold.includes(marker), 'the scaffold is not carrying the current resolver');
});

test('no consumer-facing window.parent.DeSciX / window.top.DeSciX survives in the scaffold', () => {
  // The CEO's ruling: an app author should never need to know `window` from
  // `window.top`. Any surviving reach is either a bug or a teaching that recreates
  // the confusion this workstream removed.
  const scaffold = fs.readFileSync(SCAFFOLD, 'utf8');
  const reaches = scaffold
    .split('\n')
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => /window\.(top|parent)\s*\.\s*DeSciX/.test(line));

  assert.deepEqual(reaches, [],
    `the app-side SDK must resolve its own level:\n${reaches.map(([n, l]) => `  ${n}: ${l.trim()}`).join('\n')}`);
});
