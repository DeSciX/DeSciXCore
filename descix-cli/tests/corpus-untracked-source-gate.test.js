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
import { loadManifest, resolveOwningRepo } from '../lib/core/ManifestLoader.js';
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

// ─────────────── CROSS-REPO: the workspace is NOT one repository ───────────────
// THE FIXTURE IS PART OF THE GATE. Every fixture above uses `root` as BOTH the workspace
// root AND the only git repository, so it is structurally incapable of exhibiting the
// defect that BLOCKED the first revision: a ref resolved against the AMBIENT workspace
// root instead of the repository that owns the file. The real workspace crosses that
// boundary twice over — DeSciX/DeSciX_* are submodules (gitlinks), EGPT-research and
// FRAQTL are independent sibling checkouts the superrepo .gitignores — and 596 committed
// files were refused because of it. These fixtures reproduce both shapes.

/**
 * Workspace repo with a NESTED INDEPENDENT REPO inside it, the submodule shape:
 * the outer repo sees `inner/` only as an opaque boundary, exactly as a superrepo sees a
 * gitlink. `inner/lib/tracked.md` is COMMITTED ON `main` IN THE INNER REPO and is
 * unknown to the outer one.
 */
async function mkNestedRepos(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  execSync('git init -q -b main', { cwd: root });
  execSync('git config user.email t@t.t && git config user.name t', { cwd: root, shell: '/bin/bash' });
  await fs.mkdir(path.join(root, 'outer'), { recursive: true });
  await fs.writeFile(path.join(root, 'outer', 'super.md'), '# superrepo content\n');
  await fs.writeFile(path.join(root, '.gitignore'), 'sibling/\n');
  execSync('git add -A && git commit -q -m outer-init', { cwd: root, shell: '/bin/bash' });

  const inner = path.join(root, 'inner');
  await fs.mkdir(path.join(inner, 'lib'), { recursive: true });
  execSync('git init -q -b main', { cwd: inner });
  execSync('git config user.email t@t.t && git config user.name t', { cwd: inner, shell: '/bin/bash' });
  await fs.writeFile(path.join(inner, 'lib', 'tracked.md'), '# committed INSIDE the inner repo\n');
  await fs.writeFile(path.join(inner, 'lib', 'never-committed.md'), '# untracked in the inner repo\n');
  execSync('git add lib/tracked.md && git commit -q -m inner-init', { cwd: inner, shell: '/bin/bash' });

  // Sibling shape: an independent repo the OUTER repo .gitignores (EGPT-research/FRAQTL).
  const sibling = path.join(root, 'sibling');
  await fs.mkdir(path.join(sibling, 'docs'), { recursive: true });
  execSync('git init -q -b main', { cwd: sibling });
  execSync('git config user.email t@t.t && git config user.name t', { cwd: sibling, shell: '/bin/bash' });
  await fs.writeFile(path.join(sibling, 'docs', 'paper.md'), '# committed in an IGNORED sibling repo\n');
  execSync('git add -A && git commit -q -m sibling-init', { cwd: sibling, shell: '/bin/bash' });

  return { root, inner, sibling };
}

