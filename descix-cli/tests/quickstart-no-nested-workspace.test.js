/**
 * `descix quickstart` (the TOP-LEVEL command) must never create a NESTED workspace.
 *
 * "Where is the workspace root" had THREE derivations: WorkspaceConfig.findWorkspaceRoot (the
 * owner, walks UP), the wizard guard (target-path only — fixed alongside this), and this command's
 * own fs.access (target-path only). Run from a SUBDIRECTORY of an existing workspace the third
 * check saw nothing, runInit created a workspace.json whose workspaceRoot pointed at the
 * SUBDIRECTORY, and it SHADOWED the parent for every later resolution — silently, with
 * "Quickstart complete!" and exit 0.
 *
 * BEHAVIOUR: this command SKIPS AND REPORTS (exit 0), it does not refuse. quickstart is onboarding;
 * a user who asked to be set up and already is set up has succeeded. `descix mcp quickstart`
 * refuses NON-ZERO on the same fact because it was asked specifically to CREATE a workspace and
 * cannot honour that. Different verbs, different contracts, one owner for the fact.
 *
 * COVERAGE BOUNDARY — printed on GREEN as well as RED:
 *   WHAT THIS COMPARES: the REAL CLI BINARY, bin/descix.js, spawned as a child process with cwd
 *     set to a subdirectory of a disposable workspace fixture. This is a STRONGER plane than the
 *     other two suites in this repo, which drive exported functions one frame below the command
 *     layer: this command's auth step is satisfiable with a synthetic disposable wallet, whereas
 *     `mcp quickstart` calls requireAuth first and cannot be driven without credentials.
 *   WHAT IT CATCHES: any creation of .descix/workspace.json in a directory that already sits
 *     inside a workspace; modification of the parent workspace; a silent success that leaves a
 *     shadowing file behind.
 *   WHAT IT DOES NOT READ: whether the remaining quickstart steps (agent files, mcp.json, SDK
 *     assets) target the right directory in the nested case. They run in cwd exactly as before
 *     this change; re-pointing them is a separate behaviour decision and is NOT made here.
 *   FIXTURE VALIDITY: C2 is a POSITIVE CONTROL. It proves the stdin script actually drives
 *     runInit to a successful WRITE, so that C1's absence of a file is attributable to the guard
 *     and not to a fixture that could never have produced one. Without C2, C1 passes on a broken
 *     fixture — which is exactly how this gate was nearly built.
 *   AND THE COUPLING IS ENFORCED IN CODE, NOT DESCRIBED IN THIS COMMENT: C1 REFUSES TO REPORT
 *     PASS while C2 is red. It was described here first and that was not enough — on 2026-09-15
 *     C2 went red and C1 kept reporting GREEN, vacuously, because nothing could create a
 *     workspace through this harness any more. A comment does not reach the reader of a green;
 *     the only surface a citer of C1 reliably touches is C1.
 *   NO NETWORK, NO CREDENTIAL: the wallet is shape-only and disposable; no platform call is made
 *     and no account state is touched.
 *   RUN BY: `npm test` in descix-cli (node --test "tests/*.test.js"). Nothing else runs it.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_JS = path.resolve(__dirname, '../bin/descix.js');
const HARNESS_TIMEOUT_MS = 90000;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// A REGISTERED PRODUCT IS PART OF THE FIXTURE, not decoration: the later quickstart steps read
// the workspace to learn the app and community they must state, and refuse on a workspace that
// names neither. A products:[] parent would make this suite fail for a reason unrelated to
// nesting — a fixture that cannot reach the behaviour under test does not measure it.
const PARENT_WS = (root) => JSON.stringify({
  version: '2.1', workspaceRoot: root, type: 'workspace',
  env: {
    environment: 'DEV',
    gateway: { port: 5173 },
    products: [{ appId: 'parentapp', localPath: '.', kbId: 'General', communityId: 'testcomm' }]
  }
}, null, 2);

// Shape-only, disposable. Not a credential: no real address, no real signature, never leaves
// this directory, and no network call is made with it.
const FIXTURE_WALLET = JSON.stringify({
  walletAddress: '0x' + 'a'.repeat(40),
  signature: 'fixture-not-a-credential',
  userId: 'fixture-disposable',
  sessionToken: 'fixture-not-a-credential',
  expiresAt: '2099-01-01T00:00:00.000Z'
}, null, 2);

/**
 * Spawn the REAL CLI binary in a subdirectory. `withParentWorkspace` decides whether there is a
 * workspace ABOVE that subdirectory — the single variable under test.
 */
