/**
 * `descix mcp quickstart` MUST NOT clobber an existing .descix/workspace.json.
 *
 * The wizard used to build a config literal and call fs.writeFile directly — no existence
 * check, no parse check, no save(). It destroyed a HEALTHY workspace as readily as a corrupt
 * one, and wrote a version '2.0' shape on a v2.1 platform.
 *
 * COVERAGE BOUNDARY — printed by the suite itself on GREEN as well as RED, because a reader of
 * a green needs to see where the green stops:
 *   WHAT THIS COMPARES: the real exported runSetupWizard() from the real lib/wizard/setup.js in
 *     THIS tree, spawned in a real child node process against disposable fixtures.
 *   WHAT IT CATCHES: any write to .descix/workspace.json when one is already present; a created
 *     workspace whose version is not the owner's 2.1; an interactive stall on the refusal path.
 *   WHAT IT DOES NOT READ: the bin/descix.js -> lib/commands/mcp.js wiring. `descix mcp quickstart`
 *     calls requireAuth BEFORE it dynamically imports the wizard, and this suite holds no
 *     credentials, so it cannot drive the CLI binary past auth. That wiring is verified
 *     separately and statically by the reachability test at the bottom of this file.
 *   FIXTURE VALIDITY, ENFORCED IN CODE: GATE B3b is B1's NEGATIVE CONTROL, and B1 REFUSES TO
 *     REPORT PASS while B3b is red. B3b proves this harness can still PROCEED AND CREATE when
 *     there is no workspace up-tree, which is what makes B1's refusal attributable to the PARENT
 *     WORKSPACE rather than to the mere fact of being run in a subdirectory. On 2026-09-15 B3b
 *     went red and B1 kept reporting GREEN, vacuously. A comment saying "B3b is the control" did
 *     not reach the reader of that green; the only surface a citer of B1 reliably touches is B1.
 *   AUTH IS STUBBED: a local throwaway HTTP server answers validate_session/fetch_my_purchases.
 *     No platform call leaves this machine and no account state is touched.
 *   RUN BY: `npm test` in descix-cli (node --test "tests/*.test.js"). Nothing else runs it.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETUP_JS = path.resolve(__dirname, '../lib/wizard/setup.js');
const BIN_JS = path.resolve(__dirname, '../bin/descix.js');
const MCP_JS = path.resolve(__dirname, '../lib/commands/mcp.js');

const HARNESS_TIMEOUT_MS = 60000;
// The refusal path does no network and no prompting, so it must finish well inside this.
const PROMPT_BUDGET_MS = 25000;

const HEALTHY = (root) => JSON.stringify({
  version: '2.1',
  workspaceRoot: root,
  type: 'workspace',
  env: {
    environment: 'DEV',
    gateway: { port: 5173 },
    platform: { appId: 'daita', localPath: './platform' },
    products: []
  }
}, null, 2);

const CORRUPT = '{ "version": "2.1", "env": { this is not JSON';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Spawn the REAL exported runSetupWizard in a real child process against a disposable fixture. */
async function runWizard({ workspaceContent, stdinData, subdir = null }) {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-wizgate-'));
  // subdir mode: the wizard is invoked BELOW the workspace root. Workspace resolution walks UP,
  // so an existing workspace here must still be found and the run refused.
  const runDir = subdir ? path.join(fixture, subdir) : fixture;
  if (subdir) await fs.mkdir(runDir, { recursive: true });
  const descixDir = path.join(fixture, '.descix');
  await fs.mkdir(descixDir, { recursive: true });

  const wsPath = path.join(descixDir, 'workspace.json');
  let before = null;
  if (workspaceContent !== null) {
    const content = typeof workspaceContent === 'function' ? workspaceContent(fixture) : workspaceContent;
    await fs.writeFile(wsPath, content);
    before = await fs.readFile(wsPath, 'utf-8');
    // FIXTURE ASSERTION: a fixture that cannot exhibit the failure does not measure it.
    assert.ok(before.length > 0, 'fixture workspace.json must be non-empty');
  }

  // Synthetic throwaway wallet — shape only, so isAuthenticated() takes the stub path.
  // Not a credential: no real address, no real signature, never leaves this directory.
  await fs.writeFile(path.join(descixDir, 'wallet.json'), JSON.stringify({
    walletAddress: '0x' + 'a'.repeat(40),
    signature: 'fixture-not-a-credential',
    userId: 'fixture-disposable',
    sessionToken: 'fixture-not-a-credential'
  }, null, 2));

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'OK',
        message: { userId: 'fixture-disposable' },
        communities: [], apps: [], service_slots: []
      }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const stdio = [stdinData === null ? 'ignore' : 'pipe', 'pipe', 'pipe'];
  const started = Date.now();
  const child = spawn(process.execPath, [
    '--input-type=module', '-e',
    `const { runSetupWizard } = await import(${JSON.stringify(SETUP_JS)}); await runSetupWizard();`
  ], {
    cwd: runDir,
    env: { ...process.env, DESCIX_API_URL: `http://127.0.0.1:${port}`, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio
  });

  if (stdinData !== null) {
    // Written after a beat so an already-listening prompt receives it.
    setTimeout(() => { try { child.stdin.end(stdinData); } catch { /* already gone */ } }, 3000);
  }

  let out = '', err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });

  let timedOut = false;
  const killer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, HARNESS_TIMEOUT_MS);
  const code = await new Promise((r) => child.on('close', r));
  clearTimeout(killer);
  const elapsedMs = Date.now() - started;
  server.close();

  let after = null;
  let exists = true;
  try { after = await fs.readFile(wsPath, 'utf-8'); } catch { exists = false; }

  // Did the run leave a NESTED workspace behind in the subdirectory it was invoked from?
  let nestedCreated = false;
  if (subdir) {
    try { await fs.stat(path.join(runDir, '.descix', 'workspace.json')); nestedCreated = true; }
    catch { nestedCreated = false; }
  }

  return {
    fixture, runDir, nestedCreated, wsPath, code, out, err, elapsedMs, timedOut, exists,
    before, after,
    hashBefore: before === null ? null : sha256(before),
    hashAfter: after === null ? null : sha256(after),
    combined: out + err
  };
}

