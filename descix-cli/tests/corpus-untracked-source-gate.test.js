/**
 * Corpus source gate — "every served source is TRACKED BY GIT AT ITS REF".
 *
 * Contract: contract-sub-devplane-corpus-sync-gitignored-source-gate-2026-09-10.
 * Defect:   defect-corpus-sync-ships-gitignored-scratch-as-kb-source-2026-09-10.
 *
 * MEASURED DEFECT this suite exists to hold closed: corpus:04406066... was served as a
 * citable KB source in unk-beast/EVP-DeSciX and resolved by exact hash to
 * `.claude/agent-memory/evp-descix/qa-pairs.jsonl` — a path .gitignore:99 deliberately
 * excludes as private per-thread scratch. Mechanism, read in code (CorpusWalker.js,
 * pre-fix computeBlobSha lines 74-96): `git rev-parse {ref}:{path}` FAILS for an
 * untracked path, and the catch fell back to `git hash-object {absolutePath}` — hashing
 * the WORKING TREE. Content git was told to exclude was chunked and served.
 *
 * THE FIXTURE IS PART OF THE GATE. Each temp repo below carries a REAL committed
 * `.gitignore` and a REAL ignored file on disk, so the fixture can actually exhibit the
 * failure: on pre-fix code the ignored file IS accepted and these tests FAIL (RED).
 * A fixture whose files were all tracked could never trip the bug however green it ran.
 *
 * Run: `node --test tests/corpus-untracked-source-gate.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { loadManifest } from '../lib/core/ManifestLoader.js';
import { walkCorpus } from '../lib/core/CorpusWalker.js';

const SHA40 = /^[0-9a-f]{40}$/;

/**
 * Build a temp git repo on branch `main` with:
 *   - content/tracked.md      — committed (the positive control)
 *   - .gitignore              — committed, excluding `scratch/`
 *   - scratch/private.jsonl   — ON DISK, IGNORED, never committed (the defect fixture)
 *   - loose/uncommitted.md    — ON DISK, untracked but NOT ignored (population (b))
 *
 * The .gitignore is COMMITTED rather than merely present, so the exclusion is a property
 * of the ref under test rather than of the checkout.
 */
async function mkRepo(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  execSync('git init -q -b main', { cwd: root });
  execSync('git config user.email t@t.t && git config user.name t', { cwd: root, shell: '/bin/bash' });

  await fs.mkdir(path.join(root, 'content'), { recursive: true });
  await fs.writeFile(path.join(root, 'content', 'tracked.md'), '# Tracked\n\nthis is committed content\n');
  await fs.writeFile(path.join(root, '.gitignore'), 'scratch/\n');
  execSync('git add -A && git commit -q -m init', { cwd: root, shell: '/bin/bash' });

  // AFTER the commit: the ignored scratch file and a loose untracked file.
  await fs.mkdir(path.join(root, 'scratch'), { recursive: true });
  await fs.writeFile(path.join(root, 'scratch', 'private.jsonl'), '{"q":"secret","a":"scratch"}\n');
  await fs.mkdir(path.join(root, 'loose'), { recursive: true });
  await fs.writeFile(path.join(root, 'loose', 'uncommitted.md'), '# Not committed yet\n');

  return root;
}

async function writeManifest(root, kbName, sources) {
  const mdir = path.join(root, '.descix', 'manifests');
  await fs.mkdir(mdir, { recursive: true });
  const p = path.join(mdir, `${kbName}.json`);
  await fs.writeFile(p, JSON.stringify({ kb_name: kbName, sources }, null, 2));
  return p;
}

// ───────────────────────── FIXTURE SELF-CHECK ─────────────────────────
// A fixture that cannot exhibit the failure does not measure the failure. Prove, from
// git itself, that the scratch file really is ignored and really is absent from the ref
// BEFORE any test leans on that being true.

