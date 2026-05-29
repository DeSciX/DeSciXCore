/**
 * SiteWalker - Manifest-driven file walker for site deployment
 *
 * Given a site manifest (.descix/manifests/site.json), walks source entries,
 * applies include/exclude glob patterns, and computes file hashes for
 * delta-based deployment to GCS.
 *
 * Architecture:
 * - Files stay in place — no copying or staging
 * - File hashes (SHA-256) enable delta uploads (skip unchanged files)
 * - Multiple source entries are flattened into a deploy tree preserving
 *   relative paths from each source root
 * - Unlike CorpusWalker, accepts any file type (HTML, CSS, JS, images, fonts, etc.)
 *   and uses include/exclude globs instead of syncignore + extension filtering
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { minimatch } from 'minimatch';

/**
 * Check if a relative path matches any of the given glob patterns.
 *
 * @param {string} relativePath - Path relative to the source entry root
 * @param {string[]} patterns - Array of glob patterns
 * @returns {boolean} True if the path matches at least one pattern
 */
function matchesAny(relativePath, patterns) {
  for (const pattern of patterns) {
    if (minimatch(relativePath, pattern, { dot: true })) {
      return true;
    }
    // Also check just the filename for patterns like "*.css"
    const basename = path.basename(relativePath);
    if (minimatch(basename, pattern, { dot: true })) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a directory name matches any exclude patterns that look like directory names.
 * Patterns ending with "/" are directory excludes (e.g., "node_modules/").
 *
 * @param {string} dirName - Directory name (not full path)
 * @param {string[]} excludePatterns - Exclude patterns
 * @returns {boolean} True if the directory should be skipped entirely
 */
function isDirExcluded(dirName, excludePatterns) {
  for (const pattern of excludePatterns) {
    // Pattern ending with / targets directories
    if (pattern.endsWith('/') && dirName === pattern.slice(0, -1)) {
      return true;
    }
    // Also match directory-style patterns without trailing slash
    if (dirName === pattern) {
      return true;
    }
  }
  return false;
}

/**
 * Compute SHA-256 hash of a file's contents.
 *
 * @param {string} absolutePath - Absolute path to the file
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
async function computeFileHash(absolutePath) {
  const content = await fs.readFile(absolutePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Get file size in bytes.
 *
 * @param {string} absolutePath - Absolute path to the file
 * @returns {Promise<number>} File size
 */
async function getFileSize(absolutePath) {
  const stat = await fs.stat(absolutePath);
  return stat.size;
}

/**
 * Recursively walk a directory and collect file paths,
 * applying include and exclude glob filters.
 *
 * @param {string} dir - Directory to walk
 * @param {string} baseDir - Base directory for computing relative paths
 * @param {string[]} include - Include glob patterns (empty = include all)
 * @param {string[]} exclude - Exclude glob patterns
 * @returns {Promise<string[]>} Array of absolute file paths that pass filters
 */
async function walkDir(dir, baseDir, include, exclude) {
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

    if (entry.isDirectory()) {
      // Skip excluded directories early (avoids walking into node_modules, etc.)
      if (isDirExcluded(entry.name, exclude)) {
        continue;
      }
      // Also check full relative path against exclude patterns
      if (matchesAny(relativePath + '/', exclude) || matchesAny(relativePath, exclude)) {
        continue;
      }
      const subFiles = await walkDir(fullPath, baseDir, include, exclude);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      // Check exclude first
      if (exclude.length > 0 && matchesAny(relativePath, exclude)) {
        continue;
      }
      // Check include (empty include = match all)
      if (include.length === 0 || matchesAny(relativePath, include)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Walk a site manifest and return file entries with hashes for deployment.
 *
 * For each source entry in the manifest:
 * 1. Resolve the local path (relative to app root / workspace root)
 * 2. Walk the directory, applying include/exclude globs
 * 3. Compute SHA-256 hash for each file
 * 4. Return file list with deploy paths (relative to deploy root)
 *
 * @param {Object} manifest - Validated site manifest with _resolvedSources
 * @param {string} appRoot - Absolute path to the app root directory
 * @returns {Promise<Object>} { files: Array<SiteFileEntry>, totalSize: number }
 *
 * SiteFileEntry: {
 *   absolutePath: string,       // Local filesystem path
 *   deployPath: string,         // Path in the deploy tree (relative)
 *   hash: string,               // SHA-256 hex hash
 *   size: number,               // File size in bytes
 *   sourceEntry: string         // Source manifest path for traceability
 * }
 */
export async function walkSite(manifest, appRoot) {
  const files = [];
  let totalSize = 0;

  for (const source of manifest._resolvedSources) {
    const { absolutePath, include, exclude, sourcePath } = source;

    // Check if source is a single file
    let stat;
    try {
      stat = await fs.stat(absolutePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Source doesn't exist — skip with warning (caller can log)
        continue;
      }
      throw err;
    }

    if (stat.isFile()) {
      // Single file source entry — deploy at the filename level
      const hash = await computeFileHash(absolutePath);
      const size = stat.size;
      totalSize += size;

      files.push({
        absolutePath,
        deployPath: path.basename(absolutePath),
        hash,
        size,
        sourceEntry: sourcePath
      });
    } else if (stat.isDirectory()) {
      // Directory: walk with include/exclude
      const filePaths = await walkDir(absolutePath, absolutePath, include, exclude);

      for (const filePath of filePaths) {
        const hash = await computeFileHash(filePath);
        const size = await getFileSize(filePath);
        totalSize += size;

        // Deploy path is relative to the source directory root (not the source entry label).
        // e.g. source.path = "site/dist" → dist/index.html under {env}/{app}/site/
        const relativeToSource = path.relative(absolutePath, filePath);
        const deployPath = relativeToSource.split(path.sep).join('/');

        files.push({
          absolutePath: filePath,
          deployPath,
          hash,
          size,
          sourceEntry: sourcePath
        });
      }
    }
  }

  return { files, totalSize };
}

export default { walkSite };
