/**
 * ApiAuth - Auth, OAuth, device login, config
 */

import {
  makeCommandRequestJSON,
  AppData,
  ResponseStatus,
  LoginStatus,
} from '../AppData.jsx';

let discordOAuthUrlCache = { origin: null, config: null };
let googleOAuthUrlCache = { origin: null, config: null };
let walletConfigCache = null;

export async function getDiscordOAuthConfig() {
  const currentOrigin = window.location.origin;
  if (discordOAuthUrlCache.origin === currentOrigin && discordOAuthUrlCache.config) {
    return discordOAuthUrlCache.config;
  }
  try {
    const data = await makeCommandRequestJSON('get_discord_config', {}, true);
    if (data && data.status === ResponseStatus.OK && data.message?.oauth_url) {
      const config = {
        oauthUrl: data.message.oauth_url,
        redirectUri: data.message.redirect_uri,
      };
      discordOAuthUrlCache = { origin: currentOrigin, config };
      return config;
    }
    console.error('Failed to load Discord OAuth URL from backend:', data);
    return null;
  } catch (err) {
    console.error('Network error while loading Discord OAuth URL:', err);
    return null;
  }
}

export async function getGoogleOAuthConfig() {
  const currentOrigin = window.location.origin;
  if (googleOAuthUrlCache.origin === currentOrigin && googleOAuthUrlCache.config) {
    return googleOAuthUrlCache.config;
  }
  try {
    const data = await makeCommandRequestJSON('get_google_config', {}, true);
    if (data && data.status === ResponseStatus.OK && data.message?.oauth_url) {
      const config = {
        oauthUrl: data.message.oauth_url,
        redirectUri: data.message.redirect_uri,
      };
      googleOAuthUrlCache = { origin: currentOrigin, config };
      return config;
    }
    console.error('Failed to load Google OAuth URL from backend:', data);
    return null;
  } catch (err) {
    console.error('Network error while loading Google OAuth URL:', err);
    return null;
  }
}

export async function getWalletConfig() {
  if (walletConfigCache) return walletConfigCache;
  try {
    const data = await makeCommandRequestJSON('get_wallet_config', {}, true);
    if (data && data.status === ResponseStatus.OK && data.message?.signature_message) {
      walletConfigCache = data.message.signature_message;
      return walletConfigCache;
    }
    console.error('Failed to load wallet config from backend:', data);
    return null;
  } catch (err) {
    console.error('Network error while loading wallet config:', err);
    return null;
  }
}

export function acceptTos(email, version = '1.0.0') {
  return makeCommandRequestJSON('descix_accept_tos', { email, version });
}

