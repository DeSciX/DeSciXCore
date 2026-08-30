/**
 * A5 — ws-devplane-cli-kb-surface-single-canonical-sync.
 *
 * PROPERTY: the CLI exposes exactly ONE kb sync surface, `descix kb corpus sync`. Every other
 * registered or dead sync path is DELETED and its name exits non-zero naming the replacement.
 *
 * Modelled on tests/removed-methods-anti-regression.test.js: a grep meta-test over lib/ + bin/
 * (excluding tests/). It must go RED when ONE superseded registration is restored — that is the
 * mutation control, and a gate that cannot fail is not a gate.
 *
 * WHY THE ASSERTIONS KEY ON `.command('x')` AND NOT ON BARE NAMES:
 * the canonical verb is ITSELF named `sync` (`kb corpus sync`). A bare-name grep for "sync" -> 0
 * could only pass by deleting the canonical verb — a gate that passes by destroying the thing it
 * protects. So every assertion keys on the REGISTRATION SITE (parent + `.command('child')`),
 * never on the child name in prose. Comments are deliberately NOT stripped before matching: a
 * grep that skips comment-looking lines has let a live defect through before.
 *
 * The retired set and the deleted-symbol set are imported from lib/commands/retired-kb-sync.js —
 * the ONE owner both the registration and this gate read, so they cannot drift apart.
 *
 * Run: `node --test tests/kb-sync-single-surface.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RETIRED_KB_SYNC_SURFACES,
  DELETED_KB_SYNC_SYMBOLS,
  CANONICAL_KB_SYNC,
} from '../lib/commands/retired-kb-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(CLI_ROOT, 'bin', 'descix.js');

const SRC = fs.readFileSync(ENTRY, 'utf-8');

/** Every .js file under bin/ and lib/, excluding tests/. */
function sourceFiles() {
  const out = [];
  for (const root of ['bin', 'lib']) {
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === 'node_modules' || e.name === 'tests') continue;
          walk(p);
        } else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) {
          out.push(p);
        }
      }
    };
    walk(path.join(CLI_ROOT, root));
  }
  return out;
}

const FILES = sourceFiles().map((f) => ({ path: f, text: fs.readFileSync(f, 'utf-8') }));

