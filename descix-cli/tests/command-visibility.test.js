/**
 * Unit tests for the hide/show decision in lib/command-visibility.js, against a STUBBED server
 * surface (no network). Exercises the exact cases named in the design:
 *   - a verb whose every invoked command is 'admin'            -> hidden
 *   - a verb with a MIXED public+admin invoke set               -> visible
 *   - a verb with NO recorded invokes (local-only)               -> visible
 *   - `descix drive pull` / `drive push`                         -> hidden (CEO ruling, not server-derived)
 *   - a GROUP whose every child ends up hidden                   -> the group itself hidden
 *   - isHelpInvocation() recognizes --help / help / bare / bare-group, and NOT a real leaf call
 *
 * Run: `node --test tests/command-visibility.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import {
  shouldHideLeaf,
  applyVisibility,
  isHelpInvocation,
  INFRA_ADMIN_HIDDEN_PATHS,
  getVerbInvokeMap,
} from '../lib/command-visibility.js';

const REAL_MAP = getVerbInvokeMap();

test('shouldHideLeaf: every invoked command admin -> hidden', () => {
  // "community create" -> ["create_community_skeleton"] in the real generated map.
  assert.ok(REAL_MAP['community create']?.includes('create_community_skeleton'), 'fixture assumption: community create invokes create_community_skeleton');
  const surface = { create_community_skeleton: 'admin' };
  assert.equal(shouldHideLeaf('community create', surface), true);
});

test('shouldHideLeaf: mixed public+admin invoke set -> visible', () => {
  // "app set-default-model" -> [clear_app_default_model, set_app_default_model] in the real
  // generated map (real verb, real invoke list) — the SURFACE is what's stubbed, to a mixed
  // classification neither command actually carries in production, exercising the "every
  // invoked command must be admin, not just one" rule in isolation.
  assert.deepEqual(REAL_MAP['app set-default-model'], ['clear_app_default_model', 'set_app_default_model']);
  const surface = { clear_app_default_model: 'admin', set_app_default_model: 'public' };
  assert.equal(shouldHideLeaf('app set-default-model', surface), false);
});

test('shouldHideLeaf: no recorded invokes -> visible', () => {
  assert.deepEqual(REAL_MAP['app set-localpath'], [], 'fixture assumption: app set-localpath has no invokes');
  const surface = {}; // no data at all — must not matter
  assert.equal(shouldHideLeaf('app set-localpath', surface), false);
});

test('shouldHideLeaf: a command missing from the surface is never treated as admin (fails open toward visible)', () => {
  // "community create" invokes create_community_skeleton, but the surface says nothing about it.
  const surface = {};
  assert.equal(shouldHideLeaf('community create', surface), false);
});

test('shouldHideLeaf: drive pull / drive push are hidden by explicit CEO-ruling declaration, not server data', () => {
  assert.ok(INFRA_ADMIN_HIDDEN_PATHS.has('drive pull'));
  assert.ok(INFRA_ADMIN_HIDDEN_PATHS.has('drive push'));
  const surface = {}; // the server has no opinion on these — the CLI's own declaration decides
  assert.equal(shouldHideLeaf('drive pull', surface), true);
  assert.equal(shouldHideLeaf('drive push', surface), true);
});

/**
 * Build a commander tree whose verb PATHS (group name + leaf name, space-joined) match REAL
 * entries in the generated map, so applyVisibility — which reads the real VERB_INVOKES map by
 * path — is exercised end-to-end. Group 'community' has two children: 'create' (real path
 * "community create" -> ["create_community_skeleton"], all-admin under our stub) and 'list'
 * (real path "community list" -> ["find_communities"], public under our stub) — a group with
 * one hidden and one visible child, which must stay visible. Group 'credits' has two children,
 * 'grant' and 'refund' (real paths -> ["grant_credits"] / ["refund_credits"]), both all-admin
 * under our stub — a group whose every child is hidden, which must collapse.
 */
function buildFixtureProgram() {
  const program = new Command().name('descix').exitOverride();

  const community = program.command('community');
  community.command('create').action(() => {});
  community.command('list').action(() => {});

  const credits = program.command('credits');
  credits.command('grant').action(() => {});
  credits.command('refund').action(() => {});

  program.command('login').action(() => {}); // a real no-invoke leaf: stays visible regardless

  return program;
}

test('applyVisibility: hides an all-admin leaf, keeps a public leaf visible, group with a mixed child stays visible, group with all-hidden children collapses', () => {
  const program = buildFixtureProgram();
  assert.deepEqual(REAL_MAP['community create'], ['create_community_skeleton']);
  assert.deepEqual(REAL_MAP['community list'], ['find_communities']);
  assert.deepEqual(REAL_MAP['credits grant'], ['grant_credits']);
  assert.deepEqual(REAL_MAP['credits refund'], ['refund_credits']);

  const surface = {
    create_community_skeleton: 'admin',
    find_communities: 'public',
    grant_credits: 'admin',
    refund_credits: 'admin',
  };
  applyVisibility(program, surface);

  const community = program.commands.find((c) => c.name() === 'community');
  const create = community.commands.find((c) => c.name() === 'create');
  const list = community.commands.find((c) => c.name() === 'list');
  const credits = program.commands.find((c) => c.name() === 'credits');
  const grant = credits.commands.find((c) => c.name() === 'grant');
  const refund = credits.commands.find((c) => c.name() === 'refund');
  const login = program.commands.find((c) => c.name() === 'login');

  assert.equal(program._hidden, false, 'the root program must never be hidden');
  assert.equal(create._hidden, true, 'all-admin leaf must be hidden');
  assert.equal(list._hidden, false, 'public leaf must stay visible');
  assert.equal(community._hidden, false, 'a group with at least one visible child must stay visible');
  assert.equal(grant._hidden, true);
  assert.equal(refund._hidden, true);
  assert.equal(credits._hidden, true, 'a group whose every child is hidden must itself be hidden');
  assert.equal(login._hidden, false, 'a real no-invoke leaf stays visible regardless of the surface');
});

