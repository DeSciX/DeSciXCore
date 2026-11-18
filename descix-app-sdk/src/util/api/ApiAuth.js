/**
 * ApiAuth - Auth, OAuth, device login, config
 */

import {
  makeCommandRequestJSON,
  AppData,
  ResponseStatus,
} from '../AppData.jsx';

let walletConfigCache = null;

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

/**
 * Complete a device login from the browser: `{ user_code, tos_accepted }`. The request is named by
 * its user_code ONLY (the device_code is the requesting CLI's secret and the browser never holds it).
 * The proof is the Powch session apiFront validates: the backend reads the account, its email and
 * its wallet from that session's user record, so the browser sends no email.
 */
export async function completeDeviceLogin(params) {
  try {
    if (params?.device_code != null) {
      throw new Error('completeDeviceLogin does not accept device_code: pass user_code only.');
    }
    for (const key of ['email', 'verification_code']) {
      if (params?.[key] != null) {
        throw new Error(`completeDeviceLogin does not accept ${key}: the account comes from the signed-in session; pass { user_code, tos_accepted }.`);
      }
    }
    const { user_code, tos_accepted } = params;
    if (!user_code) throw new Error('user_code is required');
    if (!tos_accepted) throw new Error('Terms of Service acceptance is required');
    const data = await makeCommandRequestJSON('device_complete', { user_code, tos_accepted }, true);
    if (data && data.status === ResponseStatus.OK) {
      return { status: ResponseStatus.OK, message: data.message };
    }
    return { status: ResponseStatus.ERROR, message: data?.message || 'Failed to complete device login' };
  } catch (error) {
    console.error('Network error completing device login:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Failed to complete device login' };
  }
}

/**
 * complete the browser OAuth connect ceremony.
 * Called by ConnectCeremonyWidget AFTER the Powch passkey+ToS ceremony reaches CONNECTED,
 * presenting the fresh session (makeCommandRequestJSON auto-attaches it — allowGuest:false).
 * The server (complete_connect_ceremony) mints the single-use OAuth code bound to the
 * authenticated user and returns redirect_url; the widget follows it back to claude.ai.
 */
export async function completeConnectCeremony(params) {
  try {
    const { ceremony_id } = params;
    if (!ceremony_id) throw new Error('ceremony_id is required');
    const data = await makeCommandRequestJSON('complete_connect_ceremony', { ceremony_id }, false);
    if (data && data.status === ResponseStatus.OK) {
      // redirect_url may be at top-level or nested under message depending on the envelope.
      const redirect_url = data.redirect_url ?? data.message?.redirect_url ?? null;
      return { status: ResponseStatus.OK, redirect_url, message: data.message };
    }
    return { status: ResponseStatus.ERROR, message: data?.message || 'Failed to complete connect ceremony' };
  } catch (error) {
    console.error('Network error completing connect ceremony:', error);
    return { status: ResponseStatus.ERROR, message: error.message || 'Failed to complete connect ceremony' };
  }
}
