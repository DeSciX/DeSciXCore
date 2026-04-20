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

  // M2 (2026-04-20): skip non-KB manifests.
  // {app}/.descix/manifests/ can hold schemas other than KB manifests
  // (notably site.json, which has its own schema — see loadSiteManifest).
  // The legacy loader validated every .json as a KB manifest and blocked
  // 'descix kb corpus sync' with `kb_name required` whenever a site.json
  // was present. We now:
  //   (a) explicitly skip known non-KB filenames (site.json)
  //   (b) try-catch each load and treat validation failures as "not a KB
  //       manifest" when the cause is a missing kb_name, rather than
  //       aborting the whole operation.
  // Any other error (I/O, malformed JSON) is still propagated with context.
  const NON_KB_MANIFESTS = new Set(['site.json']);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !NON_KB_MANIFESTS.has(f));
  const manifests = [];

  for (const file of jsonFiles) {
    const manifestPath = path.join(manifestsDir, file);
    let manifest;
    try {
      manifest = await loadManifest(manifestPath, workspaceRoot);
    } catch (err) {
      // If the file is missing kb_name, it's not a KB manifest — skip it
      // with a warning rather than aborting the whole operation. This
      // lets future non-KB schemas coexist without editing this allowlist.
      if (/kb_name \(string\) is required/.test(err.message)) {
        console.warn(`  ⚠ Skipping non-KB manifest: ${file} (${err.message})`);
        continue;
      }
      throw err;
    }

    if (filterKbName && manifest.kb_name !== filterKbName) {
      continue;
    }

    manifests.push(manifest);
  }

  return manifests;
}

// ============ Site Manifest Support ============

/**
 * Validate a site manifest against its schema.
 * Required: sources (non-empty array).
 * Each source: path (string) required; include, exclude optional string arrays.
 * buildCommand: optional string.
 *
 * @param {Object} manifest - Parsed JSON manifest
 * @param {string} filePath - Path to manifest file (for error messages)
 * @throws {Error} If validation fails
 */
function validateSiteManifest(manifest, filePath) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error(`Invalid site manifest at ${filePath}: not a JSON object`);
  }

  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new Error(`Invalid site manifest at ${filePath}: sources (non-empty array) is required`);
  }

  for (let i = 0; i < manifest.sources.length; i++) {
    const src = manifest.sources[i];
    if (!src.path || typeof src.path !== 'string') {
      throw new Error(`Invalid site manifest at ${filePath}: sources[${i}].path (string) is required`);
    }
    if (src.include !== undefined && !Array.isArray(src.include)) {
      throw new Error(`Invalid site manifest at ${filePath}: sources[${i}].include must be a string array`);
    }
    if (src.exclude !== undefined && !Array.isArray(src.exclude)) {
      throw new Error(`Invalid site manifest at ${filePath}: sources[${i}].exclude must be a string array`);
    }
  }

  if (manifest.buildCommand !== undefined && manifest.buildCommand !== null && typeof manifest.buildCommand !== 'string') {
    throw new Error(`Invalid site manifest at ${filePath}: buildCommand must be a string or null`);
  }
}

/**
 * Load a site manifest from {appRoot}/.descix/manifests/site.json.
 *
 * Resolves source paths relative to the app's localPath in workspace.json.
 * Each source entry gets include/exclude defaults applied.
 *
 * @param {string} appRoot - Absolute path to the app root directory
 * @returns {Promise<Object|null>} Validated site manifest with _resolvedSources, or null if not found
 */
export async function loadSiteManifest(appRoot) {
  const manifestPath = path.join(appRoot, '.descix', 'manifests', 'site.json');

  let raw;
  try {
    raw = await fs.readFile(manifestPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // No site manifest — not an error
    }
    throw err;
  }

  const manifest = JSON.parse(raw);
  validateSiteManifest(manifest, manifestPath);

  // Resolve source paths relative to app root
  manifest._resolvedSources = manifest.sources.map(src => ({
    sourcePath: src.path,
    absolutePath: path.resolve(appRoot, src.path),
    include: src.include || [],  // empty = include everything
    exclude: src.exclude || [],
  }));

  manifest._manifestPath = manifestPath;
  manifest.buildCommand = manifest.buildCommand || null;

  return manifest;
}

export default { loadManifest, loadManifests, loadSiteManifest };
