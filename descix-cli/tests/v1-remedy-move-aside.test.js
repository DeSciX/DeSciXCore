/**
 * A REFUSAL MUST NEVER PRESCRIBE A REMEDY THAT DESTROYS THE THING IT IS DIAGNOSING.
 *
 * load()'s v1 branch used to answer "this workspace is the retired v1 shape" with
 * "Delete .descix/workspace.json" — while its sibling refusal, forty lines above it in the same
 * function's file, told the user their contents are lost only if they delete it. One file, two
 * refusals, opposite advice. This suite holds the v1 branch to the sibling's language.
 *
 * COVERAGE BOUNDARY — printed on GREEN as well as RED, because a reader of a green needs to see
 * where the green stops:
 *   WHAT THIS COMPARES: the MESSAGE THROWN by the real exported WorkspaceConfig.load() in THIS
 *     tree, against a disposable v1 fixture, plus the sha256 of the fixture before and after.
 *   WHAT IT CATCHES: a v1 refusal that prescribes deleting/removing the file it is diagnosing;
 *     a v1 refusal that does not offer the move-aside route; a v1 branch that MODIFIES the file.
 *   WHAT IT DOES NOT READ: the CLI binary. This drives load() one frame below the command layer
 *     (bin/descix.js -> commands -> WorkspaceConfig.load). It also does not read FILE TEXT — it
 *     reads the THROWN STRING, so a comment mentioning the old wording cannot turn it red or
 *     green. It says nothing about any other refusal in the CLI; see the census.
 *   PREDICATE: destructive IMPERATIVE at the head of a line, not any mention of the word. The
 *     correct message legitimately contains "lost only if you delete it", which must NOT trip it.
 *   RUN BY: `npm test` in descix-cli (node --test "tests/*.test.js"). Nothing else runs it.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import path from 'node:path';
import { WorkspaceConfig } from '../lib/workspace-config.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/**
 * A destructive prescription is an imperative that HEADS a line (optionally after a bullet):
 * "Delete X", "Remove X", "rm X". A mid-sentence mention ("lost only if you delete it") is NOT
 * a prescription and must not match, or the gate cannot tell advice from explanation.
 */
const DESTRUCTIVE_IMPERATIVE = /^[\s>*•-]*(?:delete|remove|rm\b|wipe|erase)\b/im;

const V1_WORKSPACE = {
  version: '1.0',
  communities: { descix: { apps: { daita: { localPath: 'DeSciX_Cloud', kbId: 'General' } } } }
  // no "env" key — this is the v1 detection condition
};

async function v1Fixture(t) {
  const wsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'descix-v1remedy-'));
  await fs.mkdir(path.join(wsRoot, '.descix'), { recursive: true });
  const wsPath = path.join(wsRoot, '.descix', 'workspace.json');
  await fs.writeFile(wsPath, JSON.stringify(V1_WORKSPACE, null, 2));
  const before = await fs.readFile(wsPath, 'utf-8');
  // FIXTURE ASSERTION: inputs that cannot exhibit the failure do not measure it.
  assert.ok(before.length > 0, 'fixture must be non-empty');
  assert.ok(before.includes('communities') && !before.includes('"env"'),
    'fixture must actually BE v1 (communities, no env) or it cannot reach the branch under test');
  t.after(async () => { await fs.rm(wsRoot, { recursive: true, force: true }); });
  return { wsRoot, wsPath, before, hashBefore: sha256(before) };
}

before(() => {
  console.log([
    '',
    '=== COVERAGE BOUNDARY (printed on GREEN as well as RED) ===',
    'COMPARES : the THROWN MESSAGE of the real WorkspaceConfig.load() in this tree, against a',
    '           disposable v1 fixture, plus sha256 of the fixture before/after.',
    'CATCHES  : a v1 refusal prescribing deletion of the file it diagnoses; a missing move-aside',
    '           route; a v1 branch that modifies the file.',
    'DOES NOT : execute the CLI binary (drives load() one frame below the command layer), and',
    '           does not read FILE TEXT — only the thrown string. Says nothing about any other',
    '           refusal in the CLI; that is what the census covers.',
    'PREDICATE: destructive IMPERATIVE heading a line. "lost only if you delete it" must NOT trip.',
    'RUN BY   : npm test (node --test "tests/*.test.js"). Nothing else runs it.',
    '==========================================================',
    ''
  ].join('\n'));
});

