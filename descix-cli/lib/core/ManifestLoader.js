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
// Canonical doc_class taxonomy lives in CorpusDenyLint — import it, never re-list.
import { PUBLISHABLE_DOC_CLASSES, DENY_DOC_CLASSES } from './CorpusDenyLint.js';

// Valid publish tiers (model §1). "I" internal (default), "P" public, "U" user.
const PUBLISH_TIERS = new Set(['P', 'I', 'U']);

// ============ Canonical Manifest Schema (WS-EVP-DESCIX-KB-CLEANUP item 5) ============
//
// ONE canonical corpus-manifest schema. Historically two families shared
// `.descix/manifests/*.json` with drifting per-source field names — the DeSciX-family
// (`tier`/`doc_type`/`syncignore`/`raw_path`) and the EGPT-research family (which also used
// `src_path`). Because every field except `path` was optional, the loader SILENTLY accepted both
// AND silently ignored any unrecognized/misspelled field (the same fail-loud gap as the KB command
// params — a typo'd `synchignore` produced an empty syncignore with no signal). This is the single
// source of truth for the recognized field set. Consumers (the walker, the deny-lint, a conformance
// test) key off these exports so the schema can never drift by hand again.
//
// Deprecation window: unrecognized fields and deprecated aliases WARN (they do not throw) so both
// legacy formats keep syncing. `src_path` is normalized to its canonical name `raw_path` at load.
// The schema doc lives at V2_docs/architecture/corpus-manifest-schema.md.
export const CANONICAL_SOURCE_FIELDS = new Set([
  'path', 'ref', 'tier', 'doc_type', 'syncignore',
  'doc_class', 'license_basis', 'lint_exempt', 'exempt_reason', 'raw_path',
]);

// Deprecated per-source field -> canonical replacement. Normalized at load (canonical wins if both
// are present); a deprecation warning is emitted during the migration window.
export const DEPRECATED_SOURCE_ALIASES = Object.freeze({ src_path: 'raw_path' });

// Recognized manifest-level (top-level) keys. `_`-prefixed keys are annotation/comment keys and are
// always allowed (e.g. `_purpose`). Unknown top-level keys warn like unknown source fields.
export const CANONICAL_MANIFEST_FIELDS = new Set([
  'kb_name', 'sync_mode', 'publish_tier', 'sources', 'github',
]);

/**
 * Collect schema warnings for a manifest WITHOUT throwing — the validator half of the canonical
 * schema. Flags unknown per-source/top-level fields (typo guard) and deprecated aliases. Exported
 * so a conformance test drives off the SAME field set the loader enforces (no hand-mirrored list).
 *
 * @param {Object} manifest - parsed manifest object
 * @param {string} filePath - manifest path (for message context)
 * @returns {string[]} human-readable warning lines (empty when the manifest is fully canonical)
 */
export function collectManifestSchemaWarnings(manifest, filePath) {
  const warnings = [];
  const base = path.basename(filePath || 'manifest.json');
  const recognized = [...CANONICAL_SOURCE_FIELDS].join(', ');

  for (const key of Object.keys(manifest || {})) {
    if (key.startsWith('_')) continue; // annotation/comment key
    if (CANONICAL_MANIFEST_FIELDS.has(key)) continue;
    warnings.push(`  ⚠ ${base}: unknown top-level field "${key}" is ignored — check for a typo.`);
  }

  const sources = Array.isArray(manifest?.sources) ? manifest.sources : [];
  sources.forEach((src, i) => {
    for (const key of Object.keys(src || {})) {
      if (key.startsWith('_')) continue;
      if (CANONICAL_SOURCE_FIELDS.has(key)) continue;
      if (key in DEPRECATED_SOURCE_ALIASES) {
        warnings.push(
          `  ⚠ ${base} sources[${i}] (${src.path}): field "${key}" is DEPRECATED — rename to ` +
          `"${DEPRECATED_SOURCE_ALIASES[key]}" (normalized for now; support is removed after the ` +
          `deprecation window).`
        );
      } else {
        warnings.push(
          `  ⚠ ${base} sources[${i}] (${src.path}): unknown field "${key}" is ignored — check for a ` +
          `typo (recognized: ${recognized}).`
        );
      }
    }
  });

  return warnings;
}

