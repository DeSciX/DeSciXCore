/**
 * P5 — "manifest sources carry repo+ref" (interface-ws-c4-I2-manifest-source).
 *
 * A manifest source names WHERE its content comes from. Two shapes only:
 *   IN-REPO   : omit `repo`. The 205-row no-migration guarantee — this MUST keep working.
 *   CROSS-REPO: `repo` REQUIRED, an owner/name slug (never a URL), fetched at `ref`.
 *
 * Refusals under test (each shown failing on its negative control before the fix):
 *   - `path` beginning with '../'  — adjacency reads a working tree, so `ref` is not
 *     honored and the claimed provenance is FALSE.
 *   - `repo` naming the manifest's OWN repository — omission is the single spelling of
 *     "here", an explicit slug the single spelling of "elsewhere".
 *   - `repo` given as a URL rather than an owner/name slug.
 *   - `path` carrying a glob — `path` is a literal; `syncignore` already owns exclusion.
 *
 * Design: synthesizes temp git repos. No live platform, no network in the in-repo tests.
 * Run: `node --test tests/manifest-source-repo.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import {
    loadManifest,
    collectManifestSchemaWarnings,
    CANONICAL_SOURCE_FIELDS,
    repoSlugFromRemoteUrl,
} from '../lib/core/ManifestLoader.js';
import { walkCorpus, resolveSourceProvenance } from '../lib/core/CorpusWalker.js';

const SHA40 = /^[0-9a-f]{40}$/;

async function mkTmp(prefix) {
    return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Build a temp git repo with a real commit and (optionally) an `origin` remote.
 * The origin is load-bearing: without it the "repo names its OWN repository"
 * refusal has nothing to compare against and the fixture could not exhibit the
 * failure it claims to test.
 */
async function mkRepo(prefix, originUrl) {
    const root = await mkTmp(prefix);
    execSync('git init -q', { cwd: root });
    execSync('git config user.email t@t.t && git config user.name t', { cwd: root, shell: '/bin/bash' });
    await fs.mkdir(path.join(root, 'content'), { recursive: true });
    await fs.writeFile(path.join(root, 'content', 'a.md'), '# A\n\nbody\n');
    if (originUrl) execSync(`git remote add origin ${originUrl}`, { cwd: root });
    execSync('git add -A && git commit -q -m init', { cwd: root, shell: '/bin/bash' });
    return root;
}

async function writeManifest(root, kbName, sources) {
    const mdir = path.join(root, '.descix', 'manifests');
    await fs.mkdir(mdir, { recursive: true });
    const p = path.join(mdir, `${kbName}.json`);
    await fs.writeFile(p, JSON.stringify({ kb_name: kbName, sources }, null, 2));
    return p;
}

// ─────────────────────── AC#1(i): '../' adjacency is REFUSED ───────────────────────

test('AC1i: a source path beginning with "../" is REFUSED, naming the migration', async () => {
    const root = await mkRepo('p5-adj-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'Adj', [
        { path: '../unk/unkamon-beast/README.md', ref: 'main' },
    ]);

    await assert.rejects(
        () => loadManifest(mp, root),
        (err) => {
            assert.match(err.message, /\.\.\//, 'error must quote the offending "../" path');
            assert.match(err.message, /repo/i, 'error must name the cross-repo migration');
            return true;
        },
        'a "../" adjacency path MUST be refused — it reads a working tree, so `ref` is not honored'
    );
});

// ───────────────── AC#1(ii): `repo` naming the manifest's OWN repo is REFUSED ─────────────────

test('AC1ii: `repo` naming the manifest\'s OWN repository is REFUSED', async () => {
    // Fixture MUST carry a real origin, else the check has nothing to compare against.
    const root = await mkRepo('p5-self-', 'https://github.com/eabadir/unk.git');
    const mp = await writeManifest(root, 'Self', [
        { path: 'content', ref: 'main', repo: 'eabadir/unk' },
    ]);

    await assert.rejects(
        () => loadManifest(mp, root),
        (err) => {
            assert.match(err.message, /eabadir\/unk/, 'error must name the self-named repo');
            assert.match(err.message, /own|here|omit/i, 'error must say omission is the spelling of "here"');
            return true;
        },
        'naming your OWN repository in `repo` MUST be refused — omission is the single spelling of "here"'
    );
});

