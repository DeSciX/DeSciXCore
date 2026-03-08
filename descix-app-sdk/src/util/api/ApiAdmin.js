/**
 * ApiAdmin - Admin CRUD, pool deployment, airdrop
 */

import { makeCommandRequestJSON, ResponseStatus } from '../AppData.jsx';

export const listAllCommunitiesAdmin = async () => {
  try {
    const data = await makeCommandRequestJSON('list_all_communities_admin', {});
    if (data.status === ResponseStatus.OK) {
      return data.message.communities || [];
    }
    const errorMsg = data.message || '';
    if (errorMsg.includes('permission') || errorMsg.includes('PLATFORM_MANAGE')) {
      return { error: 'permission_denied', message: errorMsg };
    }
    return [];
  } catch (error) {
    console.error('Error fetching admin communities:', error);
    return { error: 'permission_denied', message: error.message };
  }
};

export const updateCommunity = async (communityId, updates) => {
  try {
    const data = await makeCommandRequestJSON('update_community', { community_id: communityId, ...updates });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to update community');
    return data.message;
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
};

export const deleteCommunity = async (communityId, hardDelete = false) => {
  try {
    const data = await makeCommandRequestJSON('delete_community', { community_id: communityId, hard_delete: hardDelete });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to delete community');
    return data.message;
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
};

export const listAppsForCommunity = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('list_apps_for_community', { community_id: communityId });
    return data.status === ResponseStatus.OK ? data.message.apps : [];
  } catch (error) {
    console.error('Error listing apps:', error);
    throw error;
  }
};

export const getUpgradeCandidates = async () => {
  try {
    const data = await makeCommandRequestJSON('get_upgrade_candidates', {});
    return data.status === ResponseStatus.OK ? data.message : [];
  } catch (error) {
    console.error('Error fetching upgrade candidates:', error);
    return [];
  }
};

export const getPoolDeploymentStatus = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('get_pool_deployment_status', { community_id: communityId });
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    return null;
  }
};

export const listPoolDeployments = async (status = null) => {
  try {
    const data = await makeCommandRequestJSON('list_pool_deployments', { status });
    return data.status === ResponseStatus.OK ? data.message : [];
  } catch (error) {
    console.error('Error listing deployments:', error);
    return [];
  }
};

export const upgradeCommunityPool = async (params) => {
  try {
    const data = await makeCommandRequestJSON('upgrade_community_pool', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to upgrade community');
    return data.message;
  } catch (error) {
    console.error('Error upgrading community:', error);
    throw error;
  }
};

export const createPoolDeployment = async (params) => {
  try {
    const data = await makeCommandRequestJSON('create_pool_deployment', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to create deployment');
    return data.message;
  } catch (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }
};

export const enableSelling = async (tokenSymbol, sellFeeBps = null) => {
  try {
    const data = await makeCommandRequestJSON('enable_selling', { token_symbol: tokenSymbol, sell_fee_bps: sellFeeBps });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to enable selling');
    return data.message;
  } catch (error) {
    console.error('Error enabling selling:', error);
    throw error;
  }
};

export const disableSelling = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('disable_selling', { token_symbol: tokenSymbol });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to disable selling');
    return data.message;
  } catch (error) {
    console.error('Error disabling selling:', error);
    throw error;
  }
};

export const pauseTrading = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('pause_trading', { token_symbol: tokenSymbol });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to pause trading');
    return data.message;
  } catch (error) {
    console.error('Error pausing trading:', error);
    throw error;
  }
};

export const resumeTrading = async (tokenSymbol, enableSellingFlag = false) => {
  try {
    const data = await makeCommandRequestJSON('resume_trading', { token_symbol: tokenSymbol, enable_selling: enableSellingFlag });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to resume trading');
    return data.message;
  } catch (error) {
    console.error('Error resuming trading:', error);
    throw error;
  }
};

export const preparePoolDeployment = async (params) => {
  try {
    const data = await makeCommandRequestJSON('prepare_pool_deployment', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to prepare deployment');
    return data.message;
  } catch (error) {
    console.error('Error preparing pool deployment:', error);
    throw error;
  }
};

export const prepareUV4Init = async (params) => {
  try {
    const data = await makeCommandRequestJSON('prepare_uv4_init', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to prepare initialization');
    return data.message;
  } catch (error) {
    console.error('Error preparing UV4 init:', error);
    throw error;
  }
};

export const verifyAdminRole = async (tokenSymbol, adminAddress) => {
  try {
    const data = await makeCommandRequestJSON('verify_admin_role', { token_symbol: tokenSymbol, admin_address: adminAddress });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to verify role');
    return data.message;
  } catch (error) {
    console.error('Error verifying admin role:', error);
    throw error;
  }
};

export const recordContractDeployment = async (params) => {
  try {
    const data = await makeCommandRequestJSON('record_contract_deployment', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to record deployment');
    return data.message;
  } catch (error) {
    console.error('Error recording deployment:', error);
    throw error;
  }
};

export const recordPoolInitialization = async (params) => {
  try {
    const data = await makeCommandRequestJSON('record_pool_initialization', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to record initialization');
    return data.message;
  } catch (error) {
    console.error('Error recording initialization:', error);
    throw error;
  }
};

export const activatePool = async (communityId) => {
  try {
    const data = await makeCommandRequestJSON('activate_pool', { community_id: communityId });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to activate pool');
    return data.message;
  } catch (error) {
    console.error('Error activating pool:', error);
    throw error;
  }
};

export const getContractInfo = async (params) => {
  try {
    const data = await makeCommandRequestJSON('get_contract_info', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to get contract info');
    return data.message;
  } catch (error) {
    console.error('Error getting contract info:', error);
    throw error;
  }
};

export const getRequiredSigner = async (params) => {
  try {
    const data = await makeCommandRequestJSON('get_required_signer', params);
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to get required signer');
    return data.message;
  } catch (error) {
    console.error('Error getting required signer:', error);
    throw error;
  }
};

export const airdropLoadSheet = async (sheetUrl) => {
  try {
    const data = await makeCommandRequestJSON('airdrop_load_sheet', { sheet_url: sheetUrl });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to load sheet');
    return data.message;
  } catch (error) {
    console.error('Error loading airdrop sheet:', error);
    throw error;
  }
};

export const airdropStage = async (sheetUrl, tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('airdrop_stage', { sheet_url: sheetUrl, token_symbol: tokenSymbol });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to stage airdrop');
    return data.message;
  } catch (error) {
    console.error('Error staging airdrop:', error);
    throw error;
  }
};

export const airdropExecute = async (sheetUrl, tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('airdrop_execute', { sheet_url: sheetUrl, token_symbol: tokenSymbol });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to execute airdrop');
    return data.message;
  } catch (error) {
    console.error('Error executing airdrop:', error);
    throw error;
  }
};

export const airdropConfirm = async (sheetUrl, tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('airdrop_confirm', { sheet_url: sheetUrl, token_symbol: tokenSymbol });
    if (data.status !== ResponseStatus.OK) throw new Error(data.message || 'Failed to confirm airdrop');
    return data.message;
  } catch (error) {
    console.error('Error confirming airdrop:', error);
    throw error;
  }
};
