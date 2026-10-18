import * as fs from 'fs/promises';
import * as path from 'path';
import { ENV_ORIGINS, resolveWorkspaceApps, resolveWorkspaceAppsFrom, assertSiteStatic } from '@descix/app-sdk/dev';
import { resolveOrigin } from './origin.js';
// The one canonical KB-sync surface, from its owner. The example in requireContext() is a remedy
// a stuck developer will copy verbatim, so it must resolve to the live verb rather than a literal
// that can go stale where nobody is watching.
import { CANONICAL_KB_SYNC } from './commands/kb-sync-surface.js';
import { npxCommand } from './invocation.js';

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
    `App "${appId}" is not this workspace's app (workspace.json env.app). ` +
    'A v3 workspace is single-app: run commands for another app from ITS repo root, ' +
    'or run `descix app init -a <id>` in a fresh repo to create its workspace.'
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
 * The local app set of a loaded workspace — THE one CLI-side entry to resolveWorkspaceApps.
 * Every command that enumerates local apps (health, microservice restart) goes through here, so
 * a config that carries no workspaceRoot FAILS LOUD in one place instead of each caller quietly
 * substituting the cwd and enumerating a different workspace than the one it was handed.
 *
 * @param {WorkspaceConfig} wsConfig
 * @returns {{ shellApp: Object|null, apps: Object[] }} see resolveWorkspaceApps
 */
export function resolveLocalApps(wsConfig) {
    if (!wsConfig?.workspaceRoot) {
        throw new Error(
            'Cannot enumerate the workspace apps: the workspace config carries no workspaceRoot. ' +
            'Load it with WorkspaceConfig.load() (which sets it) rather than constructing it bare.'
        );
    }
    return resolveWorkspaceApps(wsConfig.workspaceRoot);
}

/**
 * `descix app init` runs where the APP REPO is — its root becomes the workspace root. A nested
 * checkout used to WALK UP, find a parent workspace and silently register into it (the measured
 * trap: an app repo cloned inside another workspace mapped itself into the parent's registry).
 * Under v3 single-app there is nothing to register into: a workspace found at an ANCESTOR of the
 * init directory is a refusal, loud, before anything is written anywhere.
 *
 * A workspace AT the directory itself is fine — that is the re-init case.
 *
 * @param {string} dir - the directory `app init` is about to make a workspace root
 * @throws when a workspace.json exists at a strict ancestor of dir
 */
export async function assertNoParentWorkspace(dir = process.cwd()) {
    const resolved = path.resolve(dir);
    const found = await WorkspaceConfig.findWorkspaceRoot(resolved);
    if (found && path.resolve(found) !== resolved) {
        throw new Error(
            `This directory is nested inside another DeSciX workspace.\n` +
            `  Here:              ${resolved}\n` +
            `  Parent workspace:  ${found} (.descix/workspace.json)\n` +
            `\n` +
            `A v3 workspace is single-app: the app repo's own root is its workspace root, and\n` +
            `"descix app init" refuses to run inside someone else's workspace rather than\n` +
            `silently registering this checkout into it.\n` +
            `Move this checkout OUT of ${found} (sibling checkouts, one gateway config, is the\n` +
            `supported local layout), then run "descix app init" again from the repo root.`
        );
    }
}

/**
 * The ONE text for "there is no workspace here". It is correct advice for exactly one state —
 * the file does not exist — and it is a lie for every other state, which is why it now has a
 * single owner instead of being retyped at each throw site.
 */
const NOT_CONFIGURED_MESSAGE =
  'Workspace not configured.\n' +
  `Run "${npxCommand('init')}" first to initialize your workspace.`;

/**
 * THE ONE OWNER of "how do I set the API origin". Named by every refusal that turns a developer
 * away from a retired way of setting it (the retired setter verb, a top-level `apiUrl` key), so
 * the three live surfaces are spelled once. Order: persistent known env, persistent custom
 * origin, per-run.
 */
