/**
 * Git Utilities for DeSciX SDK
 * 
 * Provides Git-aware metadata extraction for the Git-as-Source philosophy.
 * Used by FolderPreparer and SyncOrchestrator to capture commit context.
 * 
 * Supports folder-scoped operations for monorepo and delta-sync use cases.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * GitUtils - Extract Git metadata from a repository
 */
export class GitUtils {
  /**
   * @param {string} projectPath - Path to the project root
   */
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  /**
   * Execute a git command and return the output
   * @param {string} command - Git command (without 'git' prefix)
   * @returns {string|null} Command output or null on error
   * @private
   */
  _execGit(command) {
    try {
      const result = execSync(`git ${command}`, {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return result.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if the project path is inside a Git repository
   * @returns {Promise<boolean>} True if inside a Git repo
   */
  async isGitRepository() {
    const result = this._execGit('rev-parse --is-inside-work-tree');
    return result === 'true';
  }

  /**
   * Get the root directory of the Git repository
   * @returns {Promise<string|null>} Absolute path to repo root, or null
   */
  async getRepositoryRoot() {
    return this._execGit('rev-parse --show-toplevel');
  }

  /**
   * Get the relative path from repo root to the project path
   * @returns {Promise<string|null>} Relative path (e.g., "Apps/Tokenomics") or null if not in a repo
   */
  async getRelativePath() {
    const repoRoot = await this.getRepositoryRoot();
    if (!repoRoot) return null;
    const relativePath = path.relative(repoRoot, this.projectPath);
    // Return empty string as '.' for repo root, otherwise return the relative path
    return relativePath || '.';
  }

  /**
   * Get the current branch name
   * @returns {Promise<string|null>} Branch name or null if not on a branch
   */
  async getCurrentBranch() {
    // Try to get branch name
    const branch = this._execGit('rev-parse --abbrev-ref HEAD');
    
    // If HEAD is detached, rev-parse returns 'HEAD'
    if (branch === 'HEAD') {
      // Try to get a more descriptive reference
      const describe = this._execGit('describe --tags --always');
      return describe || 'HEAD';
    }
    
    return branch;
  }

  /**
   * Get the HEAD commit hash (full SHA)
   * @returns {Promise<string|null>} Full commit hash or null
   */
  async getHeadCommitHash() {
    return this._execGit('rev-parse HEAD');
  }

  /**
   * Get the HEAD commit hash (short version)
   * @returns {Promise<string|null>} Short commit hash (7 chars) or null
   */
  async getShortCommitHash() {
    return this._execGit('rev-parse --short HEAD');
  }

  /**
   * Check if there are uncommitted changes (staged or unstaged)
   * @returns {Promise<boolean>} True if there are uncommitted changes
   */
  async hasUncommittedChanges() {
    // Check for staged changes
    const staged = this._execGit('diff --cached --quiet');
    // Check for unstaged changes
    const unstaged = this._execGit('diff --quiet');
    // Check for untracked files
    const untracked = this._execGit('ls-files --others --exclude-standard');
    
    // If any git diff command fails (returns non-zero), there are changes
    // We detect this by checking if the commands returned null (error) vs empty string (success)
    const hasStagedChanges = staged === null;
    const hasUnstagedChanges = unstaged === null;
    const hasUntrackedFiles = untracked && untracked.length > 0;
    
    return hasStagedChanges || hasUnstagedChanges || hasUntrackedFiles;
  }

  /**
   * Get list of untracked files
   * @returns {Promise<string[]>} Array of untracked file paths
   */
  async getUntrackedFiles() {
    const result = this._execGit('ls-files --others --exclude-standard');
    if (!result) return [];
    return result.split('\n').filter(f => f.length > 0);
  }

  /**
   * Get list of modified files (staged and unstaged)
   * @returns {Promise<string[]>} Array of modified file paths
   */
  async getModifiedFiles() {
    const result = this._execGit('diff --name-only HEAD');
    if (!result) return [];
    return result.split('\n').filter(f => f.length > 0);
  }

  /**
   * Get files changed in a specific folder since a commit
   * Used for folder-scoped delta-sync in monorepos
   * @param {string} sinceCommit - Commit hash to compare from
   * @param {string} [folderPath] - Relative folder path from repo root (defaults to project path)
   * @returns {Promise<string[]>} Array of changed file paths (relative to repo root)
   */
  async getChangedFilesInFolder(sinceCommit, folderPath = null) {
    const targetPath = folderPath || await this.getRelativePath();
    if (!targetPath) return [];
    
    // Use -- to separate path from revision
    const result = this._execGit(`diff --name-only ${sinceCommit}..HEAD -- "${targetPath}"`);
    if (!result) return [];
    return result.split('\n').filter(f => f.length > 0);
  }

  /**
   * Check if a specific folder has changes since a commit
   * @param {string} sinceCommit - Commit hash to compare from
   * @param {string} [folderPath] - Relative folder path from repo root
   * @returns {Promise<boolean>} True if folder has changes
   */
  async hasFolderChanges(sinceCommit, folderPath = null) {
    const changes = await this.getChangedFilesInFolder(sinceCommit, folderPath);
    return changes.length > 0;
  }

  /**
   * Get file hashes for all files in a folder
   * Used for delta-sync comparison independent of Git
   * @param {string} folderPath - Absolute path to folder
   * @param {string[]} [extensions] - File extensions to include (e.g., ['.md', '.txt']). Null = all files
   * @returns {Promise<Object>} Map of relative path -> { hash, size, modified }
   */
  async getFileHashes(folderPath, extensions = null) {
    const hashes = {};
    
    const walkDir = async (dir, basePath = '') => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch (err) {
        // Directory doesn't exist or can't be read
        return;
      }
      
      for (const entry of entries) {
        // Skip hidden files and directories
        if (entry.name.startsWith('.')) continue;
        // Skip common ignore patterns
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = basePath ? path.join(basePath, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await walkDir(fullPath, relPath);
        } else if (entry.isFile()) {
          // Filter by extension if specified
          if (extensions && !extensions.some(ext => entry.name.endsWith(ext))) {
            continue;
          }
          
          try {
            const content = await fs.readFile(fullPath);
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            const stat = await fs.stat(fullPath);
            
            hashes[relPath] = {
              hash: `sha256:${hash}`,
              size: stat.size,
              modified: stat.mtime.toISOString()
            };
          } catch (err) {
            // Skip files that can't be read
            console.error(`[GitUtils] Could not hash file ${fullPath}: ${err.message}`);
          }
        }
      }
    };
    
    await walkDir(folderPath);
    return hashes;
  }

  /**
   * Get the remote URL (origin)
   * @returns {Promise<string|null>} Remote URL or null
   */
  async getRemoteUrl() {
    return this._execGit('remote get-url origin');
  }

  /**
   * Get commit message for HEAD
   * @returns {Promise<string|null>} Commit message or null
   */
  async getHeadCommitMessage() {
    return this._execGit('log -1 --format=%s');
  }

  /**
   * Get commit timestamp for HEAD
   * @returns {Promise<string|null>} ISO timestamp or null
   */
  async getHeadCommitTimestamp() {
    return this._execGit('log -1 --format=%aI');
  }

  /**
   * Get comprehensive Git status for the project
   * @returns {Promise<Object>} Git status object
   */
  async getStatus() {
    const isRepo = await this.isGitRepository();
    
    if (!isRepo) {
      return {
        isGitRepo: false,
        branch: null,
        commitHash: null,
        shortHash: null,
        hasUncommittedChanges: false,
        modifiedFiles: [],
        untrackedFiles: [],
        remoteUrl: null,
        repoRoot: null
      };
    }

    const [
      branch,
      commitHash,
      shortHash,
      hasChanges,
      modifiedFiles,
      untrackedFiles,
      remoteUrl,
      repoRoot
    ] = await Promise.all([
      this.getCurrentBranch(),
      this.getHeadCommitHash(),
      this.getShortCommitHash(),
      this.hasUncommittedChanges(),
      this.getModifiedFiles(),
      this.getUntrackedFiles(),
      this.getRemoteUrl(),
      this.getRepositoryRoot()
    ]);

    return {
      isGitRepo: true,
      branch,
      commitHash,
      shortHash,
      hasUncommittedChanges: hasChanges,
      modifiedFiles,
      untrackedFiles,
      remoteUrl,
      repoRoot
    };
  }

  /**
   * Generate metadata object for sync operations
   * This metadata is written to .descix_metadata.json in Drive
   * @param {Object} fileHashes - Map of file paths to their content hashes
   * @param {string} [appFolderPath] - Relative path to app folder from repo root
   * @returns {Promise<Object>} Metadata object for Drive sync
   */
  async generateSyncMetadata(fileHashes = {}, appFolderPath = null) {
    const status = await this.getStatus();
    const folderPath = appFolderPath || await this.getRelativePath();
    
    return {
      version: '1.0',
      sync: {
        commit_hash: status.commitHash,
        short_hash: status.shortHash,
        branch: status.branch,
        synced_at: new Date().toISOString(),
        app_folder_path: folderPath,
        has_uncommitted_changes: status.hasUncommittedChanges
      },
      files: fileHashes,
      remote_files: {}  // Populated during pull operations for Drive-only files
    };
  }

  /**
   * Compare current file hashes with previous sync metadata to determine delta
   * @param {Object} currentHashes - Current file hashes from getFileHashes()
   * @param {Object} previousMetadata - Previous .descix_metadata.json content
   * @returns {Object} Delta: { added: [], modified: [], deleted: [], unchanged: [] }
   */
  compareSyncState(currentHashes, previousMetadata) {
    const previousFiles = previousMetadata?.files || {};
    
    const added = [];
    const modified = [];
    const deleted = [];
    const unchanged = [];
    
    // Check current files against previous
    for (const [filePath, info] of Object.entries(currentHashes)) {
      const previous = previousFiles[filePath];
      if (!previous) {
        added.push(filePath);
      } else if (previous.hash !== info.hash) {
        modified.push(filePath);
      } else {
        unchanged.push(filePath);
      }
    }
    
    // Check for deleted files
    for (const filePath of Object.keys(previousFiles)) {
      if (!currentHashes[filePath]) {
        deleted.push(filePath);
      }
    }
    
    return { added, modified, deleted, unchanged };
  }
}

/**
 * Create a GitUtils instance for a project path
 * @param {string} projectPath - Path to the project
 * @returns {GitUtils} GitUtils instance
 */
export function createGitUtils(projectPath) {
  return new GitUtils(projectPath);
}

export default GitUtils;
