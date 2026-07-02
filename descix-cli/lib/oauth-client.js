/**
 * DeSciX CLI OAuth client — WS-HEADLESS-MVP-A1
 * (mcp-oauth-longlived-tokens-design-2026-06-30.md §2.1/§2.2)
 *
 * The gcloud-ADC-style long-lived credential layer for the CLI/MCP:
 *   - PKCE S256 pair generation (binds code redemption to THIS process)
 *   - Dynamic Client Registration (RFC 7591) for the CLI public client
 *   - authorization_code redemption (the device→OAuth bridge hands the code
 *     back through device_check_status — no browser redirect surface)
 *   - refresh_token grant (silent refresh; the AS rotates on use)
 *   - RFC 7009 revocation (descix logout)
 *
 * These are the OAuth AS's OWN HTTP endpoints (/oauth/*), NOT /apifront commands —
 * the CLI POSTs to them directly, exactly as any OAuth client would (design §5:
 * "CLI-is-HTTP-only — the CLI just POSTs to /oauth/token"). Everything else in the
 * CLI still routes /apifront/ via DeSciXApiClient.
 */

import crypto from 'crypto';
import axios from 'axios';

/** OOB redirect URI for the CLI public client — the bridge returns the code via the
 *  device-status poll, never via redirect, but the OAuth records still carry a
 *  registered redirect_uri which redemption must echo (RFC 6749 §4.1.3). */
export const OOB_REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

/** Default scope requested by `descix login`. The scope is a CEILING, not a grant:
 *  write/admin are honored only on internal-posture deployments and, even there, the
 *  server's checkCommandPermission decides per-user. On public deployments the wider
 *  scopes are inert by construction (design §2.3). */
export const DEFAULT_OAUTH_SCOPE = 'mcp:read mcp:tools mcp:write mcp:admin';

/** Generate a PKCE S256 verifier/challenge pair. */
export function generatePkcePair() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/** Shared axios config for the AS endpoints (self-signed local dev handling
 *  mirrors DeSciXApiClient). */
async function axiosConfigFor(baseUrl) {
  const config = { timeout: 30000, validateStatus: () => true };
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    const https = await import('https');
    config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }
  return config;
}

/**
 * Register the CLI as an OAuth public client (RFC 7591 DCR).
 * @returns {Promise<string>} client_id
 */
export async function registerOAuthClient(baseUrl, { clientName = 'descix-cli' } = {}) {
  const config = await axiosConfigFor(baseUrl);
  const resp = await axios.post(`${baseUrl}/oauth/register`, {
    client_name: clientName,
    redirect_uris: [OOB_REDIRECT_URI],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  }, config);
  if (resp.status !== 201 || !resp.data?.client_id) {
    throw new Error(`OAuth client registration failed (HTTP ${resp.status}): ${JSON.stringify(resp.data)}`);
  }
  return resp.data.client_id;
}

/** POST /oauth/token — shared form-encoded grant helper. */
async function tokenGrant(baseUrl, form) {
  const config = await axiosConfigFor(baseUrl);
  config.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const resp = await axios.post(`${baseUrl}/oauth/token`, new URLSearchParams(form).toString(), config);
  if (resp.status !== 200 || !resp.data?.access_token) {
    const err = new Error(`OAuth token grant '${form.grant_type}' failed (HTTP ${resp.status}): ` +
      `${resp.data?.error || 'unknown'} — ${resp.data?.error_description || JSON.stringify(resp.data)}`);
    err.oauthError = resp.data?.error || null;
    err.httpStatus = resp.status;
    throw err;
  }
  return resp.data; // { access_token, token_type, expires_in, refresh_token, scope }
}

/**
 * Redeem the device-bridge authorization code (PKCE) for the token pair.
 * @returns {Promise<Object>} { access_token, expires_in, refresh_token, scope }
 */
export async function redeemAuthorizationCode(baseUrl, { code, clientId, codeVerifier }) {
  return tokenGrant(baseUrl, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: OOB_REDIRECT_URI,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
}

/**
 * Silent refresh (gcloud-ADC analogue). The AS ROTATES the refresh token on use —
 * callers MUST persist BOTH returned tokens or the next refresh trips reuse-detection
 * and revokes the whole chain.
 * @returns {Promise<Object>} { access_token, expires_in, refresh_token, scope }
 */
export async function refreshOAuthTokens(baseUrl, { refreshToken, clientId }) {
  return tokenGrant(baseUrl, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
}

/**
 * RFC 7009 revocation (used by `descix logout`). 200 is returned even for
 * unknown tokens; only a transport/server failure throws.
 */
export async function revokeOAuthToken(baseUrl, { token, clientId }) {
  const config = await axiosConfigFor(baseUrl);
  config.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const resp = await axios.post(`${baseUrl}/oauth/revoke`, new URLSearchParams({
    token,
    token_type_hint: 'refresh_token',
    ...(clientId ? { client_id: clientId } : {}),
  }).toString(), config);
  if (resp.status !== 200) {
    throw new Error(`OAuth revocation failed (HTTP ${resp.status}): ${JSON.stringify(resp.data)}`);
  }
  return true;
}

/**
 * Build the persisted `oauth` credential block for wallet.json from a token response.
 * Single shape owner — ensureSession/login/logout all consume this contract.
 */
export function buildOAuthCredentialBlock({ clientId, tokens, tokenEndpointBase, scope }) {
  return {
    client_id: clientId,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || scope || null,
    token_endpoint: `${tokenEndpointBase}/oauth/token`,
  };
}

/** Is the cached OAuth access token still fresh (with clock-skew margin)? */
export function isOAuthAccessTokenFresh(oauthBlock, skewMs = 60000) {
  if (!oauthBlock?.access_token || !oauthBlock?.access_token_expires_at) return false;
  const expiresAt = Date.parse(oauthBlock.access_token_expires_at);
  if (Number.isNaN(expiresAt)) return false;
  return (expiresAt - Date.now()) > skewMs;
}

export default {
  OOB_REDIRECT_URI,
  DEFAULT_OAUTH_SCOPE,
  generatePkcePair,
  registerOAuthClient,
  redeemAuthorizationCode,
  refreshOAuthTokens,
  revokeOAuthToken,
  buildOAuthCredentialBlock,
  isOAuthAccessTokenFresh,
};
