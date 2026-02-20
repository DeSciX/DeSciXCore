import * as fs from 'fs/promises';
import * as path from 'path';

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
    
    // Legacy fields (v1 compatibility)
    this.primaryCommunity = config.primaryCommunity;
    this.directoryMappings = config.directoryMappings || {};
    this.additionalContexts = config.additionalContexts || [];
    this.defaultContext = config.defaultContext;
    this.apiUrl = config.apiUrl;
    this.environment = config.environment;
    
    // V2 community tracking (root workspace)
    this.communities = config.communities || {};
    
    // Environment URLs for descix-serve gateway routing
    this.env = config.env || {};
    
    // Drive configuration (base_folder_id for template-based navigation)
    this.driveConfig = config.driveConfig || null;
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
    
    // Workspace marker directories in priority order
    const workspaceMarkers = ['.descix', '.cursor', '.vscode'];
    
    while (currentDir !== root) {
      // Check for any workspace marker
      for (const marker of workspaceMarkers) {
        const markerDir = path.join(currentDir, marker);
        try {
          const stat = await fs.stat(markerDir);
          if (stat.isDirectory()) {
            return currentDir; // Workspace marker found = workspace root
          }
        } catch (error) {
          // Marker not found at this level, continue
        }
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached filesystem root
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
   * @param {string} startDir - Directory to start searching from (default: cwd)
   * @returns {Promise<WorkspaceConfig>} Configuration object
   * @throws {Error} If workspace not found
   */
  static async load(startDir = process.cwd()) {
    // First, find workspace root by searching upward
    const workspaceRoot = await WorkspaceConfig.findWorkspaceRoot(startDir);
    if (!workspaceRoot) {
      throw new Error(
        'Workspace not configured.\n' +
        'Run "npx descix init" first to initialize your workspace.'
      );
    }
    
    const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(data);
      return new WorkspaceConfig(parsed, workspaceRoot);
    } catch (error) {
      throw new Error(
        'Workspace not configured.\n' +
        'Run "npx descix init" first to initialize your workspace.'
      );
    }
  }
  
  /**
   * Try to load workspace configuration, return null if not found
   * Useful for commands that need to check if workspace exists
   * 
   * @param {string} startDir - Directory to start searching from
   * @returns {Promise<WorkspaceConfig|null>}
   */
  static async tryLoad(startDir = process.cwd()) {
    try {
      return await WorkspaceConfig.load(startDir);
    } catch {
      return null;
    }
  }
  
  /**
   * Save workspace configuration
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
    
    // Update stored workspace root
    this.workspaceRoot = root;
    
    // Compute absolute paths before saving
    this.computeAbsolutePaths(root);
    
    const configData = {
      version: this.version,
      workspaceRoot: path.resolve(root), // Always store absolute workspace root
      type: this.type,
      primaryCommunity: this.primaryCommunity,
      directoryMappings: this.directoryMappings,
      additionalContexts: this.additionalContexts,
      defaultContext: this.defaultContext,
      apiUrl: this.apiUrl,
      environment: this.environment
    };
    
    // Include communities for v2 root workspace
    if (this.version === '2.0' || Object.keys(this.communities).length > 0) {
      configData.version = '2.0';
      configData.communities = this.communities;
    }
    
    // Include env block for descix-serve gateway routing
    if (this.env && Object.keys(this.env).length > 0) {
      configData.env = this.env;
    }
    
    // Include driveConfig for template-based navigation
    if (this.driveConfig) {
      configData.driveConfig = this.driveConfig;
    }
    
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return configPath;
  }
  
  /**
   * Compute and store absolute paths for all communities and apps
   * Called automatically by save() to ensure paths are pre-computed
   * 
   * @param {string} workspaceRoot - Workspace root directory
   */
  computeAbsolutePaths(workspaceRoot) {
    const absWorkspaceRoot = path.resolve(workspaceRoot);
    
    for (const [communityId, community] of Object.entries(this.communities || {})) {
      // Compute community absolute path
      if (community.localPath) {
        community.absolutePath = path.join(absWorkspaceRoot, community.localPath);
      }
      
      // Compute app absolute paths
      for (const [appId, app] of Object.entries(community.apps || {})) {
        if (app.localPath) {
          app.absolutePath = path.join(absWorkspaceRoot, app.localPath);
        }
      }
    }
  }
  
  // ============ Community Tracking Methods ============
  
  /**
   * Register a community in the root workspace
   * @param {string} communityId - Community identifier
   * @param {Object} communityConfig - Community configuration
   * @param {string} communityConfig.localPath - Local folder path
   * @param {string} communityConfig.tokenSymbol - Token symbol
   * @param {Object} [communityConfig.apps] - Apps in this community
   * @returns {boolean} Success status
   */
  registerCommunity(communityId, communityConfig) {
    if (!communityId || !communityConfig.localPath) {
      throw new Error('communityId and localPath are required');
    }
    
    this.communities[communityId] = {
      localPath: communityConfig.localPath,
      tokenSymbol: communityConfig.tokenSymbol || null,
      registeredAt: new Date().toISOString(),
      apps: communityConfig.apps || {}
    };
    
    this.version = '2.0';
    return true;
  }
  
  /**
   * Register an app within a community
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @param {Object} appConfig - App configuration
   * @param {string} appConfig.localPath - Local folder path
   * @param {string} [appConfig.kbId] - Default knowledge base ID
   * @returns {boolean} Success status
   */
  registerApp(communityId, appId, appConfig) {
    if (!communityId || !appId || !appConfig.localPath) {
      throw new Error('communityId, appId, and localPath are required');
    }
    
    // Create community entry if it doesn't exist
    if (!this.communities[communityId]) {
      this.communities[communityId] = {
        localPath: null,
        tokenSymbol: null,
        apps: {}
      };
    }
    
    this.communities[communityId].apps[appId] = {
      localPath: appConfig.localPath,
      kbId: appConfig.kbId || 'General',
      registeredAt: new Date().toISOString()
    };
    
    // Also update directoryMappings for backward compatibility
    this.directoryMappings[appConfig.localPath] = {
      communityId,
      appId,
      kbId: appConfig.kbId || 'General'
    };
    
    this.version = '2.0';
    return true;
  }
  
  /**
   * Get community configuration by ID
   * @param {string} communityId - Community identifier
   * @returns {Object|null} Community configuration or null
   */
  getCommunity(communityId) {
    return this.communities[communityId] || null;
  }
  
  /**
   * Get app configuration from a community
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @returns {Object|null} App configuration or null
   */
  getApp(communityId, appId) {
    const community = this.communities[communityId];
    if (!community || !community.apps) return null;
    return community.apps[appId] || null;
  }
  
  /**
   * List all registered communities
   * @returns {Array} Array of community IDs
   */
  listCommunities() {
    return Object.keys(this.communities);
  }
  
  /**
   * List all apps in a community
   * @param {string} communityId - Community identifier
   * @returns {Array} Array of app IDs
   */
  listApps(communityId) {
    const community = this.communities[communityId];
    if (!community || !community.apps) return [];
    return Object.keys(community.apps);
  }
  
  /**
   * Remove a community registration
   * @param {string} communityId - Community identifier
   * @returns {boolean} Success status
   */
  unregisterCommunity(communityId) {
    if (this.communities[communityId]) {
      // Remove directory mappings for all apps
      const apps = this.communities[communityId].apps || {};
      for (const [appId, appConfig] of Object.entries(apps)) {
        if (appConfig.localPath) {
          delete this.directoryMappings[appConfig.localPath];
        }
      }
      delete this.communities[communityId];
      return true;
    }
    return false;
  }
  
  /**
   * Remove an app registration
   * @param {string} communityId - Community identifier
   * @param {string} appId - App identifier
   * @returns {boolean} Success status
   */
  unregisterApp(communityId, appId) {
    const community = this.communities[communityId];
    if (community && community.apps && community.apps[appId]) {
      const appConfig = community.apps[appId];
      if (appConfig.localPath) {
        delete this.directoryMappings[appConfig.localPath];
      }
      delete community.apps[appId];
      return true;
    }
    return false;
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
    
    for (const [commId, comm] of Object.entries(this.communities || {})) {
      for (const [appId, app] of Object.entries(comm.apps || {})) {
        // Compute app path from absolutePath or localPath
        let appPath = app.absolutePath;
        if (!appPath && app.localPath && wsRoot) {
          appPath = path.join(wsRoot, app.localPath);
        }
        
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
  resolveContextWithOptions(options = {}) {
    const detected = this.detectContext();
    
    return {
      communityId: options.community || detected?.communityId || null,
      appId: options.app || detected?.appId || null,
      kbId: options.kb || detected?.kbId || 'General'
    };
  }
  
  /**
   * Resolve context and throw if community/app not determined
   * 
   * @param {Object} options - CLI options { community, app, kb }
   * @returns {{ communityId: string, appId: string, kbId: string }}
   * @throws {Error} If community or app cannot be determined
   */
  requireContext(options = {}) {
    const ctx = this.resolveContextWithOptions(options);
    
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
  
  /**
   * Get the workspace root path
   * @returns {string|null}
   */
  getWorkspaceRoot() {
    return this.workspaceRoot;
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
    
    // For v2 root workspace with communities
    if (this.version === '2.0' && Object.keys(this.communities).length > 0) {
      for (const [communityId, community] of Object.entries(this.communities)) {
        if (community.apps) {
          for (const [appId, app] of Object.entries(community.apps)) {
            if (!app.localPath) {
              errors.push(`Community "${communityId}" app "${appId}" missing localPath`);
            }
          }
        }
      }
      return {
        isValid: errors.length === 0,
        errors
      };
    }
    
    // Legacy v1 validation
    if (!this.primaryCommunity) {
      errors.push('Missing primaryCommunity');
    }
    
    if (!this.defaultContext) {
      errors.push('Missing defaultContext');
    } else {
      if (!this.defaultContext.communityId) errors.push('defaultContext missing communityId');
      if (!this.defaultContext.appId) errors.push('defaultContext missing appId');
      if (!this.defaultContext.kbId) errors.push('defaultContext missing kbId');
    }
    
    // Validate directory mappings
    for (const [dir, context] of Object.entries(this.directoryMappings)) {
      if (!context.communityId) errors.push(`Directory "${dir}" mapping missing communityId`);
      if (!context.appId) errors.push(`Directory "${dir}" mapping missing appId`);
      if (!context.kbId) errors.push(`Directory "${dir}" mapping missing kbId`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