test('fixture self-check: the nested/sibling files are invisible to the WORKSPACE repo but committed in their own', async () => {
  const { root, inner, sibling } = await mkNestedRepos('gate-xrepo-fixture-');

  // The outer repo cannot see either file at its own ref — this is what makes the fixture
  // able to exhibit the ambient-root defect at all.
  assert.throws(() => execSync('git rev-parse "main:inner/lib/tracked.md"', { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }),
    'the WORKSPACE repo must NOT resolve the nested repo\'s file — otherwise the fixture is same-repo');
  assert.throws(() => execSync('git rev-parse "main:sibling/docs/paper.md"', { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }),
    'the WORKSPACE repo must NOT resolve the ignored sibling repo\'s file');

  // And the sibling really is ignored by the outer repo, like EGPT-research/.gitignore:9.
  assert.match(execSync('git check-ignore -v sibling/docs/paper.md', { cwd: root, encoding: 'utf-8' }),
    /\.gitignore:1:sibling\//, 'the sibling must be genuinely .gitignored by the workspace repo');

  // But each IS committed on main in the repository that owns it.
  assert.match(execSync('git rev-parse "main:lib/tracked.md"', { cwd: inner, encoding: 'utf-8' }).trim(), SHA40);
  assert.match(execSync('git rev-parse "main:docs/paper.md"', { cwd: sibling, encoding: 'utf-8' }).trim(), SHA40);
});

test('CROSS-REPO POSITIVE CONTROL: a file tracked in a NESTED repo at its own ref PASSES', async () => {
  // The regression that blocked revision 1, in one test: `DeSciX/DeSciX_Cloud/...` is
  // committed on the submodule's `main` and must sync, not refuse.
  const { root, inner } = await mkNestedRepos('gate-xrepo-nested-');
  const mp = await writeManifest(root, 'Nested', [
    { path: 'inner/lib/tracked.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  const { files } = await walkCorpus(manifest, root);
  assert.equal(files.length, 1, 'a file committed in the repo that OWNS it must not be refused');
  const fromInner = execSync('git rev-parse "main:lib/tracked.md"', { cwd: inner, encoding: 'utf-8' }).trim();
  assert.equal(files[0].blob_sha, fromInner, 'and its sha must come from the OWNING repo\'s ref');
});

test('CROSS-REPO POSITIVE CONTROL: a file in an IGNORED SIBLING repo, tracked at its own ref, PASSES', async () => {
  // EGPT-research/FRAQTL shape: .gitignored by the workspace repo, fully tracked in its own.
  // Under the ambient-root gate this got the WORST diagnosis — "IGNORED BY GIT ... remove
  // this source from the manifest" — about content that is properly committed.
  const { root, sibling } = await mkNestedRepos('gate-xrepo-sibling-');
  const mp = await writeManifest(root, 'Sibling', [
    { path: 'sibling/docs', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  const { files } = await walkCorpus(manifest, root);
  assert.equal(files.length, 1, 'an ignored-by-the-superrepo sibling repo\'s committed file must sync');
  const fromSibling = execSync('git rev-parse "main:docs/paper.md"', { cwd: sibling, encoding: 'utf-8' }).trim();
  assert.equal(files[0].blob_sha, fromSibling);
});

test('the gate KEEPS ITS TEETH across the boundary: untracked INSIDE the nested repo is still REFUSED', async () => {
  // The failure mode to fear now is the opposite one: "fix" the false refusals by making
  // the gate lenient. A file the OWNING repo does not track must still be refused, and the
  // diagnosis must name the repository it was judged in.
  const { root } = await mkNestedRepos('gate-xrepo-teeth-');
  const mp = await writeManifest(root, 'Teeth', [
    { path: 'inner/lib/never-committed.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /never-committed\.md/, 'must name the offending path');
      assert.match(err.message, /UNTRACKED at ref "main"/, 'must still refuse on the owning repo\'s verdict');
      assert.match(err.message, /in inner/, 'the diagnosis must name WHICH REPOSITORY judged it');
      return true;
    },
    'crossing a repo boundary must not become a way to launder untracked content in'
  );
});

test('provenance records the OWNING repository\'s commit, not the workspace root\'s', async () => {
  // One owner, consulted by both sites: if the blob comes from the inner repo, the commit
  // recorded beside it must too, or sync-state attributes content to a commit that never
  // contained it.
  const { root, inner } = await mkNestedRepos('gate-xrepo-prov-');
  const mp = await writeManifest(root, 'Prov', [
    { path: 'inner/lib/tracked.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  const { provenance } = await walkCorpus(manifest, root);
  const innerCommit = execSync('git rev-parse main', { cwd: inner, encoding: 'utf-8' }).trim();
  const outerCommit = execSync('git rev-parse main', { cwd: root, encoding: 'utf-8' }).trim();
  assert.equal(provenance[0].resolved_commit_sha, innerCommit, 'must record the OWNING repo\'s commit');
  assert.notEqual(provenance[0].resolved_commit_sha, outerCommit, 'and must NOT record the workspace root\'s');
});

test('a source inside NO git repository at all is REFUSED, not assumed', async () => {
  const bare = await fs.mkdtemp(path.join(os.tmpdir(), 'gate-norepo-'));
  await fs.mkdir(path.join(bare, 'loose'), { recursive: true });
  await fs.writeFile(path.join(bare, 'loose', 'orphan.md'), '# in no repository\n');
  const mp = await writeManifest(bare, 'NoRepo', [
    { path: 'loose/orphan.md', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, bare, { ownRepoSlug: null });

  await assert.rejects(
    () => walkCorpus(manifest, bare),
    (err) => {
      assert.match(err.message, /NO GIT REPOSITORY|NOT INSIDE ANY GIT REPOSITORY/i,
        'a path no repository owns must be refused by name, never silently accepted');
      return true;
    },
    'resolveOwningRepo returning null must fail loud'
  );
});

// ────────── THE EMPTY-INPUT BOUNDARY: a source that DOES NOT EXIST ──────────
// A gate that cannot fail AT ITS EMPTY-INPUT BOUNDARY is not a gate. Every test above
// feeds the tracked-ness predicate at least one file. A DIRECTORY SOURCE POINTING AT A
// MISSING PATH feeds it NOTHING: walkDir returns [] for a directory it cannot read, so
// the per-file loop never runs, nothing is refused, and the manifest passes with zero
// files — a silent green over a source that is simply not there. MEASURED on the real
// workspace: EVP-EGPT's ten `EGPT/` sources contributed ZERO files at base and nobody
// was told. The `if (!exists)` block in walkCorpus is what closes that boundary, and
// until these tests existed nothing held it closed — with the block removed the suite
// still ran 16/0.
//
// THE FIXTURE IS PART OF THE GATE, TWICE OVER. The absent path must sit where its
// OWNING REPO IS RESOLVABLE — i.e. its parent directory exists inside a git repo — or
// the second block (`NOT INSIDE ANY GIT REPOSITORY`) would refuse it instead and these
// tests would pass with the block under test deleted. That is exactly the illusory
// scope-out measured on the real EVP-EGPT manifest: deleting the block changed the
// diagnostic there and not the outcome, so a fixture shaped like that measures nothing.
// The self-check below pins the fixture to the shape that CAN exhibit the failure.

/**
 * A repo where `present/` is committed with two files and `no-such-dir` does not exist —
 * but its parent (the repo root) does, and IS a git repository. So `resolveOwningRepo`
 * answers for the absent path, and the only thing that can refuse it is the existence
 * check itself.
 */
async function mkExistsRepo(prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  execSync('git init -q -b main', { cwd: root });
  execSync('git config user.email t@t.t && git config user.name t', { cwd: root, shell: '/bin/bash' });
  await fs.mkdir(path.join(root, 'present'), { recursive: true });
  await fs.writeFile(path.join(root, 'present', 'a.md'), '# a\n\ncommitted content\n');
  await fs.writeFile(path.join(root, 'present', 'b.md'), '# b\n\ncommitted content\n');
  execSync('git add -A && git commit -q -m init', { cwd: root, shell: '/bin/bash' });
  return root;
}

test('fixture self-check: the absent source has an OWNING REPO, so only the existence check can refuse it', async () => {
  const root = await mkExistsRepo('gate-exists-fixture-');
  const absent = path.join(root, 'no-such-dir');

  assert.equal(await fs.access(absent).then(() => true, () => false), false,
    'the fixture path must genuinely not exist — otherwise there is no absent source to refuse');

  // THE LOAD-BEARING HALF: resolveOwningRepo must NOT return null here. If it did, the
  // `NOT INSIDE ANY GIT REPOSITORY` branch would refuse the source and the DOES-NOT-EXIST
  // block could be deleted with these tests still green — a gate that cannot fail.
  const owner = resolveOwningRepo(absent);
  assert.notEqual(owner, null,
    'the absent path must lie inside a git repository, or the NEXT block refuses it and this suite measures the wrong thing');
  assert.equal(owner.repoRelativePath, 'no-such-dir');

  // And the present half really is tracked at the ref, so the pair discriminates.
  assert.match(execSync('git rev-parse "main:present/a.md"', { cwd: root, encoding: 'utf-8' }).trim(), SHA40);
});

test('an ABSENT in-repo source is REFUSED BY NAME, not silently walked as zero files', async () => {
  const root = await mkExistsRepo('gate-exists-absent-');
  const mp = await writeManifest(root, 'Absent', [
    { path: 'no-such-dir', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const manifest = await loadManifest(mp, root);

  await assert.rejects(
    () => walkCorpus(manifest, root),
    (err) => {
      assert.match(err.message, /DOES NOT EXIST/, 'the refusal must name the CAUSE, not just fail');
      assert.match(err.message, /no-such-dir/, 'and must name the offending source path');
      assert.ok(Array.isArray(err.refused) && err.refused.length === 1,
        'the absent source must appear in the aggregated refusal, so the scan can report it as data');
      return true;
    },
    'a manifest source that is not on disk must REFUSE — with the existence check removed it ' +
    'passes silently with 0 files, which is how ten EVP-EGPT sources contributed nothing unnoticed'
  );
});

test('DISCRIMINATING PAIR: present tracked path PASSES with its files, absent path REFUSES', async () => {
  // One fixture, one manifest shape, two paths — the predicate must read differently on
  // them. Without the present half, "everything refuses" would look like a passing gate.
  const root = await mkExistsRepo('gate-exists-pair-');

  const presentMp = await writeManifest(root, 'Pair-Present', [
    { path: 'present', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const { files } = await walkCorpus(await loadManifest(presentMp, root), root);
  assert.equal(files.length, 2, 'the PRESENT tracked directory source must pass WITH its files');
  assert.deepEqual(files.map(f => f.relative_path).sort(), ['present/a.md', 'present/b.md']);

  const absentMp = await writeManifest(root, 'Pair-Absent', [
    { path: 'no-such-dir', ref: 'main', tier: 1, doc_type: 'x', syncignore: [] },
  ]);
  const absentManifest = await loadManifest(absentMp, root);
  await assert.rejects(
    () => walkCorpus(absentManifest, root),
    /DOES NOT EXIST/,
    'the ABSENT source must refuse — 2 files vs a refusal is the discrimination; 2 files vs ' +
    '0 files and no refusal is what the block-removed tree gives, and 0 files is silent'
  );
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

test('ONE OWNER: the source-tracking scan derives no ref resolution of its own', async () => {
  // The DORMANT second derivation. `scan-corpus-source-tracking.mjs` reported the class-(ii)
  // `likely_from` attribution with its own `git rev-parse`, run through a helper bound to
  // cwd = the workspace root, on a workspace-RELATIVE path — the identical ambient-root
  // mistake that made the gate refuse 596 committed files, surviving in the REPORTING half.
  // It read clean only because class (ii) is empty on today's data, which is precisely why
  // it had to go: a live bug gets found, a dormant one waits and then detonates silently.
  //
  // Asserted on the SOURCE the scan actually executes. RED at 4cc3ff5 (the `rev-parse` is
  // present at :232), GREEN here.
  const src = await fs.readFile(
    path.join(import.meta.dirname, '..', 'scripts', 'scan-corpus-source-tracking.mjs'),
    'utf-8'
  );
  // Comments are allowed to NAME the thing that was removed; executable code is not. Strip
  // line comments before asserting, so the explanation above may survive in the file.
  const code = src.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');

  assert.doesNotMatch(
    code, /rev-parse/,
    'the scan must run NO `git rev-parse` of its own — "is this tracked at its ref" has one ' +
    'owner (CorpusWalker::resolveTrackedBlobSha), which resolves it in the repository ' +
    'ManifestLoader::resolveOwningRepo names'
  );
  assert.match(
    src, /import\s*\{[^}]*resolveTrackedBlobSha[^}]*\}\s*from\s*'\.\.\/lib\/core\/CorpusWalker\.js'/,
    'and it must CONSUME that owner rather than re-implementing the predicate'
  );
  assert.match(
    src, /import\s*\{[^}]*resolveOwningRepo[^}]*\}\s*from\s*'\.\.\/lib\/core\/ManifestLoader\.js'/,
    'ownership stays consumed from its one owner too'
  );
});
