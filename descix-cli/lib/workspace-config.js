import * as fs from 'fs/promises';
import * as path from 'path';
import { ENV_ORIGINS } from '@descix/app-sdk/dev';
import { resolveOrigin } from './origin.js';
// The one canonical KB-sync surface, from its owner. The example in requireContext() is a remedy
// a stuck developer will copy verbatim, so it must resolve to the live verb rather than a literal
// that can go stale where nobody is watching.
import { CANONICAL_KB_SYNC } from './commands/retired-kb-sync.js';

/**
 * THE ONE OWNER of "this app is not mapped in workspace.json, here is how to fix it".
 *
 * This text existed as three byte-identical copies in this file, and TWO OTHER call sites in
 * bin/descix.js answered the same condition with a DIFFERENT and wrong remedy — `npx descix init`,
 * which initialises a WORKSPACE and cannot map an app, so a developer who followed it stayed
 * exactly as stuck. That is the mirror-drift tell: the same condition explained two ways, and the
 * wrong one was the one a developer actually hit on the onboarding path.
 *
 * @param {string} appId - the app that is not mapped
 * @returns {string}
 */
export function unmappedAppMessage(appId) {
  return (
    `App "${appId}" is not mapped in workspace.json. ` +
    'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
  );
}

/**
 * ONE OWNER for turning a workspace-relative localPath into an absolute path.
 *
 * This was resolved four different ways across this file and its callers — three with
 * path.join and one with path.resolve — and the two treatments DISAGREE on an absolute
 * localPath. path.join('/ws', '/ws/app') yields '/ws/ws/app' (the "doubling"); path.resolve
 * yields '/ws/app'. Concretely, getAppByAppId() and detectContext() both derive from the same
 * _appIdToConfig entry, so an absolute localPath made detectContext match a directory that
 * getAppByAppId reported as a doubled path that does not exist.
 *
 * FAIL LOUD rather than quietly absorbing it. An absolute localPath in workspace.json is a
 * PORTABILITY defect, not a valid configuration: workspace.json is shared across checkouts and
 * machines, and a machine-specific absolute path cannot survive either. Silently resolving it
 * would make the doubling disappear while leaving the unshareable config in place. Name the
 * offending entry and the config verb that fixes it.
 */
export function resolveWorkspacePath(workspaceRoot, localPath, label = 'app') {
    if (!localPath) return null;
    if (path.isAbsolute(localPath)) {
        throw new Error(
            `workspace.json: localPath for '${label}' is an absolute path (${localPath}). ` +
            `localPath must be relative to the workspace root so the workspace is portable across ` +
            `checkouts and machines. Fix it with the config verb — never by hand-editing workspace.json.`
        );
    }
    return path.resolve(workspaceRoot, localPath);
}

/**
 * The ONE text for "there is no workspace here". It is correct advice for exactly one state —
 * the file does not exist — and it is a lie for every other state, which is why it now has a
 * single owner instead of being retyped at each throw site.
 */
const NOT_CONFIGURED_MESSAGE =
  'Workspace not configured.\n' +
  'Run "npx descix init" first to initialize your workspace.';

/**
 * THE ONE OWNER of the "move it aside, do not delete it" remedy.
 *
 * TWO different diagnoses reach this SAME remedy: a workspace.json that cannot be READ
 * (WorkspaceUnreadableError) and one that reads fine but carries the retired v1 schema
 * (load()'s v1 branch). Each used to hand-write its own remedy and THEY DISAGREED - the v1
 * branch prescribed DELETING the file outright, while its sibling forty lines above it in this
 * same file told the user their contents are lost only if they delete it. Two derivations of
 * one fact drift silently; this is the extracted owner both now consume.
 *
 * A REFUSAL MUST NEVER PRESCRIBE A REMEDY THAT DESTROYS THE THING IT IS DIAGNOSING. That rule
 * was ALREADY WRITTEN IN THIS FILE, as prose, a few lines above the branch that violated it -
 * and it still shipped. A rule stated beside code does not enforce itself, and proximity may
 * even hurt: a reader who sees the rule assumes it is in force. So it is expressed here as a
 * FUNCTION every refusal must CALL, rather than a comment every author must NOTICE.
 *
 * @param {string} configPath - absolute path to the workspace.json being refused
 * @param {string} initVerb - the verb that creates a fresh workspace once this file is aside
 * @returns {string} the remedy block (no trailing newline)
 */
export function moveAsideRemedy(configPath, initVerb) {
  return (
    `  • Recover it: restore ${path.basename(configPath)} from version control or a backup.\n` +
    `  • If you do not need its contents, move it aside first\n` +
    `    (mv "${configPath}" "${configPath}.broken") and then run "${initVerb}".\n` +
    `    Its contents are lost only if you delete it.`
  );
}

