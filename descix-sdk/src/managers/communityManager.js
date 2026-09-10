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
   * List the communities listed in the app store.
   *
   * `public_only` is GONE, not renamed. The served find_communities contract accepts exactly one
   * parameter, `filter`, and the gateway REFUSES anything else before injection — measured
   * 2026-09-10: `find_communities {public_only:false}` returns INVALID_PARAMS "unknown parameter
   * 'public_only'. Accepted parameters: filter", so every call this method made threw. There is no
   * compat shim for it precisely because there is no behaviour to preserve.
   *
   * There is also no "public" sense left to express: the platform owns `listed` (the access sense)
   * and `tradeable` (token-tradeability) separately, and the old `is_public` conflated them.
   * Communities you own or that are shared with you stay reachable via fetch_my_purchases even
   * when they are not listed.
   *
   * UNKNOWN OPTIONS ARE REFUSED, because deleting `publicOnly` without this INVERTED fail-loud.
   * Before the deletion, `list({publicOnly:true})` put `public_only` in the params bag and the
   * gateway threw INVALID_PARAMS naming it. After it, the option matched nothing, `params` came out
   * `{}` and the call SUCCEEDED — the caller's intent discarded in silence, which is strictly worse
   * than the broken call it replaced. Measured 2026-09-10 with a stub client: `list({publicOnly:true})`
   * resolved without error and forwarded `{}`. So the refusal moves to this boundary rather than
   * being lost with the parameter.
   *
   * ACCEPTED is this METHOD's own option surface, not a mirror of the served schema. They coincide
   * today; they are different contracts, and an option that mapped onto some other param would
   * belong here without belonging there. The gateway still enforces its own params independently —
   * this check never claims to stand in for it.
   *
   * @param {Object} options - Query options
   * @param {string} [options.filter] - Optional filter string, passed through verbatim
   * @returns {Promise<Array>} Array of community objects
   * @throws {Error} code INVALID_PARAMS when any option other than `filter` is supplied
   */
  async list(options = {}) {
    const ACCEPTED = ['filter'];
    const unknown = Object.keys(options).filter((k) => !ACCEPTED.includes(k));
    if (unknown.length > 0) {
      const err = new Error(
        `CommunityManager.list: unknown option${unknown.length > 1 ? 's' : ''} ` +
        `${unknown.map((k) => `'${k}'`).join(', ')}. ` +
        `Accepted options: ${ACCEPTED.join(', ')}. ` +
        'Rejected at the SDK boundary — the option was NOT applied, and no default was substituted.' +
        (unknown.includes('publicOnly')
          ? " 'publicOnly' was REMOVED, not renamed: the platform owns `listed` (access) and " +
            '`tradeable` (token-tradeability) separately, and there is no "public" sense left to ' +
            'express. Communities you own or that are shared with you remain reachable via ' +
            'fetch_my_purchases even when they are not listed.'
          : '')
      );
      err.code = 'INVALID_PARAMS';
      err.data = {
        command: 'CommunityManager.list',
        unknown_parameters: unknown,
        accepted_parameters: ACCEPTED,
      };
      throw err;
    }

    const params = {};
    if (options.filter !== undefined) params.filter = options.filter;

    const response = await this.apiClient.invoke('find_communities', params, { allowGuest: false });

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
