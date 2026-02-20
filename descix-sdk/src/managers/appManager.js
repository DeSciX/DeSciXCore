/**
 * App Manager for DeSciX SDK
 * 
 * Wrapper for app-related API operations.
 * Provides a clean interface for CLI and MCP tools.
 */

/**
 * AppManager - High-level app operations
 */
export class AppManager {
  /**
   * @param {Object} apiClient - DeSciXApiClient instance
   */
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get an app by ID
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @returns {Promise<Object>} App object
   */
  async get(communityId, appId) {
    const response = await this.apiClient.invoke('get_app', {
      community_id: communityId,
      app_id: appId
    });

    const result = response.message || response;
    return result.app || result;
  }

  /**
   * Check if an app exists
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(communityId, appId) {
    try {
      const response = await this.apiClient.invoke('check_app_exists', {
        community_id: communityId,
        app_id: appId
      });
      return response.message?.exists || false;
    } catch {
      return false;
    }
  }

  /**
   * Create a skeleton app
   * @param {Object} params - App parameters
   * @param {string} params.communityId - Community ID
   * @param {string} params.appName - App display name
   * @param {string} [params.driveFolderId] - Google Drive folder ID
   * @param {string} [params.description] - App description
   * @param {string} [params.apiBaseUrl] - API base URL for microservice
   * @param {boolean} [params.overwrite=false] - Overwrite if exists
   * @returns {Promise<Object>} Created app object
   */
  async create(params) {
    const response = await this.apiClient.invoke('create_skeleton_app', {
      community_id: params.communityId,
      app_name: params.appName,
      drive_folder_id: params.driveFolderId,
      app_description: params.description,
      api_base_url: params.apiBaseUrl,
      overwrite: params.overwrite || false,
      createSubfolders: true
    });

    return response.message || response;
  }

  /**
   * Create app from existing Drive folder
   * @param {Object} params - Creation parameters
   * @param {string} params.communityId - Community ID
   * @param {string} params.appName - App name
   * @param {string} params.driveFolderId - Drive folder ID with app content
   * @returns {Promise<Object>} Created app object
   */
  async createFromDrive(params) {
    const response = await this.apiClient.invoke('create_app_from_drive_folder', {
      community_id: params.communityId,
      app_name: params.appName,
      drive_folder_id: params.driveFolderId
    });

    return response.message || response;
  }

  /**
   * Update app metadata
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated app object
   */
  async update(communityId, appId, updates) {
    const response = await this.apiClient.invoke('update_app_metadata', {
      community_id: communityId,
      app_id: appId,
      ...updates
    });

    return response.message || response;
  }

  /**
   * Refresh listing assets (icon, description) from Drive
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} [driveFolderId] - Optional Drive folder override
   * @returns {Promise<Object>} Refresh result
   */
  async refreshAssets(communityId, appId, driveFolderId = null) {
    const response = await this.apiClient.invoke('refresh_listing_assets', {
      community_id: communityId,
      app_id: appId,
      drive_folder_id: driveFolderId
    });

    return response.message || response;
  }

  /**
   * Upload a specific asset (icon, description, system_instructions)
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} assetType - Asset type: 'icon', 'description', 'system_instructions'
   * @param {string} fileName - Original file name
   * @param {string} fileContent - Base64 encoded content
   * @returns {Promise<Object>} Upload result
   */
  async uploadAsset(communityId, appId, assetType, fileName, fileContent) {
    const response = await this.apiClient.invoke('upload_app_asset', {
      community_id: communityId,
      app_id: appId,
      asset_type: assetType,
      file_name: fileName,
      file_content: fileContent
    });

    return response.message || response;
  }

  /**
   * Check developer permission for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Permission result
   */
  async checkDeveloperPermission(communityId) {
    const response = await this.apiClient.invoke('check_developer_permission', {
      community_id: communityId
    });

    return response.message || response;
  }

  /**
   * Register base Drive folder for the user
   * @param {string} folderUrl - Drive folder URL or ID
   * @returns {Promise<Object>} Registration result
   */
  async registerBaseFolder(folderUrl) {
    const response = await this.apiClient.invoke('register_base_folder', {
      folder_url: folderUrl
    });

    return response.message || response;
  }

  /**
   * Get user's registered base folder
   * @returns {Promise<Object>} Folder info
   */
  async getBaseFolder() {
    const response = await this.apiClient.invoke('get_user_base_folder', {});
    return response.message || response;
  }

  /**
   * Create a knowledge base folder
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} kbName - Knowledge base name
   * @returns {Promise<Object>} Created KB object
   */
  async createKnowledgeBase(communityId, appId, kbName) {
    const response = await this.apiClient.invoke('create_skeleton_kb', {
      community_id: communityId,
      app_id: appId,
      kb_name: kbName
    });

    return response.message || response;
  }

  /**
   * Upload files to a knowledge base
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} kbId - Knowledge base ID
   * @param {Array} files - Array of file objects {name, path, content (base64)}
   * @returns {Promise<Object>} Upload result
   */
  async uploadFilesToKB(communityId, appId, kbId, files) {
    const response = await this.apiClient.invoke('upload_files_to_kb', {
      community_id: communityId,
      app_id: appId,
      kb_id: kbId,
      files: files
    });

    return response.message || response;
  }

  /**
   * Sync knowledge base to RAG vectors
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} kbId - Knowledge base ID
   * @param {Object} [options] - Sync options
   * @param {boolean} [options.full=false] - Full resync
   * @returns {Promise<Object>} Sync result
   */
  async syncKnowledgeBase(communityId, appId, kbId, options = {}) {
    const response = await this.apiClient.invoke('sync_knowledge_base', {
      community_id: communityId,
      app_id: appId,
      kb_id: kbId,
      options: { full: options.full || false }
    });

    return response.message || response;
  }

  /**
   * Get three-stage sync status
   * @param {string} communityId - Community ID
   * @param {string} appId - App ID
   * @param {string} kbId - Knowledge base ID
   * @returns {Promise<Object>} Sync status for all stages
   */
  async getSyncStatus(communityId, appId, kbId) {
    const [stage2, stage3] = await Promise.all([
      this.apiClient.invoke('get_drive_gcs_sync_status', {
        community_id: communityId,
        app_id: appId,
        kb_id: kbId
      }),
      this.apiClient.invoke('get_gcs_pinecone_sync_status', {
        community_id: communityId,
        app_id: appId,
        kb_id: kbId
      })
    ]);

    return {
      stage2: stage2.message || stage2,
      stage3: stage3.message || stage3
    };
  }

  /**
   * Register a microservice via manifest
   * @param {Object} manifest - Service manifest object
   * @returns {Promise<Object>} Registration result
   */
  async registerService(manifest) {
    const response = await this.apiClient.invoke('register_service', {
      manifest
    });

    return response.message || response;
  }
}

/**
 * Create an AppManager instance
 * @param {Object} apiClient - API client
 * @returns {AppManager}
 */
export function createAppManager(apiClient) {
  return new AppManager(apiClient);
}

export default AppManager;
