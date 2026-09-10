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
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const full = path.join(dir, e.name);
      if (e.name === '.descix' && fs.existsSync(path.join(full, 'manifests'))) out.push(full);
      else walk(full, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

const findings = { untrackedPath: [], unresolvable: [], mergeImpact: [] };
const kbsScanned = [];

for (const descixDir of findAppDirs(workspaceRoot)) {
  const manifestDir = path.join(descixDir, 'manifests');
  const syncStateDir = path.join(descixDir, 'sync-state');

  for (const mf of fs.readdirSync(manifestDir).filter(f => f.endsWith('.json'))) {
    const manifestPath = path.join(manifestDir, mf);
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch { continue; }
    if (!manifest.kb_name || !Array.isArray(manifest.sources)) continue;

    // ── MERGE-IMPACT SET: which manifest ENTRIES will refuse under the new gate? ──
    for (const src of manifest.sources) {
      if (src.repo) continue; // cross-repo is refused separately, by resolveSourceProvenance
      const ref = src.ref || 'main';
      const abs = path.resolve(workspaceRoot, src.path);
      const isFile = fs.existsSync(abs) && fs.statSync(abs).isFile();

      // A file source refuses iff that path is untracked at ref. A directory source
      // refuses iff ANY processable file under it is untracked at ref.
      const candidates = [];
      if (isFile) candidates.push(src.path);
      else if (fs.existsSync(abs)) {
        // list files git does NOT track at ref, under this dir, that the walker would take
        const tracked = new Set((gitOrNull(`git ls-tree -r --name-only "${ref}" -- "${src.path}"`) || '').split('\n').filter(Boolean));
        const stack = [abs];
        while (stack.length) {
          const d = stack.pop();
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) { if (e.name !== '.git' && e.name !== 'node_modules') stack.push(p); continue; }
            const rel = path.relative(workspaceRoot, p);
            const ext = path.extname(p).toLowerCase();
            if (!['.md', '.txt', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.rs', '.go', '.sol',
                  '.lean', '.json', '.jsonl', '.yaml', '.yml', '.toml', '.csv', '.tex', '.sh', '.bash'].includes(ext)) continue;
            if (!tracked.has(rel)) candidates.push(rel);
          }
        }
      }

      // Batch the git work: one rev-parse per FILE source (dir candidates are already
      // known-untracked from the ls-tree above), and ONE check-ignore --stdin for the lot.
      const offenders = [];
      for (const rel of candidates) {
        if (isFile && gitOrNull(`git rev-parse "${ref}:${rel}"`)) continue; // tracked at ref
        offenders.push(rel);
      }
      if (offenders.length) {
        let ignoredSet = new Map();
        try {
          const out = execSync('git check-ignore -v --stdin', {
            cwd: workspaceRoot, encoding: 'utf-8', input: offenders.join('\n'),
            stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024
          });
          for (const line of out.split('\n').filter(Boolean)) {
            const [rule, p] = line.split('\t');
            if (p) ignoredSet.set(p, rule);
          }
        } catch (e) {
          // exit 1 simply means "none ignored"; still parse whatever came back
          const out = String(e.stdout || '');
          for (const line of out.split('\n').filter(Boolean)) {
            const [rule, p] = line.split('\t');
            if (p) ignoredSet.set(p, rule);
          }
        }
        for (const rel of offenders) {
          findings.mergeImpact.push({
            kb: manifest.kb_name, manifest: path.relative(workspaceRoot, manifestPath),
            entry: src.path, path: rel, ref,
            why: ignoredSet.has(rel) ? `gitignored (${ignoredSet.get(rel)})` : 'untracked at ref'
          });
        }
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
    const trackedBySha = new Map();
    for (const commit of new Set(prov.map(p => p.resolved_commit_sha).filter(Boolean))) {
      const out = gitOrNull(`git ls-tree -r "${commit}"`) || '';
      for (const line of out.split('\n')) {
        const m = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
        if (m && !trackedBySha.has(m[1])) trackedBySha.set(m[1], m[2]);
      }
    }

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
        const ign = gitOrNull(`git check-ignore -v "${wtPath}"`);
        findings.untrackedPath.push({
          kb: manifest.kb_name, sha, path: wtPath, ref,
          why: ign ? `gitignored (${ign.split('\t')[0]})` : 'untracked at recorded ref'
        });
      } else {
        // Class (ii). Try to attribute it to a manifest entry that is currently untracked.
        const suspects = manifest.sources
          .filter(s => { const a = path.resolve(workspaceRoot, s.path);
                         return fs.existsSync(a) && fs.statSync(a).isFile() && !gitOrNull(`git rev-parse "${(s.ref || 'main')}:${s.path}"`); })
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
R(`── MERGE-IMPACT SET — manifest entries that WILL refuse under the new gate: ${findings.mergeImpact.length}`);
for (const f of findings.mergeImpact) R(`   [${f.kb}] ${f.manifest}\n      entry "${f.entry}" -> ${f.path} (ref "${f.ref}") — ${f.why}`);

R('');
R('── COVERAGE BOUNDARY OF THIS SCAN ──');
R('   compares: recorded synced_blob_shas + manifest sources against git ls-tree/rev-parse at the ref sync-state recorded');
R('   catches:  served sources that are not tracked blobs at their recorded ref (classes i and ii), and entries that will refuse on merge');
R('   does NOT read: Pinecone live vectors (a chunk deleted server-side still appears here), KBs with no local sync-state,');
R('                  cross-repo sources, or chunk CONTENT — and it cannot distinguish an unresolvable id whose source was');
R('                  legitimately deleted from one whose gitignored source merely changed on disk.');
R('   runs automatically: NO — this is a one-shot audit, not a CI gate. The CI-enforced half is CorpusWalker\'s source gate.');
