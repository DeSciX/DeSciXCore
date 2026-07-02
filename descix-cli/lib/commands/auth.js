/**
 * Authentication Commands - SDK Architecture V2
 *
 * login, logout, whoami, reconnect
 * All operations use HTTP API client - no service imports
 */

import chalk from 'chalk';
import ora from 'ora';
import { DeSciXApiClient } from '../api-client.js';
import { WalletFileManager } from '../wallet-file.js';
import { WorkspaceConfig } from '../workspace-config.js';
import { requireAuth } from '../auth-guard.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);
const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_TIME_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Open browser to URL
 */
async function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  try {
    await execAsync(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Request device login via HTTP.
 * WS-HEADLESS-MVP-A1: optionally carries the device→OAuth bridge context so the server
 * issues an OAuth authorization code alongside the session on completion (design §2.1).
 * @param {DeSciXApiClient} apiClient - The API client
 * @param {Object|null} oauthCtx - { client_id, code_challenge, redirect_uri, scope }
 */
async function requestDeviceLogin(apiClient, oauthCtx = null) {
  const params = oauthCtx ? { oauth: oauthCtx } : {};
  const response = await apiClient.invoke('device_request_login', params, { allowGuest: true });
  return response.message;
}

/**
 * WS-HEADLESS-MVP-A1 — prepare the OAuth leg of `descix login`:
 * PKCE pair + a registered CLI public client (DCR, reusing a cached client_id when the
 * wallet file already has one). Returns null (with a loud warning) when the server does
 * not expose the OAuth AS — the wallet-sig login proceeds untouched (design §4.1:
 * "Behind a flag; wallet-sig path untouched").
 */
async function prepareOAuthLeg(apiClient, existingWallet, scope) {
  const oauthClient = await import('../oauth-client.js');
  const { verifier, challenge } = oauthClient.generatePkcePair();

  let clientId = existingWallet?.oauth?.client_id || null;
  if (!clientId) {
    clientId = await oauthClient.registerOAuthClient(apiClient.baseUrl, {});
  }

  return {
    oauthClient,
    verifier,
    clientId,
    ctx: {
      client_id: clientId,
      code_challenge: challenge,
      redirect_uri: oauthClient.OOB_REDIRECT_URI,
      scope: scope || oauthClient.DEFAULT_OAUTH_SCOPE,
    },
  };
}

/**
 * Poll for device login completion via HTTP
 */
async function pollDeviceLogin(apiClient, deviceCode, onStatus = null) {
  const startTime = Date.now();
  
  while (true) {
    if (Date.now() - startTime > MAX_POLL_TIME_MS) {
      throw new Error('Device login request expired. Please try again.');
    }
    
    try {
      const response = await apiClient.invoke('device_check_status', { device_code: deviceCode }, { allowGuest: true });
      const status = response.message.status;
      
      if (status === 'complete') {
        return {
          user_id: response.message.user_id,
          email: response.message.email || null,
          session_token: response.message.session_token,
          wallet_address: response.message.wallet_address,
          signature: response.message.signature,
          community_id: response.message.community_id,
          token_symbol: response.message.token_symbol || 'DAITA',
          // WS-A1 device→OAuth bridge: single-use authorization code (present exactly once
          // when the request carried an oauth ctx) — redeemed at /oauth/token immediately.
          oauth_code: response.message.oauth_code || null,
          oauth_scope: response.message.oauth_scope || null
        };
      }
      
      if (status === 'expired') {
        throw new Error('Device login request expired. Please try again.');
      }
      
      if (onStatus) {
        onStatus(status);
      }
      
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      if (error.message.includes('expired') || error.message.includes('timeout')) {
        throw error;
      }
      // Continue polling on other errors
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

/**
 * Device login command
 */
export async function loginDevice(options = {}) {
  const apiClient = new DeSciXApiClient({ baseUrl: options.url });
  
  console.log(chalk.cyan('\n🔐 DeSciX Device Login\n'));
  
  const spinner = ora('Requesting device login...').start();
  
  // Ensure we have the base URL resolved
  await apiClient.ensureBaseUrl();
  console.log(chalk.gray(`   API: ${apiClient.baseUrl}\n`));
  
  try {
    // Detect workspace root
    let workspaceRoot;
    let foundRoot;

    if (options.workspaceRoot) {
      workspaceRoot = options.workspaceRoot;
      foundRoot = workspaceRoot;
    } else {
      const startDir = process.cwd();
      foundRoot = await WorkspaceConfig.findWorkspaceRoot(startDir);
      workspaceRoot = foundRoot || startDir;
    }

    // WS-HEADLESS-MVP-A1: OAuth leg (default ON, `--no-oauth` disables). Additive: any
    // failure here warns loudly and the wallet-sig device login proceeds untouched.
    let oauthLeg = null;
    if (options.oauth !== false) {
      try {
        const existingWallet = await WalletFileManager.loadWalletFile(
          WalletFileManager.getProjectWalletPath(workspaceRoot));
        oauthLeg = await prepareOAuthLeg(apiClient, existingWallet, options.scope);
      } catch (e) {
        console.log(chalk.yellow(`\n⚠️  OAuth token leg unavailable (${e.message}).`));
        console.log(chalk.yellow('   Proceeding with wallet-signature login only.\n'));
      }
    }

    // Request device login (retry ONCE on a stale cached OAuth client_id)
    let request;
    try {
      request = await requestDeviceLogin(apiClient, oauthLeg?.ctx || null);
    } catch (e) {
      if (oauthLeg && /invalid_client/.test(e.message || '')) {
        // Cached client_id no longer registered server-side — re-register and retry.
        oauthLeg.clientId = await oauthLeg.oauthClient.registerOAuthClient(apiClient.baseUrl, {});
        oauthLeg.ctx.client_id = oauthLeg.clientId;
        request = await requestDeviceLogin(apiClient, oauthLeg.ctx);
      } else {
        throw e;
      }
    }

    spinner.succeed('Device login request created');

    console.log(chalk.yellow('\n📱 Browser will open automatically...\n'));
    console.log(chalk.white('In the browser, you will need to:'));
    console.log(chalk.gray('  1. Enter your email address'));
    console.log(chalk.gray('  2. Verify your email with the code sent'));
    console.log(chalk.gray('  3. Accept the Terms of Service'));
    console.log(chalk.gray('  4. Connect your crypto wallet'));
    console.log(chalk.gray('  5. Sign the message to prove wallet ownership'));
    console.log('');

    spinner.start('Opening browser...');

    // Open browser
    const apiUrl = apiClient.baseUrl;
    const verificationUrl = request.verification_url || `${apiUrl}/wallet?code=${request.user_code}`;
    const opened = await openBrowser(verificationUrl);
    if (opened) {
      spinner.succeed('Browser opened');
      console.log(chalk.yellow(`\nURL: ${verificationUrl}\n`));
    } else {
      spinner.warn('Could not open browser automatically');
      console.log(chalk.yellow(`\nPlease open: ${verificationUrl}\n`));
    }

    // Poll for completion
    spinner.start('Waiting for authentication...');
    const credentials = await pollDeviceLogin(apiClient, request.device_code, (status) => {
      spinner.text = `Waiting for authentication... (${status})`;
    });

    // Save credentials
    spinner.start('Saving credentials...');
    const walletData = {
      walletAddress: credentials.wallet_address,
      signature: credentials.signature,
      tokenSymbol: credentials.token_symbol,
      communityId: credentials.community_id,
      userId: credentials.user_id,
      email: credentials.email,
      sessionToken: credentials.session_token,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    // WS-HEADLESS-MVP-A1: redeem the device-bridge authorization code for the long-lived
    // OAuth pair (design §3) and cache it gcloud-ADC-style in wallet.json. The AS's auth
    // codes are single-use with a ≤60s TTL — redeem BEFORE anything else.
    if (oauthLeg && credentials.oauth_code) {
      try {
        const tokens = await oauthLeg.oauthClient.redeemAuthorizationCode(apiClient.baseUrl, {
          code: credentials.oauth_code,
          clientId: oauthLeg.clientId,
          codeVerifier: oauthLeg.verifier,
        });
        walletData.oauth = oauthLeg.oauthClient.buildOAuthCredentialBlock({
          clientId: oauthLeg.clientId,
          tokens,
          tokenEndpointBase: apiClient.baseUrl,
        });
      } catch (e) {
        console.log(chalk.yellow(`\n⚠️  OAuth code redemption failed: ${e.message}`));
        console.log(chalk.yellow('   Wallet-signature login is still valid; re-run "descix login" for OAuth tokens.\n'));
      }
    } else if (oauthLeg && !credentials.oauth_code) {
      console.log(chalk.yellow('\n⚠️  Server did not issue an OAuth code (device→OAuth bridge not available).'));
      console.log(chalk.yellow('   Wallet-signature login is still valid.\n'));
    }

    const walletPath = WalletFileManager.getProjectWalletPath(workspaceRoot);
    await WalletFileManager.saveWalletFile(walletPath, walletData);

    spinner.succeed(chalk.green('Login successful!'));
    if (walletData.oauth) {
      console.log(chalk.green('   OAuth tokens cached (30-day silent refresh — gcloud-style).'));
      console.log(chalk.gray(`   Scope: ${walletData.oauth.scope}`));
    }
    console.log(chalk.cyan(`\n✅ Credentials saved to:`));
    console.log(chalk.gray(`   ${walletPath}\n`));
    
    // Sync auto-purchase apps
    spinner.start('Syncing app entitlements...');
    try {
      apiClient.setCredentials({
        userId: credentials.user_id,
        accessToken: credentials.session_token,
        walletAddress: credentials.wallet_address,
        signature: credentials.signature
      });
      
      const syncResponse = await apiClient.invoke('sync_auto_purchases', {}, { allowGuest: false });
      const syncResult = syncResponse.message || syncResponse;
      
      if (syncResult.apps_purchased && syncResult.apps_purchased.length > 0) {
        spinner.succeed(chalk.green(`Synced ${syncResult.apps_purchased.length} app(s)`));
      } else {
        spinner.succeed(chalk.gray('App entitlements up to date'));
      }
    } catch (error) {
      spinner.warn(chalk.yellow('Could not sync app entitlements'));
      console.log(chalk.gray(`   ${error.message}\n`));
    }
    
    console.log(chalk.white('You can now use all DeSciX CLI commands!\n'));

  } catch (error) {
    spinner.fail(chalk.red('Login failed'));
    console.error(chalk.red(error.message));
    
    if (error.message.includes('expired')) {
      console.log(chalk.yellow('💡 Tip: Device codes expire after 15 minutes.'));
      console.log(chalk.yellow('   Run the login command again to get a new code.\n'));
    } else {
      console.log(chalk.yellow('💡 Tip: Make sure you:'));
      console.log(chalk.yellow('   - Have an internet connection'));
      console.log(chalk.yellow('   - Can access the DeSciX platform'));
      console.log(chalk.yellow('   - Complete all steps in the browser'));
      console.log(chalk.yellow(`   - API URL is correct: ${apiClient.baseUrl || 'unknown'}`));
      if (apiClient.baseUrl?.includes('localhost')) {
        console.log(chalk.yellow('   - Local backend server is running'));
      }
      console.log('');
    }
    throw error;
  }
}

/**
 * Direct wallet login command (not yet implemented)
 */
export async function loginWallet() {
  console.log(chalk.cyan('\n🔐 DeSciX Wallet Login\n'));
  console.log(chalk.yellow('\n⚠️  Direct wallet login requires a Web3 provider.\n'));
  console.log(chalk.white('For CLI/MCP, device login is recommended:\n'));
  console.log(chalk.cyan('  descix login\n'));
  console.log(chalk.gray('This opens your browser where you can connect your wallet.\n'));
  throw new Error('Direct wallet login not yet implemented for CLI. Use device login instead.');
}

/**
 * Reconnect using saved wallet credentials via HTTP
 */
export async function reconnect() {
  const apiClient = new DeSciXApiClient();
  
  const spinner = ora('Loading wallet credentials...').start();
  
  try {
    const walletPath = await WalletFileManager.findWalletFile(process.cwd());
    if (!walletPath) {
      throw new Error('No wallet file found. Run "descix login" first.');
    }
    
    const walletInfo = await WalletFileManager.loadWalletFile(walletPath);
    if (!walletInfo) {
      throw new Error('Failed to load wallet file. Run "descix login" to re-authenticate.');
    }
    
    spinner.text = 'Reconnecting with wallet...';
    
    const result = await apiClient.invoke('reconnect_by_wallet', {
      wallet_address: walletInfo.walletAddress,
      signature: walletInfo.signature
    }, {
      credentials: {
        walletAddress: walletInfo.walletAddress,
        signature: walletInfo.signature
      },
      allowGuest: true
    });
    
    if (result.status !== 'OK') {
      throw new Error(result.message || 'Reconnection failed');
    }
    
    const sessionInfo = result.message?.sessionInfo || result.message;
    
    const updatedWalletData = {
      ...walletInfo,
      sessionToken: sessionInfo?.access_token || sessionInfo?.session_token || walletInfo.sessionToken,
      userId: sessionInfo?.id || sessionInfo?.user_id || walletInfo.userId,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    await WalletFileManager.saveWalletFile(walletPath, updatedWalletData);
    
    spinner.succeed(chalk.green('Reconnected successfully!'));
    console.log(chalk.cyan(`\n✅ Status: ${result.auth_status || 'CONNECTED'}`));
    console.log(chalk.gray(`   User: ${sessionInfo?.email || sessionInfo?.id || walletInfo.userId}`));
    console.log(chalk.gray(`   Wallet: ${walletInfo.walletAddress?.substring(0, 10)}...`));
    console.log(chalk.gray(`   Session refreshed\n`));
    
  } catch (error) {
    spinner.fail(chalk.red('Reconnection failed'));
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Show current authentication status via HTTP
 */
export async function whoami() {
  const apiClient = new DeSciXApiClient();
  
  const spinner = ora('Checking authentication status...').start();
  
  try {
    await requireAuth(apiClient);
    
    const response = await apiClient.invoke('validate_session', {}, { allowGuest: false });
    const userInfo = response.message;
    
    const walletPath = await WalletFileManager.findWalletFile(process.cwd());
    const walletInfo = walletPath ? await WalletFileManager.loadWalletFile(walletPath) : null;
    const isValid = walletInfo ? WalletFileManager.hasValidSession(walletInfo) : false;
    
    spinner.succeed(chalk.green('Authentication status'));
    
    console.log(chalk.cyan('\n📋 Current Session:\n'));
    console.log(chalk.white(`   User ID:    ${userInfo?.id || userInfo?.user_id || walletInfo?.userId || 'Unknown'}`));
    console.log(chalk.white(`   Email:      ${userInfo?.email || walletInfo?.email || 'N/A'}`));
    if (walletInfo) {
      console.log(chalk.white(`   Wallet:     ${walletInfo.walletAddress?.substring(0, 10)}...${walletInfo.walletAddress?.slice(-6) || ''}`));
      if (walletInfo.communityId) {
        console.log(chalk.white(`   Community:  ${walletInfo.communityId}`));
      }
      if (walletInfo.tokenSymbol) {
        console.log(chalk.white(`   Token:      ${walletInfo.tokenSymbol}`));
      }
      console.log(chalk.white(`   Session:    ${isValid ? chalk.green('Valid') : chalk.red('Expired')}`));
      
      if (walletInfo.expiresAt) {
        const expiresDate = new Date(walletInfo.expiresAt);
        const now = new Date();
        if (expiresDate > now) {
          const hoursLeft = Math.round((expiresDate - now) / (1000 * 60 * 60));
          console.log(chalk.white(`   Expires:    ${hoursLeft}h remaining`));
        } else {
          console.log(chalk.white(`   Expires:    ${chalk.red('Expired')}`));
        }
      }
    }
    
    if (userInfo) {
      // Account Details: feature access is entitlement-based (community membership / subscriptions),
      // NOT a custodial balance or a STAKED state — both removed per CEO-D-2026-06-14-DROP-CUSTODIAL-ELIMINATE-STAKED.
      console.log(chalk.cyan('\n📊 Account Details:\n'));

      try {
        const purchasesResponse = await apiClient.invoke('fetch_my_purchases', { product_type: 'APP' }, { allowGuest: false });
        const purchases = purchasesResponse.message || {};
        const communities = purchases.communities || [];
        const apps = purchases.apps || purchases.products || [];

        console.log(chalk.white(`   Communities: ${communities.length}`));
        console.log(chalk.white(`   Apps:        ${apps.length}`));
        if (apps.length > 0) {
          apps.slice(0, 5).forEach(a => {
            const id = a.app_id || a.appId || a.id || a.product_id;
            if (id) console.log(chalk.gray(`               - ${id}`));
          });
          if (apps.length > 5) console.log(chalk.gray(`               ... and ${apps.length - 5} more`));
        }
      } catch (err) {
        // Ignore purchase fetch errors
      }
    }
    
    console.log('');
    
    if (walletInfo && !isValid) {
      console.log(chalk.yellow('   ⚠️  Session expired. Run "descix reconnect" to refresh.\n'));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to check status'));
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Logout - revoke server-side OAuth credentials (RFC 7009), then clear the local cache.
 * WS-HEADLESS-MVP-A1 (design §4.6): revocation kills the whole refresh-token chain so a
 * copied wallet.json cannot keep refreshing after logout. Revocation failure is reported
 * but never blocks the local credential wipe.
 */
export async function logout() {
  const spinner = ora('Logging out...').start();

  try {
    const walletPath = await WalletFileManager.findWalletFile(process.cwd());

    if (!walletPath) {
      spinner.info(chalk.yellow('Not logged in'));
      console.log(chalk.gray('\n   No credentials to remove.\n'));
      return;
    }

    const walletInfo = await WalletFileManager.loadWalletFile(walletPath);
    if (walletInfo?.oauth?.refresh_token) {
      spinner.text = 'Revoking OAuth credentials...';
      try {
        const apiClient = new DeSciXApiClient();
        await apiClient.ensureBaseUrl();
        const { revokeOAuthToken } = await import('../oauth-client.js');
        await revokeOAuthToken(apiClient.baseUrl, {
          token: walletInfo.oauth.refresh_token,
          clientId: walletInfo.oauth.client_id,
        });
        console.log(chalk.gray('\n   OAuth refresh-token chain revoked server-side.'));
      } catch (e) {
        console.log(chalk.yellow(`\n   ⚠️  OAuth revocation failed (${e.message}); removing local credentials anyway.`));
      }
    }

    await fs.unlink(walletPath);

    spinner.succeed(chalk.green('Logged out'));
    console.log(chalk.cyan('\n✅ Credentials removed\n'));

  } catch (error) {
    spinner.fail(chalk.red('Logout failed'));
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Admin bootstrap login — generates CLI credentials for platform admins
 * without requiring the PWA device login / Powch flow.
 * Requires email to be in the DESCIX_ADMIN_GROUP Google Group.
 */
export async function adminLogin(options = {}) {
  const email = options.email;
  if (!email) {
    console.error(chalk.red('--email is required'));
    process.exit(1);
  }

  const spinner = ora('Authenticating as admin...').start();

  try {
    const apiClient = new DeSciXApiClient();
    await apiClient.ensureBaseUrl();

    // admin_bootstrap_login is a bootstrap command: it must be sent guest-like,
    // never carrying a previously-stored access_token. Targeting a DIFFERENT env
    // than the one that minted the stored token (e.g. CLI configured for dev but
    // logging into prod via --env prod) would otherwise send a token prod's auth
    // middleware rejects with HTTP 401 BEFORE admin_bootstrap_login runs. Force
    // guest by skipping the session token, same as device_request_login.
    const result = await apiClient.invokeRaw('admin_bootstrap_login', { email }, null, { skipSessionCheck: true });
    const data = result.data || result;

    if (data.status === 'ERROR') {
      spinner.fail(data.message || 'Admin login failed');
      process.exit(1);
    }

    const info = data.message;
    if (!info || !info.session_token) {
      spinner.fail('Unexpected response from server');
      process.exit(1);
    }

    const walletData = {
      walletAddress: info.wallet_address,
      signature: info.signature,
      sessionToken: info.session_token,
      userId: info.user_id,
      email: info.email,
      communityId: info.community_id,
      tokenSymbol: info.token_symbol || 'DAITA',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Save wallet.json
    const workspaceRoot = await WorkspaceConfig.findWorkspaceRoot(process.cwd()) || process.cwd();
    const walletPath = WalletFileManager.getProjectWalletPath(workspaceRoot);
    await WalletFileManager.saveWalletFile(walletPath, walletData);

    spinner.succeed(chalk.green(`Logged in as admin: ${email}`));
    console.log(chalk.dim(`  Wallet: ${walletData.walletAddress}`));
    console.log(chalk.dim(`  Session expires: ${walletData.expiresAt}`));
    console.log(chalk.dim(`  Credentials saved to: ${walletPath}`));
  } catch (error) {
    spinner.fail(error.message || 'Admin login failed');
    process.exit(1);
  }
}