async function runQuickstart({ withParentWorkspace }) {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-nested-'));
  const subdir = path.join(fixture, 'packages', 'inner');
  await fs.mkdir(path.join(subdir, '.descix'), { recursive: true });

  let parentPath = path.join(fixture, '.descix', 'workspace.json');
  let parentBefore = null;
  if (withParentWorkspace) {
    await fs.mkdir(path.join(fixture, '.descix'), { recursive: true });
    await fs.writeFile(parentPath, PARENT_WS(fixture));
    parentBefore = await fs.readFile(parentPath, 'utf-8');
    assert.ok(parentBefore.length > 0, 'parent workspace fixture must be non-empty');
  }

  // The wallet lives where this command looks for it: getWalletPath(process.cwd()).
  await fs.writeFile(path.join(subdir, '.descix', 'wallet.json'), FIXTURE_WALLET);

  const child = spawn(process.execPath, [BIN_JS, 'quickstart'], {
    cwd: subdir,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Timed writes, because runInit prompts and an EOF'd stdin makes the process exit with the
  // prompt still pending — which would leave NO file for reasons unrelated to the guard.
  const w = (ms, s) => setTimeout(() => { try { child.stdin.write(s); } catch { /* gone */ } }, ms);
  w(1500, 'testcomm\n');
  w(3500, 'innerapp\n');
  w(5500, 'y\n');
  const ender = setTimeout(() => { try { child.stdin.end(); } catch { /* gone */ } }, 12000);

  let out = '', err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });

  let timedOut = false;
  const killer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, HARNESS_TIMEOUT_MS);
  const code = await new Promise((r) => child.on('close', r));
  clearTimeout(killer); clearTimeout(ender);

  let nestedCreated = false;
  try { await fs.stat(path.join(subdir, '.descix', 'workspace.json')); nestedCreated = true; } catch { /* absent */ }

  let parentAfter = null;
  if (withParentWorkspace) { try { parentAfter = await fs.readFile(parentPath, 'utf-8'); } catch { /* gone */ } }

  return {
    fixture, subdir, code, timedOut, nestedCreated,
    combined: out + err,
    hashBefore: parentBefore === null ? null : sha256(parentBefore),
    hashAfter: parentAfter === null ? null : sha256(parentAfter)
  };
}

// ===========================================================================================
// FIXTURE-VALIDITY COUPLING — GATE C2 (positive control) GOVERNS GATE C1 (discriminator).
//
// C1 discriminates on an ABSENCE: that no nested .descix/workspace.json was created. An absence
// is evidence ONLY if this harness could have produced a PRESENCE. C2 is the proof that it could.
// While C2 is red, C1's absence is UNATTRIBUTABLE — indistinguishable from a harness that creates
// nothing under any conditions — so C1 must report FAIL, never pass.
//
// The control is measured ONCE here rather than inside the C2 test so that the verdict exists
// before ANY gate reads it, independently of declaration order or runner concurrency. It costs no
// extra harness run: C2 consumes this same measurement and asserts exactly what it always did.
//
// FAIL-CLOSED: every state that is not an observed PASS (NOT-RUN, a throw, a timeout) blocks C1.
// ===========================================================================================
let controlC2 = { state: 'NOT-RUN', why: 'the positive control has not been run yet', run: null };

/**
 * Called FIRST by GATE C1. Returns silently only when C2 was observed to PASS; otherwise fails
 * C1 with a message that names the CONTROL as the thing to debug — a refusal that does not name
 * its cause sends the next reader to debug the wrong gate.
 */
function requireControlC2(gate) {
  if (controlC2.state === 'PASS') return;
  assert.fail([
    `${gate} CANNOT REPORT PASS: its positive control GATE C2 is ${controlC2.state}.`,
    '',
    `  WHY C2 GOVERNS ${gate}: ${gate} discriminates on the ABSENCE of a nested`,
    '    .descix/workspace.json. An absence is evidence ONLY if this harness could have produced',
    '    a PRESENCE. GATE C2 is the proof that it could. With C2 red, the fixture CANNOT BE SHOWN',
    '    able to produce the write this gate discriminates on, so a green here would be VACUOUS:',
    '    it would read as coverage of a real, shipped, destructive defect (a quickstart creating a',
    '    nested workspace that silently SHADOWS its parent) while being unable to fail.',
    '',
    `  CONTROL STATE  : ${controlC2.state}`,
    `  CONTROL REASON : ${controlC2.why}`,
    '',
    '  DEBUG THE CONTROL, NOT THIS GATE. This gate is making no claim about the product right',
    '  now; it is refusing to report a result it cannot attribute. Fix GATE C2 (the harness must',
    '  be able to create a workspace again) and this gate will discriminate once more.'
  ].join('\n'));
}