/** Did it REFUSE — as opposed to merely failing for some unrelated reason? */
function refused(r, { wantVersion = null } = {}) {
  const t = r.combined;
  const namesRefusal = /refus/i.test(t);
  const namesPath = t.includes(r.wsPath) || t.includes('.descix/workspace.json');
  const namesVersion = wantVersion === null ? true : t.includes(wantVersion);
  return { namesRefusal, namesPath, namesVersion, ok: namesRefusal && namesPath && namesVersion };
}

// ===========================================================================================
// FIXTURE-VALIDITY COUPLING — GATE B3b (negative control) GOVERNS GATE B1 (discriminator).
//
// B1 discriminates on a REFUSAL plus an ABSENCE: the wizard exits non-zero and leaves no nested
// workspace.json. Both readings are attributable to the PARENT WORKSPACE only if this harness,
// run in the same subdirectory with NOTHING up-tree, would instead PROCEED AND CREATE. That is
// exactly what B3b measures. While B3b is red, every subdirectory run refuses and creates
// nothing whatever the cause, so B1 cannot tell the guard from an unrelated refusal and MUST NOT
// REPORT PASS.
//
// Measured ONCE here so the verdict exists before any gate reads it, independently of
// declaration order or runner concurrency, and at no extra harness run: B3b consumes this same
// measurement and asserts exactly what it always did.
//
// FAIL-CLOSED: every state that is not an observed PASS (NOT-RUN, a throw, a timeout) blocks B1.
// ===========================================================================================
let controlB3b = { state: 'NOT-RUN', why: 'the negative control has not been run yet', run: null };

/**
 * Called FIRST by GATE B1. Returns silently only when B3b was observed to PASS; otherwise fails
 * B1 with a message naming the CONTROL as the thing to debug.
 */
function requireControlB3b(gate) {
  if (controlB3b.state === 'PASS') return;
  assert.fail([
    `${gate} CANNOT REPORT PASS: its negative control GATE B3b is ${controlB3b.state}.`,
    '',
    `  WHY B3b GOVERNS ${gate}: ${gate} reads a REFUSAL and the ABSENCE of a nested`,
    '    .descix/workspace.json, and attributes both to the PARENT WORKSPACE. That attribution',
    '    holds only if the same harness, in the same subdirectory with NOTHING up-tree, would',
    '    PROCEED AND CREATE instead. GATE B3b is that proof. With B3b red, every subdirectory run',
    '    refuses and creates nothing whatever the cause, so a green here would be VACUOUS: it',
    '    would read as coverage of a real, shipped, destructive defect (a wizard clobbering a',
    '    healthy workspace / creating a nested one that SHADOWS its parent) while being unable',
    '    to fail.',
    '',
    `  CONTROL STATE  : ${controlB3b.state}`,
    `  CONTROL REASON : ${controlB3b.why}`,
    '',
    '  DEBUG THE CONTROL, NOT THIS GATE. This gate is making no claim about the product right',
    '  now; it is refusing to report a result it cannot attribute. Fix GATE B3b (the harness must',
    '  be able to proceed and create again) and this gate will discriminate once more.'
  ].join('\n'));
}