// The fixture must actually be able to see the code it judges.
test('FIXTURE: the sources under test are non-empty and include the entrypoint', () => {
  assert.ok(FILES.length > 5, `expected many source files, saw ${FILES.length}`);
  assert.ok(SRC.length > 10000, 'bin/descix.js must be read in full');
  assert.ok(
    FILES.some((f) => f.path.endsWith(path.join('bin', 'descix.js'))),
    'bin/descix.js must be among the scanned files'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// I1 — exactly ONE kb sync verb is registered.
// ─────────────────────────────────────────────────────────────────────────────

test('I1: `.command(\'sync\')` is registered EXACTLY ONCE, and it is `kb corpus sync`', () => {
  const hits = [...SRC.matchAll(/\.command\('sync'\)/g)];
  assert.equal(
    hits.length,
    1,
    `expected exactly 1 \`.command('sync')\` (the canonical corpus sync), found ${hits.length}. ` +
      'A second one means a superseded sync registration was restored.'
  );
  // ...and the one that survives hangs off corpusCommand.
  assert.match(
    SRC,
    /corpusCommand\s*\n\s*\.command\('sync'\)/,
    'the surviving `sync` registration must be `corpusCommand.command(\'sync\')`'
  );
});

test('I1: the canonical surface is still wired to runCorpusSync', () => {
  assert.match(SRC, /corpusCommands\.runCorpusSync/, 'kb corpus sync must call runCorpusSync');
  assert.match(SRC, /kbCommand\s*\n\s*\.command\('corpus'\)/, '`kb corpus` must be registered');
});

// ─────────────────────────────────────────────────────────────────────────────
// I2 — no superseded registration survives. THIS IS THE MUTATION CONTROL.
// ─────────────────────────────────────────────────────────────────────────────

test('I2: `kb chunk` is not registered', () => {
  assert.ok(
    !/kbCommand\s*\n\s*\.command\('chunk'\)/.test(SRC),
    'a `kbCommand.command(\'chunk\')` registration was restored — `kb chunk` is REMOVED'
  );
});

test('I2: `kb sync` is not registered as a working verb', () => {
  assert.ok(
    !/kbCommand\s*\n\s*\.command\('sync'\)/.test(SRC),
    'a `kbCommand.command(\'sync\')` registration was restored — `kb sync` is REMOVED'
  );
});

test('I2: the `sync` command GROUP is gone (no syncCommand, no `sync kb`)', () => {
  assert.ok(
    !/const syncCommand = program/.test(SRC),
    'the `sync` group was restored — it had no surviving children and is REMOVED'
  );
  assert.ok(
    !/syncCommand\s*\n\s*\.command\('kb'\)/.test(SRC),
    'a `syncCommand.command(\'kb\')` registration was restored — `sync kb` is REMOVED'
  );
});

test('I2: `update kb` refuses instead of dispatching to a sync implementation', () => {
  assert.ok(
    !/case 'kb':\s*\n\s*(return )?await updateCommands\.updateKB/.test(SRC),
    'the `update kb` dispatcher branch was restored'
  );
  assert.match(
    SRC,
    /refuseRetiredKbSync\('descix update kb'/,
    '`update kb` must fail loud naming the canonical surface, via the one owner'
  );
});

test('I2: every retired invocation is registered ONLY through the one owner helper', () => {
  for (const s of RETIRED_KB_SYNC_SURFACES) {
    if (s.parent === 'update') continue; // dispatcher branch, asserted above
    const re = new RegExp(`registerRetiredKbSync\\([^)]*'${s.name}',\\s*'${s.invocation.replace(/ /g, ' ')}'`);
    assert.match(
      SRC,
      re,
      `${s.invocation} must be registered via registerRetiredKbSync so it exits non-zero naming ${CANONICAL_KB_SYNC}`
    );
  }
});

test('I2: updateAuto\'s kb branch refuses through the ONE owner, not a private copy', () => {
  const upd = fs.readFileSync(path.join(CLI_ROOT, 'lib', 'commands', 'update.js'), 'utf-8');
  // Auto-detect resolves to 'kb' whenever the user stands in the app's kb/ directory, so this
  // branch is REACHED in normal use — it is the likeliest surviving way to try a KB sync.
  assert.match(
    upd,
    /case 'kb':[\s\S]{0,600}?refuseRetiredKbSync\('descix update kb'/,
    "updateAuto's kb branch must refuse via refuseRetiredKbSync"
  );
  assert.ok(
    !/case 'kb':[\s\S]{0,400}?updateKB\(/.test(upd),
    'updateAuto must not dispatch to a kb sync implementation'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// I3 — dead implementations deleted; no exported symbol survives without a caller.
// ─────────────────────────────────────────────────────────────────────────────

test('I3: every deleted kb-sync symbol is absent from lib/ and bin/', () => {
  for (const sym of DELETED_KB_SYNC_SYMBOLS) {
    // Key on the CALL/DEFINITION form, not the bare name: I3's property is that no symbol
    // survives WITHOUT A CALLER. Prose that records what was deleted is not a survival.
    // Comments are still scanned — a real call inside a commented-out block would be caught.
    const callOrDef = new RegExp(`(function\\s+${sym}\\b|\\b${sym}\\s*\\(|\\.${sym}\\b|\\b${sym}\\s*,)`);
    const offenders = FILES
      .filter((f) => !f.path.endsWith('retired-kb-sync.js'))
      .filter((f) => callOrDef.test(f.text))
      .map((f) => path.relative(CLI_ROOT, f.path));
    assert.deepEqual(
      offenders,
      [],
      `${sym} is DELETED but is still defined/called/exported in: ${offenders.join(', ')}`
    );
  }
});

test('I3: runKbPull/runKbPush SURVIVE — `descix drive pull|push` still call them', () => {
  const kb = fs.readFileSync(path.join(CLI_ROOT, 'lib', 'commands', 'kb.js'), 'utf-8');
  assert.match(kb, /export async function runKbPull/, 'runKbPull must survive');
  assert.match(kb, /export async function runKbPush/, 'runKbPush must survive');
  assert.match(SRC, /kbCommands\.runKbPull/, '`drive pull` must still call runKbPull');
  assert.match(SRC, /kbCommands\.runKbPush/, '`drive push` must still call runKbPush');
});

// ─────────────────────────────────────────────────────────────────────────────
// I4 — `kb create` is KEPT and is what the corpus refusal names.
// ─────────────────────────────────────────────────────────────────────────────

test('I4: `kb create` is still registered', () => {
  assert.match(
    SRC,
    /kbCommand\s*\n\s*\.command\('create'\)/,
    '`kb create` is the corpus dependency and must be KEPT'
  );
});

test('I4: the unregistered-KB refusal names `descix kb create` and NOT `app init`', () => {
  const corpus = fs.readFileSync(path.join(CLI_ROOT, 'lib', 'commands', 'corpus.js'), 'utf-8');
  assert.match(corpus, /descix kb create/, 'the refusal must name `descix kb create`');
  // Scope to the unregistered-KB refusal itself. corpus.js has a SEPARATE refusal about
  // community/product resolution that legitimately mentions app registration; I4 is about
  // the missing-KB path only, and widening this assertion would make the gate fire on
  // correct code — as broken as one that cannot fire.
  const kbRefusal = corpus.slice(
    corpus.indexOf('KnowledgeBase document(s) missing in Firestore'),
    corpus.indexOf('// 4. Process each manifest')
  );
  assert.ok(kbRefusal.length > 50, 'fixture: the KB refusal block must be located');
  assert.match(kbRefusal, /descix kb create/, 'the KB refusal must name `descix kb create`');
  assert.ok(
    !/app init/.test(kbRefusal),
    'the KB refusal must not name `app init` — that repairs an uninitialized APP, not a missing KB'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FLAG-6 — the stale blocker comments are swept.
// ─────────────────────────────────────────────────────────────────────────────

test('FLAG-6: no source still cites the retired sync-kb-sources.sh as a reason not to delete', () => {
  const offenders = FILES.filter((f) => /sync-kb-sources/.test(f.text)).map((f) =>
    path.relative(CLI_ROOT, f.path)
  );
  assert.deepEqual(
    offenders,
    [],
    `sync-kb-sources.sh was retired 2026-07-22 and does not exist; still cited in: ${offenders.join(', ')}`
  );
});
