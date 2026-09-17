/**
 * The staged-contribution owner (createContributionStage).
 *
 * Measured defect this guards (2026-09-17): media staged by DeSciX.chat.sendMedia and an
 * action_result 'send' issued in the same task — the submitted turn carried only the result,
 * and the staged media was then wiped. Staging must be visible to a send issued immediately,
 * and a send must release only what it carried.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createContributionStage, mediaContribution, actionResultContribution, normalizeContribution, collectTurnMedia } from '../src/util/chatIngress.js';

const media = { data: 'AAAA', mime_type: 'video/mp4', label: 'flight' };

test('a stage followed by a send in the same task rides ONE turn (no await, no render)', () => {
  const renders = [];
  const stage = createContributionStage((list) => renders.push(list));
  const staged = stage.stage(normalizeContribution(mediaContribution([media], { note: 'flight' })));
  const result = normalizeContribution(actionResultContribution('recordFlight', { ok: true }, { disposition: 'send' }));
  const batch = [...stage.current(), result];
  assert.equal(batch.length, 2);
  assert.equal(batch[0], staged);
  assert.equal(collectTurnMedia(batch).length, 1, 'the staged media must be in the submitted turn');
});

test('release drops exactly what the turn carried; a bag staged while the turn was in flight survives', () => {
  const stage = createContributionStage(() => {});
  const a = stage.stage(normalizeContribution(mediaContribution([media])));
  const carried = [...stage.current()];
  const b = stage.stage(normalizeContribution(mediaContribution([media], { note: 'arrived mid-turn' })));
  stage.release(carried);
  assert.deepEqual(stage.current(), [b]);
  assert.ok(!stage.current().includes(a));
});

test('remove deletes one chip by identity; every change publishes the new list for render', () => {
  const published = [];
  const stage = createContributionStage((list) => published.push(list));
  const a = stage.stage(normalizeContribution(mediaContribution([media])));
  const b = stage.stage(normalizeContribution(mediaContribution([media])));
  stage.remove(a);
  assert.deepEqual(stage.current(), [b]);
  assert.equal(published.length, 3);
  assert.deepEqual(published.at(-1), [b]);
});

test('ChatWidget reads and clears staging only through the owner (no render-refreshed ref, no blanket clear)', () => {
  const src = fs.readFileSync(new URL('../src/components/ChatWidget.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /pendingContributionsRef/);
  assert.doesNotMatch(src, /setPendingContributions\(\s*\[\s*\]\s*\)/);
  const setterUses = src.match(/setPendingContributions/g) || [];
  assert.equal(setterUses.length, 2, 'the setter appears only in its declaration and as the owner\'s render mirror');
  assert.match(src, /contributionStage\.release\(contributions\)/);
});