/**
 * Validate a parsed manifest object against the schema.
 * Required: kb_name (string), sources (non-empty array).
 * Each source: path (string) required; ref, tier, doc_type, syncignore optional.
 * KB-curation (CEO-D-2026-07-11): manifest-level `publish_tier` ("P"|"I"|"U",
 * default "I") + per-source `doc_class`, `license_basis`, `lint_exempt`,
 * `exempt_reason`, `raw_path` (all optional). A `publish_tier:"P"` manifest hard-
 * fails if any source lacks a publishable `doc_class` (no default is allowed).
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

  if (manifest.publish_tier !== undefined) {
    if (typeof manifest.publish_tier !== 'string' || !PUBLISH_TIERS.has(manifest.publish_tier)) {
      throw new Error(`Invalid manifest at ${filePath}: publish_tier must be one of "P", "I", "U"`);
    }
  }
  const isTierP = manifest.publish_tier === 'P';

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
    // KB-curation optional per-source fields.
    if (src.doc_class !== undefined && typeof src.doc_class !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].doc_class must be a string`);
    }
    if (src.license_basis !== undefined && typeof src.license_basis !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].license_basis must be a string`);
    }
    if (src.lint_exempt !== undefined && !Array.isArray(src.lint_exempt)) {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].lint_exempt must be an array`);
    }
    if (src.exempt_reason !== undefined && typeof src.exempt_reason !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].exempt_reason must be a string`);
    }
    if (src.raw_path !== undefined && typeof src.raw_path !== 'string') {
      throw new Error(`Invalid manifest at ${filePath}: sources[${i}].raw_path must be a string`);
    }

    // Tier-P: every source MUST carry a publishable doc_class (no default allowed).
    if (isTierP) {
      if (!src.doc_class) {
        throw new Error(
          `Invalid manifest at ${filePath}: sources[${i}] (${src.path}) requires a doc_class ` +
          `in a Tier-P (publish_tier:"P") manifest — no default is allowed.`
        );
      }
      if (DENY_DOC_CLASSES.has(src.doc_class)) {
        throw new Error(
          `Invalid manifest at ${filePath}: sources[${i}] (${src.path}) doc_class "${src.doc_class}" ` +
          `is a deny-class {${[...DENY_DOC_CLASSES].join(', ')}} — structurally invalid in a Tier-P manifest.`
        );
      }
      if (!PUBLISHABLE_DOC_CLASSES.has(src.doc_class)) {
        throw new Error(
          `Invalid manifest at ${filePath}: sources[${i}] (${src.path}) doc_class "${src.doc_class}" ` +
          `is not a publishable class {${[...PUBLISHABLE_DOC_CLASSES].join(', ')}}.`
        );
      }
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

  // Canonical-schema warnings (WS-EVP-DESCIX-KB-CLEANUP item 5): surface deprecated aliases and
  // unknown/misspelled fields during the deprecation window — warn, never throw, so both legacy
  // formats keep syncing.
  for (const w of collectManifestSchemaWarnings(manifest, manifestPath)) {
    console.warn(w);
  }

  // Resolve source paths relative to workspace root
  manifest._resolvedSources = manifest.sources.map(src => {
    // Normalize deprecated field aliases (src_path -> raw_path). Canonical field wins if both set.
    const s = { ...src };
    for (const [alias, canonical] of Object.entries(DEPRECATED_SOURCE_ALIASES)) {
      if (s[alias] !== undefined && s[canonical] === undefined) {
        s[canonical] = s[alias];
      }
    }
    return {
      ...s,
      absolutePath: path.resolve(workspaceRoot, s.path),
      ref: s.ref || 'main',
      tier: s.tier || 3,
      doc_type: s.doc_type || 'generic',
      syncignore: s.syncignore || [],
      // KB-curation carry-through. doc_class is as-is (may be undefined for tier I).
      doc_class: s.doc_class,
      license_basis: s.license_basis ?? null,
      lint_exempt: s.lint_exempt || [],
      exempt_reason: s.exempt_reason ?? null,
      raw_path: s.raw_path ?? null
    };
  });

  // Surface publish_tier on the manifest object (default "I") so corpus.js can
  // read manifest.publish_tier to decide whether to run the Tier-P deny lint.
  manifest.publish_tier = manifest.publish_tier || 'I';

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
