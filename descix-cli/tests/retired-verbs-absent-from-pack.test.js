/**
 * GATE: no RETIRED verb survives as a SUGGESTION in what this package actually ships.
 *
 * WHY THE PACKED FILE LIST AND NOT A REPO GREP. A repo-only fix that never ships is not a fix.
 * The shipped set is `package.json.files`, which is not the same as the working tree — this gate
 * asks npm itself (`npm pack --dry-run --json`) which files go in the tarball, and reads only
 * those. That also makes it notice if `files` starts shipping something new.
 *
 * THE DISCRIMINATION IS SUGGESTION vs REFUSAL, not mere presence. A retired verb SHOULD appear in
 * the CLI's bytes: retired-kb-sync.js enumerates them, and each refusal call site passes one in by
 * name so the user is told what they typed is gone. Those are the mechanism. What must never
 * appear is a retired verb offered as a NEXT STEP or a REMEDY — a success-path instruction that
 * manufactures a failure for a developer who did everything right. So the rule is: a retired
 * invocation may appear only inside the owner module, or on a line that calls the refusal helper.
 *
 * DRIVEN OFF THE OWNER'S OWN LIST. The invocations are read from RETIRED_KB_SYNC_SURFACES rather
 * than typed here, so retiring a new verb extends this gate automatically and a hand-kept mirror
 * cannot drift out of agreement with the registrations.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RETIRED_KB_SYNC_SURFACES } from '../lib/commands/retired-kb-sync.js';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The files npm will actually put in the tarball. */
function packedFiles() {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  // Parse by SHAPE, from the first '[', never by line offset: npm may prefix non-JSON notices.
  const json = JSON.parse(out.slice(out.indexOf('[')));
  return json[0].files.map((f) => f.path);
}

const OWNER = 'lib/commands/retired-kb-sync.js';
const INVOCATIONS = RETIRED_KB_SYNC_SURFACES.map((s) => s.invocation)
  // longest first so `descix sync kb` is attributed before `descix sync`
  .sort((a, b) => b.length - a.length);

/** Lines that legitimately name a retired verb: the owner module, and refusal call sites. */
function isMechanism(relPath, line) {
  if (relPath === OWNER) return true;
  return line.includes('refuseRetiredKbSync') || line.includes('registerRetiredKbSync');
}

function scan(predicate) {
  const hits = [];
  for (const rel of packedFiles()) {
    const abs = join(PKG_ROOT, rel);
    if (!existsSync(abs)) continue;
    if (!predicate(rel)) continue;
    let text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch {
      continue; // binary or unreadable — not a text surface
    }
    text.split('\n').forEach((line, i) => {
      for (const inv of INVOCATIONS) {
        if (line.includes(inv) && !isMechanism(rel, line)) {
          hits.push(`${rel}:${i + 1}: ${line.trim()}`);
          break;
        }
      }
    });
  }
  return hits;
}

const isExecutable = (rel) => rel.startsWith('bin/') || rel.startsWith('lib/');
const isDocSurface = (rel) => rel.startsWith('templates/') || rel.startsWith('agent-assets/');

test('the packed file list is non-empty and includes the executable surface', () => {
  const files = packedFiles();
  assert.ok(files.length > 0, 'npm pack reported no files');
  assert.ok(files.some((f) => f === 'bin/descix.js'), 'bin/descix.js must ship');
  assert.ok(files.some((f) => f.startsWith('lib/')), 'lib/ must ship');
});

test('EXECUTABLE SURFACE: no retired verb offered as a next step or remedy', () => {
  const hits = scan(isExecutable);
  assert.deepEqual(
    hits,
    [],
    'A retired verb is being SUGGESTED by the CLI\'s own output. Every one of these hands a ' +
      'developer a command that exits non-zero:\n  ' + hits.join('\n  ')
  );
});

test('the gate can see a retired verb at all (fixture check)', () => {
  // A gate whose predicate never fires proves nothing. Confirm the scanner DOES find the
  // mechanism sites when the mechanism exemption is removed — otherwise a green above could
  // simply mean the scan matched nothing anywhere.
  const withoutExemption = [];
  for (const rel of packedFiles()) {
    if (rel !== OWNER) continue;
    const text = readFileSync(join(PKG_ROOT, rel), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (INVOCATIONS.some((inv) => line.includes(inv))) withoutExemption.push(`${rel}:${i + 1}`);
    });
  }
  assert.ok(
    withoutExemption.length > 0,
    'the scanner found no retired invocation even in the owner module — the predicate is broken'
  );
});

test('DOC SURFACE: report-only, pending a ruling on P2 scope', () => {
  // templates/ and agent-assets/ SHIP (they are in package.json.files), so a retired verb here
  // still reaches a developer. Whether P2's "the CLI's own output" covers them is a scope
  // question for the contracting party, so this leg REPORTS and does not assert.
  const hits = scan(isDocSurface);
  console.log(`
  ── SHIPPED DOC SURFACE: ${hits.length} retired-verb mention(s) ─────────────────
${hits.length ? hits.map((h) => '   ' + h).join('\n') : '   (none)'}
  Report-only by design: these files ship, but whether they fall under P2 is the
  contracting party's call, not this gate's.
  ───────────────────────────────────────────────────────────────────────────`);
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : every text file npm will put in the tarball, against the
                     retired invocations read from RETIRED_KB_SYNC_SURFACES.
  DEFECT CLASS     : a removed command surviving as a SUGGESTION (next step /
                     remedy / example) in a shipped file.
  DISCRIMINATION   : suggestion vs refusal. The owner module and any line
                     calling refuseRetiredKbSync/registerRetiredKbSync are
                     exempt, because naming a dead verb in order to refuse it
                     is the mechanism, not the defect.
  WHAT IT DOES NOT READ:
    - RUNTIME behaviour. It proves a string is absent, never that a command
      works. It would not catch a next step that is merely WRONG while naming
      a live verb.
    - any verb retired outside RETIRED_KB_SYNC_SURFACES (e.g. 'descix kb pull',
      which moved to 'descix drive pull', is not in that list).
    - the published tarball on the registry — only what THIS tree would pack.
    - other packages. @descix/app-sdk and @descix/sdk ship separately.
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
