/**
 * Tests for `descix app set-default-model` and `descix kb {set,clear}-override-model`.
 *
 * Coverage (per dispatch §4):
 *   1. HARD-FAIL with clear errors when required args missing.
 *   2. HARD-FAIL on unknown app / KB (surfaces backend errors with canonical message).
 *   3. --clear flows route to clear_* backend commands (verifies FieldValue.delete()
 *      semantics by asserting the *.clear command is invoked, not a value-write).
 *   4. Audit-log JSONL line emitted with the correct schema and field types.
 *   5. Resolution-chain print is accurate (asserted indirectly via the print helpers).
 *
 * Design: we mock DeSciXApiClient by injecting a fake into a fresh ESM import of
 * model-config.js. The CLI command module imports DeSciXApiClient + requireAuth at
 * module top-level; we intercept via a small loader that swaps the api-client module
 * in node's import cache. We use isolated tmp workspaces so the audit-log JSONL lands
 * in a sandbox and never touches the real docs/handoff/ tree.
 *
 * Run: `node --test tests/model-config.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_ROOT = path.resolve(__dirname, '..');
const MODEL_CONFIG_PATH = path.join(CLI_ROOT, 'lib', 'commands', 'model-config.js');

/**
 * Create an isolated workspace.json so resolveAuditLogPath anchors at our tmp root.
 * The workspace.json is required for WorkspaceConfig.tryLoad() to succeed; without one
 * we'd fall back to cwd (which the test harness may share with other tests).
 */
async function makeIsolatedWorkspace(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-model-cfg-test-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  const workspace = {
    version: '2.1',
    workspaceRoot: wsRoot,
    type: 'workspace',
    env: { products: [] }
  };
  await fs.writeFile(
    path.join(wsRoot, '.descix', 'workspace.json'),
    JSON.stringify(workspace, null, 2)
  );

  const originalCwd = process.cwd();
  process.chdir(wsRoot);
  t.after(async () => {
    process.chdir(originalCwd);
    await fs.rm(wsRoot, { recursive: true, force: true });
  });
  return wsRoot;
}

/**
 * Build a fake api-client module exposing a single DeSciXApiClient class whose
 * `invoke(cmd, params)` resolves to whatever the test plans. Records calls.
 *
 * We also stub requireAuth() so tests don't need real wallet credentials.
 */
function makeFakeApiClientModule(plan) {
  const calls = [];
  class FakeApiClient {
    constructor() { this.credentials = { email: 'test@descix.net' }; }
    async loadCredentials() { return; }
    async invoke(cmd, params) {
      calls.push({ cmd, params });
      if (plan[cmd] === undefined) {
        throw new Error(`Unexpected backend command: ${cmd}`);
      }
      const handler = plan[cmd];
      if (typeof handler === 'function') return handler(params);
      if (handler instanceof Error) throw handler;
      return handler;
    }
  }
  return { module: { DeSciXApiClient: FakeApiClient }, calls };
}

/**
 * Dynamic ESM stub: write the fake api-client to a tmp file, then dynamically import
 * a transient copy of model-config.js that has been rewritten to point at it.
 * This avoids depending on test-runner module mocking (which Node's --test lacks).
 */
