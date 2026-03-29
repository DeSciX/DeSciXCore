/**
 * ManifestLoader - Load and validate corpus sync manifests
 *
 * Manifests declare a *view* over git-managed files for RAG indexing.
 * Files stay in place — no staging. Git blob SHAs handle versioning.
 * Pinecone metadata handles multi-tenancy (CEO-D12).
 *
 * Manifest location convention:
 *   {app_root}/.descix/manifests/{kb_name}.json
 *
 * workspace.json `localPath` provides the app root.
 * The CLI discovers manifests at `{localPath}/.descix/manifests/`.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Validate a parsed manifest object against the schema.
 * Required: kb_name (string), sources (non-empty array).
 * Each source: path (string) required; ref, tier, doc_type, syncignore optional.
 * github block: optional, validated but not used for sync_mode: "local".
 *
 * @param {Object} manifest - Parsed JSON manifest
 * @param {string} filePath - Path to manifest file (for error messages)
 * @throws {Error} If validation fails
 */
function validateManifest(manifest, filePath) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error(`Invalid manifest at ${filePath}: not a JSON object`);
  }

  if (!manifest.kb_name || typeof manifest.kb_name !== 'string') {
    throw new Error(`Invalid manifest at ${filePath}: kb_name (string) is required`);
  }

  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error(`Invalid manifest at ${filePath}: sources (non-empty array) is required`);
  }

  for (let i = 0; i < manifest.sources.length; i++) {
    const src = manifest.sources[i];
    if (!src.path || typeof src.path !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].path (string) is required`);
    }
    // Optional fields: ref (string), tier (number), doc_type (string), syncignore (string[])
    if (src.ref !== undefined && typeof src.ref !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].ref must be a string`);
    }
    if (src.tier !== undefined && typeof src.tier !== 'number') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].tier must be a number`);
    }
    if (src.doc_type !== undefined && typeof src.doc_type !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].doc_type must be a string`);
    }
    if (src.syncignore !== undefined && !Array.isArray(src.syncignore)) {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].syncignore must be an array`);
    }
  }

  // github block: validate structure if present, but skip for local sync
  if (manifest.github !== undefined) {
    if (typeof manifest.github !== 'object') {
      throw new Error(`Invalid manifest at ${filePath}: github must be an object`);
    }
  }
}

/**
 * Load a single manifest file.
 *
 * @param {string} manifestPath - Absolute path to manifest JSON file
 * @param {string} workspaceRoot - Workspace root for resolving relative paths
 * @returns {Promise<Object>} Validated manifest with resolved paths
 */
export async function loadManifest(manifestPath, workspaceRoot) {
  const raw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);

  validateManifest(manifest, manifestPath);

  // Resolve source paths relative to workspace root
  manifest._resolvedSources = manifest.sources.map(src => ({
    ...src,
    absolutePath: path.resolve(workspaceRoot, src.path),
    ref: src.ref || 'main',
    tier: src.tier || 3,
    doc_type: src.doc_type || 'generic',
    syncignore: src.syncignore || []
  }));

  manifest._manifestPath = manifestPath;
  return manifest;
}

/**
 * Discover and load all manifests for an app.
 * Looks in {appRoot}/.descix/manifests/*.json
 *
 * @param {string} appRoot - Absolute path to app root directory
 * @param {string} workspaceRoot - Workspace root for resolving relative paths
 * @param {string} [filterKbName] - If provided, only load manifest with this kb_name
 * @returns {Promise<Array<Object>>} Array of validated manifest objects
 */
export async function loadManifests(appRoot, workspaceRoot, filterKbName = null) {
  const manifestsDir = path.join(appRoot, '.descix', 'manifests');

  let files;
  try {
    files = await fs.readdir(manifestsDir);
  } catch {
    return []; // No manifests directory — not an error
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const manifests = [];

  for (const file of jsonFiles) {
    const manifestPath = path.join(manifestsDir, file);
    const manifest = await loadManifest(manifestPath, workspaceRoot);

    if (filterKbName && manifest.kb_name !== filterKbName) {
      continue;
    }

    manifests.push(manifest);
  }

  return manifests;
}

export default { loadManifest, loadManifests };
