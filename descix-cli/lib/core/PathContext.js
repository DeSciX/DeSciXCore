/**
 * PathContext - Unified filesystem context for DeSciX CLI
 * 
 * Design principle: No "finding" after setup.
 * - Setup time: Detect IDE markers, persist absolute paths to workspace.json
 * - Runtime: Load workspace.json, all paths are simple lookups
 * 
 * The workspace.json is the single source of truth for all paths.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Find IDE workspace root by searching for .cursor/ or .vscode/ markers
 * This is the only "searching" allowed - IDE markers are guaranteed in Cursor/VSCode
 * 
 * @param {string} startDir - Directory to start searching from
 * @returns {Promise<string|null>} Workspace root path, or null if not in IDE workspace
 */
export async function findIDEMarker(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;
  
  // Only look for IDE markers (not .descix - that's created by setup)
  const ideMarkers = ['.cursor', '.vscode'];
  
  while (currentDir !== root) {
    for (const marker of ideMarkers) {
      const markerDir = path.join(currentDir, marker);
      try {
        const stat = await fs.stat(markerDir);
        if (stat.isDirectory()) {
          return currentDir;
        }
      } catch {
        // Marker not found, continue
      }
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * PathContext - Unified path resolution from workspace.json
 * 
 * All paths come from workspace.json - no runtime "finding" of app contexts.
 */
export class PathContext {
  /**
   * @param {string} workspaceRoot - Absolute path to workspace root
   * @param {Object} config - Parsed workspace.json contents
   */
  constructor(workspaceRoot, config) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
  }

  /**
   * Load PathContext from workspace.json
   * 
   * @param {string} startDir - Directory to start searching from (default: cwd)
   * @returns {Promise<PathContext>} Loaded context
   * @throws {Error} If not in IDE workspace or workspace not configured
   */
  static async load(startDir = process.cwd()) {
    // Find IDE marker (only .cursor/ or .vscode/)
    const wsRoot = await findIDEMarker(startDir);
    if (!wsRoot) {
      throw new Error(
        'Not in a Cursor/VSCode workspace.\n' +
        'Open this folder in Cursor or VSCode first.'
      );
    }
    
    // Load workspace.json
    const configPath = path.join(wsRoot, '.descix', 'workspace.json');
    let configData;
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      configData = JSON.parse(content);
    } catch (error) {
      throw new Error(
        'Workspace not configured.\n' +
        'Run "npx descix init" first to configure your workspace.'
      );
    }
    
    return new PathContext(wsRoot, configData);
  }

  /**
   * Try to load PathContext, return null if not configured
   * Useful for commands that need to check if workspace exists
   * 
   * @param {string} startDir - Directory to start searching from
   * @returns {Promise<PathContext|null>}
   */
  static async tryLoad(startDir = process.cwd()) {
    try {
      return await PathContext.load(startDir);
    } catch {
      return null;
    }
  }

  // ============ Path Getters (all from workspace.json) ============

  /**
   * Get workspace root path
   * @returns {string} Absolute path to workspace root
   */
  getWorkspaceRoot() {
    return this.config.workspaceRoot || this.workspaceRoot;
  }

  /**
   * Get community path
   * @param {string} communityId - Community identifier
   * @returns {string|null} Absolute path to community folder, or null if not found
   */
  getCommunityPath(communityId) {
    const community = this.config.communities?.[communityId];
    if (!community) return null;
    
    // Use absolutePath if available, otherwise compute from localPath
    if (community.absolutePath) {
      return community.absolutePath;
    }
    if (community.localPath) {
      return path.join(this.getWorkspaceRoot(), community.localPath);
    }
    return null;
  }

  /**
   * Get app path
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @returns {string|null} Absolute path to app folder, or null if not found
   */
  getAppPath(communityId, appId) {
    const app = this.config.communities?.[communityId]?.apps?.[appId];
    if (!app) return null;
    
    // Use absolutePath if available, otherwise compute from localPath
    if (app.absolutePath) {
      return app.absolutePath;
    }
    if (app.localPath) {
      return path.join(this.getWorkspaceRoot(), app.localPath);
    }
    return null;
  }

  /**
   * Get KB path
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @param {string} kbId - KB identifier (default: 'General')
   * @returns {string|null} Absolute path to KB folder, or null if app not found
   */
  getKbPath(communityId, appId, kbId = 'General') {
    const appPath = this.getAppPath(communityId, appId);
    return appPath ? path.join(appPath, 'kb', kbId) : null;
  }

  /**
   * Get site path
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @returns {string|null} Absolute path to site folder, or null if app not found
   */
  getSitePath(communityId, appId) {
    const appPath = this.getAppPath(communityId, appId);
    return appPath ? path.join(appPath, 'site') : null;
  }

  /**
   * Get microservice path
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @returns {string|null} Absolute path to microservice folder, or null if app not found
   */
  getMicroservicePath(communityId, appId) {
    const appPath = this.getAppPath(communityId, appId);
    return appPath ? path.join(appPath, 'microservice') : null;
  }

  // ============ Context Detection (match cwd against known paths) ============

  /**
   * Detect community/app context from current working directory
   * Matches cwd against known absolutePaths in workspace.json
   * 
   * @returns {{ communityId: string, appId: string, kbId: string }|null}
   */
  detectContext() {
    const cwd = process.cwd();
    
    for (const [commId, comm] of Object.entries(this.config.communities || {})) {
      for (const [appId, app] of Object.entries(comm.apps || {})) {
        const appPath = app.absolutePath || 
          (app.localPath ? path.join(this.getWorkspaceRoot(), app.localPath) : null);
        
        if (appPath && cwd.startsWith(appPath)) {
          return {
            communityId: commId,
            appId,
            kbId: app.kbId || 'General'
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Resolve context by merging CLI options with detected context
   * CLI options take priority over detected context
   * 
   * @param {Object} options - CLI options { community, app, kb }
   * @returns {{ communityId: string|null, appId: string|null, kbId: string }}
   */
  resolveContext(options = {}) {
    const detected = this.detectContext();
    
    const resolved = {
      communityId: options.community || detected?.communityId || null,
      appId: options.app || detected?.appId || null,
      kbId: options.kb || detected?.kbId || 'General'
    };
    
    return resolved;
  }

  /**
   * Resolve context and throw if community/app not determined
   * 
   * @param {Object} options - CLI options { community, app, kb }
   * @returns {{ communityId: string, appId: string, kbId: string }}
   * @throws {Error} If community or app cannot be determined
   */
  requireContext(options = {}) {
    const ctx = this.resolveContext(options);
    
    if (!ctx.communityId || !ctx.appId) {
      throw new Error(
        'Could not determine app context.\n\n' +
        'Options:\n' +
        '  1. cd into an app directory\n' +
        '  2. Use flags: -c <community> -a <app>\n\n' +
        'Example: npx descix kb build -c descix -a appsdk'
      );
    }
    
    return ctx;
  }

  // ============ Config Access ============

  /**
   * Get raw workspace.json config
   * @returns {Object}
   */
  getWorkspaceConfig() {
    return this.config;
  }

  /**
   * Get Drive configuration
   * @returns {{ base_folder_id: string }|null}
   */
  getDriveConfig() {
    return this.config.driveConfig || null;
  }

  /**
   * Get API URL
   * Derives from env.platform.microservice.port in DEV mode (v2.1 workspace format).
   * @returns {string}
   */
  getApiUrl() {
    if (this.config.apiUrl) return this.config.apiUrl;
    const env = this.config.env || {};
    const platformPort = env.platform?.microservice?.port;
    if (platformPort && env.environment === 'DEV') return `https://localhost:${platformPort}`;
    return 'https://descix.net';
  }

  /**
   * Get environment
   * @returns {string}
   */
  getEnvironment() {
    return this.config.environment || 'production';
  }

  // ============ Listing ============

  /**
   * List all community IDs
   * @returns {string[]}
   */
  listCommunities() {
    return Object.keys(this.config.communities || {});
  }

  /**
   * List all app IDs (optionally filtered by community)
   * @param {string} communityId - Optional community filter
   * @returns {Array<{ communityId: string, appId: string }>}
   */
  listApps(communityId = null) {
    const apps = [];
    
    for (const [commId, comm] of Object.entries(this.config.communities || {})) {
      if (communityId && commId !== communityId) continue;
      
      for (const appId of Object.keys(comm.apps || {})) {
        apps.push({ communityId: commId, appId });
      }
    }
    
    return apps;
  }
}

export default PathContext;