test('AC1ii negative control: `repo` naming a DIFFERENT repo is NOT refused by the self-check', async () => {
    // Proves the refusal keys on SELF-naming, not merely on `repo` being present.
    const root = await mkRepo('p5-other-', 'https://github.com/eabadir/unk.git');
    const mp = await writeManifest(root, 'Other', [
        { path: 'unkamon-beast/README.md', ref: 'main', repo: 'eabadir/SomeOtherRepo' },
    ]);
    const m = await loadManifest(mp, root);
    assert.equal(m._resolvedSources[0].repo, 'eabadir/SomeOtherRepo');
});

// ───────────────── `repo` must be an owner/name slug, never a URL ─────────────────

test('a `repo` given as a URL is REFUSED (slug, not URL)', async () => {
    const root = await mkRepo('p5-url-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'Url', [
        { path: 'content', ref: 'main', repo: 'https://github.com/eabadir/unk.git' },
    ]);
    await assert.rejects(
        () => loadManifest(mp, root),
        (err) => {
            assert.match(err.message, /slug/i, 'error must name the owner/name slug shape');
            return true;
        }
    );
});

test('a `path` carrying a glob is REFUSED (path is a literal; syncignore owns exclusion)', async () => {
    const root = await mkRepo('p5-glob-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'Glob', [{ path: 'content/**/*.md', ref: 'main' }]);
    await assert.rejects(
        () => loadManifest(mp, root),
        (err) => {
            assert.match(err.message, /syncignore/i, 'error must point at syncignore as the exclusion owner');
            return true;
        }
    );
});

// ───────── AC#2: the 205-row no-migration guarantee — in-repo, no `repo`, still works ─────────

test('AC2: an in-repo source with NO `repo` validates AND syncs (205-row no-migration guarantee)', async () => {
    const root = await mkRepo('p5-inrepo-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'InRepo', [{ path: 'content', ref: 'main', tier: 2 }]);

    // (a) validates, and `repo` stays undefined — omission is preserved, not defaulted.
    const m = await loadManifest(mp, root);
    assert.equal(m._resolvedSources.length, 1);
    assert.equal(m._resolvedSources[0].repo, undefined, '`repo` must remain absent for an in-repo source');

    // (b) actually SYNCS — the walker collects the file with a real blob sha.
    const { files } = await walkCorpus(m, root);
    assert.equal(files.length, 1, 'the in-repo source must still be walked');
    assert.match(files[0].blob_sha, SHA40);
    assert.equal(path.basename(files[0].absolute_path), 'a.md');
});

// ───────────────── AC#3: sync-state records the RESOLVED COMMIT SHA ─────────────────

test('AC3: an in-repo source resolves to the actual commit sha, never "unknown"', async () => {
    const root = await mkRepo('p5-prov-', 'https://github.com/eabadir/Unkamon.git');
    const head = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf-8' }).trim();

    const mp = await writeManifest(root, 'Prov', [{ path: 'content', ref: branch }]);
    const m = await loadManifest(mp, root);

    const prov = await resolveSourceProvenance(m._resolvedSources[0], root);
    assert.equal(prov.repo, null, 'in-repo provenance carries repo=null');
    assert.equal(prov.ref, branch);
    assert.match(prov.resolved_commit_sha, SHA40, 'resolved sha must be a real 40-hex commit');
    assert.equal(prov.resolved_commit_sha, head, 'resolved sha must equal the branch HEAD commit');
    assert.notEqual(prov.resolved_commit_sha, 'unknown');
});

test('AC3: walkCorpus surfaces per-source provenance carrying the resolved sha', async () => {
    const root = await mkRepo('p5-provwalk-', 'https://github.com/eabadir/Unkamon.git');
    const head = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf-8' }).trim();
    const mp = await writeManifest(root, 'ProvWalk', [{ path: 'content', ref: branch }]);
    const m = await loadManifest(mp, root);

    const { provenance } = await walkCorpus(m, root);
    assert.ok(Array.isArray(provenance), 'walkCorpus must return a provenance array for sync-state');
    assert.equal(provenance.length, 1);
    assert.equal(provenance[0].resolved_commit_sha, head);
    assert.equal(provenance[0].repo, null);
    assert.equal(provenance[0].ref, branch);
});

test('AC3: an unresolvable ref FAILS LOUD rather than recording "unknown"', async () => {
    const root = await mkRepo('p5-badref-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'BadRef', [{ path: 'content', ref: 'no-such-ref-xyz' }]);
    const m = await loadManifest(mp, root);
    await assert.rejects(
        () => resolveSourceProvenance(m._resolvedSources[0], root),
        (err) => {
            assert.match(err.message, /no-such-ref-xyz/, 'error must name the unresolvable ref');
            return true;
        },
        'an unresolvable ref must fail loud — a silent "unknown" is a false provenance record'
    );
});

// ───────── Cross-repo: never silently falls back to an adjacent working tree ─────────

test('a cross-repo source NEVER falls back to a local read — it resolves or REFUSES, naming the repo', async () => {
    const root = await mkRepo('p5-xrepo-', 'https://github.com/eabadir/Unkamon.git');
    const mp = await writeManifest(root, 'XRepo', [
        { path: 'content', ref: 'main', repo: 'eabadir/definitely-not-a-real-repo-p5' },
    ]);
    const m = await loadManifest(mp, root);

    let outcome;
    try {
        const prov = await resolveSourceProvenance(m._resolvedSources[0], root);
        outcome = { ok: true, prov };
    } catch (err) {
        outcome = { ok: false, message: err.message };
    }

    if (outcome.ok) {
        // If it "succeeded" it must NOT have silently reported the LOCAL repo's commit.
        const localHead = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim();
        assert.notEqual(
            outcome.prov.resolved_commit_sha, localHead,
            'a cross-repo source must NEVER resolve to the local working tree\'s commit'
        );
    } else {
        assert.match(
            outcome.message, /eabadir\/definitely-not-a-real-repo-p5/,
            'the refusal must NAME the repo it could not fetch'
        );
    }
});

// ───────────────── AC#4: conformance driven off the exported field set ─────────────────

test('AC4: `repo` is a member of the canonical source-field set (single source of truth)', () => {
    assert.ok(
        CANONICAL_SOURCE_FIELDS.has('repo'),
        '`repo` must be added to CANONICAL_SOURCE_FIELDS — consumers derive from it, never hand-mirror'
    );
    assert.ok(CANONICAL_SOURCE_FIELDS.has('ref'), '`ref` must already be canonical');
});

test('AC4: every field in CANONICAL_SOURCE_FIELDS is accepted with no "unknown field" warning', () => {
    // Driven off the exported set — NOT a hand-listed table. Adding a field to the
    // set without teaching the validator about it makes this test fail.
    const src = {};
    for (const f of CANONICAL_SOURCE_FIELDS) src[f] = null;
    const warnings = collectManifestSchemaWarnings({ kb_name: 'X', sources: [src] }, 'X.json');
    const unknown = warnings.filter(w => /unknown field/.test(w));
    assert.deepEqual(unknown, [], `no canonical field may warn as unknown; got:\n${unknown.join('\n')}`);
});

test('AC4: repoSlugFromRemoteUrl normalizes every remote spelling to one owner/name slug', () => {
    // One owner for "which repo is this" — the tell for mirror drift is two derivations.
    assert.equal(repoSlugFromRemoteUrl('https://github.com/eabadir/unk.git'), 'eabadir/unk');
    assert.equal(repoSlugFromRemoteUrl('https://github.com/eabadir/unk'), 'eabadir/unk');
    assert.equal(repoSlugFromRemoteUrl('git@github.com:eabadir/unk.git'), 'eabadir/unk');
    assert.equal(repoSlugFromRemoteUrl('ssh://git@github.com/eabadir/unk.git'), 'eabadir/unk');
    assert.equal(repoSlugFromRemoteUrl(''), null);
    assert.equal(repoSlugFromRemoteUrl(null), null);
});