/**
 * THE ONE OWNER of "this workspace.json EXISTS and I could not read it".
 *
 * ABSENT and UNREADABLE are two different facts about the world and they need two different
 * remedies. load() used to collapse them — every read error, JSON syntax error and permission
 * error became NOT_CONFIGURED_MESSAGE — so a corrupt-but-present workspace.json reported as
 * absent and the message prescribed `descix init` over a file that was still recoverable. A
 * REFUSAL MUST NEVER PRESCRIBE A REMEDY THAT DESTROYS THE THING IT IS DIAGNOSING.
 *
 * It is a TYPE, not a message prefix, because callers have to branch on it (tryLoad returns
 * null for absent and rethrows this) and matching on error text is the narrow-string-matching
 * anti-pattern this file already suffered from — load()'s own v1 re-throw was an
 * `error.message.includes(...)` test, and it is deleted in the same change.
 *
 * save() already refuses to overwrite a present-but-unparseable file and names it. This is the
 * READ side of that same judgment, so the two halves of the file's lifecycle now agree.
 */
export class WorkspaceUnreadableError extends Error {
  constructor(configPath, cause) {
    // fs errors already lead with their code ("EACCES: permission denied, open ..."); JSON.parse
    // errors carry no code at all. Prefix only when it is not already there, so the reason line
    // never reads "EACCES: EACCES: ...".
    const raw = cause?.message || String(cause);
    const detail = cause?.code && !raw.startsWith(cause.code) ? `${cause.code}: ${raw}` : raw;
    super(
      `Workspace config exists but could not be read.\n` +
      `  File:   ${configPath}\n` +
      `  Reason: ${detail}\n` +
      `\n` +
      `This file is still on disk and has NOT been modified. Do NOT run "descix init" here —\n` +
      `that command is for a workspace that is ABSENT, and this one is DAMAGED.\n` +
      moveAsideRemedy(configPath, 'descix init')
    );
    this.name = 'WorkspaceUnreadableError';
    this.code = 'WORKSPACE_UNREADABLE';
    this.configPath = configPath;
    this.cause = cause;
  }
}

/**
 * WorkspaceConfig - Manages workspace-specific configuration
 *
 * This is the SOLE configuration methodology for DeSciX CLI.
 * All path resolution and context detection uses workspace.json.
 * 
 * Loads and manages .descix/workspace.json for workspace-level operations.
 */
export class WorkspaceConfig {
  constructor(config, workspaceRoot = null) {
    // Store workspace root for later use
    this.workspaceRoot = workspaceRoot || config.workspaceRoot || null;
    
    // Core config
    this.version = config.version || '1.0';
    this.type = config.type || 'workspace'; // 'workspace', 'community', or 'app'
    
    // Legacy fields (kept for save() PWA response conversion compatibility)
    this.defaultContext = config.defaultContext;
    this.apiUrl = config.apiUrl;
    this.environment = config.environment;
    this.directoryMappings = config.directoryMappings || {};

    // app_id → localPath map from env.platform + env.products (Unified Registry)
    this._appIdToConfig = this._buildAppIdMap(config);
    
    // Environment URLs for descix-serve gateway routing
    this.env = config.env || {};
    
    // Drive configuration (base_folder_id for template-based navigation)
    this.driveConfig = config.driveConfig || null;
  }

  /**
   * Build app_id → config map from env.platform and env.products
   * Unified Registry: app_id is globally unique; localPath maps to directory
   * @param {Object} config - Parsed workspace.json
   * @returns {Object} Map of appId -> { localPath, communityId?, kbId }
   */
  _buildAppIdMap(config) {
    const map = {};
    const env = config.env || {};
    const wsRoot = config.workspaceRoot || this.workspaceRoot;

    // env.platform (e.g. daita -> DeSciX_Cloud)
    if (env.platform?.appId && env.platform?.localPath) {
      map[env.platform.appId] = {
        localPath: env.platform.localPath,
        communityId: env.platform.communityId || null,
        kbId: env.platform.kbId || 'General'
      };
    }

    // env.products array (e.g. powch -> DeSciX_Powch)
    const products = Array.isArray(env.products) ? env.products : [];
    for (const p of products) {
      if (p?.appId && p?.localPath) {
        map[p.appId] = {
          localPath: p.localPath,
          communityId: p.communityId || null,
          kbId: p.kbId || 'General'
        };
      }
    }

    return map;
  }

