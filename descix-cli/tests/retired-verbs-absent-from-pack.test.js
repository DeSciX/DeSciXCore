/**
 * GATE: no RETIRED verb survives as a SUGGESTION in what this package actually ships.
 *
 * WHY THE PACK MANIFEST IS THE ONE OWNER OF "WHAT SHIPS". A repo-only fix that never ships is not
 * a fix — but neither is a gate that guesses at the shipped set. There are exactly two ways to
 * guess, and BOTH have been measured wrong on this package:
 *
 *   - a hand-listed set of path prefixes. This gate used to scan only `templates/` and
 *     `agent-assets/` for shipped instructions, so README.md — the npm page every new developer
 *     reads first — was never looked at, and retired commands survived on it.
 *   - `package.json.files`. Also wrong, and wrong on the exact file that broke: `files` here is
 *     [bin, lib, templates, agent-assets, vendor] and does NOT list README.md or LICENSE.md, yet
 *     npm ships both unconditionally. A `files`-derived scan reads clean on a broken README.
 *
 * So the shipped set is asked of npm itself (`npm pack --dry-run --json`) and NOTHING narrows it.
 * Every file in that manifest is scanned. New files inherit coverage automatically because the
 * scope is derived, never maintained — add a directory tomorrow and it is already in scope.
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

/** The files npm will actually put in the tarball. THE one authority on what ships. */
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

/**
 * ROUTING, NOT SCOPE. These two predicates decide only WHICH failure message a hit gets — the
 * CLI's own runtime code suggesting a dead verb reads differently from a shipped document
 * instructing someone to type one. They must never decide WHETHER a file is read.
 *
 * That is why `isDocSurface` is the COMPLEMENT of `isExecutable` and not a list of its own. A
 * complement cannot narrow: whatever `isExecutable` does not claim, the doc surface takes, so
 * every packed file lands in exactly one bucket no matter what npm adds later. Turning it back
 * into a positive prefix list re-creates the original bug and is caught by the SCOPE test below.
 */
const RUNTIME_PREFIXES = ['bin/', 'lib/', 'vendor/'];
const isExecutable = (rel) => RUNTIME_PREFIXES.some((p) => rel.startsWith(p));
const isDocSurface = (rel) => !isExecutable(rel);

/** A file npm ships that is not text — scanning it for strings is meaningless, so it is counted. */
function isBinary(abs) {
  return readFileSync(abs).subarray(0, 8192).includes(0);
}

/**
 * Scan every packed file the predicate routes here. Returns the hits AND what it could not read,
 * so a green can state its own boundary instead of quietly skipping files.
 */
function scan(predicate) {
  const hits = [];
  const skippedBinary = [];
  const skippedMissing = [];
  let scanned = 0;
  for (const rel of packedFiles()) {
    if (!predicate(rel)) continue;
    const abs = join(PKG_ROOT, rel);
    if (!existsSync(abs)) {
      skippedMissing.push(rel); // npm says it ships but it is not on disk — report, never swallow
      continue;
    }
    if (isBinary(abs)) {
      skippedBinary.push(rel);
      continue;
    }
    scanned += 1;
    readFileSync(abs, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const inv of INVOCATIONS) {
          if (line.includes(inv) && !isMechanism(rel, line)) {
            hits.push(`${rel}:${i + 1}: ${line.trim()}`);
            break;
          }
        }
      });
  }
  return { hits, scanned, skippedBinary, skippedMissing };
}

/** Lines that legitimately name a retired verb: the owner module, and refusal call sites. */
function isMechanism(relPath, line) {
  if (relPath === OWNER) return true;
  return line.includes('refuseRetiredKbSync') || line.includes('registerRetiredKbSync');
}

test('the packed file list is non-empty and includes the executable surface', () => {
  const files = packedFiles();
  assert.ok(files.length > 0, 'npm pack reported no files');
  assert.ok(files.some((f) => f === 'bin/descix.js'), 'bin/descix.js must ship');
  assert.ok(files.some((f) => f.startsWith('lib/')), 'lib/ must ship');
});

