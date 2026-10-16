/**
 * Gates for @descix/platform-api/mcp-tools/cli-verbs.generated.json — the CLI verb list
 * (verb path, description, arguments, options, runbook anchor) generated from the LIVE
 * commander tree of bin/descix.js and served by Cloud's tell_me_how.
 *
 *  1. FRESHNESS: regenerating from the current bin/descix.js reproduces the committed file.
 *  2. ANCHORS ARE TRUE: every runbook anchor declared beside a verb is an anchor the runbook
 *     source renders (DeSciX/V2_docs/app-sdk/app-developer-runbook.md, slug rule in
 *     scripts/lib/runbook-anchors.mjs).
 *  3. THE SLUG RULE reproduces the ids VitePress rendered on the live page (measured
 *     2026-10-16 at https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html).
 *
 * Run: `node --test tests/cli-verbs-generated.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCliVerbList, serializeCliVerbs, CLI_VERBS_GENERATED_PATH } from '../scripts/lib/cli-verb-list.mjs';
import {
  vitepressSlug, runbookHeadingAnchors, readRunbookAnchors, unknownRunbookAnchors,
} from '../scripts/lib/runbook-anchors.mjs';
import { DescixCommand } from '../lib/descix-command.js';

const fresh = buildCliVerbList();

test('cli-verbs.generated.json is fresh (regenerating from bin/descix.js reproduces it exactly)', () => {
  assert.ok(fs.existsSync(CLI_VERBS_GENERATED_PATH), `${CLI_VERBS_GENERATED_PATH} does not exist. Run: npm run generate:cli-verbs`);
  assert.equal(
    serializeCliVerbs(fresh), fs.readFileSync(CLI_VERBS_GENERATED_PATH, 'utf8'),
    'cli-verbs.generated.json is STALE. Run: npm run generate:cli-verbs'
  );
});

test('every declared runbook anchor is a heading the runbook renders', () => {
  const anchored = fresh.filter((v) => v.runbookAnchor !== null);
  assert.ok(anchored.length > 0, 'no verb declares a runbook anchor — the gate would measure nothing');
  assert.deepEqual(unknownRunbookAnchors(fresh, readRunbookAnchors()), [],
    'these verbs declare an anchor the runbook does not render (fix the declaration in bin/descix.js, or the heading)');
});

test('the anchors declared for serve and set-site are the ones measured on the live page', () => {
  const byPath = new Map(fresh.map((v) => [v.verbPath, v]));
  assert.equal(byPath.get('serve')?.runbookAnchor, '#_5-run-it-locally-descix-serve');
  assert.equal(byPath.get('app set-site')?.runbookAnchor, '#_5-run-it-locally-descix-serve');
});

test('a verb with no runbook section carries null, never a placeholder', () => {
  for (const v of fresh) {
    assert.ok(v.runbookAnchor === null || /^#\S+$/.test(v.runbookAnchor), `${v.verbPath}: ${JSON.stringify(v.runbookAnchor)}`);
  }
  assert.ok(fresh.some((v) => v.runbookAnchor === null), 'every verb has an anchor — the null case is unmeasured');
});

test('slug rule reproduces the VitePress ids measured on the live runbook page', () => {
  const measured = [
    ['App Developer Runbook', 'app-developer-runbook'],
    ['5. Run it locally: descix serve', '_5-run-it-locally-descix-serve'],
    ['5.1 Preview a scratch directory in the shell', '_5-1-preview-a-scratch-directory-in-the-shell'],
    ['An app that already exists (the usual clone path)', 'an-app-that-already-exists-the-usual-clone-path'],
    ['7.3 share.json — the link-preview card', '_7-3-share-json-—-the-link-preview-card'],
    ['10. The whole path in eleven commands', '_10-the-whole-path-in-eleven-commands'],
  ];
  for (const [text, id] of measured) assert.equal(vitepressSlug(text), id, text);
});

test('heading scan: code spans keep content, fenced "#" lines are not headings, duplicates suffix', () => {
  const md = [
    '## 5. Run it locally: `descix serve`',
    '```bash',
    '# {"mode":"standalone"}',
    '```',
    '## Verify',
    '### Verify',
  ].join('\n');
  assert.deepEqual(runbookHeadingAnchors(md).map((h) => h.anchor),
    ['#_5-run-it-locally-descix-serve', '#verify', '#verify-1']);
});

test('heading scan refuses markup it cannot render instead of guessing', () => {
  assert.throws(() => runbookHeadingAnchors('## A *bold* claim'), /inline markup/);
  assert.throws(() => runbookHeadingAnchors('## A [link](x)'), /inline markup/);
  assert.throws(() => runbookHeadingAnchors('Setext\n------'), /setext/);
  assert.throws(() => readRunbookAnchors('/nonexistent/runbook.md'), /not at \/nonexistent/);
});

test('runbookAnchor declarations fail loud on a malformed or second anchor', () => {
  const cmd = new DescixCommand('x');
  assert.throws(() => cmd.runbookAnchor('_5-no-hash'), /rendered anchor/);
  assert.throws(() => cmd.runbookAnchor('#Upper'), /rendered anchor/);
  cmd.runbookAnchor('#ok');
  assert.throws(() => cmd.runbookAnchor('#again'), /declared twice/);
  assert.equal(new DescixCommand('y').declaredRunbookAnchor(), null);
  assert.ok(new DescixCommand('z').command('sub') instanceof DescixCommand, 'subcommands are DescixCommands');
});
