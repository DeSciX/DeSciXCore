/**
 * ApiCommunities - Communities, apps, Drive/KB, referrals
 */

import {
  makeCommandRequestJSON,
  AppData,
  ResponseStatus,
  ProductTypes,
} from '../AppData.jsx';

export const verifyCommunityStructure = async (folderId) => {
  try {
    const data = await makeCommandRequestJSON('verify_community_drive_folder_structure', { communityFolderId: folderId });
    return data.message;
  } catch (error) {
    console.error('Error verifying community structure:', error);
    return { success: false, messages: [error.message] };
  }
};

export const verifyAppStructure = async (folderId, appName, kbName, communityId) => {
  try {
    const params = { appFolderId: folderId, newKBName: kbName, app_name: appName, community_id: communityId };
    const data = await makeCommandRequestJSON('verify_app_drive_folder_structure', params);
    return data.message;
  } catch (error) {
    console.error('Error verifying app structure:', error);
    return { success: false, messages: [error.message] };
  }
};

/**
 * Fetch store bundle + purchases in a single call (authenticated users).
 * Hydrates AppData.availableCommunities, myCommunities, and myApps.
 */
export const fetchStoreAndPurchases = async () => {
  try {
    const data = await makeCommandRequestJSON('fetch_my_purchases', {}, true);
    if (data.status === ResponseStatus.OK) {
      const msg = data.message;
      // Hydrate store data
      AppData.availableCommunities = msg.communities || [];
      // Hydrate user purchases (filter from store bundle using overlay IDs)
      const myCommIds = new Set(msg.my_community_ids || []);
      const myAppIds = new Set(msg.my_app_ids || []);
      AppData.myCommunities = (msg.communities || []).filter(c => myCommIds.has(c.community_id));
      AppData.myApps = (msg.communities || []).flatMap(c => (c.apps || []).filter(a => myAppIds.has(a.app_id)));
      return msg;
    }
    return null;
  } catch (error) {
    console.error('Error in fetchStoreAndPurchases:', error);
    return null;
  }
};

/**
 * Fetch store bundle only (guest path — no auth required).
 * Hydrates AppData.availableCommunities.
 */
export const fetchStoreBundle = async () => {
  try {
    const data = await makeCommandRequestJSON('get_store_bundle', {}, true);
    if (data.status === ResponseStatus.OK) {
      AppData.availableCommunities = data.message.communities || [];
      return data.message;
    }
    return null;
  } catch (error) {
    console.error('Error in fetchStoreBundle:', error);
    return null;
  }
};

/** @deprecated Use fetchStoreAndPurchases instead */
export const fetchMyCommunitiesAndApps = fetchStoreAndPurchases;

export const fetchMyTransactions = async () => {
  try {
    const data = await makeCommandRequestJSON('fetch_my_transactions', {});
    if (data.status === ResponseStatus.OK) {
      AppData.myTransactions = data.message.transactions || [];
      return AppData.myTransactions;
    }
    return [];
  } catch (error) {
    console.error('Error fetching my transactions:', error);
    return [];
  }
};

export const getPromotedCommunitiesWithBalances = async (walletAddress = null) => {
  try {
    const params = walletAddress ? { wallet_address: walletAddress } : {};
    const data = await makeCommandRequestJSON('get_promoted_communities_with_balances', params);
    if (data.status === ResponseStatus.OK && data.message?.communities) {
      return data.message.communities;
    }
    return [];
  } catch (error) {
    console.error('Error fetching promoted communities with balances:', error);
    return [];
  }
};

