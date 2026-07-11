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

/**
 * Get the current HEAD commit SHA for a ref.
 *
 * @param {string} ref - Git ref (branch/tag)
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {string} Commit SHA
 */
function getHeadCommit(ref, workspaceRoot) {
  try {
    return execSync(
      `git rev-parse "${ref}"`,
      { cwd: workspaceRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch {
    return 'unknown';
  }
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
 * @returns {Promise<Object>} { files: Array<FileEntry>, commitSha: string }
 */
export async function walkCorpus(manifest, workspaceRoot) {
  const files = [];
  let commitSha = 'unknown';

  for (const source of manifest._resolvedSources) {
    const { absolutePath, ref, tier, doc_type, syncignore } = source;

    // Get commit SHA (same for all sources using the same ref)
    const refCommit = getHeadCommit(ref, workspaceRoot);
    if (commitSha === 'unknown') {
      commitSha = refCommit;
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
      // Compute workspace-relative path for git operations
      const workspaceRelativePath = path.relative(workspaceRoot, filePath);

      // Compute blob SHA
      const blobSha = computeBlobSha(filePath, workspaceRelativePath, ref, workspaceRoot);
      if (!blobSha) {
        continue; // Skip files that can't be hashed
      }

      // Derive source_repo from first path segment
      const sourceRepo = source.path.split('/')[0] || 'unknown';

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

  return { files, commitSha };
}

export default { walkCorpus };
