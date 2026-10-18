/**
 * ApiPayments - roles, catalogue purchases, crypto price reads, wallet file
 */

import {
  makeCommandRequestJSON,
  AppData,
  ResponseStatus,
  ProductTypes,
} from '../AppData.jsx';

export const getMyRoles = async () => {
  try {
    const data = await makeCommandRequestJSON('get_my_roles');
    return data.status === ResponseStatus.OK ? AppData.userRoles : null;
  } catch (error) {
    console.error('Error fetching my roles:', error);
    throw error;
  }
};

export const getRolesForScope = async (scope, scopeId) => {
  try {
    const data = await makeCommandRequestJSON('get_roles_for_scope', { scope, scope_id: scopeId });
    return data.status === ResponseStatus.OK ? data.message.roles : [];
  } catch (error) {
    console.error('Error fetching roles for scope:', error);
    throw error;
  }
};

export const purchaseRole = async (roleId, scope = null, scopeId = null) => {
  try {
    const params = { role_id: roleId };
    if (scope && scopeId) {
      params.scope = scope;
      params.scope_id = scopeId;
    }
    const data = await makeCommandRequestJSON('purchase_role', params);
    return data;
  } catch (error) {
    console.error('Error purchasing role:', error);
    throw error;
  }
};

export const generateWalletFile = async () => {
  try {
    const data = await makeCommandRequestJSON('generate_wallet_file', {});
    if (data.status === ResponseStatus.OK && data.message) {
      return data.message;
    }
    return null;
  } catch (error) {
    console.error('Error generating wallet file:', error);
    throw error;
  }
};

export const getSupportedChains = async () => {
  try {
    const data = await makeCommandRequestJSON('get_supported_chains', {}, true);
    return data.status === ResponseStatus.OK ? data.message : [];
  } catch (error) {
    console.error('Error getting supported chains:', error);
    throw error;
  }
};

export const getCryptoPrice = async (asset) => {
  try {
    const data = await makeCommandRequestJSON('get_crypto_price', { asset }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error getting crypto price:', error);
    throw error;
  }
};

export const getAllCryptoPrices = async () => {
  try {
    const data = await makeCommandRequestJSON('get_all_crypto_prices', {}, true);
    return data.status === ResponseStatus.OK ? data.message : {};
  } catch (error) {
    console.error('Error getting all crypto prices:', error);
    throw error;
  }
};

export const handlePurchase = async (item, type = ProductTypes.COMMUNITY) => {
  try {
    let response;
    if (type === ProductTypes.ROLE) {
      response = await purchaseRole(item.role_id, item.scope, item.scope_id);
    } else {
      response = await purchaseProduct({
        community_id: item.community_id,
        product_id: item.app_id || item.community_id,
        product_type: type,
        product_price: item.price || 0,
        project_token: item.token_symbol,
        user_id: AppData.sessionInfo?.id,
      });
    }
    return response;
  } catch (error) {
    console.error('AppData: handlePurchase failed:', error);
    return { status: ResponseStatus.ERROR, message: error.message };
  }
};

export async function purchaseProduct({ community_id, product_id, product_type, product_price, project_token, user_id }) {
  try {
    const command = product_type !== ProductTypes.COMMUNITY ? 'purchase_product' : 'join_community';
    const response = await makeCommandRequestJSON(command, { community_id, product_id, product_type, product_price, project_token, user_id });
    return response;
  } catch (error) {
    console.error('Error in purchaseProduct:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Purchase failed.' };
  }
}