export async function checkAuthenticationStatus(newWalletAddress = null, newSignature = null) {
  try {
    const sessionInfo = AppData.sessionInfo;
    const isNativeMode = !AppData.sdk;
    if (isNativeMode && !newWalletAddress && !newSignature) {
      if (sessionInfo?.id) {
        let currentStatus = AppData.loginStatus || LoginStatus.GUEST;
        const hasWallet = sessionInfo?.wallet_address;
        if (!hasWallet && currentStatus === LoginStatus.CONNECTED) {
          console.log(`Authentication check: Correcting status from ${currentStatus} to AUTHENTICATED (no wallet)`);
          currentStatus = LoginStatus.AUTHENTICATED;
          AppData.loginStatus = LoginStatus.AUTHENTICATED;
        }
        console.log(`Authentication check skipped in native mode. Using existing session. Status: ${currentStatus}`);
        return currentStatus;
      } else {
        console.log(`Authentication check skipped in native mode. No session, returning GUEST.`);
        AppData.loginStatus = LoginStatus.GUEST;
        return LoginStatus.GUEST;
      }
    }
    const params = {
      code: AppData.sdkCode,
      access_token: sessionInfo?.access_token || null,
      user_id: sessionInfo?.id || null,
      ...(newWalletAddress && newSignature && {
        wallet_address: newWalletAddress,
        signature: newSignature,
      }),
    };
    const data = await makeCommandRequestJSON('auth_discord', params, true);
    if (data && data.status === ResponseStatus.OK && data.message?.sessionInfo) {
      // Hydration in makeCommandRequestJSON sets AppData.sessionInfo, custodialBalance, userRoles
      console.log(`Authentication check successful. Status: ${data.auth_status}, Custodial Balance: ${AppData.custodialBalance}`);
      return data.auth_status;
    } else {
      console.error('Error during authentication check:', data);
      const isNativeMode = !AppData.sdk;
      if (isNativeMode && sessionInfo?.id && !newWalletAddress && !newSignature) {
        const currentStatus = AppData.loginStatus || LoginStatus.GUEST;
        console.log(`Discord auth failed in native mode, preserving existing session. Status: ${currentStatus}`);
        return currentStatus;
      }
      AppData.sessionInfo = null;
      AppData.loginStatus = LoginStatus.AUTH_FAILED;
      AppData.custodialBalance = 0;
      AppData.userRoles = null;
      localStorage.clear();
      return LoginStatus.AUTH_FAILED;
    }
  } catch (error) {
    console.error('Network error during authentication check:', error);
    const isNativeMode = !AppData.sdk;
    if (isNativeMode && AppData.sessionInfo?.id && !newWalletAddress && !newSignature) {
      const currentStatus = AppData.loginStatus || LoginStatus.GUEST;
      console.log(`Network error in native mode, preserving existing session. Status: ${currentStatus}`);
      return currentStatus;
    }
    if (!AppData.sessionInfo?.id) {
      AppData.loginStatus = LoginStatus.GUEST;
      return LoginStatus.GUEST;
    }
    AppData.sessionInfo = null;
    AppData.loginStatus = LoginStatus.AUTH_FAILED;
    AppData.custodialBalance = 0;
    AppData.userRoles = null;
    localStorage.clear();
    return LoginStatus.AUTH_FAILED;
  }
}

export async function checkGoogleAuthenticationStatus(googleCode = null) {
  try {
    const sessionInfo = AppData.sessionInfo;
    const params = {
      code: googleCode || null,
      access_token: sessionInfo?.access_token || null,
      user_id: sessionInfo?.id || null,
    };
    const data = await makeCommandRequestJSON('auth_google', params, true);
    if (data && data.status === ResponseStatus.OK && data.message?.sessionInfo) {
      // Hydration in makeCommandRequestJSON sets AppData
      console.log(`Google authentication check successful. Status: ${data.auth_status}, Custodial Balance: ${AppData.custodialBalance}`);
      return { status: data.auth_status, sessionInfo: data.message.sessionInfo, next_destination: data.message.next_destination };
    } else {
      console.error('Error during Google authentication check:', data);
      AppData.sessionInfo = null;
      AppData.loginStatus = LoginStatus.AUTH_FAILED;
      AppData.custodialBalance = 0;
      AppData.userRoles = null;
      localStorage.clear();
      return { status: LoginStatus.AUTH_FAILED, error: data?.message };
    }
  } catch (error) {
    console.error('Network error during Google authentication check:', error);
    AppData.sessionInfo = null;
    AppData.loginStatus = LoginStatus.AUTH_FAILED;
    AppData.custodialBalance = 0;
    AppData.userRoles = null;
    localStorage.clear();
    return { status: LoginStatus.AUTH_FAILED, error: error.message };
  }
}

export async function checkDiscordAuthenticationStatus(discordCode) {
  try {
    const params = { code: discordCode, access_token: null, user_id: null };
    const data = await makeCommandRequestJSON('auth_discord', params, true);
    if (data && data.status === ResponseStatus.OK && data.message?.sessionInfo) {
      // Hydration in makeCommandRequestJSON sets AppData
      console.log(`Discord authentication check successful. Status: ${data.auth_status}, Custodial Balance: ${AppData.custodialBalance}`);
      return { status: data.auth_status, sessionInfo: data.message.sessionInfo, next_destination: data.message.next_destination };
    } else {
      console.error('Error during Discord authentication check:', data);
      AppData.sessionInfo = null;
      AppData.loginStatus = LoginStatus.AUTH_FAILED;
      AppData.custodialBalance = 0;
      AppData.userRoles = null;
      localStorage.clear();
      return { status: LoginStatus.AUTH_FAILED, error: data?.message };
    }
  } catch (error) {
    console.error('Network error during Discord authentication check:', error);
    AppData.sessionInfo = null;
    AppData.loginStatus = LoginStatus.AUTH_FAILED;
    AppData.custodialBalance = 0;
    AppData.userRoles = null;
    localStorage.clear();
    return { status: LoginStatus.AUTH_FAILED, error: error.message };
  }
}