before(async () => {
  console.log([
    '',
    '=== COVERAGE BOUNDARY (printed on GREEN as well as RED) ===',
    'COMPARES : the real exported runSetupWizard() from ' + SETUP_JS,
    '           spawned in a real child node process against disposable fixtures.',
    'CATCHES  : any write to a PRESENT .descix/workspace.json; a created workspace whose',
    '           version is not the owner\'s 2.1; an interactive stall on the refusal path.',
    'DOES NOT : drive the CLI binary. `descix mcp quickstart` calls requireAuth BEFORE it',
    '           dynamically imports the wizard and this suite holds no credentials, so the',
    '           bin -> mcp.js -> wizard wiring is covered STATICALLY by the last test only.',
    'STUBBED  : auth/entitlements answered by a local throwaway server. Nothing leaves the',
    '           machine; no account state is touched.',
    'COUPLED  : B1 is COUPLED TO B3b IN CODE. While B3b is red, B1 reports FAIL and names B3b as',
    '           the thing to debug. B1 CANNOT emit a green its own control has not earned.',
    'RUN BY   : npm test (node --test "tests/*.test.js"). Nothing else runs it.',
    '==========================================================',
    ''
  ].join('\n'));

  // Measure the negative control ONCE, before any gate reads its verdict.
  try {
    const r = await runWizard({ workspaceContent: null, stdinData: 'n\n', subdir: 'packages/inner' });
    controlB3b.run = r;
    if (r.timedOut) {
      controlB3b = { ...controlB3b, state: 'FAIL', why: 'the control run TIMED OUT (the harness hung)' };
    } else if (!r.nestedCreated) {
      controlB3b = { ...controlB3b, state: 'FAIL',
        why: 'THE FIXTURE IS INERT — with NO workspace up-tree the wizard still created nothing '
           + `where it was invoked (child exit=${r.code}). Tail:\n` + r.combined.slice(-600) };
    } else if (/Refusing/i.test(r.combined)) {
      controlB3b = { ...controlB3b, state: 'FAIL',
        why: 'the wizard REFUSED merely for being in a subdirectory, so a refusal in B1 cannot be '
           + 'attributed to the parent workspace' };
    } else {
      controlB3b = { ...controlB3b, state: 'PASS',
        why: `the harness proceeded and created a workspace where invoked (child exit=${r.code})` };
    }
  } catch (e) {
    controlB3b = { state: 'FAIL', why: 'the control run THREW: ' + (e && e.message), run: null };
  }
  console.log(`[CONTROL B3b] state=${controlB3b.state} :: ${controlB3b.why.split('\n')[0]}`);
});

