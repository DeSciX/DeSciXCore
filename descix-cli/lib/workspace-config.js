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

    // V2.1 Product tracking (Unified Registry)
    this.products = config.products || {};

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
      const absPath = path.join(this.workspaceRoot, fromEnv.localPath);
      return {
        localPath: fromEnv.localPath,
        absolutePath: absPath,
        communityId: fromEnv.communityId,
        kbId: fromEnv.kbId || 'General'
      };
    }

    // Legacy: products object
    const product = this.products[appId];
    if (product?.localPath) {
      const absPath = product.absolutePath || path.join(this.workspaceRoot, product.localPath);
      return {
        localPath: product.localPath,
        absolutePath: absPath,
        communityId: product.context?.community || null,
        kbId: product.kbId || 'General'
      };
    }

    // Legacy: communities.apps
    for (const [, comm] of Object.entries(this.communities || {})) {
      const app = comm?.apps?.[appId];
      if (app?.localPath) {
        const absPath = app.absolutePath || path.join(this.workspaceRoot, app.localPath);
        return {
          localPath: app.localPath,
          absolutePath: absPath,
          communityId: null, // Will be derived from Products on backend
          kbId: app.kbId || 'General'
        };
      }
    }

    return null;
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
   * @param {string} startDir - Directory to start searching from (default: cwd)
   * @returns {Promise<WorkspaceConfig>} Configuration object
   * @throws {Error} If workspace not found
   */
  static async load(startDir = process.cwd()) {
    // First, find workspace root by searching upward
    // If startDir is provided, use it. If not, use process.cwd()
    const workspaceRoot = await WorkspaceConfig.findWorkspaceRoot(startDir);
    if (!workspaceRoot) {
      // Fallback: Check if we are running from within a package in the repo
      // and try to find the root by looking for .descix in parent directories
      // This is redundant with findWorkspaceRoot but let's be explicit about the error
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
   * Save workspace configuration in v2.1 format.
   * Always writes env.platform / env.products structure — never v1 communities.
   * If loaded from a v1 communities format (e.g. PWA device_check_status response),
   * auto-converts communities.apps → env.products on write.
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

    // Build env block for v2.1 output.
    // Native v2.1 path: this.env is already populated from env.platform/env.products.
    // Legacy conversion path: this.env is absent but communities are populated (v1 PWA response).
    let envBlock = (this.env && Object.keys(this.env).length > 0) ? this.env : null;

    if (!envBlock && Object.keys(this.communities || {}).length > 0) {
      const products = [];
      for (const [, community] of Object.entries(this.communities)) {
        for (const [appId, app] of Object.entries(community.apps || {})) {
          if (app.localPath) {
            products.push({ appId, localPath: app.localPath, kbId: app.kbId || 'General' });
          }
        }
      }
      envBlock = { products };
      // Update in-memory state so callers see a consistent env after save
      this.env = envBlock;
      this._appIdToConfig = this._buildAppIdMap({ env: this.env, workspaceRoot: this.workspaceRoot });
    }

    const configData = {
      version: '2.1',
      workspaceRoot: path.resolve(root),
      type: this.type,
    };

    if (envBlock) configData.env = envBlock;
    if (this.driveConfig) configData.driveConfig = this.driveConfig;

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

    // Compute absolute paths for products
    for (const [productId, product] of Object.entries(this.products || {})) {
      if (product.localPath) {
        product.absolutePath = path.join(absWorkspaceRoot, product.localPath);
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
    // V2: Community identity is server-authoritative (Products registry).
    // workspace.json does not track communities. No-op.
    return true;
  }
  
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

    if (!this.env) this.env = {};
    if (!Array.isArray(this.env.products)) this.env.products = [];

    const entry = { appId, localPath: appConfig.localPath, kbId: appConfig.kbId || 'General' };

    if (this.env.platform?.appId === appId) {
      this.env.platform.localPath = appConfig.localPath;
      if (appConfig.kbId) this.env.platform.kbId = appConfig.kbId;
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
   * Register a product (Unified Registry)
   * @param {string} productId - Global product identifier
   * @param {Object} productConfig - Product configuration
   * @returns {boolean} Success status
   */
  registerProduct(productId, productConfig) {
    if (!productId || !productConfig.localPath) {
      throw new Error('productId and localPath are required');
    }
    
    this.products[productId] = {
      type: productConfig.type || 'APP',
      localPath: productConfig.localPath,
      context: productConfig.context || {},
      registeredAt: new Date().toISOString()
    };
    
    this.version = '2.0';
    return true;
  }

  /**
   * Get product configuration
   * @param {string} productId 
   * @returns {Object|null}
   */
  getProduct(productId) {
    return this.products[productId] || null;
  }

  /**
   * List all registered products
   * @returns {Array} Array of product IDs
   */
  listProducts() {
    return Object.keys(this.products);
  }

  /**
   * Remove a product registration
   * @param {string} productId 
   * @returns {boolean}
   */
  unregisterProduct(productId) {
    if (this.products[productId]) {
      delete this.products[productId];
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

    // env.platform + env.products (Unified Registry - primary)
    if (wsRoot) {
      for (const [appId, cfg] of Object.entries(this._appIdToConfig || {})) {
        const appPath = path.resolve(wsRoot, cfg.localPath);
        if (cwd.startsWith(appPath)) {
          return {
            appId,
            communityId: cfg.communityId || null,
            kbId: cfg.kbId || 'General'
          };
        }
      }
    }
    
    for (const [commId, comm] of Object.entries(this.communities || {})) {
      for (const [appId, app] of Object.entries(comm.apps || {})) {
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

    // products object (legacy)
    for (const [productId, product] of Object.entries(this.products || {})) {
      let productPath = product.absolutePath;
      if (!productPath && product.localPath && wsRoot) {
        productPath = path.join(wsRoot, product.localPath);
      }

      if (productPath && cwd.startsWith(productPath)) {
        return {
          productId,
          communityId: product.context?.community || null,
          appId: product.context?.app || productId,
          kbId: product.kbId || 'General'
        };
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
        'Example: npx descix update kb -a daita'
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
   * Get API URL for the current workspace.
   * In DEV mode, derives from env.platform.microservice.port (v2.1 format).
   * Eliminates the need for DESCIX_API_URL in local dev.
   * @returns {string}
   */
  getApiUrl() {
    if (this.apiUrl) return this.apiUrl;
    const platformPort = this.env?.platform?.microservice?.port;
    if (platformPort && this.env?.environment === 'DEV') return `https://localhost:${platformPort}`;
    return 'https://descix.net';
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

