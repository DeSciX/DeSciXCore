/**
 * GATE: `descix login` must not claim full success, or exit 0, when entitlement sync failed.
 *
 * THE DEFECT. Credentials save, then entitlement sync runs in its own try/catch. On failure the
 * catch warned and fell through to "You can now use all DeSciX CLI commands!" with exit 0.
 * Entitlements are what grant app access, so that sentence was false exactly when it mattered,
 * and the exit code — the only thing a script reads — said everything was fine.
 *
 * THIS LEG IS A SOURCE ASSERTION, AND THAT IS A REAL LIMITATION, NOT A PREFERENCE. loginDevice()
 * constructs its own DeSciXApiClient internally and drives an interactive device-login (browser
 * open + poll), so there is no seam to inject a failing sync through without restructuring the
 * command. A verifier wanting the runtime proof must drive a real `descix login` against a backend
 * that fails sync_auto_purchases and read `echo $?`. What this gate DOES buy is regression
 * protection: the guard cannot be deleted without turning it red.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUTH = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'commands', 'auth.js');
const CLAIM = 'You can now use all DeSciX CLI commands!';

const source = await readFile(AUTH, 'utf8');

test('the sync failure path records that it failed', () => {
  assert.match(
    source,
    /catch\s*\([^)]*\)\s*\{\s*entitlementsSynced\s*=\s*false/,
    'the entitlement-sync catch does not record the failure, so nothing downstream can react to it'
  );
});

test('the full-success claim is guarded, not unconditional', () => {
  assert.ok(source.includes(CLAIM), 'the success line vanished — this gate is measuring nothing');

  // Everything between the failure branch and the claim. If the claim is not preceded by a
  // early-returning guard on the flag, it is reachable on the failure path.
  const guard = /if\s*\(\s*!entitlementsSynced\s*\)\s*\{[\s\S]*?process\.exitCode\s*=\s*1;[\s\S]*?return;[\s\S]*?\}/;
  assert.match(
    source,
    guard,
    'no `if (!entitlementsSynced) { ... process.exitCode = 1; return; }` guard found'
  );

  const guardEnd = source.search(guard);
  assert.ok(guardEnd !== -1 && guardEnd < source.indexOf(CLAIM),
    'the guard must come BEFORE the success claim, or the claim still prints on failure');
});

test('a failed sync does not exit 0', () => {
  assert.match(
    source,
    /entitlementsSynced[\s\S]{0,600}?process\.exitCode\s*=\s*1/,
    'no non-zero exit is set on the entitlement-sync failure path'
  );
});

test('COVERAGE BOUNDARY (prints on green as well as red)', () => {
  console.log(`
  ── GATE COVERAGE BOUNDARY ─────────────────────────────────────────────────
  WHAT IT COMPARES : the SOURCE of lib/commands/auth.js against the shape of a
                     guarded success claim + non-zero exit.
  DEFECT CLASS     : a command reporting success, and exiting 0, after a step
                     it needed silently failed.
  WHAT IT DOES NOT READ:
    - RUNTIME. Nothing here executes login. loginDevice() builds its own api
      client and drives an interactive device flow, so there is no injection
      seam. The runtime proof requires a real \`descix login\` against a backend
      whose sync_auto_purchases fails, then reading the exit code.
    - whether the WORDING is right, only that the claim is guarded.
    - any other overclaiming command. This file covers login only.
  AUTOMATION       : runs under this package's \`npm test\`
                     (node --test "tests/*.test.js"). Nothing else invokes it.
  ───────────────────────────────────────────────────────────────────────────`);
});