test('fixture self-check: the scratch file is genuinely gitignored and absent from ref main', async () => {
  const root = await mkRepo('gate-fixture-');

  const ignored = execSync('git check-ignore -v scratch/private.jsonl', { cwd: root, encoding: 'utf-8' });
  assert.match(ignored, /\.gitignore:1:scratch\//, 'fixture must be excluded by a COMMITTED .gitignore rule');

  assert.throws(
    () => execSync('git rev-parse "main:scratch/private.jsonl"', { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }),
    'fixture must NOT resolve at ref main — otherwise the gate has nothing to refuse'
  );

  // And it IS hashable from the working tree — i.e. the deleted fallback WOULD have
  // succeeded on it. That is precisely what made the defect silent.
  const wt = execSync('git hash-object scratch/private.jsonl', { cwd: root, encoding: 'utf-8' }).trim();
  assert.match(wt, SHA40, 'fixture must be hashable from the working tree (the pre-fix fallback path)');
});

// ───────────────────────── THE GATE (RED on pre-fix code) ─────────────────────────

test('a GITIGNORED file named as a manifest source is REFUSED BY NAME', async () => {
  const root = await mkRepo('gate-ignored-');
  const mp = await writeManifest(root, 'Ignored', [
    { path: 'content', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
    { path: 'scratch/private.jsonl', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /scratch\/private\.jsonl/, 'refusal must name the offending PATH');
      assert.match(err.message, /main/, 'refusal must name the REF it was not tracked at');
      assert.match(err.message, /ignore/i, 'refusal must give the REASON — that git ignores this path');
      return true;
    },
    'a gitignored source MUST be refused, never silently chunked from the working tree'
  );
});

test('an UNTRACKED (not ignored) file named as a manifest source is REFUSED BY NAME', async () => {
  // Population (b): a file the developer simply has not committed yet. The property is
  // "tracked at ref" — ONE predicate, no second derivation of "what is a corpus source".
  const root = await mkRepo('gate-untracked-');
  const mp = await writeManifest(root, 'Loose', [
    { path: 'loose/uncommitted.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /loose\/uncommitted\.md/, 'refusal must name the offending PATH');
      assert.match(err.message, /main/, 'refusal must name the REF');
      return true;
    },
    'an untracked source MUST be refused — "tracked at ref" is the whole predicate'
  );
});

test('a gitignored file reached by walking a DIRECTORY source is REFUSED too', async () => {
  // The real instance was an explicit file source, but a directory source walks the
  // filesystem (walkDir consults `syncignore`, never .gitignore) and would sweep the
  // same content in. Both entry paths must land on the same predicate.
  const root = await mkRepo('gate-dirwalk-');
  await fs.writeFile(path.join(root, 'content', 'sneaky.md'), '# ignored-by-git, inside a walked dir\n');
  await fs.appendFile(path.join(root, '.gitignore'), 'content/sneaky.md\n');
  execSync('git add .gitignore && git commit -q -m ignore-sneaky', { cwd: root, shell: '/bin/bash' });

  const mp = await writeManifest(root, 'DirWalk', [
    { path: 'content', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /sneaky\.md/, 'refusal must name the file found by the directory walk');
      return true;
    },
    'a directory source must not launder a gitignored file into the corpus'
  );
});

test('the refusal AGGREGATES every offending file, not just the first', async () => {
  const root = await mkRepo('gate-aggregate-');
  const mp = await writeManifest(root, 'Many', [
    { path: 'scratch/private.jsonl', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
    { path: 'loose/uncommitted.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /scratch\/private\.jsonl/, 'must name the first offender');
      assert.match(err.message, /loose\/uncommitted\.md/, 'must ALSO name the second offender');
      return true;
    },
    'one aggregated refusal listing every offender — mirrors CorpusDenyLint::assertNoViolations'
  );
});

test('a file PRESENT AT HEAD but ABSENT AT THE PINNED REF is refused, and says so', async () => {
  // Population (c). Diagnosed BEFORE the ignore check, because .gitignore patterns do
  // not apply to tracked files and would misdiagnose this case.
  const root = await mkRepo('gate-oldref-');
  const firstCommit = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim();
  await fs.writeFile(path.join(root, 'content', 'added-later.md'), '# Added after the pinned ref\n');
  execSync('git add -A && git commit -q -m later', { cwd: root, shell: '/bin/bash' });

  const mp = await writeManifest(root, 'OldRef', [
    { path: 'content/added-later.md', ref: firstCommit, tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /added-later\.md/, 'must name the path');
      assert.match(err.message, /ABSENT AT REF/, 'must diagnose population (c) specifically');
      assert.doesNotMatch(err.message, /IGNORED BY GIT/, 'must NOT misdiagnose a tracked file as ignored');
      return true;
    },
    'a file absent at the pinned ref must be refused with the old-ref diagnostic'
  );
});

test('the refusal names the MANIFEST FILE and the offending ENTRY, so it is fixable in one act', async () => {
  const root = await mkRepo('gate-selfcure-');
  const mp = await writeManifest(root, 'SelfCure', [
    { path: 'scratch/private.jsonl', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /SelfCure\.json/, 'must name the MANIFEST FILE to edit');
      assert.match(err.message, /manifest entry/, 'must point at the offending sources[] entry');
      assert.match(err.message, /SelfCure/, 'must name the KB');
      return true;
    },
    'whoever owns the manifest must be able to fix it from the error text alone'
  );
});

// ───────────────────────── POSITIVE CONTROL ─────────────────────────
// The predicate must DISCRIMINATE: it has to read differently on the two states, or a
// green means nothing.

test('POSITIVE CONTROL: a manifest whose sources are all TRACKED syncs normally', async () => {
  const root = await mkRepo('gate-positive-');
  const mp = await writeManifest(root, 'Clean', [
    { path: 'content', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  const { files, commitSha } = await walkCorpus(manifest, root);
  assert.equal(files.length, 1, 'the one tracked file must still be walked');
  assert.equal(files[0].relative_path, path.join('content', 'tracked.md'));
  assert.match(files[0].blob_sha, SHA40, 'a tracked file still gets its blob sha');
  assert.match(commitSha, SHA40);

  // And that sha is the COMMITTED blob, not a working-tree hash.
  const fromRef = execSync('git rev-parse "main:content/tracked.md"', { cwd: root, encoding: 'utf-8' }).trim();
  assert.equal(files[0].blob_sha, fromRef, 'the sha must come from the ref, not from the working tree');
});

test('POSITIVE CONTROL: a tracked file MODIFIED in the working tree syncs at its REF sha', async () => {
  // Proves the gate keys on "tracked at ref" and did not become "the working tree is clean".
  const root = await mkRepo('gate-dirty-');
  const refSha = execSync('git rev-parse "main:content/tracked.md"', { cwd: root, encoding: 'utf-8' }).trim();
  await fs.writeFile(path.join(root, 'content', 'tracked.md'), '# Tracked\n\nLOCALLY MODIFIED, uncommitted\n');

  const mp = await writeManifest(root, 'Dirty', [
    { path: 'content', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  const { files } = await walkCorpus(manifest, root);
  assert.equal(files.length, 1, 'a dirty-but-tracked file is NOT refused');
  assert.equal(files[0].blob_sha, refSha, 'and it syncs at the committed sha, ignoring local edits');
});

// ───────────────────────── SUPER-DRY: the old path is GONE ─────────────────────────

test('the working-tree `git hash-object` fallback is DELETED, not fenced', async () => {
  // SUPER-DRY (CEO-D-2026-07-26): the superseded path is deleted in the same change and
  // there is no flag that restores it. Read the SOURCE this suite imports — the
  // executing artifact — not a bundle.
  const src = await fs.readFile(
    path.join(import.meta.dirname, '..', 'lib', 'core', 'CorpusWalker.js'),
    'utf-8'
  );
  assert.doesNotMatch(
    src, /hash-object/,
    'CorpusWalker must contain NO `git hash-object` call — the working-tree fallback IS the defect'
  );
  assert.doesNotMatch(
    src, /allow[_-]?untracked|force[_-]?untracked|skip[_-]?tracked[_-]?check/i,
    'no compat fence / opt-out flag may restore the deleted path'
  );
});