export async function authenticateBySignature(signature) {
  try {
    if (!signature) throw new Error('Signature is required');
    const data = await makeCommandRequestJSON('authenticate_by_signature', { signature }, true);
    if (data && data.status === ResponseStatus.OK && data.message?.sessionInfo) {
      // Hydration in makeCommandRequestJSON sets AppData
      console.log(`Auto-reconnect via signature successful. Status: ${AppData.loginStatus}`);
      return { status: ResponseStatus.OK, message: data.message, auth_status: data.auth_status };
    } else {
      console.error('Error during signature authentication:', data);
      return { status: ResponseStatus.ERROR, message: data?.message || 'Signature authentication failed' };
    }
  } catch (error) {
    console.error('Network error during signature authentication:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Signature authentication failed' };
  }
}

export async function validateDeviceLoginRequest(userCode) {
  try {
    if (!userCode) throw new Error('User code is required');
    const data = await makeCommandRequestJSON('device_validate', { user_code: userCode }, true);
    if (data && data.status === ResponseStatus.OK) {
      return { status: ResponseStatus.OK, message: data.message };
    }
    return { status: ResponseStatus.ERROR, message: data?.message || 'Invalid or expired device login request' };
  } catch (error) {
    console.error('Network error validating device login:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Failed to validate device login request' };
  }
}

export async function completeDeviceLogin(params) {
  try {
    const { device_code, user_code, email, tos_accepted, verification_code, wallet_address, signature } = params;
    if (!device_code && !user_code) throw new Error('Device code or user code is required');
    if (!email || !email.includes('@')) throw new Error('Valid email address is required');
    if (!tos_accepted) throw new Error('Terms of Service acceptance is required');
    if (!wallet_address || !signature) throw new Error('Wallet address and signature are required');
    const data = await makeCommandRequestJSON('device_complete', {
      device_code, user_code, email, tos_accepted, verification_code, wallet_address, signature,
    }, true);
    if (data && data.status === ResponseStatus.OK) {
      return { status: ResponseStatus.OK, message: data.message };
    }
    return { status: ResponseStatus.ERROR, message: data?.message || 'Failed to complete device login' };
  } catch (error) {
    console.error('Network error completing device login:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Failed to complete device login' };
  }
}

export async function initiateGoogleOAuth() {
  const config = await getGoogleOAuthConfig();
  if (!config?.oauthUrl) throw new Error('Google OAuth URL not configured on server');
  const state = Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('google_oauth_state', state);
  const separator = config.oauthUrl.includes('?') ? '&' : '?';
  const authUrl = `${config.oauthUrl}${separator}state=${encodeURIComponent(state)}`;
  console.log('[Google OAuth] Redirecting to:', authUrl);
  window.location.href = authUrl;
}

export async function initiateDiscordOAuth(options = {}) {
  const config = await getDiscordOAuthConfig();
  if (!config?.oauthUrl) throw new Error('Discord OAuth URL not configured on server');
  const stateObj = { random: Math.random().toString(36).substring(2, 15) };
  if (options.referralCode) stateObj.referralCode = options.referralCode;
  const state = JSON.stringify(stateObj);
  sessionStorage.setItem('discord_oauth_state', state);
  const separator = config.oauthUrl.includes('?') ? '&' : '?';
  const authUrl = `${config.oauthUrl}${separator}state=${encodeURIComponent(state)}`;
  console.log('[Discord OAuth] Redirecting to:', authUrl);
  window.location.href = authUrl;
}
