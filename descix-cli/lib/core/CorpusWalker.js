/**
 * CorpusWalker - Git-aware file walker for corpus sync
 *
 * Given a manifest, walks source directories, applies syncignore globs,
 * and computes git blob SHAs for content-addressed chunk IDs.
 *
 * Architecture:
 * - Files stay in place — no copying or staging
 * - Git blob SHAs provide versioning (same content = same SHA)
 * - Untracked/modified files use `git hash-object` for working tree version
 * - Chunk IDs are content-addressed: {app_id}:{kb_name}:{blob_sha}:{chunk_idx}
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
// The source-ref default is owned by ManifestLoader — consume it, never re-default.
import { DEFAULT_SOURCE_REF } from './ManifestLoader.js';

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

/**
 * Compute the git blob SHA for a file.
 * First tries `git rev-parse {ref}:{workspace-relative-path}` for tracked files.
 * Falls back to `git hash-object {file}` for untracked/modified files.
 *
 * @param {string} absolutePath - Absolute path to the file
 * @param {string} workspaceRelativePath - Path relative to workspace root
 * @param {string} ref - Git ref (branch/tag)
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {string} Git blob SHA (40 hex chars)
 */
function computeBlobSha(absolutePath, workspaceRelativePath, ref, workspaceRoot) {
  try {
    // Try to get the blob SHA from the git tree at the specified ref
    const sha = execSync(
      `git rev-parse "${ref}:${workspaceRelativePath}"`,
      { cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    return sha;
  } catch {
    // File is untracked or path doesn't exist in git tree at that ref
    // Fall back to hashing the working tree version
    try {
      const sha = execSync(
        `git hash-object "${absolutePath}"`,
        { cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      return sha;
    } catch {
      // Last resort: return null — caller should skip this file
      return null;
    }
  }
}

const SHA40 = /^[0-9a-f]{40}$/i;

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
  // ONE derivation of "which repo this content belongs to": the explicit slug when the source is
  // cross-repo, else the leading path segment (the historical in-repo value, preserved verbatim so
  // existing chunk metadata does not churn).
  const source_repo = repo ?? (String(source.path || '').split('/')[0] || 'unknown');

  if (!repo) {
    let sha;
    try {
      sha = execSync(`git rev-parse "${ref}^{commit}"`, {
        cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      throw new Error(
        `Cannot resolve ref "${ref}" to a commit in ${workspaceRoot} for source "${source.path}". ` +
        `Refusing to record provenance — a sync-state commit of "unknown" is a FALSE record, not a ` +
        `missing one. Check that the ref exists locally.`
      );
    }
    if (!SHA40.test(sha)) {
      throw new Error(`Ref "${ref}" resolved to "${sha}", which is not a commit sha (source "${source.path}").`);
    }
    return { repo: null, ref, resolved_commit_sha: sha, source_repo };
  }

  // CROSS-REPO: resolve against the remote. Never a local read.
  if (SHA40.test(ref)) {
    return { repo, ref, resolved_commit_sha: ref.toLowerCase(), source_repo };
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
  return { repo, ref, resolved_commit_sha: sha, source_repo };
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
      // Compute workspace-relative path for git operations
      const workspaceRelativePath = path.relative(workspaceRoot, filePath);

      // Compute blob SHA
      const blobSha = computeBlobSha(filePath, workspaceRelativePath, ref, workspaceRoot);
      if (!blobSha) {
        continue; // Skip files that can't be hashed
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

  return { files, commitSha, provenance };
}

export default { walkCorpus, resolveSourceProvenance };