before(async () => {
  console.log([
    '',
    '=== COVERAGE BOUNDARY (printed on GREEN as well as RED) ===',
    'COMPARES : the REAL CLI BINARY ' + BIN_JS + ' spawned with cwd inside a disposable',
    '           workspace fixture. Stronger plane than the other two suites, which drive',
    '           exported functions one frame below the command layer.',
    'CATCHES  : creation of a NESTED .descix/workspace.json inside an existing workspace;',
    '           modification of the parent; a silent exit-0 success leaving a shadowing file.',
    'DOES NOT : check whether the remaining quickstart steps target the right directory in the',
    '           nested case — they run in cwd as before; re-pointing them is a separate decision.',
    'FIXTURE  : C2 is a POSITIVE CONTROL proving the stdin script really drives runInit to a',
    '           WRITE. Without it, C1 would pass on a fixture that could never create a file.',
    'COUPLED  : C1 is COUPLED TO C2 IN CODE. While C2 is red, C1 reports FAIL and names C2 as',
    '           the thing to debug. C1 CANNOT emit a green its own control has not earned.',
    'NO NET   : shape-only disposable wallet; no platform call, no account state touched.',
    'RUN BY   : npm test (node --test "tests/*.test.js"). Nothing else runs it.',
    '==========================================================',
    ''
  ].join('\n'));

  // Measure the positive control ONCE, before any gate reads its verdict.
  try {
    const r = await runQuickstart({ withParentWorkspace: false });
    controlC2.run = r;
    if (r.timedOut) {
      controlC2 = { ...controlC2, state: 'FAIL', why: 'the control run TIMED OUT (the harness hung)' };
    } else if (!r.nestedCreated) {
      controlC2 = { ...controlC2, state: 'FAIL',
        why: 'THE FIXTURE IS INERT — with NOTHING above it the harness still created no '
           + `workspace.json (child exit=${r.code}). Tail:\n` + r.combined.slice(-600) };
    } else {
      controlC2 = { ...controlC2, state: 'PASS',
        why: `the harness drove runInit to a real write (child exit=${r.code})` };
    }
  } catch (e) {
    controlC2 = { state: 'FAIL', why: 'the control run THREW: ' + (e && e.message), run: null };
  }
  console.log(`[CONTROL C2] state=${controlC2.state} :: ${controlC2.why.split('\n')[0]}`);
});

describe('descix quickstart must not create a nested workspace', () => {

  // GATE C1 — THE DISCRIMINATOR. Run twice.
  for (const pass of [1, 2]) {
    test(`GATE C1 (pass ${pass}): in a SUBDIRECTORY of an existing workspace, creates NO nested workspace`, async () => {
      // THE COUPLING. C1 may not report a green its own positive control has not earned.
      requireControlC2(`GATE C1 (pass ${pass})`);
      const r = await runQuickstart({ withParentWorkspace: true });
      console.log(`[C1 p${pass}] subdir=${r.subdir}`);
      console.log(`[C1 p${pass}] exit=${r.code} timedOut=${r.timedOut} nestedCreated=${r.nestedCreated}`);
      console.log(`[C1 p${pass}] parent hashBefore=${r.hashBefore}`);
      console.log(`[C1 p${pass}] parent hashAfter =${r.hashAfter}`);
      assert.equal(r.timedOut, false, 'quickstart must not hang');
      assert.equal(r.nestedCreated, false,
        'a NESTED .descix/workspace.json was created in the subdirectory — it SHADOWS the parent '
        + 'for every later resolution. Output:\n' + r.combined.slice(-2000));
      assert.equal(r.hashAfter, r.hashBefore, 'the parent workspace must be byte-identical');
      assert.equal(r.code, 0,
        'this command SKIPS AND REPORTS on an existing workspace — onboarding that finds you '
        + 'already onboarded is a success, not an error');
      assert.ok(r.combined.includes(r.fixture),
        'it must NAME THE WORKSPACE ROOT it found, so the user knows which workspace is in force. '
        + 'Output:\n' + r.combined.slice(-2000));
      assert.match(r.combined, /shadow/i,
        'it must say WHY no workspace was created here. Output:\n' + r.combined.slice(-2000));
    });
  }

  // GATE C2 — POSITIVE CONTROL for C1's fixture. Proves the harness CAN produce a workspace.json,
  // so C1's absence of one is attributable to the guard and not to an inert fixture.
  test('GATE C2 (positive control): with NO workspace up-tree the SAME harness DOES create one', async () => {
    // Consumes the ONE control measurement taken in before(); asserts exactly what it always did.
    const r = controlC2.run;
    console.log(`[C2] state=${controlC2.state}`);
    assert.ok(r !== null, 'the positive control did not run at all: ' + controlC2.why);
    console.log(`[C2] exit=${r.code} timedOut=${r.timedOut} created=${r.nestedCreated}`);
    assert.equal(r.timedOut, false, 'quickstart must not hang');
    assert.ok(r.nestedCreated,
      'THE FIXTURE IS INERT: this harness could not create a workspace even with nothing above it, '
      + 'so GATE C1 proves nothing. Output:\n' + r.combined.slice(-2000));
    console.log('[C2] fixture validated: the stdin script drives runInit to a real write.');
  });
});