test('EXECUTABLE SURFACE: no retired verb offered as a next step or remedy', () => {
  const { hits } = scan(isExecutable);
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

test('SHIPPED DOC SURFACE: no retired verb delivered as instruction', () => {
  // The test is whether this package DELIVERS a dead verb as instruction to a reader who will ACT
  // on it. That is every shipped file that is not the CLI's own runtime code: README.md (the npm
  // front page), LICENSE.md, package.json, the `templates/` a developer's app is scaffolded from,
  // and the `agent-assets/` that tell an AGENT what to run — worse than a README telling a human,
  // because the agent acts without hesitating.
  const { hits } = scan(isDocSurface);
  assert.deepEqual(
    hits,
    [],
    'A retired verb ships as instruction to someone who will act on it:\n  ' + hits.join('\n  ')
  );
});

test('SCOPE: the shipped surface is the pack manifest, and nothing narrows it', () => {
  // THE ANTI-REGRESSION FOR THIS GATE'S OWN HISTORY. The bug being guarded against is not a bad
  // README — it is a predicate that silently removes files from scope. Each assertion below FAILS
  // if the doc surface is ever rewritten as a positive prefix list again.
  const files = packedFiles();

  // 1. FIXTURE, ASSERTED BY CONTENT. npm ships these three despite package.json `files` listing
  //    none of them. If that ever stops being true the premise of this gate has changed and this
  //    test must fail loudly rather than pass on an assumption.
  const alwaysShipped = ['README.md', 'LICENSE.md', 'package.json'];
  for (const f of alwaysShipped) {
    assert.ok(
      files.includes(f),
      `${f} is expected in the pack manifest (npm ships it regardless of package.json "files"), ` +
        'but npm did not report it. The shipped-surface premise has changed — re-measure.'
    );
    assert.ok(
      isDocSurface(f),
      `${f} SHIPS but is not routed to any scan. This is the exact defect this gate exists to ` +
        'prevent: a hand-listed surface predicate that cannot see the package front page.'
    );
  }

  // 2. FUTURE FILES INHERIT COVERAGE. A path under a directory that does not exist today must
  //    still be in scope, or the predicate has become a maintained list again.
  assert.ok(
    isDocSurface('a/directory/added/tomorrow/GUIDE.md'),
    'the doc surface must admit files under directories that do not exist yet — it is defined as ' +
      'the complement of the runtime surface precisely so that it can never narrow'
  );

  // 3. Every packed file is routed somewhere, and none is claimed twice.
  const uncovered = files.filter((f) => !isExecutable(f) && !isDocSurface(f));
  const doubled = files.filter((f) => isExecutable(f) && isDocSurface(f));
  assert.deepEqual(uncovered, [], `packed files no test reads:\n  ${uncovered.join('\n  ')}`);
  assert.deepEqual(doubled, [], `packed files claimed by both surfaces:\n  ${doubled.join('\n  ')}`);
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  const all = packedFiles();
  const exe = scan(isExecutable);
  const doc = scan(isDocSurface);
  const skipped = [...exe.skippedBinary, ...doc.skippedBinary];
  const missing = [...exe.skippedMissing, ...doc.skippedMissing];
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : every text file npm will put in the tarball, against the
                     retired invocations read from RETIRED_KB_SYNC_SURFACES.
  SHIPPED SET      : ${all.length} files, from \`npm pack --dry-run --json\`.
                     NOT from package.json "files" (which omits README.md and
                     LICENSE.md that npm ships anyway) and NOT from any
                     hand-listed path prefix. Nothing narrows the manifest.
  READ THIS RUN    : ${exe.scanned} runtime file(s) [${RUNTIME_PREFIXES.join(' ')}]
                     + ${doc.scanned} shipped-document file(s) = ${exe.scanned + doc.scanned} of ${all.length}.
  NOT READ THIS RUN: ${skipped.length} binary file(s)${skipped.length ? ': ' + skipped.join(', ') : ''}
                     ${missing.length} manifest file(s) absent from disk${missing.length ? ': ' + missing.join(', ') : ''}
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
    - repo files npm does NOT pack (docs/, tests/, this file itself). The pack
      manifest is the scope boundary. README.md, LICENSE.md and package.json
      ARE packed, so they ARE read.
    - the published tarball on the registry — only what THIS tree would pack.
    - other packages. @descix/app-sdk and @descix/sdk ship separately.
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