  /**
   * Get app config by app_id (Unified Registry - app_id is globally unique)
   * Resolves from env.platform, env.products, communities, or products
   * @param {string} appId - App/product identifier
   * @returns {Object|null} { localPath, absolutePath?, communityId?, kbId } or null
   */
  getAppByAppId(appId) {
    if (!appId || !this.workspaceRoot) return null;

    // env.platform + env.products (primary for manually crafted workspace)
    const fromEnv = this._appIdToConfig[appId];
    if (fromEnv) {
      const absPath = resolveWorkspacePath(this.workspaceRoot, fromEnv.localPath, appId);
      return {
        localPath: fromEnv.localPath,
        absolutePath: absPath,
        communityId: fromEnv.communityId,
        kbId: fromEnv.kbId || 'General'
      };
    }

    return null;
  }

  /**
   * The RAW registry entry for an app — `localPath` exactly as workspace.json carries it, with NO
   * path resolution and therefore no possibility of throwing on a bad stored value.
   *
   * This exists for exactly one caller shape: a command that is about to REPLACE an app's
   * localPath. Such a command must not resolve the OUTGOING value. getAppByAppId() resolves, and
   * resolving the value you are on your way to overwrite is what made `descix app set-localpath`
   * unusable precisely when it was needed — a workspace already carrying a rejected localPath
   * could not be repaired by the one verb whose job is repairing it, while the rejection itself
   * forbade hand-editing. The verb was the prescribed remedy and the verb refused.
   *
   * It reads the SAME map getAppByAppId reads (_buildAppIdMap is still the one owner of "what is
   * mapped"); it simply stops short of resolution. Do NOT use it to obtain a usable path — take
   * getAppByAppId().absolutePath for that, so the loader's rejection still runs.
   *
   * @param {string} appId - App/product identifier
   * @returns {{ localPath: string, communityId: string|null, kbId: string }|null}
   */
  getAppEntry(appId) {
    if (!appId) return null;
    return this._appIdToConfig?.[appId] || null;
  }

  /**
   * THE ONE OWNER of "find the LIVE env entry for this app, or hard-fail".
   *
   * Live means the actual object inside this.env — mutate it and save() persists the mutation.
   * getAppByAppId() and getAppEntry() both return copies and are useless for writing.
   *
   * This existed as three byte-identical copies (setSitePort, setMicroservicePort,
   * setStaticSite) and `set-localpath` hand-rolled a FOURTH variant in bin/descix.js that
   * walked env.products ONLY. That omission is the whole reason the platform app silently
   * failed: the loop found nothing, wrote nothing, and the command still printed success.
   * A fourth copy here would have reproduced the same class of bug, so there is now one.
   *
   * @param {string} appId - App identifier
   * @returns {Object} the live env.platform or env.products[] entry
   * @throws if appId is not mapped
   */
  _liveEnvEntry(appId) {
    let entry = null;
    if (this.env?.platform?.appId === appId) {
      entry = this.env.platform;
    } else if (Array.isArray(this.env?.products)) {
      entry = this.env.products.find(p => p.appId === appId) || null;
    }
    if (!entry) {
      throw new Error(unmappedAppMessage(appId));
    }
    return entry;
  }

  /**
   * Update an app's localPath in env.platform or env.products[].
   *
   * The canonical write path for localPath, and the sibling that was missing while
   * setSitePort/setMicroservicePort/setStaticSite all existed. Backs `descix app set-localpath`.
   *
   * localPath MUST be workspace-root-relative. It is validated here through
   * resolveWorkspacePath — the LOADER'S OWN resolver, not a second copy of its rules — so a
   * value the loader will refuse on the next read is refused now, before anything is written.
   * Writing a value the loader rejects is what bricked workspaces: every subsequent command
   * threw, including the repair verbs, while the rejection forbade hand-editing.
   *
   * Persists via save() — same auto-save pattern as its siblings.
   * Hard-fails if appId is not mapped in env.platform or env.products.
   *
   * @param {string} appId - App identifier (must exist in env.platform or env.products)
   * @param {string} localPath - New path, relative to the workspace root
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setLocalPath(appId, localPath) {
    if (!appId) throw new Error('appId is required');
    if (!localPath) throw new Error('localPath is required');

    const entry = this._liveEnvEntry(appId);

    // Validate through the loader's own resolver. Throws on an absolute path.
    resolveWorkspacePath(this.workspaceRoot, localPath, appId);

    entry.localPath = localPath;
    return this.save();
  }

  /**
   * Get the absolute path to an app's site/ directory
   * @param {string} appId - App identifier
   * @returns {string|null} Absolute path to site/ or null if app not mapped
   */
  getSitePath(appId) {
    const appConfig = this.getAppByAppId(appId);
    if (!appConfig?.absolutePath) return null;
    return path.join(appConfig.absolutePath, 'site');
  }

  /**
   * Get the absolute path to an app's microservice/ directory
   * @param {string} appId - App identifier
   * @returns {string|null} Absolute path to microservice/ or null if app not mapped
   */
  getMicroservicePath(appId) {
    const appConfig = this.getAppByAppId(appId);
    if (!appConfig?.absolutePath) return null;
    return path.join(appConfig.absolutePath, 'microservice');
  }
  
