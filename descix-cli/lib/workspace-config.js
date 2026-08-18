import * as fs from 'fs/promises';
import * as path from 'path';
import { ENV_ORIGINS, DEFAULT_API_URL } from '@descix/app-sdk/dev';

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

    return null;
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

      // v1 format hard-error: has communities block but no env block
      if (parsed.communities && !parsed.env) {
        throw new Error(
          'v1 workspace format is not supported. Migrate to v2.1.\n' +
          'Delete .descix/workspace.json and re-run "descix app init" to create a v2.1 workspace.'
        );
      }

      return new WorkspaceConfig(parsed, workspaceRoot);
    } catch (error) {
      if (error.message.includes('v1 workspace format')) throw error;
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
   * Always writes env.platform / env.products structure.
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

    // Compute absolute paths for products
    for (const [productId, product] of Object.entries(this.products || {})) {
      if (product.localPath) {
        product.absolutePath = path.join(absWorkspaceRoot, product.localPath);
      }
    }
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
   *
   * Priority: env.apiUrl > legacy this.apiUrl > the shipped default (PROD).
   * There is NO environment-name-to-localhost derivation: an environment names a
   * cloud environment, and localhost is a URL you set explicitly
   * (`descix config set-env dev --url https://localhost:4000`, or env.apiUrl).
   * @returns {string}
   */
  getApiUrl() {
    if (this.env?.apiUrl) return this.env.apiUrl;
    if (this.apiUrl) return this.apiUrl;
    return DEFAULT_API_URL;
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

    // Find the live env entry (platform or products[]) — not a copy
    let entry = null;
    if (this.env?.platform?.appId === appId) {
      entry = this.env.platform;
    } else if (Array.isArray(this.env?.products)) {
      entry = this.env.products.find(p => p.appId === appId) || null;
    }

    if (!entry) {
      throw new Error(
        `App "${appId}" is not mapped in workspace.json. ` +
        'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
      );
    }

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

    // Find the live env entry (platform or products[]) — not a copy
    let entry = null;
    if (this.env?.platform?.appId === appId) {
      entry = this.env.platform;
    } else if (Array.isArray(this.env?.products)) {
      entry = this.env.products.find(p => p.appId === appId) || null;
    }

    if (!entry) {
      throw new Error(
        `App "${appId}" is not mapped in workspace.json. ` +
        'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
      );
    }

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

    // Find the live env entry (platform or products[]) — not a copy
    let entry = null;
    if (this.env?.platform?.appId === appId) {
      entry = this.env.platform;
    } else if (Array.isArray(this.env?.products)) {
      entry = this.env.products.find(p => p.appId === appId) || null;
    }

    if (!entry) {
      throw new Error(
        `App "${appId}" is not mapped in workspace.json. ` +
        'Use `descix app init` to register, or `descix app set-localpath -a <id> -p <path>` to repoint.'
      );
    }

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