export const TOP_LEVEL_API_URL_REMEDY =
  'descix config init --env dev|demo|prod         # pin a known environment (writes env.apiUrl)\n' +
  '  descix config set-env <name> --url <origin>    # pin a custom origin under your own env name\n' +
  '  descix --api-url <origin> <command>            # this run only; no workspace change (e.g. serve)';

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
 * A workspace.json in a RETIRED format (v1, v2.1 multi-app). It is a TYPE, like
 * WorkspaceUnreadableError, because tryLoad() has to branch on it: "there is no workspace
 * here" and "the workspace here is in a retired format" are different answers, and only the
 * first is a soft null. Measured 2026-10-10: the refusal threw a PLAIN Error, tryLoad
 * swallowed it, and five app repos' stale v2.1 files silently resolved to the DEFAULT origin —
 * the exact wrong-env hazard the loader exists to prevent.
 */
export class WorkspaceRetiredFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkspaceRetiredFormatError';
    this.code = 'WORKSPACE_RETIRED_FORMAT';
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
/** Error code of resolveAppRepo's refusal when no gateway entry holds the app. */
export const APP_NOT_IN_GATEWAY = 'APP_NOT_IN_GATEWAY';

export class WorkspaceConfig {
  constructor(config, workspaceRoot = null) {
    // Store workspace root for later use
    this.workspaceRoot = workspaceRoot || config.workspaceRoot || null;
    
    // Core config
    this.version = config.version || '1.0';
    this.type = config.type || 'workspace'; // 'workspace', 'community', or 'app'
    
    // Legacy fields (kept for save() PWA response conversion compatibility)
    this.defaultContext = config.defaultContext;
    this.environment = config.environment;
    this.directoryMappings = config.directoryMappings || {};

    // app_id → config map from env.app (v3 single-app)
    this._appIdToConfig = this._buildAppIdMap(config);
    
    // Environment URLs for descix-serve gateway routing
    this.env = config.env || {};
    
    // Drive configuration (base_folder_id for template-based navigation)
    this.driveConfig = config.driveConfig || null;
  }

  /**
   * Build the app_id → config map from env.app (v3 single-app).
   *
   * v3 holds exactly ONE app and its localPath is implicitly '.': the app repo's root IS the
   * workspace root. The map shape survives (one entry) so every reader keyed on appId keeps
   * its contract; the retired v2.1 multi-app walk (env.platform + env.products) is refused by
   * load() and has no reader here any more.
   *
   * @param {Object} config - Parsed workspace.json
   * @returns {Object} Map of appId -> { localPath, communityId?, kbId }
   */
  _buildAppIdMap(config) {
    const map = {};
    const app = config.env?.app;
    if (app?.appId) {
      map[app.appId] = {
        localPath: '.',
        communityId: app.communityId || null,
        kbId: app.kbId || 'General'
      };
    }
    return map;
  }

