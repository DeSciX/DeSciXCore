/**
 * ApiTrading - Portfolio, market, pools, swap, migration
 */

import { makeCommandRequestJSON, AppData, ResponseStatus } from '../AppData.jsx';

export const getPlatformHoldings = async () => {
  try {
    const params = {};
    if (AppData.sessionInfo?.wallet_address) {
      params.wallet_address = AppData.sessionInfo.wallet_address;
    }
    const data = await makeCommandRequestJSON('get_platform_holdings', params, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return null;
  }
};

export const getMarketOverview = async () => {
  try {
    const data = await makeCommandRequestJSON('get_market_overview', {}, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return null;
  }
};

export const getUserNfts = async () => {
  try {
    const data = await makeCommandRequestJSON('get_user_nfts', {}, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return null;
  }
};

const poolStateCache = {
  pending: new Map(),
  results: new Map(),
  TTL_MS: 5000,
};

export const getPoolState = async (tokenSymbol) => {
  const cacheKey = tokenSymbol.toUpperCase();
  const cached = poolStateCache.results.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < poolStateCache.TTL_MS) {
    return cached.data;
  }
  const pending = poolStateCache.pending.get(cacheKey);
  if (pending) return pending;
  const requestPromise = (async () => {
    try {
      const data = await makeCommandRequestJSON('get_pool_state', { token_symbol: tokenSymbol }, true);
      const result = data.status === ResponseStatus.OK ? data.message : null;
      poolStateCache.results.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error fetching pool state:', error);
      return null;
    } finally {
      poolStateCache.pending.delete(cacheKey);
    }
  })();
  poolStateCache.pending.set(cacheKey, requestPromise);
  return requestPromise;
};

export const getSwapQuote = async (params) => {
  try {
    const data = await makeCommandRequestJSON('get_swap_quote', params);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    throw error;
  }
};

export const getPoolLiquidity = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('get_pool_liquidity', { token_symbol: tokenSymbol }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching pool liquidity:', error);
    return null;
  }
};

export const getPoolMarketOverview = async (tokenSymbols) => {
  try {
    const data = await makeCommandRequestJSON('get_pool_market_overview', { token_symbols: tokenSymbols }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching pool market overview:', error);
    return null;
  }
};

export const getPriceHistory = async (tokenSymbol, hours = 24) => {
  try {
    const data = await makeCommandRequestJSON('get_price_history', { token_symbol: tokenSymbol, hours }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return null;
  }
};

export const getPoolTokenInfo = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('get_pool_token_info', { token_symbol: tokenSymbol }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching pool token info:', error);
    return null;
  }
};

export const getMigrationStatus = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('get_migration_status', { token_symbol: tokenSymbol }, true);
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching migration status:', error);
    return null;
  }
};

export const getUserMigrationEligibility = async (tokenSymbol) => {
  try {
    const data = await makeCommandRequestJSON('get_user_migration_eligibility', { token_symbol: tokenSymbol });
    return data.status === ResponseStatus.OK ? data.message : null;
  } catch (error) {
    console.error('Error fetching migration eligibility:', error);
    return null;
  }
};