export const fetchCommunities = async (forceRefresh) => {
  try {
    const data = await makeCommandRequestJSON('find_communities', {});
    if (data.status === ResponseStatus.OK && data.message.communities?.length) {
      AppData.availableCommunities = data.message.communities;
      return data.message.communities;
    }
    return [];
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

export const fetchCommunity = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('get_community', { community_id: communityId });
    if (data.status === ResponseStatus.OK && data.message.community) {
      return data.message.community;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching community ${communityId}:`, error);
    return null;
  }
};

export const fetchCommunityByTokenSymbol = async (tokenSymbol) => {
  try {
    const communities = await fetchCommunities(false);
    const matchingCommunity = communities.find((c) =>
      c.token_symbol && c.token_symbol.toUpperCase() === tokenSymbol.toUpperCase()
    );
    if (matchingCommunity) {
      AppData.selectedCommunityToken = tokenSymbol.toUpperCase();
      return matchingCommunity;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching community by token symbol ${tokenSymbol}:`, error);
    return null;
  }
};

export const fetchAppsForCommunity = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('list_apps_for_community', { community_id: communityId });
    if (data.status === ResponseStatus.OK) {
      return data.message.apps;
    }
    return [];
  } catch (error) {
    console.error('Error fetching apps for community:', error);
    return [];
  }
};

export const fetchFeaturedCommunities = () => fetchCommunities(false);
export const fetchFeaturedApps = (communityId) => fetchAppsForCommunity(communityId);

export const searchStore = async (params) => {
  const { query, entity_types, community_id, limit = 20, offset = 0 } = params;
  try {
    const data = await makeCommandRequestJSON('search_store', {
      query, entity_types, community_id, limit, offset,
    }, true);
    if (data?.status === ResponseStatus.OK) return data.message;
    console.error('Search store failed:', data?.message);
    return { results: [], total: 0 };
  } catch (error) {
    console.error('Error in searchStore:', error);
    return { results: [], total: 0 };
  }
};

export const generateReferralCode = async (params) => {
  try {
    const data = await makeCommandRequestJSON('generate_referral_code', params);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error in generateReferralCode:', error);
    return null;
  }
};

export const validateReferral = async (params) => {
  try {
    const data = await makeCommandRequestJSON('process_deep_link', params);
    return data;
  } catch (error) {
    console.error('Error in validateReferral:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Referral validation failed.' };
  }
};

export const getCommunityDetails = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('get_community_details', { community_id: communityId });
    return data.status === ResponseStatus.OK ? data.message.community : null;
  } catch (error) {
    console.error('Error in getCommunityDetails:', error);
    return null;
  }
};

export const getUserCommunityStats = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('get_user_community_stats', { community_id: communityId });
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error in getUserCommunityStats:', error);
    return null;
  }
};

export const incrementRep = async (targetUserId, reactorId, messageId, communityId) => {
  try {
    const params = {
      target_user_id: targetUserId,
      reactor_id: reactorId,
      message_id: messageId,
      community_id: communityId,
      source_guild_id: AppData.source_guild_id,
    };
    const data = await makeCommandRequestJSON('increment_rep', params);
    return data;
  } catch (error) {
    console.error('Error in incrementRep:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Failed to increment REP.' };
  }
};

export const getTokenContractAddresses = async (tokenSymbol = 'DAITA') => {
  try {
    const data = await makeCommandRequestJSON('get_token_contract_addresses', { token_symbol: tokenSymbol });
    return data.status === ResponseStatus.OK ? data.message.contract_info : null;
  } catch (error) {
    console.error('Error in getTokenContractAddresses:', error);
    return null;
  }
};

export const createCommunityWithApp = async (params) => {
  const data = await makeCommandRequestJSON('create_community_with_app', params);
  if (data.status === ResponseStatus.OK && data.message?.community) return data.message;
  throw new Error(data.message?.message || data.message || 'Failed to create community.');
};

export const createSkeletonApp = async (params) => {
  if (!params.community_id || !params.app_name) {
    throw new Error('Community ID and app name are required');
  }
  const data = await makeCommandRequestJSON('create_skeleton_app', params);
  if (data.status === ResponseStatus.OK && data.message) return data.message;
  throw new Error(data.message || 'Failed to create app.');
};