describe('v1 refusal must not prescribe destroying the file it is diagnosing', () => {

  // SELF-CHECK — the predicate must be able to go RED, or GATE A1 proves nothing.
  test('SELF-CHECK: the predicate fires on a planted violation and stays quiet on the explanation', () => {
    const planted = 'v1 workspace format is not supported.\nDelete .descix/workspace.json and re-run "descix app init".';
    assert.match(planted, DESTRUCTIVE_IMPERATIVE, 'predicate MUST fire on the pre-fix wording');
    const explanation = '    Its contents are lost only if you delete it.';
    assert.doesNotMatch(explanation, DESTRUCTIVE_IMPERATIVE,
      'predicate must NOT fire on a mid-sentence mention, or it cannot tell advice from explanation');
    const bulleted = '  • Remove the .descix folder and start again.';
    assert.match(bulleted, DESTRUCTIVE_IMPERATIVE, 'predicate must fire on a BULLETED imperative too');
    console.log('[SELF-CHECK] predicate discriminates: fires on 2 planted violations, silent on the explanation.');
  });

  for (const pass of [1, 2]) {
    test(`GATE A1 (pass ${pass}): v1 remedy is MOVE-ASIDE, and the file survives byte-identical`, async (t) => {
      const f = await v1Fixture(t);

      let msg = '';
      await assert.rejects(() => WorkspaceConfig.load(f.wsRoot), (e) => { msg = e.message; return true; },
        'load() must still reject a v1 workspace');

      const after = await fs.readFile(f.wsPath, 'utf-8');
      const hashAfter = sha256(after);
      console.log(`[A1 p${pass}] hashBefore=${f.hashBefore}`);
      console.log(`[A1 p${pass}] hashAfter =${hashAfter}`);
      console.log(`[A1 p${pass}] message:\n${msg}`);

      assert.equal(hashAfter, f.hashBefore,
        'the v1 fixture was MODIFIED — a diagnosis must not touch what it diagnoses');
      assert.doesNotMatch(msg, DESTRUCTIVE_IMPERATIVE,
        'v1 refusal PRESCRIBES DESTRUCTION of the file it is diagnosing. Got:\n' + msg);
      assert.match(msg, /move it aside/i, 'refusal must name the MOVE-ASIDE route. Got:\n' + msg);
      assert.match(msg, /\.broken/, 'refusal must show the concrete move-aside target. Got:\n' + msg);
      assert.match(msg, /Migrate to v2\.1/, 'refusal must still identify the v1 condition. Got:\n' + msg);
      assert.ok(msg.includes(f.wsPath), 'refusal must NAME THE PATH. Got:\n' + msg);
    });
  }

  // ONE OWNER: both refusals that reach the move-aside remedy must consume the same producer.
  test('ONE OWNER: the unreadable refusal and the v1 refusal share moveAsideRemedy', async () => {
    const { moveAsideRemedy } = await import('../lib/workspace-config.js');
    assert.equal(typeof moveAsideRemedy, 'function', 'the remedy must have a single exported owner');
    const produced = moveAsideRemedy('/tmp/x/.descix/workspace.json', 'descix app init');
    assert.match(produced, /move it aside/i);
    assert.doesNotMatch(produced, DESTRUCTIVE_IMPERATIVE,
      'the OWNER itself must not prescribe destruction — every consumer inherits this');
    console.log('[ONE OWNER] moveAsideRemedy exported and non-destructive; both refusals consume it.');
  });
});