  /**
   * Find the workspace root by searching up from startDir
   * 
   * Workspace root is identified by (in priority order):
   * 1. .descix/ folder (DeSciX workspace marker)
   * 2. .cursor/ folder (Cursor IDE workspace)
   * 3. .vscode/ folder (VS Code workspace)
   * 
   * This ensures we find the actual IDE workspace root, not just the current directory.
   * 
   * @param {string} startDir - Directory to start searching from (default: cwd)
   * @returns {Promise<string|null>} Workspace root path, or null if not found
   */
  static async findWorkspaceRoot(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      // Workspace root requires .descix/workspace.json — marker dirs alone are not enough
      // (sub-projects like DeSciX_Cloud have .descix/ for wallet.json but are not workspace roots)
      const wsConfigPath = path.join(currentDir, '.descix', 'workspace.json');
      try {
        const stat = await fs.stat(wsConfigPath);
        if (stat.isFile()) {
          return currentDir;
        }
      } catch {
        // workspace.json not found at this level, continue up
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }

    return null; // No workspace found
  }
  
  /**
   * Load workspace configuration from .descix/workspace.json
   * 
   * Automatically searches upward from startDir to find workspace root.
   * 
   * ABSENT vs UNREADABLE IS DECIDED HERE AND NOWHERE ELSE. Callers consume the distinction as a
   * type (WorkspaceUnreadableError), never by re-deciding it or by matching on message text.
   *
   * @param {string} startDir - Directory to start searching from (default: cwd)
   * @returns {Promise<WorkspaceConfig>} Configuration object
   * @throws {Error} NOT_CONFIGURED_MESSAGE when no workspace.json exists
   * @throws {WorkspaceUnreadableError} when one exists and cannot be read or parsed
   */
  static async load(startDir = process.cwd()) {
    // First, find workspace root by searching upward
    const workspaceRoot = await WorkspaceConfig.findWorkspaceRoot(startDir);
    if (!workspaceRoot) {
      throw new Error(NOT_CONFIGURED_MESSAGE);
    }

    const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');

    let data;
    try {
      data = await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      // ENOENT is the only genuinely ABSENT case reachable here: findWorkspaceRoot stat'd this
      // file a moment ago, so ENOENT means it disappeared in between. Everything else — EACCES
      // on a file we can see but not open, EISDIR, EIO — is a file that EXISTS. Reporting any of
      // those as "not configured" is what sent users to `descix init` over recoverable data.
      if (error.code === 'ENOENT') throw new Error(NOT_CONFIGURED_MESSAGE);
      throw new WorkspaceUnreadableError(configPath, error);
    }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      // The file is present and holds bytes we could not parse. Name the parse error and the
      // path; never absorb this into "not configured".
      throw new WorkspaceUnreadableError(configPath, error);
    }

    // v1 format hard-error: has communities block but no env block.
    // This throw now sits OUTSIDE any catch, so it propagates on its own. The previous
    // `error.message.includes('v1 workspace format')` re-throw was narrow string matching
    // (DeSciX anti-pattern #6) guarding a catch that should never have been this wide.
    if (parsed.communities && !parsed.env) {
      throw new Error(
        'v1 workspace format is not supported. Migrate to v2.1.\n' +
        `  File:   ${configPath}\n` +
        '\n' +
        'This file is still on disk and has NOT been modified. There is no automatic v1 → v2.1\n' +
        'migration: no surviving code reads the v1 layout, so its contents cannot be converted\n' +
        'for you — but they are still readable BY YOU, and this file is the only copy of them.\n' +
        moveAsideRemedy(configPath, 'descix app init')
      );
    }