describe('quickstart wizard must not clobber a present workspace', () => {

  // GATE 1 — present + HEALTHY. Run twice.
  for (const pass of [1, 2]) {
    test(`GATE 1 (pass ${pass}): refuses on a present HEALTHY workspace, non-zero, byte-identical`, async () => {
      const r = await runWizard({ workspaceContent: HEALTHY, stdinData: 'n\n' });
      console.log(`[GATE1 p${pass}] exit=${r.code} timedOut=${r.timedOut} elapsedMs=${r.elapsedMs}`);
      console.log(`[GATE1 p${pass}] hashBefore=${r.hashBefore}`);
      console.log(`[GATE1 p${pass}] hashAfter =${r.hashAfter}`);
      assert.equal(r.timedOut, false, 'wizard must not hang');
      assert.ok(r.exists, 'workspace.json must still exist');
      assert.equal(r.hashAfter, r.hashBefore,
        'PRESENT HEALTHY workspace.json was MODIFIED — the unguarded write clobbered it');
      assert.notEqual(r.code, 0, 'must exit NON-ZERO on refusal');
      const f = refused(r, { wantVersion: '2.1' });
      assert.ok(f.namesRefusal, 'output must say it REFUSED. Got:\n' + r.combined.slice(-1500));
      assert.ok(f.namesPath, 'refusal must NAME THE PATH. Got:\n' + r.combined.slice(-1500));
      assert.ok(f.namesVersion, 'refusal must NAME THE VERSION found (2.1). Got:\n' + r.combined.slice(-1500));
    });
  }

  // GATE 2 — present + CORRUPT. Run twice.
  for (const pass of [1, 2]) {
    test(`GATE 2 (pass ${pass}): refuses on a present CORRUPT workspace, non-zero, byte-identical`, async () => {
      const r = await runWizard({ workspaceContent: CORRUPT, stdinData: 'n\n' });
      console.log(`[GATE2 p${pass}] exit=${r.code} timedOut=${r.timedOut} elapsedMs=${r.elapsedMs}`);
      console.log(`[GATE2 p${pass}] hashBefore=${r.hashBefore}`);
      console.log(`[GATE2 p${pass}] hashAfter =${r.hashAfter}`);
      assert.equal(r.timedOut, false, 'wizard must not hang');
      assert.ok(r.exists, 'the unreadable file must SURVIVE — destroying it destroys the diagnosis');
      assert.equal(r.hashAfter, r.hashBefore,
        'PRESENT CORRUPT workspace.json was MODIFIED — the unguarded write clobbered it');
      assert.notEqual(r.code, 0, 'must exit NON-ZERO on refusal');
      const f = refused(r);
      assert.ok(f.namesRefusal, 'output must say it REFUSED. Got:\n' + r.combined.slice(-1500));
      assert.ok(f.namesPath, 'refusal must NAME THE PATH. Got:\n' + r.combined.slice(-1500));
    });
  }

  // GATE 3 — ABSENT. Run twice.
  // NOTE: this gate DOES discriminate, but only on the VERSION. Pre-fix the wizard created the
  // file too — with the literal's version '2.0'. If a future change makes it pass on both
  // states it is a REGRESSION GUARD, not a discriminator, and must be labelled so.
  for (const pass of [1, 2]) {
    test(`GATE 3 (pass ${pass}): still creates a workspace when ABSENT, in the shape the loader accepts`, async () => {
      const r = await runWizard({ workspaceContent: null, stdinData: 'n\n' });
      console.log(`[GATE3 p${pass}] exit=${r.code} timedOut=${r.timedOut} created=${r.exists}`);
      assert.equal(r.timedOut, false, 'wizard must not hang');
      assert.ok(r.exists, 'quickstart must STILL create a workspace when none is present');
      const parsed = JSON.parse(r.after);
      console.log(`[GATE3 p${pass}] created version=${parsed.version}`);
      assert.equal(parsed.version, '2.1',
        "created workspace must carry the OWNER's version 2.1, not the deleted literal's 2.0");
      const { WorkspaceConfig } = await import('../lib/workspace-config.js');
      const ws = await WorkspaceConfig.load(r.fixture);
      assert.equal(ws.version, '2.1', 'the loader must accept what was written');
    });
  }

  // GATE 4 — the one that protects AGENT CALLERS. stdin CLOSED, not a TTY. Run twice.
  for (const pass of [1, 2]) {
    test(`GATE 4 (pass ${pass}): refusal path is NON-INTERACTIVE — stdin closed, exits promptly`, async () => {
      const r = await runWizard({ workspaceContent: HEALTHY, stdinData: null });
      console.log(`[GATE4 p${pass}] exit=${r.code} timedOut=${r.timedOut} elapsedMs=${r.elapsedMs} (budget ${PROMPT_BUDGET_MS}ms)`);
      assert.equal(r.timedOut, false,
        `wizard HUNG with stdin closed — an agent caller waits forever. elapsed=${r.elapsedMs}ms`);
      assert.ok(r.elapsedMs < PROMPT_BUDGET_MS,
        `refusal must be PROMPT, took ${r.elapsedMs}ms (budget ${PROMPT_BUDGET_MS}ms)`);
      assert.notEqual(r.code, 0, 'must exit NON-ZERO');
      assert.equal(r.hashAfter, r.hashBefore, 'file must be byte-identical');
      const f = refused(r, { wantVersion: '2.1' });
      assert.ok(f.ok,
        'with stdin closed the refusal must still name path and version — not an EOF/prompt error. Got:\n'
        + r.combined.slice(-1500));
      assert.ok(!/ExitPromptError|force closed the prompt/i.test(r.combined),
        'refusal path must not reach an interactive prompt at all. Got:\n' + r.combined.slice(-1500));
    });
  }

  // GATE B1 — THE DISCRIMINATOR for nested shadowing. Run twice.
  // Pre-fix the guard read the TARGET PATH ONLY while load() walked UP, so from a subdirectory
  // it found nothing, reached the banner, and created a NESTED workspace.json shadowing the
  // parent for every later resolution.
  for (const pass of [1, 2]) {
    test(`GATE B1 (pass ${pass}): a SUBDIRECTORY of an existing workspace REFUSES; no nested file created`, async () => {
      // THE COUPLING. B1 may not report a green its own negative control has not earned.
      requireControlB3b(`GATE B1 (pass ${pass})`);
      const r = await runWizard({ workspaceContent: HEALTHY, stdinData: 'n\n', subdir: 'packages/inner' });
      console.log(`[B1 p${pass}] runDir=${r.runDir}`);
      console.log(`[B1 p${pass}] exit=${r.code} timedOut=${r.timedOut} nestedCreated=${r.nestedCreated}`);
      console.log(`[B1 p${pass}] parent hashBefore=${r.hashBefore}`);
      console.log(`[B1 p${pass}] parent hashAfter =${r.hashAfter}`);
      assert.equal(r.timedOut, false, 'wizard must not hang');
      assert.equal(r.nestedCreated, false,
        'a NESTED .descix/workspace.json was created in the subdirectory — it SHADOWS the parent');
      assert.equal(r.hashAfter, r.hashBefore, "the parent workspace must be byte-identical");
      assert.notEqual(r.code, 0, 'must exit NON-ZERO');
      const f = refused(r);
      assert.ok(f.namesRefusal, 'output must say it REFUSED. Got:\n' + r.combined.slice(-1500));
      assert.ok(r.combined.includes(r.fixture),
        'the refusal must NAME THE PARENT ROOT it found, so the user knows which workspace is in force. Got:\n'
        + r.combined.slice(-1500));
      assert.match(r.combined, /SHADOW/i,
        'the refusal must say WHY a nested workspace is refused (it shadows the parent). Got:\n'
        + r.combined.slice(-1500));
    });
  }

  // GATE B3b — a clean SUBDIRECTORY with no workspace anywhere up the tree still proceeds.
  // This is the fixture that proves B1 refuses because of the PARENT WORKSPACE and not merely
  // because it was run in a subdirectory.
  test('GATE B3b (negative control for B1): a subdirectory with NO workspace up-tree still proceeds', async () => {
    // Consumes the ONE control measurement taken in before(); asserts exactly what it always did.
    const r = controlB3b.run;
    console.log(`[B3b] state=${controlB3b.state}`);
    assert.ok(r !== null, 'the negative control did not run at all: ' + controlB3b.why);
    console.log(`[B3b] exit=${r.code} timedOut=${r.timedOut} created-in-subdir=${r.nestedCreated}`);
    assert.equal(r.timedOut, false, 'wizard must not hang');
    assert.ok(r.nestedCreated,
      'with NO workspace up the tree the wizard must still CREATE one where it was invoked');
    assert.ok(!/Refusing/i.test(r.combined),
      'it must not refuse merely for being in a subdirectory. Got:\n' + r.combined.slice(-1500));
  });

  // REACHABILITY — static, and explicitly NOT a discriminator for the guard.
  // It exists because a symbol search from the entrypoint MISSES the call: it is behind
  // `await import(...)`. A previous reader concluded runSetupWizard was dead code and was wrong.
  test('REACHABILITY (not a guard gate): mcp quickstart reaches runSetupWizard via a DYNAMIC import', async () => {
    const bin = await fs.readFile(BIN_JS, 'utf-8');
    const mcp = await fs.readFile(MCP_JS, 'utf-8');
    assert.ok(/\.command\(\s*['"]quickstart['"]\s*\)/.test(bin),
      'bin/descix.js must still register the `quickstart` subcommand');
    assert.ok(/mcpCommands\.quickstart\(/.test(bin),
      'the registered action must still call mcpCommands.quickstart()');
    assert.ok(/await import\(\s*['"]\.\.\/wizard\/setup\.js['"]\s*\)/.test(mcp),
      'mcp.js must still reach the wizard through the dynamic import this test exists to make visible');
    assert.ok(/runSetupWizard\(\)/.test(mcp), 'mcp.js must still call runSetupWizard()');
    console.log('[REACH] bin/descix.js registers quickstart -> mcpCommands.quickstart() -> '
      + 'mcp.js `await import("../wizard/setup.js")` -> runSetupWizard(). '
      + 'STATIC ONLY: does not execute the binary (auth precedes the import).');
  });
});
