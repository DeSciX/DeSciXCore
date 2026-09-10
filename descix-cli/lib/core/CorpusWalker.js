/**
 * CorpusWalker - Git-aware file walker for corpus sync
 *
 * Given a manifest, walks source directories, applies syncignore globs,
 * and computes git blob SHAs for content-addressed chunk IDs.
 *
 * Architecture:
 * - Files stay in place — no copying or staging
 * - Git blob SHAs provide versioning (same content = same SHA)
 * - GIT IS THE ONLY SOURCE OF TRUTH FOR WHAT IS A CORPUS SOURCE: a file must be TRACKED
 *   AT THE MANIFEST'S REF or it is refused by name. There is no working-tree fallback.
 * - Chunk IDs are content-addressed: {app_id}:{kb_name}:{blob_sha}:{chunk_idx}
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
// The source-ref default and "which repository owns this file" are both owned by
// ManifestLoader — consume them, never re-default and never re-derive.
import { DEFAULT_SOURCE_REF, resolveOwningRepo } from './ManifestLoader.js';

/**
 * File extensions that are processable for RAG chunking.
 * Binary files, images, fonts, compiled assets, etc. are excluded.
 */
const PROCESSABLE_EXTENSIONS = new Set([
  '.md', '.txt', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.py', '.rs', '.go', '.sol', '.lean', '.json', '.jsonl',
  '.yaml', '.yml', '.toml', '.csv', '.tex', '.sh', '.bash'
]);

/**
 * Check if a file has a processable text extension.
 *
 * @param {string} filePath - File path
 * @returns {boolean} True if the file can be chunked for RAG
 */
function isProcessableFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return PROCESSABLE_EXTENSIONS.has(ext);
}

/**
 * Check if a file path matches any of the syncignore patterns.
 *
 * @param {string} relativePath - Path relative to the source entry root
 * @param {string[]} syncignore - Array of glob patterns to exclude
 * @returns {boolean} True if the file should be ignored
 */
function isIgnored(relativePath, syncignore) {
  for (const pattern of syncignore) {
    if (minimatch(relativePath, pattern, { dot: true })) {
      return true;
    }
    // Also check just the filename for patterns like "*.test.js"
    const basename = path.basename(relativePath);
    if (minimatch(basename, pattern, { dot: true })) {
      return true;
    }
  }
  return false;
}

const SHA40 = /^[0-9a-f]{40}$/i;

/**
 * Explain WHICH WAY a path failed the "tracked at ref" predicate. Purely diagnostic —
 * it never decides anything, so there is still exactly one decision site. Each branch
 * ends in an instruction the operator can act on without further investigation.
 *
 * @returns {string} the reason string embedded in the aggregated refusal
 */