    return new WorkspaceConfig(parsed, workspaceRoot);
  }

  /**
   * Try to load workspace configuration, return null if not found
   * Useful for commands that need to check if workspace exists
   *
   * RETURNS NULL FOR ABSENT, THROWS FOR UNREADABLE. "There is no workspace here" and "the
   * workspace here is damaged" are different answers and only the first one is a soft no.
   * Swallowing the second made a corrupt workspace look like a fresh directory, which is how a
   * damaged workspace silently fell back to the DEFAULT (prod) origin instead of stopping.
   *
   * @param {string} startDir - Directory to start searching from
   * @returns {Promise<WorkspaceConfig|null>} config, or null when no workspace.json exists
   * @throws {WorkspaceUnreadableError} when one exists and cannot be read or parsed
   */
  static async tryLoad(startDir = process.cwd()) {
    try {
      return await WorkspaceConfig.load(startDir);
    } catch (error) {
      if (error instanceof WorkspaceUnreadableError) throw error;
      return null;
    }
  }
  
  /**
   * Save workspace configuration in v2.1 format.
   * Always writes env.platform / env.products structure.
   *
   * PRESERVES KEYS IT DOES NOT UNDERSTAND. This method used to serialize a fixed field list from
   * memory over the whole file, so ANY top-level key it did not itself enumerate was silently
   * destroyed by the next `descix app set-port` — a writer re-serializing a known schema and
   * discarding the rest. That is the same defect class as a record writer dropping a field it was
   * never taught about, and it is invisible: the write succeeds, the file looks well-formed, and
   * the loss is only discovered by whoever needed the missing key.
   *
   * The on-disk file is re-read at save time rather than trusted from construction, because the
   * instance may have been held across another writer's save.
   *
   * @param {string} [workspaceRoot] - Workspace root directory (uses stored root if not provided)
   * @returns {Promise<string>} Path to saved config
   */
  async save(workspaceRoot = null) {
    const root = workspaceRoot || this.workspaceRoot;
    if (!root) {
      throw new Error('Workspace root not set. Provide workspaceRoot parameter or load config first.');
    }

    const descixDir = path.join(root, '.descix');
    await fs.mkdir(descixDir, { recursive: true });
    const configPath = path.join(descixDir, 'workspace.json');

    this.workspaceRoot = root;

    // Build env block for v2.1 output
    const envBlock = (this.env && Object.keys(this.env).length > 0) ? this.env : null;

    // The keys this writer OWNS. Everything else on disk is carried through untouched.
    const OWNED = ['version', 'workspaceRoot', 'type', 'env', 'driveConfig'];

    let onDisk = {};
    try {
      const existing = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(existing);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) onDisk = parsed;
    } catch (err) {
      // ENOENT is the ordinary first save. A PRESENT-BUT-UNPARSEABLE file is different: carrying
      // on would overwrite content we could not read, so refuse and name the file.
      if (err.code !== 'ENOENT') {
        throw new Error(
          `Refusing to overwrite ${configPath}: it exists but could not be read as JSON ` +
          `(${err.message}). Fix or remove it — saving now would destroy whatever it holds.`
        );
      }
    }

    const carried = {};
    for (const [k, v] of Object.entries(onDisk)) {
      if (!OWNED.includes(k)) carried[k] = v;
    }

    const configData = {
      ...carried,
      version: '2.1',
      workspaceRoot: path.resolve(root),
      type: this.type,
    };

    if (envBlock) configData.env = envBlock;
    if (this.driveConfig) configData.driveConfig = this.driveConfig;

    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return configPath;
  }
  
  // ============ App Registration Methods ============

  /**
   * Register an app in the v2.1 workspace (env.platform or env.products).
   * community_id is server-authoritative — not stored in workspace.json.
   * @param {string} communityId - Accepted for call-site compatibility but not stored
   * @param {string} appId - App identifier (globally unique)
   * @param {Object} appConfig - App configuration
   * @param {string} appConfig.localPath - Local folder path relative to workspaceRoot
   * @param {string} [appConfig.kbId] - Default knowledge base ID
   * @returns {boolean} Success status
   */
  registerApp(communityId, appId, appConfig) {
    if (!appId || !appConfig.localPath) {
      throw new Error('appId and localPath are required');
    }

    // Validate through THE LOADER'S OWN RESOLVER — the same owner setLocalPath consumes, never a
    // second copy of its rules. Three writers persisted a localPath and only ONE validated it, so
    // `descix app init -p /abs` wrote an absolute value, created directories at that arbitrary
    // absolute location, printed success, and bricked the workspace on the NEXT read — the loader
    // refused the value for every command including the repair verbs, while the refusal forbade
    // hand-editing. A path this CLI accepts must be honoured, or refused before anything is written.
    resolveWorkspacePath(this.workspaceRoot, appConfig.localPath, appId);

    if (!this.env) this.env = {};
    if (!Array.isArray(this.env.products)) this.env.products = [];

    // communityId is STORED, not just validated. It was previously accepted as a parameter and
    // silently discarded, so `descix init -c egpt` wrote no trace of `egpt` anywhere — and
    // `workspace-identity.js` (this entry's reader) then had no community to report, which is
    // how the generated agent files named nobody's community. Writer and reader are a pair:
    // the key order in `readIdentity()` mirrors the shape written here.
    const entry = { appId, localPath: appConfig.localPath, kbId: appConfig.kbId || 'General' };
    if (communityId) entry.communityId = communityId;

    if (this.env.platform?.appId === appId) {
      this.env.platform.localPath = appConfig.localPath;
      if (appConfig.kbId) this.env.platform.kbId = appConfig.kbId;
      if (communityId) this.env.platform.communityId = communityId;
    } else {
      const idx = this.env.products.findIndex(p => p.appId === appId);
      if (idx >= 0) {
        this.env.products[idx] = { ...this.env.products[idx], ...entry };
      } else {
        this.env.products.push(entry);
      }
    }

    this._appIdToConfig = this._buildAppIdMap({ env: this.env, workspaceRoot: this.workspaceRoot });
    this.version = '2.1';
    return true;
  }
  
  /**
   * Resolve context based on file path
   * 
   * Maps file paths to appropriate community/app/kb based on directory mappings.
   * Uses longest match (most specific directory) when multiple mappings match.
   * 
   * @param {string} filePath - File path to resolve
   * @returns {object} Context with communityId, appId, kbId
   */
  resolveContext(filePath) {
    // Normalize path (handle both Unix and Windows paths)
    const normalized = filePath.replace(/\\/g, '/');
    
    // Try to match directory mappings (longest match first for specificity)
    const matches = [];
    for (const [dir, context] of Object.entries(this.directoryMappings)) {
      const normalizedDir = dir.replace(/\\/g, '/');
      if (normalized.includes(normalizedDir + '/') || normalized.startsWith(normalizedDir)) {
        matches.push({ dir: normalizedDir, context, length: normalizedDir.length });
      }
    }
    
    if (matches.length > 0) {
      // Return longest match (most specific directory)
      matches.sort((a, b) => b.length - a.length);
      return matches[0].context;
    }
    
    // Fallback to default context
    return this.defaultContext;
  }
  
  /**
   * Detect community/app context from current working directory
   * Matches cwd against known absolutePaths in communities/apps.
   * 
   * This is the primary method for autodiscovery of app context.
   * 
   * @param {string} startDir - Directory to detect context from (default: cwd)
   * @returns {{ communityId: string, appId: string, kbId: string }|null}
   */
  detectContext(startDir = process.cwd()) {
    const cwd = path.resolve(startDir);
    const wsRoot = this.workspaceRoot ? path.resolve(this.workspaceRoot) : null;

    // env.platform + env.products (Unified Registry - primary)
    if (wsRoot) {
      for (const [appId, cfg] of Object.entries(this._appIdToConfig || {})) {
        const appPath = resolveWorkspacePath(wsRoot, cfg.localPath, appId);
        if (cwd.startsWith(appPath)) {
          return {
            appId,
            communityId: cfg.communityId || null,
            kbId: cfg.kbId || 'General'
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Resolve context by merging CLI options with detected context
   * CLI options take priority over detected context
   * Unified Registry: app_id only is sufficient; community_id derived on backend
   * 
   * @param {Object} options - CLI options { community, app, kb }
   * @returns {{ communityId: string|null, appId: string|null, kbId: string }}
   */
  resolveContextWithOptions(options = {}) {
    const detected = this.detectContext();
    
    return {
      communityId: options.community || detected?.communityId || null,
      appId: options.app || detected?.appId || null,
      kbId: options.kb || detected?.kbId || 'General'
    };
  }
  
  /**
   * Resolve context and throw if app not determined
   * Unified Registry: app_id only required (community_id derived on backend)
   * 
   * @param {Object} options - CLI options { community, app, kb }
   * @returns {{ communityId: string|null, appId: string, kbId: string }}
   * @throws {Error} If appId cannot be determined
   */
  requireContext(options = {}) {
    const ctx = this.resolveContextWithOptions(options);
    
    if (!ctx.appId) {
      throw new Error(
        'Could not determine app context.\n\n' +
        'Options:\n' +
        '  1. cd into an app directory\n' +
        '  2. Use flag: -a <app_id>\n\n' +
        `Example: npx ${CANONICAL_KB_SYNC} -a daita`
      );
    }
    
    return ctx;
  }
  
  /**
   * Get the workspace root path
   * @returns {string|null}
   */
  getWorkspaceRoot() {
    return this.workspaceRoot;
  }

  /**
   * Get the API origin this workspace is configured for, or NULL when none is configured.
   *
   * Priority: env.apiUrl > legacy this.apiUrl. There is NO third branch. This used to end in
   * `return DEFAULT_API_URL` — the shipped PROD origin — which meant an unconfigured workspace
   * was indistinguishable from one that had deliberately chosen production, and every caller
   * received a prod origin the developer had never picked. Resolution and the fail-loud live in
   * `lib/origin.js`; this method only reports what THIS workspace file says.
   *
   * There is likewise no environment-name-to-localhost derivation: an environment names a cloud
   * environment, and localhost is a URL you set explicitly
   * (`descix config set-env dev --url https://localhost:4000`, or env.apiUrl).
   *
   * @returns {string|null} the configured origin, or null if this workspace names none
   */
  getApiUrl() {
    // Consumes the ONE origin owner rather than re-deriving the precedence or re-spelling the
    // declared default. Under (A') an unconfigured workspace resolves to the declared default
    // PROD; the SOURCE that distinguishes "chose prod" from "chose nothing" is carried by
    // resolveOrigin() and printed by the api-client, never by a null returned from here.
    return resolveOrigin({
      workspaceEnvApiUrl: this.env?.apiUrl,
      legacyApiUrl: this.apiUrl,
    }).origin;
  }

  /**
   * Known environment URL mapping.
   * Shared between `descix config set-env` and the `--env` global flag.
   * Origins come from the ONE owner (@descix/app-sdk/dev envOrigins); this map
   * adds only the CLI's own concern, the Secret Manager label.
   * @type {Object.<string, {url: string, secretLabel: string}>}
   */
  static ENV_MAP = {
    dev:  { url: ENV_ORIGINS.dev,  secretLabel: 'DEBUG' },
    demo: { url: ENV_ORIGINS.demo, secretLabel: 'DEMO' },
    prod: { url: ENV_ORIGINS.prod, secretLabel: 'LIVE' },
  };

  /**
   * Set a WORKSPACE-LEVEL env key (env.gateway.port, env.devCerts, env.powchUrl,
   * env.siteUrl) — the keys that describe the workspace itself rather than one app.
   *
   * These all previously had NO CLI verb, so the only way to set them was to hand-edit
   * .descix/workspace.json (redteam G-6). Hand-editing a generated file is how the
   * shape drifts and how a developer ends up debugging their own typo, which is the
   * opposite of "it should all just work".
   *
   * Pass null to REMOVE a key; empty parent objects are cleaned up so the file never
   * accumulates `"devCerts": {}` noise.
   *
   * @param {string} dottedKey - one of: gateway.port | devCerts.dir | devCerts.cert | devCerts.key | powchUrl | siteUrl
   * @param {string|number|null} value
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setEnvKey(dottedKey, value) {
    const ALLOWED = ['gateway.port', 'devCerts.dir', 'devCerts.cert', 'devCerts.key', 'powchUrl', 'siteUrl'];
    if (!ALLOWED.includes(dottedKey)) {
      throw new Error(
        `"${dottedKey}" is not a workspace-level env key.\n` +
        `  Settable here: ${ALLOWED.join(', ')}\n` +
        '  Per-app keys have their own verbs: descix app set-site / set-port / set-localpath.'
      );
    }

    if (!this.env) this.env = {};
    const parts = dottedKey.split('.');

    if (value === null || value === undefined) {
      if (parts.length === 1) {
        delete this.env[parts[0]];
      } else {
        const parent = this.env[parts[0]];
        if (parent) {
          delete parent[parts[1]];
          if (Object.keys(parent).length === 0) delete this.env[parts[0]];
        }
      }
      return this.save();
    }

    if (parts.length === 1) {
      this.env[parts[0]] = value;
    } else {
      if (!this.env[parts[0]]) this.env[parts[0]] = {};
      this.env[parts[0]][parts[1]] = value;
    }
    return this.save();
  }

  /**
   * Update an app's site.port in env.products[] (or env.platform if it is the platform app).
   *
   * Pass `null` to remove site.port; if site.{} becomes empty, site.{} is also deleted.
   * Persists via save() at the end — same auto-save pattern as setEnvironment().
   * Hard-fails if appId is not mapped in env.platform or env.products.
   *
   * @param {string} appId - App identifier (must exist in env.platform or env.products)
   * @param {number|string|null} port - Port number to set, or null to remove site.port
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setSitePort(appId, port) {
    if (!appId) throw new Error('appId is required');

    const entry = this._liveEnvEntry(appId);

    if (port === null || port === undefined) {
      // Remove site.port; clean up empty site.{}
      if (entry.site) {
        delete entry.site.port;
        if (Object.keys(entry.site).length === 0) {
          delete entry.site;
        }
      }
    } else {
      if (!entry.site) entry.site = {};
      entry.site.port = port;
    }

    return this.save();
  }

  /**
   * Update an app's microservice.port in env.products[] (or env.platform if it is the platform app).
   *
   * Parallel to setSitePort(), but operates on the entry's microservice.{} slot.
   * This is the canonical write path for the microservice port that `descix microservice init`
   * reads (and hard-fails on if missing). Backs the `descix app set-port` command, closing
   * WS-CLI-MESH-ROUTING-GAP without hand-editing workspace.json.
   *
   * Pass `null` to remove microservice.port; if microservice.{} becomes empty, it is also deleted.
   * Persists via save() at the end — same auto-save pattern as setSitePort()/setEnvironment().
   * Hard-fails if appId is not mapped in env.platform or env.products.
   *
   * @param {string} appId - App identifier (must exist in env.platform or env.products)
   * @param {number|string|null} port - Port number to set, or null to remove microservice.port
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setMicroservicePort(appId, port) {
    if (!appId) throw new Error('appId is required');

    const entry = this._liveEnvEntry(appId);

    if (port === null || port === undefined) {
      // Remove microservice.port; clean up empty microservice.{}
      if (entry.microservice) {
        delete entry.microservice.port;
        if (Object.keys(entry.microservice).length === 0) {
          delete entry.microservice;
        }
      }
    } else {
      if (!entry.microservice) entry.microservice = {};
      entry.microservice.port = port;
    }

    return this.save();
  }

  /**
   * Update an app's site config in env.products[] (or env.platform if it is the platform app).
   *
   * Parallel to setSitePort()/setMicroservicePort(), but operates on the entry's site.{} slot's
   * static-site fields. This is the canonical write path for site.static — the relative path the
   * dev gateway's staticSitePlugin serves at /p/{appId}/ (see createViteProxyConfig:
   * site.static is resolved against the app's localPath; "." means the localPath itself).
   * Backs the `descix app set-site` command, closing the site.static workspace gap without
   * hand-editing workspace.json (the org rule forbids hand edits — CEO-D-2026-06-02-SSGPOD-SITE-PREPROD).
   *
   * Mutates site.static and/or site.port. Pass static === null to remove site.static; pass
   * port === null to remove site.port. If site.{} becomes empty after removals it is deleted.
   * Persists via save() at the end — same auto-save pattern as setSitePort()/setMicroservicePort().
   * Hard-fails if appId is not mapped in env.platform or env.products.
   *
   * @param {string} appId - App identifier (must exist in env.platform or env.products)
   * @param {Object} fields - Fields to set on site.{}
   * @param {string|null} [fields.static] - Relative static-site path to set, or null to remove site.static
   * @param {number|string|null} [fields.port] - Site dev-server port to set, or null to remove site.port
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setStaticSite(appId, fields = {}) {
    if (!appId) throw new Error('appId is required');
    if (!fields || typeof fields !== 'object') throw new Error('fields object is required');

    const entry = this._liveEnvEntry(appId);

    if (!entry.site) entry.site = {};

    // site.static — set or remove
    if ('static' in fields) {
      if (fields.static === null || fields.static === undefined) {
        delete entry.site.static;
      } else {
        entry.site.static = fields.static;
      }
    }

    // site.port — set or remove (parallel to setSitePort, for static+devCommand sites)
    if ('port' in fields) {
      if (fields.port === null || fields.port === undefined) {
        delete entry.site.port;
      } else {
        entry.site.port = fields.port;
      }
    }

    // Clean up an empty site.{} so we never leave a bare {} behind
    if (Object.keys(entry.site).length === 0) {
      delete entry.site;
    }

    return this.save();
  }

  /**
   * Persistently set the target environment in workspace.json.
   *
   * Updates env.environment and env.apiUrl, then saves. EVERY environment writes a
   * URL — including dev, which writes the cloud DEV origin. Pointing at a local
   * backend is `--url`: `descix config set-env dev --url https://localhost:4000`.
   * For custom envs, uses --url or defaults to https://{name}.descix.net.
   *
   * @param {string} envName - Environment name (dev, demo, prod, or custom)
   * @param {string|null} [apiUrl] - Explicit API URL override
   * @returns {Promise<{configPath: string, environment: string, apiUrl: string, secretLabel: string}>}
   */
  async setEnvironment(envName, apiUrl = null) {
    const normalized = envName.toLowerCase();
    const known = WorkspaceConfig.ENV_MAP[normalized];

    let resolvedUrl;
    let secretLabel;
    let envLabel;

    if (known) {
      resolvedUrl = apiUrl || known.url; // explicit --url overrides even for known envs
      secretLabel = known.secretLabel;
      envLabel = normalized.toUpperCase();
    } else {
      resolvedUrl = apiUrl || `https://${normalized}.descix.net`;
      secretLabel = normalized.toUpperCase();
      envLabel = normalized.toUpperCase();
    }

    // Update in-memory state
    if (!this.env) this.env = {};
    this.env.environment = envLabel;

    this.env.apiUrl = resolvedUrl;

    // Save to disk
    const configPath = await this.save();

    return {
      configPath,
      environment: envLabel,
      apiUrl: resolvedUrl,
      secretLabel
    };
  }
  
  /**
   * Get all contexts (default + additional)
   * 
   * Useful for multi-context queries that search across multiple
   * communities or apps simultaneously.
   * 
   * @returns {Array} Array of context objects
   */
  getAllContexts() {
    return [this.defaultContext, ...this.additionalContexts];
  }
  
  /**
   * Validate configuration
   * 
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // v2.1 validation: must have env block
    if (!this.env || Object.keys(this.env).length === 0) {
      errors.push('Missing env block — workspace.json must be v2.1 format with env.platform or env.products');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

