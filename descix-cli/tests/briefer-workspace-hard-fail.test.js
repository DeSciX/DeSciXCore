/**
 * Deliverable C — briefer path resolution hard-fail (M3 follow-up).
 *
 * Bug: `resolveOutPath()` silently anchored to `cliPaths.repoRoot` when no
 * workspace.json was reachable from cwd, producing a wrong default like
 *   Unkamon/DeSciX/DeSciX/V2_docs/architecture/platform-must-know-briefer.md
 * (double `DeSciX/`) when invoked from inside `descix-cli/`.
 *
 * Per feedback_no-hardcoded-fallbacks, missing inputs MUST hard-fail with a
 * clear, actionable error — never a silent path guess.
 *
 * AC:
 *   1. No workspace + no --out  → throws BrieferExtractorError(WORKSPACE_NOT_FOUND).
 *   2. No workspace + explicit --out → returns the resolved --out path.
 *   3. Workspace found → returns workspace-rooted default.
 *   4. Error message names the cwd and tells operator to either cd or pass --out.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveOutPath, resolveCliPaths, DEFAULT_OUT_RELATIVE } from '../lib/commands/briefer/index.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../lib/commands/briefer/errors.js';

function fakeCliPaths() {
  // Mimics what resolveCliPaths() returns. The actual value doesn't matter
  // for the hard-fail path — what matters is that we are NOT using it.
  return {
    descixCliRoot: '/tmp/fake/DeSciX/DeSciX_Core/descix-cli',
    descixCoreRoot: '/tmp/fake/DeSciX/DeSciX_Core',
    desciXRoot:    '/tmp/fake/DeSciX',
    repoRoot:      '/tmp/fake'
  };
}

function fakeWorkspaceConfig(wsRoot) {
  return { getWorkspaceRoot: () => wsRoot };
}

test('briefer: no workspace + no --out hard-fails with WORKSPACE_NOT_FOUND', () => {
  const cliPaths = fakeCliPaths();
  let caught = null;
  try {
    resolveOutPath(undefined, null, cliPaths, '/tmp/some/cwd/with/no/workspace');
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, 'must throw — silent path-guessing is forbidden');
  assert.ok(caught instanceof BrieferExtractorError, `expected BrieferExtractorError, got ${caught?.constructor?.name}`);
  assert.equal(caught.code, BRIEFER_ERROR_CODES.WORKSPACE_NOT_FOUND);
  // Error must name the cwd so the operator can see WHERE the lookup failed.
  assert.match(caught.message, /\/tmp\/some\/cwd\/with\/no\/workspace/);
  // Error must give an actionable recovery referencing both options.
  assert.match(caught.message, /--out/);
  assert.match(caught.message, /workspace\.json/);
});

test('briefer: no workspace + explicit --out returns the override unchanged', () => {
  const cliPaths = fakeCliPaths();
  const out = resolveOutPath('/explicit/path/briefer.md', null, cliPaths, '/tmp/anywhere');
  assert.equal(out, '/explicit/path/briefer.md');
});

test('briefer: workspace present → workspace-rooted default', async (t) => {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'briefer-c-ws-'));
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });

  const cliPaths = fakeCliPaths();
  const out = resolveOutPath(undefined, fakeWorkspaceConfig(wsRoot), cliPaths, wsRoot);
  assert.equal(out, path.join(wsRoot, DEFAULT_OUT_RELATIVE));
});

test('briefer: the DOUBLE-DeSciX bug specifically does not regress', () => {
  // Concrete repro of the bug the M3 EVP reported: invoked from inside
  // descix-cli/, cliPaths.repoRoot resolves one level too high and the default
  // out-path becomes Unkamon/DeSciX/DeSciX/V2_docs/... (double DeSciX/).
  // With the fallback removed, we must hard-fail instead of returning the
  // wrong path silently.
  const cliPaths = {
    descixCliRoot: '/U/DeSciX/DeSciX_Core/descix-cli',
    descixCoreRoot: '/U/DeSciX/DeSciX_Core',
    desciXRoot:    '/U/DeSciX',
    // This is the "off-by-one" repoRoot that USED to be used as a fallback —
    // resolving from descix-cli/lib/commands/briefer/index.js four levels up
    // landed inside DeSciX/, not at the Unkamon repo root. The old code would
    // have produced /U/DeSciX/DeSciX/V2_docs/... here.
    repoRoot:      '/U/DeSciX'
  };
  assert.throws(
    () => resolveOutPath(undefined, null, cliPaths, '/U/DeSciX/DeSciX_Core/descix-cli'),
    (err) => err instanceof BrieferExtractorError
            && err.code === BRIEFER_ERROR_CODES.WORKSPACE_NOT_FOUND
  );
});

test('briefer: resolveCliPaths still returns a 4-key object (unchanged shape)', () => {
  const p = resolveCliPaths();
  for (const k of ['descixCliRoot', 'descixCoreRoot', 'desciXRoot', 'repoRoot']) {
    assert.ok(p[k], `${k} missing from resolveCliPaths()`);
  }
});
