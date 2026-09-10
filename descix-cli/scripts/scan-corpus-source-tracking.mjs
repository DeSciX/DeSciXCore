#!/usr/bin/env node
/**
 * READ-ONLY SCAN — "every served corpus source resolves to a path tracked at its recorded ref".
 *
 * Contract: contract-sub-devplane-corpus-sync-gitignored-source-gate-2026-09-10 (interface 3).
 * WRITES NOTHING. No KB, no manifest, no sync-state, no Pinecone. Reads git and JSON only.
 *
 * TWO FINDING CLASSES over ONE property (DEVPLANE ruling, gen7). Matching served ids by
 * re-hashing today's file would be a gate that cannot fail: a MUTABLE gitignored source
 * has already changed on disk, so its recorded sha matches nothing and the scan would
 * read clean precisely where the known defect lives. So:
 *
 *   (i)  UNTRACKED-PATH — the served sha resolves to a real file on disk whose path git
 *        does not track at the recorded ref (gitignored scratch, or never committed).
 *   (ii) UNRESOLVABLE  — the served sha is not a blob at the recorded ref AND matches no
 *        current manifest-source file. For a mutable gitignored source this is the
 *        EXPECTED steady state, not a scan miss: the file has been appended to since the
 *        sync, so the served chunks are attributed to content that exists nowhere in git
 *        and nowhere on disk in that form.
 *
 * Plus the MERGE-IMPACT SET: every manifest entry that WILL refuse under the new gate.
 *
 * Property, not target: counts are REPORTED, never aimed at.
 *
 * Usage: node scripts/scan-corpus-source-tracking.mjs <workspace-root>
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// The gate and the owning-repo resolver are CONSUMED, never re-implemented: this scan
// reports what the executing sync would do, so it must ask the same code.
import { loadManifest, resolveOwningRepo } from '../lib/core/ManifestLoader.js';
import { walkCorpus, resolveTrackedBlobSha } from '../lib/core/CorpusWalker.js';

const workspaceRoot = process.argv[2];
if (!workspaceRoot) {
  console.error('usage: node scripts/scan-corpus-source-tracking.mjs <workspace-root>');
  process.exit(2);
}

const git = (cmd) => execSync(cmd, { cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
const gitOrNull = (cmd) => { try { return git(cmd).trim(); } catch { return null; } };

/** DERIVE, never list: find every app that has manifests + sync-state under the workspace. */
function findAppDirs(root) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      // A WORKTREE COPY IS NOT A LIVE KB. Descending into `.claude/worktrees/` and `.wt/`
      // counted the same manifest once per in-flight branch — 148 "KBs" for a workspace that
      // has 26 live manifests — and every reported total was inflated by whatever other
      // agents happened to have checked out. Counts have to mean something to be reported.
      if (e.name === 'node_modules' || e.name === '.git') continue;
      if (e.name === 'worktrees' || e.name === '.wt') continue;
      const full = path.join(dir, e.name);
      if (e.name === '.descix' && fs.existsSync(path.join(full, 'manifests'))) out.push(full);
      else walk(full, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

const findings = { untrackedPath: [], unresolvable: [], mergeImpact: [], unwalkable: [], legacyProvenance: [] };
const kbsScanned = [];

for (const descixDir of findAppDirs(workspaceRoot)) {
  const manifestDir = path.join(descixDir, 'manifests');
  const syncStateDir = path.join(descixDir, 'sync-state');

  // The workspace is LIVE: other agents create and remove worktrees while this runs, so a
  // directory that existed at discovery can be gone by the time it is read. A vanished
  // directory is not a finding — but it must not take the whole scan down either.
  let manifestFiles;
  try { manifestFiles = fs.readdirSync(manifestDir).filter(f => f.endsWith('.json')); }
  catch { continue; }

  for (const mf of manifestFiles) {
    const manifestPath = path.join(manifestDir, mf);
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch { continue; }
    if (!manifest.kb_name || !Array.isArray(manifest.sources)) continue;

    // ── MERGE-IMPACT SET: which manifest ENTRIES will refuse under the gate? ──
    //
    // RUN THE EXECUTING GATE; do not re-implement it. This block used to walk the tree and
    // re-derive "tracked at ref" with its own git calls at the workspace root — a second
    // site deciding what the gate decides, which drifted from it in the way that matters:
    // it asked the SUPERREPO about files owned by submodules and sibling repos, and so
    // reported hundreds of committed files as offenders. Now the report is the gate's own
    // verdict, consumed as data (`err.refused`), so the two cannot disagree.
    try {
      const loaded = await loadManifest(manifestPath, workspaceRoot);
      await walkCorpus(loaded, workspaceRoot);
    } catch (err) {
      if (Array.isArray(err.refused)) {
        for (const r of err.refused) {
          findings.mergeImpact.push({
            kb: manifest.kb_name, manifest: path.relative(workspaceRoot, manifestPath),
            entry: r.source, path: r.path, ref: r.ref, why: r.reason,
          });
        }
      } else {
        // Not a gate refusal — a load/validation/cross-repo error. Report it rather than
        // swallowing it: a manifest that cannot be walked is not a manifest that is clean.
        findings.unwalkable.push({
          kb: manifest.kb_name, manifest: path.relative(workspaceRoot, manifestPath),
          error: String(err.message).split('\n')[0],
        });
      }
    }

    // ── SERVED-ID POPULATION: resolve each recorded sha against git at its ref ──
    const ssPath = path.join(syncStateDir, `${manifest.kb_name}.json`);
    if (!fs.existsSync(ssPath)) continue;
    let ss;
    try { ss = JSON.parse(fs.readFileSync(ssPath, 'utf-8')); } catch { continue; }
    const shas = ss.synced_blob_shas || [];
    const prov = ss.sources_provenance || [];
    kbsScanned.push({ kb: manifest.kb_name, served: shas.length });

    // Blobs tracked at each recorded commit, mapped sha -> path. Derived from git, not listed.
    //
    // A RECORDED COMMIT IS ONLY MEANINGFUL IN THE REPOSITORY THAT PRODUCED IT. sync-state
    // provenance now carries `repo_root` beside the commit for exactly this reason: a commit
    // from a submodule or a sibling repo does not exist in the superrepo, and `git ls-tree`
    // at the workspace root would simply return NOTHING for it — reading as "none of this
    // KB's sources are tracked" and reporting every served id as an offender. That is a
    // silent, maximally wrong answer, so both failure modes below are LOUD.
    // Unreadable evidence is AGGREGATED and reported, never guessed at and never silently
    // skipped — and it sets a non-zero exit at the end. Aborting on the first bad record
    // would hide every other KB, the same first-throw failure the walker aggregates around.
    const trackedBySha = new Map();
    let evidenceUnreadable = false;

    // NO PROVENANCE AT ALL, BUT SERVED IDS, IS NO EVIDENCE — NOT A CLEAN BILL AND NOT A
    // DIRTY ONE. With an empty `sources_provenance` the blob map below stays empty, so every
    // served id falls through as "not tracked at its ref" and the scan manufactures a finding
    // per chunk. That is exactly the unsoundness recorded against the earlier run of this
    // script ("aggregates NOT SOUND — wrong git root, empty sources_provenance in 23 of 26
    // sync-states"). Report the absence; judge nothing.
    if (shas.length > 0 && prov.length === 0) {
      findings.legacyProvenance.push({
        kb: manifest.kb_name, source: '(whole KB)', commit: '0'.repeat(40),
        why: `sync-state records ${shas.length} served id(s) but NO sources_provenance, so there ` +
             `is no commit to resolve them against — every id would be reported as untracked ` +
             `for lack of evidence rather than for cause`,
      });
      continue;
    }

    for (const p of prov) {
      const commit = p.resolved_commit_sha;
      if (!commit) continue;
      if (p.repo) continue; // cross-repo content is not in this workspace; nothing to resolve
      if (p.repo_root === undefined || p.repo_root === null) {
        findings.legacyProvenance.push({
          kb: manifest.kb_name, source: p.path, commit,
          why: 'record predates self-describing provenance (no repo_root), so which repository ' +
               'this commit belongs to is UNKNOWABLE from the record',
        });
        evidenceUnreadable = true;
        continue;
      }
      const repoDir = path.resolve(workspaceRoot, p.repo_root);
      let out;
      try {
        out = execSync(`git ls-tree -r "${commit}"`, {
          cwd: repoDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024,
        });
      } catch (e) {
        findings.legacyProvenance.push({
          kb: manifest.kb_name, source: p.path, commit,
          why: `does not resolve in its own repository "${p.repo_root}" (${String(e.stderr || e.message).trim().split('\n')[0]})`,
        });
        evidenceUnreadable = true;
        continue;
      }
      for (const line of out.split('\n')) {
        const m = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
        if (m && !trackedBySha.has(m[1])) trackedBySha.set(m[1], m[2]);
      }
    }
    // A partial blob map would make served ids look untracked for the wrong reason. Do not
    // report classes (i)/(ii) for this KB at all rather than report them wrongly.
    if (evidenceUnreadable) continue;

    // Working-tree hashes of the manifest's own source files, to NAME an untracked path.
    const wtBySha = new Map();
    for (const src of manifest.sources) {
      const abs = path.resolve(workspaceRoot, src.path);
      if (!fs.existsSync(abs)) continue;
      const files = fs.statSync(abs).isFile() ? [abs] : [];
      for (const f of files) {
        const h = gitOrNull(`git hash-object "${f}"`);
        if (h) wtBySha.set(h, path.relative(workspaceRoot, f));
      }
    }

    for (const sha of shas) {
      if (trackedBySha.has(sha)) continue; // tracked at its recorded ref — the property holds

      const wtPath = wtBySha.get(sha) || null;
      const ref = prov[0] ? (prov[0].ref || 'main') : 'main';
      if (wtPath) {
        // ASK THE OWNING REPOSITORY, not the workspace root — the same rule the gate follows.
        // Asking the superrepo whether it ignores a sibling repo's file answers "yes" about
        // content that repo tracks perfectly well, which is the false diagnosis this whole
        // revision exists to remove. It must not survive in the reporting half.
        const owner = resolveOwningRepo(path.resolve(workspaceRoot, wtPath));
        let ign = null;
        if (owner) {
          try {
            ign = execSync(`git check-ignore -v "${owner.repoRelativePath}"`, {
              cwd: owner.repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
          } catch { ign = null; }
        }
        findings.untrackedPath.push({
          kb: manifest.kb_name, sha, path: wtPath, ref,
          why: ign ? `gitignored in ${owner.repoRoot === workspaceRoot ? '.' : path.relative(workspaceRoot, owner.repoRoot)} (${ign.split('\t')[0]})`
                   : (owner ? 'untracked at recorded ref in its owning repo' : 'in no git repository')
        });
      } else {
        // Class (ii). Try to attribute it to a manifest entry that is currently untracked.
        //
        // ASK THE GATE, DO NOT RE-DERIVE ITS PREDICATE. "Is this source tracked at its ref?"
        // has ONE owner — CorpusWalker::resolveTrackedBlobSha, which resolves the ref in the
        // repository ManifestLoader::resolveOwningRepo names. This line used to run its own
        // `git rev-parse` through the workspaceRoot-bound helper on a workspace-RELATIVE
        // path, so it asked the superrepo about files owned by submodules and sibling repos —
        // the same ambient-root defect that blocked the previous revision, surviving in the
        // reporting half where it was DORMANT (class (ii) is empty on today's data) and would
        // therefore have detonated silently the first time it was not. A dormant second
        // derivation waits; a live one gets found. Consuming the owner also means this
        // attribution can no longer disagree with the MERGE-IMPACT set printed below it:
        // they are now the same predicate, evaluated once.
        const suspects = manifest.sources
          .filter(s => { const a = path.resolve(workspaceRoot, s.path);
                         return fs.existsSync(a) && fs.statSync(a).isFile()
                                && !resolveTrackedBlobSha(a, s.ref || 'main', workspaceRoot).sha; })
          .map(s => s.path);
        findings.unresolvable.push({ kb: manifest.kb_name, sha, ref, likely_from: suspects });
      }
    }
  }
}

const R = (t) => console.log(t);
R('══════ CORPUS SOURCE-TRACKING SCAN (READ-ONLY — nothing was written) ══════');
R(`workspace: ${workspaceRoot}`);
R(`KBs with sync-state scanned: ${kbsScanned.length} (${kbsScanned.reduce((n, k) => n + k.served, 0)} served source ids)`);
for (const k of kbsScanned) R(`   ${k.kb}: ${k.served} served id(s)`);

R('');
R(`── CLASS (i) UNTRACKED-PATH — served id resolves to a file git does not track at its ref: ${findings.untrackedPath.length}`);
for (const f of findings.untrackedPath) R(`   [${f.kb}] corpus:${f.sha}\n      -> ${f.path}  (ref "${f.ref}") — ${f.why}`);

R('');
R(`── CLASS (ii) UNRESOLVABLE — served id is not a blob at its recorded ref and matches no current source file: ${findings.unresolvable.length}`);
for (const f of findings.unresolvable) {
  R(`   [${f.kb}] corpus:${f.sha}  (ref "${f.ref}")`);
  if (f.likely_from.length) R(`      likely from untracked manifest source: ${f.likely_from.join(', ')}`);
}

R('');
R(`── MERGE-IMPACT SET — manifest entries the EXECUTING gate refuses: ${findings.mergeImpact.length}`);
for (const f of findings.mergeImpact) R(`   [${f.kb}] ${f.manifest}\n      entry "${f.entry}" -> ${f.path} (ref "${f.ref}") — ${f.why}`);

R('');
R(`── UNWALKABLE — manifests that error before the gate can judge them: ${findings.unwalkable.length}`);
for (const f of findings.unwalkable) R(`   [${f.kb}] ${f.manifest}\n      ${f.error}`);

R('');
R(`── EVIDENCE NOT READ — served-id analysis SKIPPED for these KBs: ${findings.legacyProvenance.length} record(s)`);
R('   These KBs are NEITHER clean NOR dirty in this report; their served ids were not judged.');
for (const f of findings.legacyProvenance) R(`   [${f.kb}] source "${f.source}" commit ${f.commit.substring(0, 8)}\n      ${f.why}`);
if (findings.legacyProvenance.length) {
  R('   REMEDY: re-run `descix kb corpus sync` for these KBs to rewrite sync-state with repo_root, then re-run this scan.');
}

R('');
R('── COVERAGE BOUNDARY OF THIS SCAN ──');
R('   compares: recorded synced_blob_shas against git ls-tree at the commit sync-state recorded, RESOLVED IN THE REPOSITORY');
R('             THAT PRODUCED IT (provenance.repo_root); and manifest entries against the EXECUTING CorpusWalker gate.');
R('   derives nothing itself: "which repo owns this file" is ManifestLoader::resolveOwningRepo and "is it tracked at its');
R('             ref" is CorpusWalker::resolveTrackedBlobSha — this scan CONSUMES both, so its report cannot disagree with');
R('             what a sync would actually do. It runs no ref resolution of its own.');
R('   catches:  served sources that are not tracked blobs at their recorded ref (classes i and ii), and entries that refuse today.');
R('   does NOT read: Pinecone live vectors (a chunk deleted server-side still appears here), KBs with no local sync-state,');
R('                  cross-repo `repo:` source CONTENT, or chunk CONTENT — and it cannot distinguish an unresolvable id whose');
R('                  source was legitimately deleted from one whose gitignored source merely changed on disk.');
R('   fails loud on: a provenance record with no repo_root (written before provenance was self-describing) and a recorded');
R('                  commit that does not resolve in its own repository — both exit 3 rather than reporting on unread evidence.');
R('   runs automatically: NO — this is a one-shot audit, not a CI gate. The CI-enforced half is CorpusWalker\'s source gate.');

// A scan that could not read its evidence must not exit 0 alongside a clean one.
process.exit(findings.legacyProvenance.length > 0 ? 3 : 0);