export const registerBaseFolder = async (params) => {
  try {
    const data = await makeCommandRequestJSON('register_base_folder', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to register Drive folder.');
  } catch (error) {
    console.error('Error registering Drive folder:', error);
    throw error;
  }
};

export const checkFolderUsage = async (params) => {
  try {
    const data = await makeCommandRequestJSON('check_folder_usage', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to check folder usage.');
  } catch (error) {
    console.error('Error checking folder usage:', error);
    throw error;
  }
};

export const uploadFilesToKB = async (params) => {
  try {
    const data = await makeCommandRequestJSON('upload_files_to_kb', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to upload files.');
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

export const syncKnowledgeBase = async (params) => {
  try {
    const data = await makeCommandRequestJSON('sync_knowledge_base', params);
    return data;
  } catch (error) {
    console.error('Error syncing knowledge base:', error);
    throw error;
  }
};

export const getDriveGcsSyncStatus = async (params) => {
  try {
    const data = await makeCommandRequestJSON('get_drive_gcs_sync_status', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to get sync status.');
  } catch (error) {
    console.error('Error getting Drive-GCS sync status:', error);
    throw error;
  }
};

export const syncDriveToGcs = async (params) => {
  try {
    const data = await makeCommandRequestJSON('sync_drive_to_gcs', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to sync Drive to GCS.');
  } catch (error) {
    console.error('Error syncing Drive to GCS:', error);
    throw error;
  }
};

export const getGcsPineconeSyncStatus = async (params) => {
  try {
    const data = await makeCommandRequestJSON('get_gcs_pinecone_sync_status', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to get RAG sync status.');
  } catch (error) {
    console.error('Error getting GCS-Pinecone sync status:', error);
    throw error;
  }
};

export const syncGcsToPinecone = async (params) => {
  try {
    const data = await makeCommandRequestJSON('sync_gcs_to_pinecone', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to sync GCS to Pinecone.');
  } catch (error) {
    console.error('Error syncing GCS to Pinecone:', error);
    throw error;
  }
};

export const convertKbFiles = async (params) => {
  try {
    const data = await makeCommandRequestJSON('convert_kb_files', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to convert KB files.');
  } catch (error) {
    console.error('Error converting KB files:', error);
    throw error;
  }
};

export const uploadCommunityAssets = async (params) => {
  try {
    const data = await makeCommandRequestJSON('upload_community_assets', params);
    if (data.status === ResponseStatus.OK && data.message) return data.message;
    throw new Error(data.message || 'Failed to upload community assets.');
  } catch (error) {
    console.error('Error uploading community assets:', error);
    throw error;
  }
};

export const registerService = async (manifest) => {
  try {
    const data = await makeCommandRequestJSON('register_service', { manifest });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to register service');
    return data;
  } catch (error) {
    console.error('Error registering service:', error);
    throw error;
  }
};

export const updateApp = async (communityId, appId, updates) => {
  try {
    const data = await makeCommandRequestJSON('update_app', { community_id: communityId, app_id: appId, ...updates });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to update app');
    return data.message;
  } catch (error) {
    console.error('Error updating app:', error);
    throw error;
  }
};

export const refreshListingAssets = async (communityId, appId, driveFolderId = null) => {
  try {
    const params = { community_id: communityId, app_id: appId };
    if (driveFolderId) params.drive_folder_id = driveFolderId;
    const data = await makeCommandRequestJSON('refresh_listing_assets', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to refresh listing assets');
    return data.message;
  } catch (error) {
    console.error('Error refreshing listing assets:', error);
    throw error;
  }
};

export const deleteApp = async (communityId, appId, hardDelete = false) => {
  try {
    const data = await makeCommandRequestJSON('delete_app', { community_id: communityId, app_id: appId, hard_delete: hardDelete });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to delete app');
    return data.message;
  } catch (error) {
    console.error('Error deleting app:', error);
    throw error;
  }
};