test('applyVisibility: a group is hidden when every one of its children is hidden (using drive as the real fixture)', async () => {
  // Rebuild the REAL bin/descix.js command tree is out of scope for a unit test (it performs
  // network-bound auth on import); instead we build a small tree shaped exactly like
  // `drive` -> {pull, push} and drive the SAME rule the real drive group is subject to: both
  // children are in INFRA_ADMIN_HIDDEN_PATHS, so both are hidden, and the group must collapse.
  const program = new Command().name('descix').exitOverride();
  const drive = program.command('drive');
  drive.command('pull').action(() => {});
  drive.command('push').action(() => {});

  applyVisibility(program, {});
  const driveCmd = program.commands.find((c) => c.name() === 'drive');
  const pullCmd = driveCmd.commands.find((c) => c.name() === 'pull');
  const pushCmd = driveCmd.commands.find((c) => c.name() === 'push');
  assert.equal(pullCmd._hidden, true);
  assert.equal(pushCmd._hidden, true);
  assert.equal(driveCmd._hidden, true, 'a group whose every child is hidden must itself be hidden');
});

test('applyVisibility: never REVEALS a command the CLI itself registered hidden (e.g. a retired-verb refusal), even with no generated-map entry', () => {
  const program = new Command().name('descix').exitOverride();
  // Mirrors lib/commands/retired-kb-sync.js: `program.command('sync', { hidden: true })`.
  program.command('sync', { hidden: true }).action(() => {});
  program.command('login').action(() => {});

  applyVisibility(program, {}); // empty surface; 'sync' has no generated-map entry either
  const sync = program.commands.find((c) => c.name() === 'sync');
  const login = program.commands.find((c) => c.name() === 'login');
  assert.equal(sync._hidden, true, 'a command registered hidden must stay hidden — this layer is additive only');
  assert.equal(login._hidden, false);
});

test('applyVisibility: a group with at least one visible child stays visible', () => {
  const program = new Command().name('descix').exitOverride();
  const mixed = program.command('mixedgroup');
  mixed.command('pull').action(() => {}); // shares the 'drive pull' leaf name but NOT the 'drive' parent path -> not in INFRA_ADMIN_HIDDEN_PATHS
  mixed.command('somethingelse').action(() => {});

  applyVisibility(program, {});
  const groupCmd = program.commands.find((c) => c.name() === 'mixedgroup');
  assert.equal(groupCmd._hidden, false, 'verb path "mixedgroup pull" is not the hidden "drive pull" — must not collapse');
});

// ── isHelpInvocation ──────────────────────────────────────────────────────────────────────────

function buildRealShapedProgram() {
  const program = new Command().name('descix').exitOverride();
  const app = program.command('app');
  app.command('list').action(() => {});
  app.command('init').action(() => {});
  program.command('login').action(() => {});
  return program;
}

test('isHelpInvocation: recognizes -h/--help anywhere', () => {
  const program = buildRealShapedProgram();
  assert.equal(isHelpInvocation(program, ['--help']), true);
  assert.equal(isHelpInvocation(program, ['app', '--help']), true);
  assert.equal(isHelpInvocation(program, ['app', 'list', '-h']), true);
});

test('isHelpInvocation: recognizes the bare invocation and the "help" command', () => {
  const program = buildRealShapedProgram();
  assert.equal(isHelpInvocation(program, []), true);
  assert.equal(isHelpInvocation(program, ['help']), true);
});

test('isHelpInvocation: recognizes a BARE GROUP invocation (a command with children and no action of its own)', () => {
  const program = buildRealShapedProgram();
  assert.equal(isHelpInvocation(program, ['app']), true);
});

test('isHelpInvocation: a real leaf invocation is NOT a help trigger (must stay fast/offline)', () => {
  const program = buildRealShapedProgram();
  assert.equal(isHelpInvocation(program, ['app', 'list']), false);
  assert.equal(isHelpInvocation(program, ['login']), false);
});

test('isHelpInvocation: --admin is recognized as a global boolean flag and does not itself force help', () => {
  const program = buildRealShapedProgram();
  const globalFlags = { valueFlags: ['--env', '--api-url'], booleanFlags: ['--admin'] };
  assert.equal(isHelpInvocation(program, ['--admin', 'app', 'list'], globalFlags), false);
  assert.equal(isHelpInvocation(program, ['--admin'], globalFlags), true, 'no positional left after stripping --admin -> bare invocation -> help');
});

test('isHelpInvocation: --env <value> is stripped as a value flag, not mistaken for a positional', () => {
  const program = buildRealShapedProgram();
  const globalFlags = { valueFlags: ['--env', '--api-url'], booleanFlags: ['--admin'] };
  assert.equal(isHelpInvocation(program, ['--env', 'dev', 'app', 'list'], globalFlags), false);
});
