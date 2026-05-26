/**
 * Tests for v1 workspace format hard-error (WS-CLI-V2.1-PURGE).
 *
 * Coverage:
 *  - WorkspaceConfig.load() against a v1 workspace throws with canonical message
 *  - WorkspaceConfig.tryLoad() against a v1 workspace returns null (soft-fail)
 *  - v2.1 workspace loads cleanly (regression check)
 *  - v1 detection fires on "communities key present, no env key" — not on any communities key
 *
 * Design: synthesizes temp workspace.json fixtures. No real workspace.json is read.
 *
 * Run: `node --test tests/workspace-config-v1-hard-error.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

/**
 * Write a workspace.json to a temp dir and return the dir path.
 */
async function writeWorkspace(t, content) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-ws1-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(content, null, 2)
  );
  t.after(async () => {
    await fs.rm(wsRoot, { recursive: true, force: true });
  });
  return wsRoot;
}

// ─────────────────────────────────────────────────────────────────────────────

test('WorkspaceConfig.load() — v1 workspace (communities + no env) → throws canonical error', async (t) => {
  const v1Workspace = {
    version: '1.0',
    communities: {
      descix: {
        apps: {
          daita: { localPath: 'DeSciX_Cloud', kbId: 'General' }
        }
      }
    }
    // no "env" key — this is the v1 detection condition
  };
  const wsRoot = await writeWorkspace(t, v1Workspace);

  await assert.rejects(
    () => WorkspaceConfig.load(wsRoot),
    (err) => {
      assert.match(
        err.message,
        /v1 workspace format is not supported/,
        'error must include the canonical v1 rejection phrase'
      );
      return true;
    },
    'load() must throw for v1 workspace format'
  );
});

test('WorkspaceConfig.tryLoad() — v1 workspace returns null (soft-fail)', async (t) => {
  const v1Workspace = {
    version: '1.0',
    communities: {
      descix: {
        apps: {
          daita: { localPath: 'DeSciX_Cloud', kbId: 'General' }
        }
      }
    }
  };
  const wsRoot = await writeWorkspace(t, v1Workspace);

  const result = await WorkspaceConfig.tryLoad(wsRoot);
  assert.equal(result, null, 'tryLoad() must return null for v1 workspace (not throw)');
});

test('WorkspaceConfig.load() — v2.1 workspace loads cleanly (regression check)', async (t) => {
  const v21Workspace = {
    version: '2.1',
    workspaceRoot: '/tmp/test',
    type: 'workspace',
    env: {
      products: [{ appId: 'daita', localPath: 'DeSciX_Cloud', kbId: 'General' }]
    }
  };
  const wsRoot = await writeWorkspace(t, v21Workspace);

  const config = await WorkspaceConfig.load(wsRoot);
  assert.ok(config, 'v2.1 workspace must load without error');
  assert.ok(config.env, 'loaded config must have env block');
  assert.ok(Array.isArray(config.env.products), 'env.products must be an array');
});

test('WorkspaceConfig.load() — communities key WITH env key does NOT trigger v1 error', async (t) => {
  // Edge case: if a workspace somehow has both communities AND env, it is not v1.
  // Only "communities without env" triggers the hard error.
  const mixedWorkspace = {
    version: '2.1',
    type: 'workspace',
    communities: { somekey: 'irrelevant' }, // extra key, not the v1 schema
    env: {
      products: [{ appId: 'daita', localPath: 'DeSciX_Cloud', kbId: 'General' }]
    }
  };
  const wsRoot = await writeWorkspace(t, mixedWorkspace);

  // Must NOT throw — the v1 check is: communities present AND env absent
  const config = await WorkspaceConfig.load(wsRoot);
  assert.ok(config, 'workspace with communities+env must load (env presence bypasses v1 check)');
});

test('WorkspaceConfig.load() — error message includes migration instructions', async (t) => {
  const v1Workspace = {
    version: '1.0',
    communities: {
      unkamon: {
        apps: { unk: { localPath: 'apps/unk', kbId: 'Role' } }
      }
    }
  };
  const wsRoot = await writeWorkspace(t, v1Workspace);

  let caughtMessage = '';
  try {
    await WorkspaceConfig.load(wsRoot);
  } catch (e) {
    caughtMessage = e.message;
  }

  assert.ok(caughtMessage.length > 0, 'must have thrown with a message');
  // Migration instructions must guide the user
  assert.match(
    caughtMessage,
    /Migrate to v2\.1/,
    'error must include "Migrate to v2.1" guidance'
  );
});