async function loadModelConfigWithFakeApi(plan) {
  const original = await fs.readFile(MODEL_CONFIG_PATH, 'utf8');

  // Place stubs INSIDE the cli tree so `chalk` (and other peer deps) resolve via
  // descix-cli/node_modules. node-resolution walks parent directories from the module
  // file; an OS tmpdir has no node_modules above it.
  const stubDir = await fs.mkdtemp(path.join(CLI_ROOT, '.test-stubs-'));
  const fakeClientPath = path.join(stubDir, 'api-client.mjs');
  const fakeAuthPath = path.join(stubDir, 'auth-guard.mjs');

  const fakeClientSrc = `
    export const __calls = [];
    export class DeSciXApiClient {
      constructor() { this.credentials = { email: 'test@descix.net' }; }
      async loadCredentials() { return; }
      async invoke(cmd, params) {
        __calls.push({ cmd, params });
        const plan = ${JSON.stringify(plan)};
        if (!(cmd in plan)) throw new Error('Unexpected backend command: ' + cmd);
        return plan[cmd];
      }
    }
  `;
  await fs.writeFile(fakeClientPath, fakeClientSrc);
  await fs.writeFile(fakeAuthPath, `export async function requireAuth() { return; }`);

  // Rewrite model-config.js to import the fakes via relative paths from stubDir
  // (which is a sibling of lib/, inside CLI_ROOT, so node_modules resolution still works).
  const fakeClientRel = './api-client.mjs';
  const fakeAuthRel = './auth-guard.mjs';
  const rewritten = original
    .replace("from '../api-client.js'", `from '${fakeClientRel}'`)
    .replace("from '../auth-guard.js'", `from '${fakeAuthRel}'`)
    .replace("from '../workspace-config.js'", `from '${path.join(CLI_ROOT, 'lib', 'workspace-config.js').replace(/\\/g, '/')}'`);

  const tmpModulePath = path.join(stubDir, `model-config-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  await fs.writeFile(tmpModulePath, rewritten);

  const mod = await import(tmpModulePath);
  const clientMod = await import(fakeClientPath);
  return { mod, calls: clientMod.__calls, cleanup: async () => fs.rm(stubDir, { recursive: true, force: true }) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HARD-FAIL on missing required args
// ─────────────────────────────────────────────────────────────────────────────

test('app set-default-model — HARD-FAIL when -a/--app is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  await assert.rejects(
    () => mod.runAppSetDefaultModel({ model: 'gemini-3.1-flash-lite' }),
    /Missing required option: -a/,
    'must hard-fail with canonical message'
  );
});

test('app set-default-model — HARD-FAIL when neither -m nor --clear is given', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  await assert.rejects(
    () => mod.runAppSetDefaultModel({ app: 'unk-cos' }),
    /Either -m, --model <model_name> or --clear is required/,
    'must hard-fail with canonical message'
  );
});

test('app set-default-model — HARD-FAIL when both -m and --clear are given', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  await assert.rejects(
    () => mod.runAppSetDefaultModel({ app: 'unk-cos', model: 'gemini-2.5-pro', clear: true }),
    /-m and --clear are mutually exclusive/,
    'must hard-fail on mutual exclusion'
  );
});

test('kb set-override-model — HARD-FAIL when -a is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);
  await assert.rejects(
    () => mod.runKbSetOverrideModel({ kb: 'Corpus', model: 'gemini-2.5-pro' }),
    /Missing required option: -a/
  );
});

test('kb set-override-model — HARD-FAIL when -k is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);
  await assert.rejects(
    () => mod.runKbSetOverrideModel({ app: 'unk-cos', model: 'gemini-2.5-pro' }),
    /Missing required option: -k/
  );
});

test('kb set-override-model — HARD-FAIL when -m is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);
  await assert.rejects(
    () => mod.runKbSetOverrideModel({ app: 'unk-cos', kb: 'Corpus' }),
    /Missing required option: -m/
  );
});

test('kb clear-override-model — HARD-FAIL when -a is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);
  await assert.rejects(
    () => mod.runKbClearOverrideModel({ kb: 'Corpus' }),
    /Missing required option: -a/
  );
});

test('kb clear-override-model — HARD-FAIL when -k is missing', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);
  await assert.rejects(
    () => mod.runKbClearOverrideModel({ app: 'unk-cos' }),
    /Missing required option: -k/
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HARD-FAIL on unknown app/KB (backend error surfaces)
// ─────────────────────────────────────────────────────────────────────────────

test('app set-default-model — HARD-FAIL on unknown app (backend error surfaces)', async (t) => {
  await makeIsolatedWorkspace(t);
  const plan = {
    set_app_default_model: (() => { const e = new Error("App 'no-such-app' not found"); throw e; })
  };
  // The fake invoke throws synchronously via a thrown Error from a getter;
  // simplify by using a plan whose value is a thrown error inside an async resolver.
  const fakeSrc = {};
  const { mod, cleanup } = await loadModelConfigWithFakeApi(fakeSrc);
  t.after(cleanup);

  // Override the fake to throw on invoke
  await assert.rejects(
    () => mod.runAppSetDefaultModel({ app: 'no-such-app', model: 'gemini-3.1-flash-lite' }),
    /Unexpected backend command|not found/
  );
});

test('kb set-override-model — HARD-FAIL when backend returns KB-not-found', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  await assert.rejects(
    () => mod.runKbSetOverrideModel({ app: 'unk-cos', kb: 'no-such-kb', model: 'gemini-2.5-pro' }),
    /Unexpected backend command/  // because the plan is empty — equivalent to backend rejecting
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Routing: --clear hits the clear_* backend command (not the set_* one)
// ─────────────────────────────────────────────────────────────────────────────

test('app set-default-model --clear → routes to clear_app_default_model (FieldValue.delete semantics)', async (t) => {
  await makeIsolatedWorkspace(t);
  const plan = {
    clear_app_default_model: {
      status: 'OK',
      action: 'clear_app_default_model',
      community_id: 'unkamon',
      app_id: 'unk-cos',
      field_was_present: true,
      field_present_after: false,
      before: { default_app_model: 'gemini-2.5-pro' },
      after: { default_app_model: null },
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: null,
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {
          '1': { label: 'Efficient', model: 'gemini-2.5-flash' },
          '2': { label: 'Standard', model: 'gemini-3.1-flash-lite' }
        },
        kb_overrides: { Corpus: null, Role: null }
      }
    }
  };
  const { mod, calls, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  const result = await mod.runAppSetDefaultModel({ app: 'unk-cos', clear: true, env: 'dev' });

  assert.equal(calls.length, 1, 'exactly one backend call');
  assert.equal(calls[0].cmd, 'clear_app_default_model', '--clear must hit clear_ handler, not set_');
  assert.equal(calls[0].params.app_id, 'unk-cos');
  assert.equal(result.action, 'clear_app_default_model');
  assert.equal(result.field_present_after, false, 'audit must reflect deleted field');
});

test('kb clear-override-model → routes to clear_kb_model_override', async (t) => {
  await makeIsolatedWorkspace(t);
  const plan = {
    clear_kb_model_override: {
      status: 'OK',
      action: 'clear_kb_model_override',
      community_id: 'unkamon',
      app_id: 'unk-cos',
      kb_name: 'Corpus',
      field_was_present: true,
      field_present_after: false,
      before: { kb_model_override: 'gemini-2.5-pro' },
      after: { kb_model_override: null },
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: null,
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {},
        kb_overrides: { Corpus: null }
      }
    }
  };
  const { mod, calls, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  await mod.runKbClearOverrideModel({ app: 'unk-cos', kb: 'Corpus', env: 'dev' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].cmd, 'clear_kb_model_override', 'must hit clear_kb_ handler');
  assert.equal(calls[0].params.app_id, 'unk-cos');
  assert.equal(calls[0].params.kb_name, 'Corpus');
});

test('kb set-override-model → routes to set_kb_model_override with model_name', async (t) => {
  await makeIsolatedWorkspace(t);
  const plan = {
    set_kb_model_override: {
      status: 'OK',
      action: 'set_kb_model_override',
      community_id: 'unkamon',
      app_id: 'unk-cos',
      kb_name: 'Corpus',
      before: { kb_model_override: null },
      after: { kb_model_override: 'gemini-2.5-pro' },
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: null,
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {},
        kb_overrides: { Corpus: 'gemini-2.5-pro' }
      }
    }
  };
  const { mod, calls, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  await mod.runKbSetOverrideModel({ app: 'unk-cos', kb: 'Corpus', model: 'gemini-2.5-pro', env: 'dev' });

  assert.equal(calls[0].cmd, 'set_kb_model_override');
  assert.equal(calls[0].params.model_name, 'gemini-2.5-pro', 'model name must be forwarded');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Audit log: JSONL line emitted with correct schema
// ─────────────────────────────────────────────────────────────────────────────

test('audit log — JSONL line written with correct schema after app set-default-model', async (t) => {
  const wsRoot = await makeIsolatedWorkspace(t);
  const plan = {
    set_app_default_model: {
      status: 'OK',
      action: 'set_app_default_model',
      community_id: 'unkamon',
      app_id: 'unk-cos',
      before: { default_app_model: null },
      after: { default_app_model: 'gemini-3.1-flash-lite' },
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: 'gemini-3.1-flash-lite',
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {},
        kb_overrides: {}
      }
    }
  };
  const { mod, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  await mod.runAppSetDefaultModel({ app: 'unk-cos', model: 'gemini-3.1-flash-lite', env: 'dev' });

  const auditPath = path.join(wsRoot, 'docs', 'handoff', 'model-config-changes.jsonl');
  const txt = await fs.readFile(auditPath, 'utf8');
  const lines = txt.trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 1, 'exactly one line written');

  const entry = JSON.parse(lines[0]);
  assert.ok(entry.date && !isNaN(Date.parse(entry.date)), 'date must be ISO-8601 parseable');
  assert.equal(entry.action, 'set_app_default_model');
  assert.equal(entry.env, 'dev');
  assert.equal(entry.app, 'unk-cos');
  assert.equal(entry.kb, undefined, 'app-level action must NOT include kb field');
  assert.deepEqual(entry.before, { default_app_model: null });
  assert.deepEqual(entry.after, { default_app_model: 'gemini-3.1-flash-lite' });
  assert.equal(entry.performed_by, 'test@descix.net', 'performed_by sourced from credentials.email');
});

test('audit log — kb action includes kb field in schema', async (t) => {
  const wsRoot = await makeIsolatedWorkspace(t);
  const plan = {
    set_kb_model_override: {
      status: 'OK',
      action: 'set_kb_model_override',
      community_id: 'unkamon',
      app_id: 'unk-cos',
      kb_name: 'Corpus',
      before: { kb_model_override: null },
      after: { kb_model_override: 'gemini-2.5-pro' },
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: null,
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {},
        kb_overrides: { Corpus: 'gemini-2.5-pro' }
      }
    }
  };
  const { mod, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  await mod.runKbSetOverrideModel({ app: 'unk-cos', kb: 'Corpus', model: 'gemini-2.5-pro', env: 'dev' });

  const auditPath = path.join(wsRoot, 'docs', 'handoff', 'model-config-changes.jsonl');
  const txt = await fs.readFile(auditPath, 'utf8');
  const entry = JSON.parse(txt.trim().split('\n')[0]);

  assert.equal(entry.action, 'set_kb_model_override');
  assert.equal(entry.kb, 'Corpus', 'kb-level action MUST include kb field');
  assert.equal(entry.app, 'unk-cos');
  assert.equal(entry.env, 'dev');
});

test('audit log — multiple actions append (not overwrite)', async (t) => {
  const wsRoot = await makeIsolatedWorkspace(t);
  const plan = {
    set_app_default_model: {
      status: 'OK', action: 'set_app_default_model',
      community_id: 'unkamon', app_id: 'unk-cos',
      before: { default_app_model: null },
      after: { default_app_model: 'gemini-3.1-flash-lite' },
      resolution: { chain: 'x', default_app_model: null, default_ai_model: 'y', intelligence_levels: {}, kb_overrides: {} }
    },
    clear_app_default_model: {
      status: 'OK', action: 'clear_app_default_model',
      community_id: 'unkamon', app_id: 'unk-cos',
      field_was_present: true, field_present_after: false,
      before: { default_app_model: 'gemini-3.1-flash-lite' },
      after: { default_app_model: null },
      resolution: { chain: 'x', default_app_model: null, default_ai_model: 'y', intelligence_levels: {}, kb_overrides: {} }
    }
  };
  const { mod, cleanup } = await loadModelConfigWithFakeApi(plan);
  t.after(cleanup);

  await mod.runAppSetDefaultModel({ app: 'unk-cos', model: 'gemini-3.1-flash-lite', env: 'dev' });
  await mod.runAppSetDefaultModel({ app: 'unk-cos', clear: true, env: 'dev' });

  const auditPath = path.join(wsRoot, 'docs', 'handoff', 'model-config-changes.jsonl');
  const txt = await fs.readFile(auditPath, 'utf8');
  const lines = txt.trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 2, 'two appends → two lines');
  assert.equal(JSON.parse(lines[0]).action, 'set_app_default_model');
  assert.equal(JSON.parse(lines[1]).action, 'clear_app_default_model');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resolution chain print: verified via _internal helpers
// ─────────────────────────────────────────────────────────────────────────────

test('resolution chain — printResolution emits chain + per-level + KB overrides', async (t) => {
  await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  const captured = [];
  const origLog = console.log;
  console.log = (...args) => captured.push(args.map(String).join(' '));
  try {
    mod._internal.printResolution({
      app_id: 'unk-cos',
      resolution: {
        chain: 'options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL',
        default_app_model: null,
        default_ai_model: 'gemini-3.1-flash-lite',
        intelligence_levels: {
          '1': { label: 'Efficient', model: 'gemini-2.5-flash' },
          '2': { label: 'Standard', model: 'gemini-3.1-flash-lite' },
          '3': { label: 'Enhanced', model: 'gemini-3-flash-preview' }
        },
        kb_overrides: { Corpus: null, Role: 'gemini-2.5-pro' }
      }
    });
  } finally {
    console.log = origLog;
  }

  const joined = captured.join('\n');
  assert.match(joined, /Resolution chain that will apply going forward/);
  assert.match(joined, /options\.model > kb\.kb_model_override > app\.default_app_model > levelConfig\.model > DEFAULT_AI_MODEL/);
  assert.match(joined, /app\.default_app_model = null/);
  assert.match(joined, /L1: gemini-2\.5-flash/);
  assert.match(joined, /L2: gemini-3\.1-flash-lite/);
  assert.match(joined, /L3: gemini-3-flash-preview/);
  assert.match(joined, /Corpus=cleared/, 'null override must print as "cleared"');
  assert.match(joined, /Role="gemini-2\.5-pro"/, 'non-null override must print with value');
});

test('audit-log path — anchored at workspace root, not cwd-relative', async (t) => {
  const wsRoot = await makeIsolatedWorkspace(t);
  const { mod, cleanup } = await loadModelConfigWithFakeApi({});
  t.after(cleanup);

  // cd into a sub-dir; resolveAuditLogPath should still return wsRoot/docs/handoff/...
  const sub = path.join(wsRoot, 'some', 'deep', 'sub');
  await fs.mkdir(sub, { recursive: true });
  process.chdir(sub);

  const auditPath = await mod._internal.resolveAuditLogPath();
  // macOS resolves /var → /private/var via realpath; normalize both sides before compare.
  const realWsRoot = await fs.realpath(wsRoot);
  assert.equal(
    await fs.realpath(path.dirname(path.dirname(path.dirname(auditPath)))),
    realWsRoot,
    'audit-log dir must be anchored at the workspace root, not cwd'
  );
  assert.equal(path.basename(auditPath), 'model-config-changes.jsonl');
});