function diagnoseUntracked(repoRelativePath, ref, repoRoot, repoLabel) {
  // Every diagnostic below runs IN THE OWNING REPOSITORY. Running them at the ambient
  // workspace root is what produced the maximally wrong advice this gate was blocked for
  // ("UNTRACKED — commit it on main" about content that was already committed, and
  // "IGNORED BY GIT" about a sibling repo the SUPERREPO ignores but which tracks it fine).
  const where = `in ${repoLabel}`;

  // (c) Present at HEAD but absent at THIS ref — checked first, because .gitignore
  // patterns do not apply to tracked files and would misdiagnose this case.
  try {
    execSync(`git rev-parse "HEAD:${repoRelativePath}"`,
      { cwd: repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return `present at HEAD but ABSENT AT REF "${ref}" ${where} — the manifest pins a ref ` +
           `that predates this file; commit it on "${ref}" or point the source at the right ref`;
  } catch { /* not at HEAD either — fall through */ }

  // (a) Deliberately excluded from the repository. The measured defect class.
  try {
    const hit = execSync(`git check-ignore -v "${repoRelativePath}"`,
      { cwd: repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim().split('\n')[0];
    if (hit) {
      return `IGNORED BY GIT (${hit.split('\t')[0]}) ${where} and not tracked at ref ` +
             `"${ref}" — content the repository deliberately excludes must never become a ` +
             `citable KB source; remove this source from the manifest`;
    }
  } catch { /* not ignored — fall through */ }

  // (b) Simply never committed.
  return `UNTRACKED at ref "${ref}" ${where} — the file exists on disk but that repository ` +
         `does not track it; commit it on "${ref}", or remove this source from the manifest`;
}

/**
 * THE SOURCE GATE — the single owner of "is this file a legitimate corpus source".
 *
 * A source is legitimate iff GIT TRACKS IT AT THE MANIFEST'S REF. That one predicate is
 * the whole rule, and it is deliberately not split by WHY a path fails it: gitignored
 * scratch, never-committed, and absent-at-an-older-ref are all "not tracked at ref".
 * Splitting them would re-derive "what is a corpus source" in a second place, and the
 * copies would drift.
 *
 * THE WORKING TREE IS NEVER CONSULTED. Reading a sha from disk when the ref lookup failed
 * is the measured defect: it served content git was explicitly told to exclude as a
 * citable KB source (corpus:04406066... = `.claude/agent-memory/evp-descix/qa-pairs.jsonl`,
 * excluded by .gitignore, chunked and served anyway). That path is deleted, not fenced
 * behind a flag, and there is nothing that restores it — SUPER-DRY, CEO-D-2026-07-26.
 *
 * THE REF IS RESOLVED IN THE REPOSITORY THAT OWNS THE FILE, never in an ambient root. A
 * workspace spans several repositories (superrepo, submodules, ignored sibling checkouts)
 * and a ref names a branch in exactly one of them. Asking the superrepo about a file inside
 * a submodule asks the wrong repository a question it cannot answer — it holds only a
 * gitlink commit — and the honest-looking "not tracked" that comes back is FALSE. That was
 * measured on this very branch: 596 committed files refused, the two largest live KBs
 * stopped, with advice telling the operator to commit content already committed.
 * "Which repository owns this file" has ONE owner: ManifestLoader::resolveOwningRepo.
 *
 * Returns a REASON rather than throwing so the caller can aggregate every offender into
 * one refusal instead of failing on the first (mirroring CorpusDenyLint's report/assert
 * split — the established refusal shape in this codebase).
 *
 * @param {string} absoluteFilePath - Absolute path to the file under test
 * @param {string} ref - Git ref (branch/tag) the manifest source named
 * @param {string} [workspaceRoot] - Only to label paths in messages; NEVER a resolution root
 * @returns {{sha: string|null, reason: string|null, repoRoot: string|null}}
 */
export function resolveTrackedBlobSha(absoluteFilePath, ref, workspaceRoot = null) {
  const owner = resolveOwningRepo(absoluteFilePath);
  if (!owner) {
    return {
      sha: null, repoRoot: null,
      reason: `NOT INSIDE ANY GIT REPOSITORY — no repository owns this path, so ref "${ref}" ` +
              `cannot be resolved for it and nothing can vouch for its content; remove this ` +
              `source from the manifest, or put the content in a repository and commit it`
    };
  }
  const { repoRoot, repoRelativePath } = owner;
  // How the owning repo is named in messages: relative to the workspace when we have one,
  // so the operator reads "DeSciX/DeSciX_Cloud" rather than an absolute machine path.
  // `repoRoot` is a REAL path (git resolves symlinks), so the workspace root must be one
  // too or the subtraction escapes upward into `../../..`.
  let workspaceReal = workspaceRoot;
  try { if (workspaceRoot) workspaceReal = fsSync.realpathSync(workspaceRoot); } catch { /* keep as given */ }
  const repoLabel = workspaceRoot ? (path.relative(workspaceReal, repoRoot) || '.') : repoRoot;

  let sha;
  try {
    sha = execSync(
      `git rev-parse "${ref}:${repoRelativePath}"`,
      { cwd: repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch {
    // ONE PREDICATE ("tracked at ref, in the owning repo"), FOUR DIAGNOSTICS. The decision
    // has already been made above — everything below only explains WHICH WAY the path
    // failed, so DRY holds and each population gets a self-curing instruction.
    return { sha: null, repoRoot, reason: diagnoseUntracked(repoRelativePath, ref, repoRoot, repoLabel) };
  }

  if (!SHA40.test(sha)) {
    return {
      sha: null, repoRoot,
      reason: `git rev-parse "${ref}:${repoRelativePath}" in ${repoLabel} returned "${sha}", which is not a blob sha`
    };
  }
  return { sha, repoRoot, reason: null };
}

/**
 * What this gate compares, catches, and does NOT read — printed with the verdict so a
 * reader of a GREEN sees where the green stops, in the gate's own words.
 */
export const SOURCE_GATE_BOUNDARY = Object.freeze({
  compares: 'each walked file against `git rev-parse <manifest source ref>:<path relative to THE REPOSITORY THAT OWNS THE FILE>`, where the owner is the nearest enclosing git repository (ManifestLoader::resolveOwningRepo) — the superrepo, a submodule, or an ignored sibling checkout',
  catches: 'any corpus source not tracked at its ref BY ITS OWN REPOSITORY — gitignored scratch, never-committed files, paths absent from an older ref, and paths inside no repository at all',
  does_not_read: 'file CONTENT (see CorpusDenyLint for content/path deny-classes), Pinecone live state, and cross-repo `repo:` sources (refused separately by resolveSourceProvenance). It also does NOT check that a submodule\'s ref matches the commit the superrepo pins at its gitlink: a source is walked at the ref it names in the repository that owns it, so content committed on that branch but not yet pinned by the superrepo is accepted.',
  runs_automatically: 'yes — inside walkCorpus, so every `descix kb corpus sync` passes through it; there is no flag that skips it'
});

/**
 * Resolve ONE source's provenance: which repository, which ref, and the exact commit synced.
 *
 * This is the single owner of "where did this content come from". `ref` may be a mutable branch,
 * so the RESOLVED COMMIT SHA is what sync-state records — provenance stays exact after the branch
 * moves. It FAILS LOUD rather than recording a placeholder: a source whose commit cannot be
 * resolved has no honest provenance, and `"unknown"` in sync-state is a false record, not a gap.
 *
 * A CROSS-REPO source (`repo` set) is resolved against the REMOTE. It never falls back to a local
 * read — that fallback is precisely the adjacency defect this contract exists to kill, and it would
 * stamp a foreign repo's content with this repo's commit.
 *
 * @param {Object} source - a `_resolvedSources` entry from ManifestLoader
 * @param {string} workspaceRoot - workspace root (the in-repo resolution context)
 * @returns {Promise<{repo: string|null, ref: string, resolved_commit_sha: string, source_repo: string}>}
 * @throws {Error} naming the repo/ref that could not be resolved
 */
export async function resolveSourceProvenance(source, workspaceRoot) {
  const ref = source.ref || DEFAULT_SOURCE_REF;
  const repo = source.repo ?? null;
  // `source_repo` is a LEGACY DISPLAY LABEL that rides into chunk metadata — NOT the
  // ownership decision. Ownership is decided in exactly one place (resolveOwningRepo);
  // this leading-path-segment value is preserved verbatim because rewriting it would
  // re-stamp every existing chunk in every live KB. Do not read it as "which repository
  // owns this file"; for that, ask the owner.
  const source_repo = repo ?? (String(source.path || '').split('/')[0] || 'unknown');

  if (!repo) {
    // Resolve the commit IN THE REPOSITORY THAT OWNS THE SOURCE — the same one owner the
    // gate consults. Resolving it at the ambient workspace root would record the
    // SUPERREPO's commit for content whose blobs came from a submodule or a sibling repo:
    // two derivations of "where did this content come from" that disagree, which is the
    // mirror-drift this file already refuses elsewhere. A provenance record that names the
    // wrong repository's commit is a FALSE record, not an approximate one.
    const owner = resolveOwningRepo(source.absolutePath);
    if (!owner) {
      throw new Error(
        `Source "${source.path}" resolves to ${source.absolutePath}, which is inside NO git ` +
        `repository. Refusing to record provenance — there is no repository whose ref "${ref}" ` +
        `could describe this content.`
      );
    }
    const provenanceRoot = owner.repoRoot;
    let sha;
    try {
      sha = execSync(`git rev-parse "${ref}^{commit}"`, {
        cwd: provenanceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      throw new Error(
        `Cannot resolve ref "${ref}" to a commit in ${provenanceRoot} (the repository that owns ` +
        `source "${source.path}") . Refusing to record provenance — a sync-state commit of ` +
        `"unknown" is a FALSE record, not a missing one. Check that the ref exists in THAT ` +
        `repository, which is not necessarily the workspace root ${workspaceRoot}.`
      );
    }
    if (!SHA40.test(sha)) {
      throw new Error(`Ref "${ref}" resolved to "${sha}", which is not a commit sha (source "${source.path}").`);
    }
    // `repo_root` MAKES THE RECORDED COMMIT SELF-DESCRIBING. Before this, every commit in
    // sync-state was a workspace-root commit, so a reader could resolve it at the workspace
    // root and be right by accident. Now a commit may belong to a submodule or a sibling
    // repo, and the SAME 40 hex characters mean different things depending on which
    // repository you ask. Writing the owning repo beside the commit is what keeps the store
    // homogeneous: a reader resolves the commit WHERE THIS SAYS, and a record written before
    // this field existed is missing it and can be detected rather than silently misread.
    return {
      repo: null, ref, resolved_commit_sha: sha, source_repo,
      repo_root: path.relative(workspaceRoot, provenanceRoot) || '.',
    };
  }

  // CROSS-REPO: resolve against the remote. Never a local read. `repo_root` is null because
  // the content is not in this workspace at all — `repo` already says where it lives.
  if (SHA40.test(ref)) {
    return { repo, ref, resolved_commit_sha: ref.toLowerCase(), source_repo, repo_root: null };
  }
  const remoteUrl = `https://github.com/${repo}.git`;
  let out;
  try {
    out = execSync(`git ls-remote "${remoteUrl}" "${ref}" "refs/heads/${ref}" "refs/tags/${ref}"`, {
      cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }).trim();
  } catch (err) {
    throw new Error(
      `Cannot fetch cross-repo source "${source.path}" from repo "${repo}" at ref "${ref}": ` +
      `${String(err.stderr || err.message).trim()}. REFUSING — a repo that cannot be fetched is ` +
      `never silently skipped and never falls back to a local/adjacent working tree. Ensure git ` +
      `credentials for ${remoteUrl} are available to this machine.`
    );
  }
  const line = out.split('\n').map(l => l.trim()).filter(Boolean)[0];
  const sha = line ? line.split(/\s+/)[0] : null;
  if (!sha || !SHA40.test(sha)) {
    throw new Error(
      `Repo "${repo}" has no ref "${ref}" (source "${source.path}"). REFUSING rather than guessing.`
    );
  }
  return { repo, ref, resolved_commit_sha: sha, source_repo, repo_root: null };
}

/**
 * Recursively walk a directory and collect file paths.
 *
 * @param {string} dir - Directory to walk
 * @param {string} baseDir - Base directory for computing relative paths
 * @param {string[]} syncignore - Glob patterns to exclude
 * @returns {Promise<string[]>} Array of absolute file paths
 */
async function walkDir(dir, baseDir, syncignore) {
  const results = [];

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results; // Directory doesn't exist or unreadable
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (isIgnored(relativePath, syncignore)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Check directory-level ignore (patterns ending with /)
      const dirRelative = relativePath + '/';
      if (isIgnored(dirRelative, syncignore)) {
        continue;
      }
      const subFiles = await walkDir(fullPath, baseDir, syncignore);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      // Only include text-processable files
      if (isProcessableFile(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Check if a path is a file (not a directory).
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
async function isFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Walk a manifest and return file entries with git metadata.
 *
 * For each source entry in the manifest:
 * 1. Resolve the local directory path (workspace-relative)
 * 2. Walk the directory, applying syncignore globs
 * 3. Compute git blob SHA for each file
 * 4. Return file list with metadata
 *
 * @param {Object} manifest - Validated manifest from ManifestLoader (with _resolvedSources)
 * @param {string} workspaceRoot - Absolute workspace root path
 * @returns {Promise<Object>} { files: Array<FileEntry>, commitSha: string,
 *                              provenance: Array<{path, repo, ref, resolved_commit_sha, source_repo}> }
 */
export async function walkCorpus(manifest, workspaceRoot) {
  const files = [];
  const provenance = [];
  // Every file the source gate refused, collected so ONE error can name them all. A
  // first-throw would hide offenders 2..N and turn one fix into N sync attempts.
  const refused = [];
  let commitSha = 'unknown';

  // Nested-source dedup (WS-EVP-DESCIX-KB-CLEANUP item 4): a manifest may list both a directory
  // source AND a more-specific source nested inside it (e.g. `.../services` at tier 3 AND
  // `.../services/commandHandlers` at tier 2 to override the tier for that subtree). Without dedup
  // the walker collects the nested files TWICE — once under each source — producing duplicate
  // content-addressed chunk IDs and a deterministic upsert-vs-live dedup delta every full sync
  // (the observed −175 on unk-beast/Corpus). Fix at the walker level so the class is killed for
  // every manifest: each physical file belongs to EXACTLY ONE source — the DEEPEST (most-specific)
  // source root that contains it. Walking an ancestor source skips a file owned by a descendant
  // source, preserving the author's override intent (the nested source's tier/doc_type/syncignore
  // win for its subtree). Order-independent and deterministic; a single-file source root === the
  // file path, so an explicit file source always out-specifies any enclosing directory source.
  const sourceRoots = manifest._resolvedSources.map(s => path.resolve(s.absolutePath));
  const ownerSourceRoot = (fileAbs) => {
    const fileResolved = path.resolve(fileAbs);
    let deepest = null;
    for (const root of sourceRoots) {
      if (fileResolved === root || fileResolved.startsWith(root + path.sep)) {
        if (deepest === null || root.length > deepest.length) deepest = root;
      }
    }
    return deepest;
  };

  for (const source of manifest._resolvedSources) {
    const { absolutePath, ref, tier, doc_type, syncignore } = source;
    const thisSourceRoot = path.resolve(absolutePath);

    // An IN-REPO source whose path lies in NO repository joins the AGGREGATED refusal rather
    // than throwing. Both outcomes refuse — but throwing would abort on the first offending
    // source and hide every later one, turning one manifest fix into N sync attempts, which
    // is the whole reason this walk aggregates. Measured: `EGPT/` (in no repo) aborted the
    // EVP-EGPT walk before its other sources were ever examined.
    //
    // CROSS-REPO SOURCES ARE DELIBERATELY EXEMPT. Their `absolutePath` is a fiction — the
    // content lives in another repository — so "is it in a repo here" is the wrong question
    // and answering it would MASK the accurate refusal resolveSourceProvenance already owns.
    // Measured: EVP-BEAST's four `repo: eabadir/unk` sources were being reported as "not
    // inside any git repository" instead of "cross-repo content fetch is not implemented".
    if (source.repo === undefined) {
      const exists = await fs.access(absolutePath).then(() => true, () => false);
      if (!exists) {
        refused.push({
          path: source.path, ref, source: source.path,
          reason: `DOES NOT EXIST at ${absolutePath} — the manifest names a path that is not ` +
                  `on disk; correct the path or remove this source from the manifest`,
        });
        continue;
      }
      if (!resolveOwningRepo(absolutePath)) {
        refused.push({
          path: source.path, ref, source: source.path,
          reason: `NOT INSIDE ANY GIT REPOSITORY (${absolutePath}) — no repository owns this ` +
                  `path, so ref "${ref}" cannot be resolved for it and nothing can vouch for ` +
                  `its content; remove this source from the manifest, or put the content in a ` +
                  `repository and commit it`,
        });
        continue;
      }
    }

    // Resolve this source's exact provenance BEFORE reading anything. A cross-repo source that
    // cannot be fetched REFUSES here, naming the repo — it is never silently skipped and never
    // falls back to reading an adjacent working tree.
    const prov = await resolveSourceProvenance(source, workspaceRoot);
    provenance.push({ path: source.path, ...prov });

    // A cross-repo source's CONTENT still lives in another repository. Reading `absolutePath`
    // would resolve inside THIS workspace — the exact adjacency defect this contract kills — so
    // refuse loudly rather than walk the wrong tree and stamp it with a foreign repo's sha.
    if (prov.repo) {
      throw new Error(
        `Cross-repo source "${source.path}" (repo "${prov.repo}", ref "${ref}" @ ` +
        `${prov.resolved_commit_sha.substring(0, 8)}) cannot be walked: cross-repo CONTENT FETCH is ` +
        `not implemented in this CLI. Refusing rather than reading the local working tree at ` +
        `${absolutePath}, which would attribute this workspace's files to "${prov.repo}".`
      );
    }

    // The sync's headline commit is the FIRST source's resolved commit — read from the one owner
    // (resolveSourceProvenance) rather than re-deriving it, so the headline and the per-source
    // provenance records can never disagree.
    if (commitSha === 'unknown') {
      commitSha = prov.resolved_commit_sha;
    }

    // Check if source path is a file or directory
    const sourceIsFile = await isFile(absolutePath);

    let filePaths;
    if (sourceIsFile) {
      // Single file source entry — check if processable
      filePaths = isProcessableFile(absolutePath) ? [absolutePath] : [];
    } else {
      // Directory: walk recursively with syncignore
      filePaths = await walkDir(absolutePath, absolutePath, syncignore);
    }

    for (const filePath of filePaths) {
      // Nested-source dedup: skip any file owned by a MORE-SPECIFIC (deeper) source root.
      if (ownerSourceRoot(filePath) !== thisSourceRoot) {
        continue;
      }
      // Workspace-relative path is the DISPLAY/metadata spelling only. Git resolution uses
      // the owning repository — see resolveTrackedBlobSha.
      const workspaceRelativePath = path.relative(workspaceRoot, filePath);

      // THE SOURCE GATE. A file the OWNING repository does not track at this source's ref
      // is REFUSED by name — never silently chunked from the working tree, and never
      // silently skipped either (a skip on a clean worktree would PURGE its live chunks).
      const { sha: blobSha, reason } = resolveTrackedBlobSha(filePath, ref, workspaceRoot);
      if (!blobSha) {
        refused.push({ path: workspaceRelativePath, ref, reason, source: source.path });
        continue;
      }

      // "Which repo does this content belong to" has ONE owner: resolveSourceProvenance.
      const sourceRepo = prov.source_repo;

      files.push({
        absolute_path: filePath,
        relative_path: workspaceRelativePath,
        blob_sha: blobSha,
        source_entry: {
          path: source.path,
          ref,
          tier,
          doc_type,
          syncignore,
          // KB-curation metadata (rides into the chunk record → Pinecone).
          doc_class: source.doc_class,
          license_basis: source.license_basis ?? null,
          raw_path: source.raw_path ?? null,
          synced_from_edit: (source.raw_path ?? null) != null
        },
        source_repo: sourceRepo
      });
    }
  }

  // ONE aggregated refusal naming every offender, its ref and its reason. Raised AFTER
  // the full walk so the operator fixes the manifest once rather than N times, and BEFORE
  // any caller can chunk, upsert or purge — the refused files are neither served nor
  // treated as deletions.
  if (refused.length > 0) {
    // The error must be fixable IN ONE ACT from its text alone: it names the manifest
    // FILE to edit and the offending ENTRY within it, not merely the resolved path.
    // `_manifestPath` is owned by ManifestLoader — consume it, never re-derive it.
    const manifestFile = manifest._manifestPath || `(manifest for kb "${manifest.kb_name}")`;
    const lines = refused.map(
      r => `  - ${r.path}\n      ref: "${r.ref}"   manifest entry: sources[] path "${r.source}"\n      ${r.reason}`
    );
    const err = new Error(
      `Corpus source gate FAILED for KB "${manifest.kb_name}": ${refused.length} file(s) are ` +
      `not tracked by git at their manifest ref — refusing to sync.\n` +
      `Manifest to edit: ${manifestFile}\n${lines.join('\n')}\n` +
      `Every corpus source must be committed at its ref. There is no working-tree fallback: ` +
      `content git excludes must never be served as a citable KB source.`
    );
    // The offenders as DATA, so a reporting tool consumes the gate's own verdict instead of
    // re-implementing the predicate or scraping this prose. The message stays the human
    // surface; `refused` is the machine one, and they cannot disagree because there is one
    // decision behind both.
    err.refused = refused;
    err.kb_name = manifest.kb_name;
    err.manifestPath = manifestFile;
    throw err;
  }

  return { files, commitSha, provenance, gateBoundary: SOURCE_GATE_BOUNDARY };
}

export default { walkCorpus, resolveSourceProvenance, resolveTrackedBlobSha, SOURCE_GATE_BOUNDARY };
