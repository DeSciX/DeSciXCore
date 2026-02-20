/**
 * Community Manager for DeSciX SDK
 * 
 * Wrapper for community-related API operations.
 * Provides a clean interface for CLI and MCP tools.
 */

/**
 * CommunityManager - High-level community operations
 */
export class CommunityManager {
  /**
   * @param {Object} apiClient - DeSciXApiClient instance
   */
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  /**
   * List all communities accessible to the user
   * @param {Object} options - Query options
   * @param {boolean} [options.publicOnly=false] - Only show public communities
   * @returns {Promise<Array>} Array of community objects
   */
  async list(options = {}) {
    const response = await this.apiClient.invoke('find_communities', {
      public_only: options.publicOnly || false
    }, { allowGuest: options.publicOnly });

    const result = response.message || response;
    return result.communities || result || [];
  }

  /**
   * Get a specific community by ID
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Community object
   */
  async get(communityId) {
    const response = await this.apiClient.invoke('get_community', {
      community_id: communityId
    });

    const result = response.message || response;
    return result.community || result;
  }

  /**
   * Check if a community exists
   * @param {string} communityId - Community ID to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(communityId) {
    try {
      const response = await this.apiClient.invoke('check_community_exists', {
        community_id: communityId
      });
      return response.message?.exists || false;
    } catch {
      return false;
    }
  }

  /**
   * Create a new community
   * @param {Object} params - Community parameters
   * @param {string} params.name - Community display name
   * @param {string} params.tokenSymbol - Token symbol (1-7 uppercase letters)
   * @param {string} [params.driveFolderId] - Google Drive folder ID
   * @param {string} [params.description] - Community description
   * @param {boolean} [params.isPublic=false] - Public visibility
   * @param {string} [params.appName='agent'] - Default app name
   * @returns {Promise<Object>} Created community object
   */
  async create(params) {
    const response = await this.apiClient.invoke('create_community', {
      community_name: params.name,
      token_symbol: params.tokenSymbol,
      source_folder_id: params.driveFolderId,
      is_public: params.isPublic || false,
      app_name: params.appName || 'agent'
    });

    return response.message || response;
  }

  /**
   * Update community metadata
   * @param {string} communityId - Community ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated community object
   */
  async update(communityId, updates) {
    const response = await this.apiClient.invoke('update_community_metadata', {
      community_id: communityId,
      ...updates
    });

    return response.message || response;
  }

  /**
   * Join a community (become a member)
   * @param {string} communityId - Community ID
   * @param {string} [referralCode] - Optional referral code
   * @returns {Promise<Object>} Join result
   */
  async join(communityId, referralCode = null) {
    const response = await this.apiClient.invoke('join_community', {
      community_id: communityId,
      referral_code: referralCode
    });

    return response.message || response;
  }

  /**
   * Validate a Drive folder structure for community creation
   * @param {string} folderId - Google Drive folder ID
   * @returns {Promise<Object>} Validation result
   */
  async validateFolder(folderId) {
    const response = await this.apiClient.invoke('validate_community_folder', {
      folder_id: folderId
    });

    return response.message || response;
  }

  /**
   * Upload community assets from local files
   * @param {string} communityId - Community ID
   * @param {Object} assets - Asset files
   * @param {Buffer|string} [assets.icon] - Icon file (base64 or Buffer)
   * @param {string} [assets.description] - Description text
   * @returns {Promise<Object>} Upload result
   */
  async uploadAssets(communityId, assets) {
    const response = await this.apiClient.invoke('upload_community_assets', {
      community_id: communityId,
      icon: assets.icon ? (Buffer.isBuffer(assets.icon) ? assets.icon.toString('base64') : assets.icon) : null,
      description: assets.description
    });

    return response.message || response;
  }

  /**
   * Get community stats for current user
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Stats object (REP, REF, DIP)
   */
  async getStats(communityId) {
    const response = await this.apiClient.invoke('get_user_community_stats', {
      community_id: communityId
    });

    return response.message || response;
  }

  /**
   * List apps in a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of app objects
   */
  async listApps(communityId) {
    const response = await this.apiClient.invoke('list_apps_for_community', {
      community_id: communityId
    });

    const result = response.message || response;
    return result.apps || result || [];
  }
}

/**
 * Create a CommunityManager instance
 * @param {Object} apiClient - API client
 * @returns {CommunityManager}
 */
export function createCommunityManager(apiClient) {
  return new CommunityManager(apiClient);
}

export default CommunityManager;