  /**
   * Get app config by app_id (Unified Registry - app_id is globally unique)
   * Resolves from env.app (v3 single-app)
   * @param {string} appId - App/product identifier
   * @returns {Object|null} { localPath, absolutePath?, communityId?, kbId } or null
   */
  getAppByAppId(appId) {
    if (!appId || !this.workspaceRoot) return null;

    // env.app (v3 single-app)
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
   * THE ONE OWNER of "find the LIVE env entry for this app, or hard-fail".
   *
   * Live means the actual object inside this.env — mutate it and save() persists the mutation.
   * getAppByAppId() returns copies and is useless for writing.
   *
   * The one lookup every entry setter (setMicroservicePort, setStaticSite) uses. In v3 the only
   * live entry is env.app; any other id hard-fails with the canonical unmapped message.
   *
   * @param {string} appId - App identifier
   * @returns {Object} the live env.app entry
   * @throws if appId is not THE app
   */
  _liveEnvEntry(appId) {
    const entry = this.env?.app?.appId === appId ? this.env.app : null;
    if (!entry) {
      throw new Error(unmappedAppMessage(appId));
    }
    return entry;
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
   * Is this a GATEWAY workspace — one that lists sibling app repos (env.gateway.shell or
   * env.gateway.appRepos[]) rather than holding only its own env.app?
   * @returns {boolean}
   */
  isGateway() {
    const gw = this.env?.gateway;
    return Boolean(gw?.shell || (Array.isArray(gw?.appRepos) && gw.appRepos.length));
  }

  /**
   * THE ONE OWNER of "which repo root does a command given `-a <appId>` operate on".
   *
   * Single-app workspace: its own env.app is its root (getAppByAppId); any other id is null.
   *
   * Gateway workspace: the entry (env.app if any, env.gateway.shell, env.gateway.appRepos[], paths
   * relative to the gateway root) whose OWN .descix/workspace.json names env.app.appId === appId.
   * Each entry is read by @descix/app-sdk/dev resolveWorkspaceAppsFrom — the rule the gateway
   * serves it by — one entry at a time, so an unreadable entry (no workspace.json, no env.app, a
   * bad site.static) is SKIPPED rather than blocking an app that is listed; every skipped entry is
   * named, with its reason, in the refusal. No match → throw naming the appId and every entry
   * searched; never a fallback to the cwd. Env, apiUrl and credential stay with the gateway
   * workspace (lib/origin.js) — this resolves only WHERE the app's files live.
   *
   * @param {string} appId
   * @returns {{ appId: string, communityId: string|null, dir: string, role: 'self'|'shell'|'repo', entry: string }|null}
   *   null only for a single-app workspace asked about another app
   * @throws in a gateway workspace when no entry, or more than one, holds appId; the no-entry
   *   refusal carries `code === APP_NOT_IN_GATEWAY` so a caller that has its own remedy (site
   *   upload's explicit -p) branches on the code, never on the message text
   */
  resolveAppRepo(appId) {
    if (!this.isGateway()) {
      const app = this.getAppByAppId(appId);
      return app ? { appId, communityId: app.communityId, dir: app.absolutePath, role: 'self', entry: '.' } : null;
    }
    if (!this.workspaceRoot) {
      throw new Error(
        'Cannot resolve a gateway app: the workspace config carries no workspaceRoot. ' +
        'Load it with WorkspaceConfig.load() (which sets it) rather than constructing it bare.'
      );
    }
    const root = path.resolve(this.workspaceRoot);
    const gw = this.env.gateway;
    const candidates = [];
    if (this.env.app?.appId) candidates.push({ entry: '.', role: 'self', env: { app: this.env.app } });
    if (gw.shell) candidates.push({ entry: gw.shell, role: 'shell', env: { gateway: { shell: gw.shell } } });
    for (const rel of gw.appRepos || []) candidates.push({ entry: rel, role: 'repo', env: { gateway: { appRepos: [rel] } } });

    const searched = [];
    const matches = [];
    for (const c of candidates) {
      let found;
      try {
        found = resolveWorkspaceAppsFrom(root, { env: c.env }).apps[0];
      } catch (err) {
        const reason = err.message.replace(/^\[workspaceApps\]\s*/, '').split('\n')[0];
        searched.push(`  ${c.entry} (${c.role}): skipped — ${reason}`);
        continue;
      }
      searched.push(`  ${c.entry} (${c.role}): app "${found.appId}"`);
      if (found.appId === appId) {
        matches.push({ appId, communityId: found.communityId, dir: found.dir, role: c.role, entry: c.entry });
      }
    }

    const gatewayFile = path.join(root, '.descix', 'workspace.json');
    if (matches.length > 1) {
      throw new Error(
        `App "${appId}" is held by more than one entry of the gateway workspace ${gatewayFile}: ` +
        `${matches.map((m) => m.entry).join(', ')}. One app, one repo — remove the duplicate with ` +
        '`descix config gateway remove-repo <repo>`.'
      );
    }
    if (matches.length === 0) {
      const err = new Error(
        `App "${appId}" is not held by any entry of the gateway workspace ${gatewayFile}.\n` +
        `Searched (env.gateway.shell / env.gateway.appRepos, relative to ${root}):\n` +
        `${searched.join('\n')}\n` +
        `List the app's repo with \`descix config gateway add-repo <repo>\`, or run the command from that repo's root.`
      );
      err.code = APP_NOT_IN_GATEWAY;
      throw err;
    }
    return matches[0];
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
      throw new WorkspaceRetiredFormatError(
        'v1 workspace format is not supported. Migrate to v3.\n' +
        `  File:   ${configPath}\n` +
        '\n' +
        'This file is still on disk and has NOT been modified. There is no automatic v1 → v3\n' +
        'migration: no surviving code reads the v1 layout, so its contents cannot be converted\n' +
        'for you — but they are still readable BY YOU, and this file is the only copy of them.\n' +
        moveAsideRemedy(configPath, 'descix app init')
      );
    }

    // v2.1 MULTI-APP hard-error: env.platform / env.products are the retired mapping model —
    // one workspace registering OTHER repos' apps by localPath. v3 is single-app (CEO
    // 2026-10-09; fork (b) 2026-10-10): the app repo's root IS the workspace root, and local
    // multi-app dev is sibling checkouts behind one gateway config. Same posture as the v1
    // refusal above: loud, non-destructive, the remedy is one command per app repo.
    if (parsed.env && (parsed.env.platform || parsed.env.products)) {
      throw new WorkspaceRetiredFormatError(
        'v2.1 multi-app workspace format is not supported. Migrate to v3 (single-app).\n' +
        `  File:   ${configPath}\n` +
        '\n' +
        'This file is still on disk and has NOT been modified. v3 holds exactly ONE app\n' +
        '(env.app) and the app repo\'s own root is the workspace root. To migrate:\n' +
        '  • In EACH app repo this file mapped, run from that repo\'s root:\n' +
        '      descix config init --env <dev|demo|prod>   # pins env.apiUrl\n' +
        '      descix app init -a <app_id>                # writes the v3 env.app block\n' +
        '  • A gateway hosting several local apps lists their repo roots in ITS OWN\n' +
        '    workspace.json under env.gateway.appRepos (fork (b): sibling checkouts, one\n' +
        '    gateway config).\n' +
        moveAsideRemedy(configPath, 'descix app init')
      );
    }

    // A v2.1 file carrying a TOP-LEVEL `apiUrl` is refused by name. That key is retired: no
    // reader consumes it (the origin owner resolves `env.apiUrl` only) and save() never writes
    // it, so a developer who set it by hand would be silently ignored on every invocation —
    // exactly what the retired setter verb used to do from the other side, printing a success
    // banner over a value that landed nowhere. The file is otherwise fine; the remedy is to remove the
    // one key and set the origin where it is read. Nothing here is destructive.
    if (typeof parsed.apiUrl === 'string' && parsed.apiUrl.trim() !== '') {
      throw new Error(
        'workspace.json carries a top-level "apiUrl", which is a retired v1 key that nothing reads.\n' +
        `  File:   ${configPath}\n` +
        `  Value:  ${parsed.apiUrl.trim()}\n` +
        '\n' +
        'The API origin lives at env.apiUrl. Remove the top-level key, then set the origin with:\n' +
        `  ${TOP_LEVEL_API_URL_REMEDY}`
      );
    }

    return new WorkspaceConfig(parsed, workspaceRoot);
  }

  /**
   * Try to load workspace configuration, return null if not found
   * Useful for commands that need to check if workspace exists
   *
   * RETURNS NULL FOR ABSENT, THROWS FOR UNREADABLE AND FOR RETIRED FORMATS. "There is no
   * workspace here", "the workspace here is damaged" and "the workspace here is in a retired
   * format" are different answers and only the first one is a soft no.
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
      if (error instanceof WorkspaceRetiredFormatError) throw error;
      return null;
    }
  }
  
  /**
   * Save workspace configuration in v3 (single-app) format: env.app, never
   * env.platform / env.products.
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

    // Build env block for v3 output
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
      version: '3.0',
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
   * Register THE app of this v3 workspace (env.app).
   *
   * Single-app is the FORMAT, not a convention: a workspace that already holds a different app
   * refuses loudly — there is no second slot to put one in, and silently replacing env.app
   * would re-point every path-derived surface (site/, microservice/, manifests) at a different
   * platform record. Re-registering the SAME app is idempotent (the `app init` re-run case) and
   * may update kbId / communityId.
   *
   * localPath is GONE as an input: the app repo's root is the workspace root, always ('.').
   *
   * communityId is STORED, not just validated. It was previously accepted as a parameter and
   * silently discarded, so `descix init -c egpt` wrote no trace of `egpt` anywhere — and
   * `workspace-identity.js` (this entry's reader) then had no community to report, which is
   * how the generated agent files named nobody's community. Writer and reader are a pair.
   *
   * @param {string} communityId - The app's community (server-authoritative value, mirrored here)
   * @param {string} appId - App identifier (globally unique)
   * @param {Object} [appConfig] - { kbId? }
   * @returns {boolean} Success status
   */
  registerApp(communityId, appId, appConfig = {}) {
    if (!appId) {
      throw new Error('appId is required');
    }

    if (!this.env) this.env = {};
    const existing = this.env.app;
    if (existing?.appId && existing.appId !== appId) {
      throw new Error(
        `This workspace already holds app '${existing.appId}' — a v3 workspace is single-app.\n` +
        `To work on '${appId}', clone or create its OWN repo and run "descix app init" from\n` +
        `that repo's root (sibling checkouts, one gateway config, is the supported local layout).`
      );
    }

    const entry = { ...(existing || {}), appId, kbId: appConfig.kbId || existing?.kbId || 'General' };
    if (communityId) entry.communityId = communityId;
    this.env.app = entry;

    this._appIdToConfig = this._buildAppIdMap({ env: this.env, workspaceRoot: this.workspaceRoot });
    this.version = '3.0';
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

    // env.app (v3 single-app): at most one entry
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
   * Get the API origin this workspace is configured for.
   *
   * The workspace names its origin at `env.apiUrl` and nowhere else. This used to end in
   * `return DEFAULT_API_URL` — the shipped PROD origin — which meant an unconfigured workspace
   * was indistinguishable from one that had deliberately chosen production, and every caller
   * received a prod origin the developer had never picked. Resolution and the fail-loud live in
   * `lib/origin.js`; this method only reports what THIS workspace file says.
   *
   * There is no environment-name-to-localhost derivation: an environment names a cloud
   * environment. A local origin is either per-run (`descix --api-url https://localhost:4000
   * serve ...`) or a custom env (`descix config set-env local --url ...`) — see
   * TOP_LEVEL_API_URL_REMEDY, the one owner of that list.
   *
   * @returns {string} the configured origin, or the declared default when this workspace names none
   */
  getApiUrl() {
    // Consumes the ONE origin owner rather than re-deriving the precedence or re-spelling the
    // declared default. Under (A') an unconfigured workspace resolves to the declared default
    // PROD; the SOURCE that distinguishes "chose prod" from "chose nothing" is carried by
    // resolveOrigin() and printed by the api-client, never by a null returned from here.
    return resolveOrigin({
      workspaceEnvApiUrl: this.env?.apiUrl,
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
        '  Per-app keys have their own verbs: descix app set-site / set-port.'
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
   * Update the app's microservice.port on env.app (v3 single-app).
   *
   * Operates on the entry's microservice.{} slot.
   * This is the canonical write path for the microservice port that `descix microservice init`
   * reads (and hard-fails on if missing). Backs the `descix app set-port` command, closing
   * WS-CLI-MESH-ROUTING-GAP without hand-editing workspace.json.
   *
   * Pass `null` to remove microservice.port; if microservice.{} becomes empty, it is also deleted.
   * Persists via save() at the end — same auto-save pattern as setEnvironment().
   * Hard-fails if appId is not THE app (env.app).
   *
   * @param {string} appId - App identifier (must be env.app.appId)
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
   * Update the app's site config on env.app (v3 single-app).
   *
   * Parallel to setMicroservicePort(), but operates on the entry's site.{} slot. This is the
   * canonical write path for site.static — the path, relative to the workspace root (the repo
   * root; "." means the root itself), that the dev gateway's staticSitePlugin serves at
   * /p/{appId}/; anything that is not a plain relative path is refused (assertSiteStatic) — and for
   * site.port / site.protocol, the dev-server upstream the gateway proxies /p/{appId} to.
   * Backs the `descix app set-site` command, closing the site.static workspace gap without
   * hand-editing workspace.json (the org rule forbids hand edits — CEO-D-2026-06-02-SSGPOD-SITE-PREPROD).
   *
   * ONE ACTIVE MODE PER WRITE (measured 2026-10-02, EGPT-Evidence: `set-site --port` then
   * `set-site --static` left BOTH fields, and the gateway silently served the dead dev-server
   * port). Setting `static` without `port` in the same call CLEARS site.port and
   * site.protocol; setting `port` without `static` CLEARS site.static. Passing BOTH in one
   * call is the explicit combined write and keeps both — the gateway then serves the dev
   * server (site.port wins; createViteProxyConfig), stated on the serve banner.
   *
   * site.protocol ("http" | "https", default https when absent) names the scheme of the
   * dev-server upstream. It is meaningless without site.port, and a write that would leave
   * protocol without port is refused loud — no auto-detection, no try-both fallback.
   *
   * Pass null for a field to remove it (what `--unset` does for all three). Removals clear
   * only the named field. If site.{} becomes empty after removals it is deleted.
   * Persists via save() at the end — same auto-save pattern as setMicroservicePort().
   * Hard-fails if appId is not THE app (env.app).
   *
   * @param {string} appId - App identifier (must be env.app.appId)
   * @param {Object} fields - Fields to set on site.{}
   * @param {string|null} [fields.static] - Relative static-site path to set, or null to remove site.static
   * @param {number|string|null} [fields.port] - Site dev-server port to set, or null to remove site.port
   * @param {string|null} [fields.protocol] - Dev-server upstream scheme "http"|"https", or null to remove site.protocol
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setStaticSite(appId, fields = {}) {
    if (!appId) throw new Error('appId is required');
    if (!fields || typeof fields !== 'object') throw new Error('fields object is required');

    const settingStatic = 'static' in fields && fields.static !== null && fields.static !== undefined;
    const settingPort = 'port' in fields && fields.port !== null && fields.port !== undefined;
    const settingProtocol = 'protocol' in fields && fields.protocol !== null && fields.protocol !== undefined;

    // site.static path rule — ONE owner (@descix/app-sdk/dev siteStatic.js), applied before
    // anything is computed so a refusal writes NOTHING.
    if (settingStatic) {
      assertSiteStatic(fields.static, { subject: '--static', remedy: `Nothing was written for ${appId}.` });
    }

    if (settingProtocol && fields.protocol !== 'http' && fields.protocol !== 'https') {
      throw new Error(
        `site.protocol must be "http" or "https" (got ${JSON.stringify(fields.protocol)}). ` +
        `It names the scheme of the app's own dev server behind the gateway's /p/${appId} proxy.`
      );
    }

    const entry = this._liveEnvEntry(appId);

    // Compute the resulting site.{} first, so validation failures write NOTHING.
    const site = { ...(entry.site || {}) };

    // One active mode per write (see doc comment above).
    if (settingStatic && !settingPort) {
      delete site.port;
      delete site.protocol;
    }
    if (settingPort && !settingStatic) {
      delete site.static;
    }

    if ('static' in fields) {
      if (fields.static === null || fields.static === undefined) delete site.static;
      else site.static = fields.static;
    }
    if ('port' in fields) {
      if (fields.port === null || fields.port === undefined) delete site.port;
      else site.port = fields.port;
    }
    if ('protocol' in fields) {
      if (fields.protocol === null || fields.protocol === undefined) delete site.protocol;
      else site.protocol = fields.protocol;
    }

    // protocol describes the dev-server upstream — without a port it describes nothing.
    if ('protocol' in site && !('port' in site)) {
      throw new Error(
        `site.protocol is only valid in dev-server mode: set it together with --port ` +
        `(or on an app whose site.port is already set). Nothing was written for ${appId}.`
      );
    }

    if (Object.keys(site).length === 0) {
      // Clean up an empty site.{} so we never leave a bare {} behind
      delete entry.site;
    } else {
      entry.site = site;
    }

    return this.save();
  }

  /**
   * THE ONE WRITER of a gateway workspace's repo list: env.gateway.shell and env.gateway.appRepos[]
   * (DeSciXCore#9). Backs `descix config gateway set-shell | add-repo | remove-repo`, so a gateway
   * workspace.json is never hand-edited.
   *
   * Paths are relative to THIS workspace's root (sibling checkouts: "../<repo>") and are stored in
   * normalized form; two spellings of one directory are one repo.
   *
   * Refused loud, and a refusal writes NOTHING:
   *  - this workspace holds env.app — a single-app workspace is not a gateway;
   *  - add-repo of a repo already listed (or already the shell);
   *  - remove-repo of a repo that is not listed;
   *  - any resulting listed repo that the gateway could not read: the candidate config is resolved
   *    by @descix/app-sdk/dev resolveWorkspaceAppsFrom — the SAME function the gateway reads it with
   *    — so an absolute path, a repo without its own .descix/workspace.json, one with no env.app, a
   *    bad site.static, or one appId listed twice is refused by the reader's own rule.
   *
   * @param {'set-shell'|'add-repo'|'remove-repo'} op
   * @param {string|null} repo - repo root relative to the workspace root; null with set-shell removes the shell
   * @returns {Promise<string>} Path to saved config (from save())
   */
  async setGatewayRepo(op, repo) {
    const OPS = ['set-shell', 'add-repo', 'remove-repo'];
    if (!OPS.includes(op)) throw new Error(`Unknown gateway op "${op}" (expected one of: ${OPS.join(', ')}).`);
    const root = this.workspaceRoot;
    if (!root) throw new Error('Workspace root not set. Load the config with WorkspaceConfig.load() first.');
    const configPath = path.join(root, '.descix', 'workspace.json');

    if (this.env?.app?.appId) {
      throw new Error(
        `${configPath} is a single-app workspace (env.app "${this.env.app.appId}"), not a gateway workspace.\n` +
        'env.gateway.shell and env.gateway.appRepos belong to a gateway workspace, which holds no env.app of\n' +
        'its own and lists sibling app repos. Run this verb from the gateway workspace\'s root. Nothing was written.'
      );
    }

    const removingShell = op === 'set-shell' && (repo === null || repo === undefined);
    if (!removingShell && (typeof repo !== 'string' || repo.trim() === '')) {
      throw new Error(`descix config gateway ${op} needs a repo path (relative to ${root}). Nothing was written.`);
    }
    // Normalized relative form: "../repo-a/", "./../repo-a" and "../repo-a" are one repo. An absolute
    // path is passed through untouched so the reader's own rule refuses it below.
    const normalize = (rel) => (path.isAbsolute(rel) ? rel : (path.normalize(rel).replace(/[\\/]+$/, '') || '.'));
    const dirOf = (rel) => path.resolve(root, rel);
    const rel = removingShell ? null : normalize(repo.trim());

    const gateway = { ...(this.env?.gateway || {}) };
    const appRepos = [...(gateway.appRepos || [])];

    if (op === 'set-shell') {
      if (rel === null) delete gateway.shell;
      else gateway.shell = rel;
    } else if (op === 'add-repo') {
      if (!path.isAbsolute(rel)) {
        const listed = appRepos.find((r) => dirOf(r) === dirOf(rel));
        if (listed) {
          throw new Error(`"${repo}" is already listed in env.gateway.appRepos (as "${listed}") in ${configPath}. Nothing was written.`);
        }
        if (gateway.shell && dirOf(gateway.shell) === dirOf(rel)) {
          throw new Error(
            `"${repo}" is this workspace's env.gateway.shell in ${configPath}; the shell is served at / and is not ` +
            'also listed in appRepos. Nothing was written.'
          );
        }
      }
      appRepos.push(rel);
    } else {
      const at = path.isAbsolute(rel) ? -1 : appRepos.findIndex((r) => dirOf(r) === dirOf(rel));
      if (at < 0) {
        throw new Error(
          `"${repo}" is not listed in env.gateway.appRepos in ${configPath}.\n` +
          `  Listed: ${appRepos.length ? appRepos.join(', ') : '(none)'}\nNothing was written.`
        );
      }
      appRepos.splice(at, 1);
    }

    if (appRepos.length) gateway.appRepos = appRepos;
    else delete gateway.appRepos;

    const candidateEnv = { ...(this.env || {}) };
    if (Object.keys(gateway).length) candidateEnv.gateway = gateway;
    else delete candidateEnv.gateway;

    // Validate the WHOLE resulting repo set with the reader's own function before anything is saved.
    resolveWorkspaceAppsFrom(root, { env: candidateEnv });

    this.env = candidateEnv;
    return this.save();
  }

  /**
   * Persistently set the target environment in workspace.json.
   *
   * Updates env.environment and env.apiUrl, then saves. EVERY environment writes a
   * URL — including dev, which writes the cloud DEV origin. For custom envs, uses --url or
   * defaults to https://{name}.descix.net. The `config set-env` verb refuses `--url` on a
   * KNOWN name (it sends you to `config init --env`), so a local backend is either per-run —
   * `descix --api-url https://localhost:4000 <command>`, no workspace change — or a custom name
   * (`set-env local --url ...`). Mind that cloud-core derives DEPLOY_ENV and port auto-detect
   * only from `env.environment === 'DEV'`, so a custom name is not a DEV workspace.
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

    // v3 validation: must have env block
    if (!this.env || Object.keys(this.env).length === 0) {
      errors.push('Missing env block — workspace.json must be v3 format with env.app');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

