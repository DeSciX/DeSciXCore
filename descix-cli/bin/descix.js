#!/usr/bin/env node

/**
 * DeSciX Unified CLI
 * 
 * Production command-line interface for DeSciX platform.
 * Combines CLI and MCP functionality with unified authentication.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { DeSciXApiClient } from '../lib/api-client.js';
import { requireAuth } from '../lib/auth-guard.js';
import { WorkspaceConfig, unmappedAppMessage, resolveWorkspacePath, TOP_LEVEL_API_URL_REMEDY } from '../lib/workspace-config.js';
import { CLI_VERSION } from '../lib/cli-version.js';
import { recordInvocationOrigin } from '../lib/origin.js';
// Chat session pointer + the ONE rule for when a dead pointer may be self-healed.
import {
  getSessionInteractionId,
  findSessionsForApp,
  saveSessionAuthoritative,
  clearAppSessions,
  isStaleThreadError,
} from '../lib/chat-session.js';
import { GlobalConfig } from '../lib/global-config.js';
import * as authCommands from '../lib/commands/auth.js';
import * as configCommands from '../lib/commands/config.js';
import * as buyCommands from '../lib/commands/buy.js';
import * as creditsCommands from '../lib/commands/credits.js';
import * as airdropCommands from '../lib/commands/airdrop.js';
import { runInit } from '../lib/commands/init.js';
// "May I prompt?" has ONE OWNER. No command in this file derives it.
import { createPromptSession } from '../lib/interactive.js';
import { registerAllRetiredKbSync, CANONICAL_KB_SYNC } from '../lib/commands/retired-kb-sync.js';
import { runStatus } from '../lib/commands/status.js';
import { runDoctor } from '../lib/commands/doctor.js';
import { runHealth } from '../lib/commands/health.js';
import * as kbCommands from '../lib/commands/kb.js';
import { kbVectorCell, kbCountSource } from '../lib/commands/kb-list-render.js';
import * as corpusCommands from '../lib/commands/corpus.js';
import * as modelConfigCommands from '../lib/commands/model-config.js';
import { isHelpInvocation, getCommandSurface, applyVisibility } from '../lib/command-visibility.js';
import { progress } from '../lib/output.js';
import { runMediaUpload } from '../lib/commands/media-upload.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * THE ONE OWNER of "a command threw, and the process must stop saying why".
 *
 * WHY THIS EXISTS (measured 2026-08-30 on the SHIPPED artifact): 27 command actions ended in a
 * bare `catch (error) { process.exit(1); }`. `DESCIX_API_URL=not-a-url descix credits balance`
 * exited 1 with ZERO BYTES on stdout AND stderr — the origin owner had built an
 * OriginInvalidError carrying the full remedy text and this handler threw it away. The contract
 * row "a configured-but-invalid origin FAILS LOUD naming the fix" was met in the module and
 * unmet on the artifact, because a message nobody prints is not a message.
 *
 * That is this contract's own bug class — silence — reaching the developer through the
 * contract's own remedy path. A handler that discards the reason is indistinguishable from a
 * crash, and it trains developers to believe the CLI has no error messages.
 *
 * @param {Error} error - the error that ended the command
 */
function fail(error) {
  const message = (error && error.message) ? error.message : String(error);
  console.error(chalk.red(`\n${message}\n`));
  process.exit(1);
}

const program = new Command();

program
  .name('descix')
  .description('DeSciX CLI - Unified command-line interface')
  .version(CLI_VERSION)
  .option('--env <name>', 'Target environment: dev, demo, prod (overrides API URL)')
  .option('--api-url <url>', 'Direct API URL override (e.g., https://demo.descix.net)')
  .option('--admin', 'Show every command in --help, including admin-only ones (also: DESCIX_ADMIN=1). Hiding is a listing convenience only — a hidden command still runs; the server is the real gate.');

// ============ Global Environment Override ============
// Maps --env flag to DESCIX_API_URL before any command runs.
// detectApiUrl() in api-client.js checks process.env.DESCIX_API_URL first.

// Derive ephemeral --env URL map from the canonical WorkspaceConfig.ENV_MAP
const ENV_URL_MAP = Object.fromEntries(
  Object.entries(WorkspaceConfig.ENV_MAP).map(([k, v]) => [k, v.url])
);

// The fold into DESCIX_API_URL is what makes every consumer see ONE variable — and it is also
// what used to DESTROY the answer to "who chose this origin", so the origin owner printed a
// static disjunction ("DESCIX_API_URL (or --api-url / --env)") for all three cases. The fold
// stays; the provenance is now RECORDED alongside it, in the same breath, so the owner can name
// the actual source. Recording it here rather than deriving it in the owner keeps one owner of
// the fact: the only code that knows a flag was passed is the code that read the flag.
//
// ONE OWNER of "apply --api-url / --env to DESCIX_API_URL", called from TWO sites: the
// `preAction` hook below (which only ever fires before an ACTION runs — never for `--help`,
// since Commander short-circuits help before reaching any action), and the help-time admin-
// surface bootstrap near the bottom of this file (which runs BEFORE `program.parseAsync()`, so
// `program.opts()` is not populated yet and the two flags are read off raw argv instead). Without
// this second call site, `descix --api-url https://X --help` silently queried the DEFAULT origin
// for the admin-listing surface while claiming to target X — the same class of misreport
// `resolveEffectiveOrigin` exists to end, just newly reachable through the one invocation shape
// (`--help`) that never runs an action.
function applyGlobalOriginOverride({ apiUrl, env }) {
  // --api-url takes highest priority
  if (apiUrl) {
    process.env.DESCIX_API_URL = apiUrl;
    recordInvocationOrigin(apiUrl, 'flagApiUrl');
    return;
  }

  // --env maps to known URLs
  if (env) {
    const envName = env.toLowerCase();
    if (!(envName in ENV_URL_MAP)) {
      // THE REFUSAL CARRIES THE CUSTOM-ENVIRONMENT PATH. This validator runs BEFORE any command
      // action, so it is now the only thing a developer typing `--env staging` ever sees — the
      // richer text inside `config init` that names `config set-env` for exactly this case can
      // no longer be reached through the flag. A refusal that names only the three built-in
      // names would strand every self-hosted or port-forwarded gateway with no next step, which
      // is the same dead end as a remedy string for a command that does not run.
      console.error(chalk.red(
        `Unknown environment: ${env}. Known environments: ${Object.keys(ENV_URL_MAP).join(', ')}.\n\n` +
        'For a self-hosted or port-forwarded gateway, name it with its origin instead:\n' +
        `  descix config set-env ${envName} --url https://...`
      ));
      process.exit(1);
    }
    // Every named environment resolves to a URL (including dev → cloud DEV).
    // A local backend is a URL you name, not an environment.
    process.env.DESCIX_API_URL = ENV_URL_MAP[envName];
    recordInvocationOrigin(ENV_URL_MAP[envName], 'flagEnv');
  }
}

program.hook('preAction', (thisCommand) => {
  // Read from the ROOT program, not from the action command. `--env` and `--api-url` are
  // declared ONCE, globally, and Commander binds them to the root — an identically-named option
  // redeclared on a subcommand is shadowed and silently never populated (measured on 1.0.4:
  // `descix config init --env dev` reached its action with `{}` and rejected its own advertised
  // flag). One declaration, read from where Commander actually puts it.
  const opts = program.opts();
  applyGlobalOriginOverride({ apiUrl: opts.apiUrl, env: opts.env });
});

// ============ Authentication Commands (No Auth Required) ============


program
  .command('login')
  .description('Authenticate with DeSciX via device login (opens browser)')
  .option('-u, --url <url>', 'API URL override')
  .option('--wallet', 'Use direct wallet connection (advanced, not yet implemented)')
  .option('--no-oauth', 'Skip the OAuth long-lived token leg (wallet-signature login only)')
  .option('--scope <scope>', 'OAuth scope to request (default: mcp:read mcp:tools mcp:write mcp:admin)')
  .action(async (options) => {
    try {
      if (options.wallet) {
        await authCommands.loginWallet();
      } else {
        await authCommands.loginDevice(options);
      }
    } catch (error) {
      fail(error);
    }
  });

program
  .command('logout')
  .description('Clear saved credentials')
  .action(async () => {
    try {
      await authCommands.logout();
    } catch (error) {
      fail(error);
    }
  });

program
  .command('admin-login')
  .description('Bootstrap CLI credentials for platform admins (requires admin group membership)')
  .requiredOption('-e, --email <email>', 'Admin email (must be in platform admin Google Group)')
  .option('-u, --url <url>', 'API URL override')
  .action(async (options) => {
    try {
      await authCommands.adminLogin(options);
    } catch (error) {
      fail(error);
    }
  });

// ============ Init Command (Git-aware workspace setup) ============

program
  .command('init')
  .description('Initialize workspace for DeSciX app development (Git-aware)')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <name>', 'App name')
  .option('-p, --path <path>', 'Project path (defaults to current directory)')
  .option('-f, --force', 'Restart the app registrations in an existing workspace (its environment settings are kept)')
  .option('-y, --yes', 'Skip the confirmation — with -c and -a, init runs without a terminal')
  .option('--from-invite <token>', 'Resolve an invite token to pre-fill app context')
  .action(async (options) => {
    try {
      // API client is optional for init (used for listing communities)
      let apiClient = null;
      try {
        apiClient = new DeSciXApiClient();
        await apiClient.loadCredentials();
      } catch {
        // Continue without API client
      }
      
      await runInit(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Auth-Required Commands ============

program
  .command('whoami')
  .description('Show current authentication status')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      await authCommands.whoami();
    } catch (error) {
      fail(error);
    }
  });

program
  .command('reconnect')
  .description('Reconnect using saved wallet credentials')
  .action(async () => {
    try {
      await authCommands.reconnect();
    } catch (error) {
      fail(error);
    }
  });

program
  .command('status')
  .description('Show comprehensive status of developer environment')
  .action(async () => {
    try {
      await runStatus();
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Diagnose environment issues (Node, Auth, gcloud, ADC)')
  .action(async () => {
    try {
      await runDoctor();
    } catch (error) {
      // runDoctor handles its own errors mostly, but catch-all here
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check platform service health (env-aware: local-port in DEV, gcloud+HTTPS in DEMO/PROD)')
  .option('--env <name>', 'Target environment: dev|demo|prod (default: dev). Also accepted at top level: descix --env=demo health ...')
  .option('-m, --microservice <name>', 'Check a specific service/app by appId')
  .option('-j, --json', 'Output raw JSON')
  .action(async (options) => {
    try {
      // Resolve --env in priority order: subcommand explicit > program parent > 'dev'.
      // Commander would otherwise silently default to 'dev' even when the parent
      // --env=demo is supplied (because the subcommand owns its own flag space).
      const parentEnv = program.opts().env || null;
      const env = options.env || parentEnv || 'dev';
      const result = await runHealth({ ...options, env });
      // A health check that reports an unhealthy service and exits 0 is not a gate.
      if (result && result.all_healthy === false) process.exitCode = 1;
    } catch (error) {
      console.error(chalk.red(`\nHealth check error: ${error.message}\n`));
      process.exit(1);
    }
  });


// ============ Buy Commands (Crypto Payments) ============

const buyCommand = program
  .command('buy')
  .description('Crypto payment operations');

buyCommand
  .command('quote')
  .description('Create a crypto payment quote')
  .requiredOption('-a, --amount <usd>', 'USD amount to purchase')
  .requiredOption('-c, --chain <chain>', 'Blockchain to use (polygon, ethereum, bnb)')
  .option('-t, --type <type>', 'Purchase type: usdcx or community_token', 'usdcx')
  .option('-e, --email <email>', 'Email for claim link (guest mode)')
  .option('--community <id>', 'Community ID for community token purchase')
  .action(async (options) => {
    try {
      await buyCommands.createQuote(options);
    } catch (error) {
      fail(error);
    }
  });

buyCommand
  .command('status <quoteId>')
  .description('Check status of a payment quote')
  .action(async (quoteId) => {
    try {
      await buyCommands.checkStatus(quoteId);
    } catch (error) {
      fail(error);
    }
  });

buyCommand
  .command('poll <quoteId>')
  .description('Poll for quote status until completed (with exponential backoff)')
  .option('--max <attempts>', 'Maximum poll attempts', '120')
  .option('--interval <ms>', 'Initial poll interval in ms', '5000')
  .action(async (quoteId, options) => {
    try {
      await buyCommands.pollStatus(quoteId, {
        maxAttempts: parseInt(options.max),
        initialInterval: parseInt(options.interval)
      });
    } catch (error) {
      fail(error);
    }
  });

buyCommand
  .command('chains')
  .description('List supported blockchains for payments')
  .action(() => {
    buyCommands.listChains();
  });

// ============ AI Credits Commands (WS-HEADLESS-MVP-A2, CEO-D-2026-07-01 D2) ============
// Platform-wide USD AI-credits: metered RAG/agent calls debit this balance.
// NOT community tokens (those are under `descix buy`).

const creditsCommand = program
  .command('credits')
  .description('Platform-wide USD AI credits (metered AI consumption)');

creditsCommand
  .command('balance')
  .description('Show your AI-credits balance')
  .action(async () => {
    try {
      await creditsCommands.showBalance();
    } catch (error) {
      fail(error);
    }
  });

creditsCommand
  .command('history')
  .description('Show your credit ledger (purchases, debits, grants)')
  .option('--limit <n>', 'Max entries (default 50)')
  .action(async (options) => {
    try {
      await creditsCommands.showHistory(options);
    } catch (error) {
      fail(error);
    }
  });

creditsCommand
  .command('buy')
  .description('Buy AI credits with USD (Stripe checkout)')
  .requiredOption('--usd <amount>', 'USD amount of credits to buy')
  // The default is the origin this invocation is already talking to, NOT a fixed production
  // host — see commands/credits.js. Naming a prod origin here made --help itself the misreport.
  .option('--return-base <url>', 'Base URL for the checkout success/cancel landing (default: the API origin in use)')
  .action(async (options) => {
    try {
      await creditsCommands.buyCredits({ usd: options.usd, returnBase: options.returnBase });
    } catch (error) {
      fail(error);
    }
  });

creditsCommand
  .command('grant')
  .description('Grant AI credits to a user')
  .requiredOption('--user <user_id>', 'Target user id')
  .requiredOption('--usd <amount>', 'USD amount to grant')
  .requiredOption('--reason <text>', 'Audit reason')
  .action(async (options) => {
    try {
      await creditsCommands.grantCredits(options);
    } catch (error) {
      fail(error);
    }
  });

creditsCommand
  .command('refund')
  .description('Remove AI credits from a user (e.g. after a Stripe refund)')
  .requiredOption('--user <user_id>', 'Target user id')
  .requiredOption('--usd <amount>', 'USD amount to remove')
  .requiredOption('--reason <text>', 'Audit reason')
  .action(async (options) => {
    try {
      await creditsCommands.refundCredits(options);
    } catch (error) {
      fail(error);
    }
  });

// ============ Airdrop Commands (WS-ADMIN-B1 manual-trigger) ============
// Per CEO-D-MANUAL-TRIGGER-NO-CRON (2026-04-20), airdrop batch execution is operator-triggered
// via this CLI command group rather than Cloud Scheduler cron. Server-side access is gated on
// platform-admin membership (`isPlatformAdmin(user)`); the server emits an on_chain_log row
// with `caller.operator_email` for audit.

const airdropCommand = program
  .command('airdrop')
  .description('Admin airdrop migration operations (WS-ADMIN-B1)');

airdropCommand
  .command('execute-queue')
  .description('Manually trigger airdrop_execute_queue on the target env (admin-only)')
  .option('--community <slug>', 'Community slug for per-community batch scoping (REQUIRED for --apply)')
  .option('--dry-run', 'Read-only preview: encode calldata, estimate gas, validate net-zero invariant. No PK, no tx, no state mutation.')
  .option('--apply', 'Live execution: requires --signer-pk-file or interactive prompt-password. Mutually exclusive with --dry-run.')
  .option('--signer-pk-file <path>', 'Path to file containing admin signer PK (0x + 64 hex). Required for --apply unless prompted interactively.')
  .option('--batch-size <n>', 'Cap on users processed this run (server caps at AIRDROP_MAX_RUN_USERS)')
  .action(async (options) => {
    try {
      await airdropCommands.executeQueue(options);
    } catch (error) {
      fail(error);
    }
  });

// ============ Sync Commands: REMOVED ============
// `sync assets`, `sync site` and `sync kb` are all gone, so the `sync` GROUP is gone with
// them: a registered verb with no working children is dead weight. Every retired surface is
// registered in ONE place below (search registerAllRetiredKbSync), driven off the owner list
// in lib/commands/retired-kb-sync.js -- this file names no retired verb itself.

// ============ Community/App Commands ============

const communityCommand = program
  .command('community')
  .description('Community operations');

communityCommand
  .command('refresh-identity')
  .description('Mirror a community\'s token symbol and icon from the descix-chain registry into this environment (the icon only if it serves)')
  .requiredOption('-c, --community <id>', 'Community ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const { refreshCommunityIdentity, printIdentityReceipt } = await import('../lib/commands/communityIdentity.js');
      printIdentityReceipt(options.community, await refreshCommunityIdentity(apiClient, options.community));
      console.log();
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

communityCommand
  .command('list')
  .description('List all communities')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('find_communities', {}, { allowGuest: false });
      const result = response.message || response;
      const communities = result.communities || [];
      
      console.log(chalk.green(`\n✅ Found ${communities.length} communities\n`));
      console.log(chalk.cyan('Communities:'));
      communities.forEach((c, idx) => {
        console.log(chalk.yellow(`${idx + 1}. ${c.community_name} (${c.community_id})`));
        console.log(chalk.gray(`   Token: ${c.token_symbol}`));
        console.log(chalk.gray(`   Description: ${c.community_description || 'N/A'}`));
        console.log();
      });
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

communityCommand
  .command('info')
  .description('Get community information')
  .option('-c, --community <id>', 'Community ID')
  .option('-n, --name <id>', 'Community ID (alias for -c)')
  .action(async (options) => {
    try {
      const communityId = options.community || options.name;
      if (!communityId) {
        console.error(chalk.red('\n  Error: Community ID is required. Use -c or -n to specify.\n'));
        process.exit(1);
      }
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const response = await apiClient.invoke('get_community', { community_id: communityId }, { allowGuest: false });
      const result = response.message || response;
      const community = result.community;

      console.log(chalk.green('\n  Community Information:\n'));
      console.log(chalk.cyan(`  Name: ${community.community_name}`));
      console.log(chalk.gray(`  ID: ${community.community_id}`));
      console.log(chalk.gray(`  Token: ${community.token_symbol}`));
      console.log(chalk.gray(`  Description: ${community.community_description || 'N/A'}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

communityCommand
  .command('check-token')
  .description('Check if a token symbol is available')
  .argument('<symbol>', 'Token symbol to check (1-7 chars)')
  .action(async (symbol) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const tokenSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (tokenSymbol.length < 1 || tokenSymbol.length > 7) {
        console.error(chalk.red('\n❌ Token symbol must be 1-7 alphanumeric characters\n'));
        process.exit(1);
      }
      
      console.log(chalk.cyan(`\n🔍 Checking token symbol '${tokenSymbol}'...\n`));
      
      const response = await apiClient.invoke('check_token_symbol_available', { token_symbol: tokenSymbol });
      const result = response.message || response;
      
      if (result.available) {
        console.log(chalk.green(`✅ Token symbol '${result.symbol}' is available!\n`));
      } else {
        console.log(chalk.red(`❌ Token symbol '${result.symbol}' is NOT available\n`));
        if (result.existing_contract) {
          console.log(chalk.yellow(`   Already used by contract: ${result.existing_contract}`));
        }
        if (result.existing_community) {
          console.log(chalk.yellow(`   Already used by community: ${result.existing_community}`));
        }
        console.log();
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

communityCommand
  .command('create')
  .description('Create a new community with token contract (requires platform admin, deploys to live Polygon)')
  .requiredOption('-n, --name <name>', 'Community display name (e.g. "SMILE")')
  .requiredOption('-t, --token <symbol>', 'Token symbol (e.g. SMILE)')
  .option('--icon <url>', 'Icon URL for the community')
  .option('--yes', 'Skip confirmation prompt (use with caution)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const communityId = options.token.toLowerCase();
      const tokenSymbol = options.token.toUpperCase();

      console.log(chalk.cyan('\n📦 Community Creation [ADMIN ONLY]\n'));
      console.log(chalk.yellow('  ⚠  WARNING: This operation is IRREVERSIBLE.'));
      console.log(chalk.yellow('  ⚠  DEV/DEMO environments use the LIVE Polygon blockchain.'));
      console.log(chalk.yellow('  ⚠  A real token contract will be deployed on-chain.\n'));
      console.log(chalk.white(`  Community ID:    ${communityId}`));
      console.log(chalk.white(`  Community Name:  ${options.name}`));
      console.log(chalk.white(`  Token Symbol:    ${tokenSymbol}`));
      console.log(chalk.white(`  Network:         Polygon (live)\n`));

      if (!options.yes) {
        const rl = createPromptSession({
          what: 'descix community create',
          destructive: true,
          nonInteractiveForm: ['descix community create ... --yes   # deploys a REAL token contract on live Polygon']
        });
        const answer = await rl.askRaw(chalk.yellow(`  Create community "${options.name}" with token ${tokenSymbol} on live Polygon? [y/N] `));
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('\n  Aborted.\n'));
          return;
        }
      }

      console.log(chalk.gray('\n  Creating community skeleton...'));

      const response = await apiClient.invoke('create_community_skeleton', {
        community_id: communityId,
        community_name: options.name,
        token_symbol: tokenSymbol,
        icon_url: options.icon || null,
      });

      const result = response.message || response;

      console.log(chalk.green(`\n  ✓ Community "${options.name}" created\n`));
      console.log(chalk.white(`  Community ID:     ${result.community_id}`));
      console.log(chalk.white(`  Default App:      ${result.app_id}`));
      console.log(chalk.white(`  Token Symbol:     ${result.token_symbol}`));
      if (result.contract_address) {
        console.log(chalk.white(`  Contract:         ${result.contract_address}`));
      }

      console.log(chalk.cyan('\n  Next steps:'));
      console.log(chalk.gray(`    descix app init -a ${result.app_id}          # Initialize KB`));
      console.log(chalk.gray(`    descix kb corpus sync -a ${result.app_id}    # Sync content`));
      console.log(chalk.gray(`    descix site upload -c ${communityId} -a ${result.app_id} -p ./site  # Deploy site\n`));

    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error.message}\n`));
      process.exit(1);
    }
  });

communityCommand
  .command('delete')
  .description('Delete a community with full cascade cleanup (all apps, KBs, vectors, GCS)')
  .requiredOption('-n, --name <community_id>', 'Community ID to delete')
  .option('--dry-run', 'Preview what would be deleted without executing')
  .option('--soft', 'Soft delete only (mark as hidden, no cascade)')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const communityId = options.name;
      const hardDelete = !options.soft;
      const dryRun = !!options.dryRun;

      if (dryRun) {
        console.log(chalk.cyan(`\n--- DRY RUN: delete community ${communityId} ---\n`));
      }

      // Always call with dry_run first to get the manifest for display
      const previewResponse = await apiClient.invoke('delete_community', {
        community_id: communityId,
        hard_delete: hardDelete,
        dry_run: true
      });

      const preview = previewResponse.message || previewResponse;
      const manifest = preview.community_manifest;

      if (!manifest) {
        console.error(chalk.red('\n  Error: Could not retrieve community information.\n'));
        process.exit(1);
      }

      // Display manifest
      console.log(chalk.bold('Community deletion manifest:\n'));
      console.log(chalk.gray(`  Community:       ${manifest.community_name} (${manifest.community_id})`));
      console.log(chalk.gray(`  Token:           ${manifest.token_symbol}`));
      console.log(chalk.gray(`  Apps:            ${manifest.app_count}`));
      if (manifest.apps && manifest.apps.length > 0) {
        for (const appM of manifest.apps) {
          if (appM.error) {
            console.log(chalk.red(`    - ${appM.app_id} (error: ${appM.error})`));
          } else {
            const kbCount = appM.pinecone_kb_count || 0;
            console.log(chalk.gray(`    - ${appM.app_id}: ${kbCount} KB(s), GCS: ${appM.gcs_prefix || 'N/A'}, Products: ${appM.products_doc ? 'yes' : 'no'}`));
          }
        }
      }
      console.log(chalk.gray(`  Mode:            ${hardDelete ? 'HARD DELETE (permanent)' : 'soft delete (hide only)'}`));

      if (dryRun) {
        console.log(chalk.yellow('\n  No changes were made. Remove --dry-run to execute.\n'));
        return;
      }

      // Confirmation prompt (unless --yes)
      if (!options.yes && hardDelete) {
        const rl = createPromptSession({
          what: 'descix community delete',
          destructive: true,
          nonInteractiveForm: [
            'Re-run with --dry-run to see the plan without changing anything.',
            'descix community delete ... --yes   # PERMANENTLY deletes the community and every app in it'
          ]
        });
        const answer = await rl.askRaw(chalk.yellow(`\n  Permanently delete community "${manifest.community_name}" and all ${manifest.app_count} app(s)? This cannot be undone. [y/N] `));
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('\n  Aborted.\n'));
          return;
        }
      }

      // Execute the actual delete
      const response = await apiClient.invoke('delete_community', {
        community_id: communityId,
        hard_delete: hardDelete,
        dry_run: false
      });

      const result = response.message || response;

      if (result.cleanup) {
        const c = result.cleanup;
        console.log(chalk.green(`\n  Community ${communityId} deleted.\n`));
        console.log(chalk.gray(`  Apps deleted:          ${c.apps_deleted?.length || 0} (${c.apps_deleted?.join(', ') || 'none'})`));
        if (c.apps_failed?.length > 0) {
          console.log(chalk.red(`  Apps failed:           ${c.apps_failed.length}`));
          for (const f of c.apps_failed) {
            console.log(chalk.red(`    - ${f.app_id}: ${f.error}`));
          }
        }
        console.log(chalk.gray(`  Pinecone vectors:      ${c.total_pinecone_deleted}`));
        console.log(chalk.gray(`  GCS files:             ${c.total_gcs_deleted}`));
        console.log(chalk.gray(`  Firestore docs:        ${c.total_firestore_deleted}`));
        console.log(chalk.gray(`  Products entries:      ${c.total_products_deleted}`));
        console.log(chalk.gray(`  ServiceManifests:      ${c.total_service_manifests_deleted}`));
        console.log();
      } else {
        console.log(chalk.green(`\n  ${result.message || `Community ${communityId} deleted.`}\n`));
      }
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error.message}\n`));
      process.exit(1);
    }
  });

communityCommand
  .command('rename')
  .description('Rename a community_id across all surfaces (Firestore, Products, Pinecone metadata, ServiceManifests, descix-chain registry). On-chain contract + token symbol are UNTOUCHED. Dry-run first.')
  .argument('<old_community_id>', 'Current community_id (e.g. unkamon)')
  .argument('<new_community_id>', 'New canonical community_id (e.g. unk)')
  .option('--dry-run', 'Preview the full cascade plan without executing')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (oldId, newId, options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const dryRun = !!options.dryRun;

      // Always fetch the plan first (dry_run:true) for display.
      const previewResp = await apiClient.invoke('rename_community', {
        old_community_id: oldId, new_community_id: newId, dry_run: true
      });
      const preview = previewResp.message || previewResp;
      const plan = preview.plan;
      if (!plan) {
        console.error(chalk.red('\n  Error: could not retrieve rename plan.\n'));
        process.exit(1);
      }

      console.log(chalk.bold(`\nCommunity rename plan: ${oldId} -> ${newId}\n`));
      console.log(chalk.gray(`  Community doc:         old_exists=${plan.community_doc.old_exists}, new_exists=${plan.community_doc.new_exists}`));
      console.log(chalk.gray(`  Name / token:          ${plan.community_doc.community_name} / ${plan.community_doc.token_symbol}`));
      console.log(chalk.gray(`  Apps subcollection:    ${plan.community_doc.apps_subcollection.join(', ') || '(none)'}`));
      console.log(chalk.gray(`  Roles subcollection:   ${plan.community_doc.roles_subcollection.join(', ') || '(none)'}`));
      console.log(chalk.gray(`  Community tree docs:   ${plan.community_doc.total_docs_in_tree}`));
      console.log(chalk.gray(`  Products to update:    ${plan.products.count} (${plan.products.app_ids.join(', ')})`));
      console.log(chalk.gray(`  User purchases:        ${plan.user_purchases_to_repoint}`));
      console.log(chalk.gray(`  ServiceManifests:      ${plan.service_manifests_to_retag.join(', ') || '(none)'}`));
      console.log(chalk.gray(`  Chain product/contract: ${plan.chain.product_doc_old || '(none)'} / ${plan.chain.contract_address || '(none)'} (symbol ${plan.chain.token_symbol}, communityId ${plan.chain.contract_community_id})`));
      console.log(chalk.cyan(`  Pinecone re-tag:       scanned=${plan.pinecone.scanned}, matched(community=${oldId})=${plan.pinecone.matched}, legacy-id-prefixed=${plan.pinecone.legacyIdMatched}`));
      console.log(chalk.gray(`    by app: ${JSON.stringify(plan.pinecone.byApp)}`));
      console.log(chalk.gray(`    prefix counts: ${JSON.stringify(plan.pinecone.prefixCounts)}`));

      if (dryRun) {
        console.log(chalk.yellow('\n  DRY RUN — no changes made. Remove --dry-run to execute.\n'));
        return;
      }

      if (!options.yes) {
        const rl = createPromptSession({
          what: 'descix community rename',
          destructive: true,
          nonInteractiveForm: [
            'Re-run with --dry-run to see the plan without changing anything.',
            'descix community rename ... --yes   # re-tags vectors and DELETES the old community doc'
          ]
        });
        const answer = await rl.askRaw(chalk.yellow(`\n  Execute rename ${oldId} -> ${newId}? Re-tags ${plan.pinecone.matched} vector(s) and deletes Community/${oldId} after verifying Community/${newId}. [y/N] `));
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('\n  Aborted.\n'));
          return;
        }
      }

      const resp = await apiClient.invoke('rename_community', {
        old_community_id: oldId, new_community_id: newId, dry_run: false
      });
      const result = resp.message || resp;
      const ex = result.executed || {};
      console.log(chalk.green(`\n  ${result.message}\n`));
      console.log(chalk.gray(`  Community doc copied:  ${ex.community_doc_copied}`));
      console.log(chalk.gray(`  Old community deleted: ${ex.old_community_deleted}`));
      console.log(chalk.gray(`  Products updated:      ${ex.products_updated}`));
      console.log(chalk.gray(`  User purchases:        ${ex.user_purchases_repointed}`));
      console.log(chalk.gray(`  Pinecone re-tagged:    ${ex.pinecone?.updated} / matched ${ex.pinecone?.matched}`));
      console.log(chalk.gray(`  ServiceManifests:      ${ex.service_manifests_retagged}`));
      console.log(chalk.gray(`  Chain re-pointed:      ${ex.chain_repointed} (contract ${ex.chain_contract_address}, symbol unchanged)`));
      console.log();
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// Deploy a token contract without creating community
communityCommand
  .command('deploy-token')
  .description('Deploy a new token contract (without creating a community)')
  .requiredOption('-t, --token <symbol>', 'Token symbol (e.g., POWCH)')
  .requiredOption('-n, --name <name>', 'Token name (e.g., "Powch Token")')
  .option('--treasury <address>', 'Treasury wallet address (defaults to platform wallet)')
  .option('-c, --community <id>', 'Community ID to link the token to (optional)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const tokenSymbol = options.token.toUpperCase();
      const tokenName = options.name;
      
      console.log(chalk.cyan('\n📦 Deploying token contract...\n'));
      console.log(chalk.gray(`  Token Symbol: ${tokenSymbol}`));
      console.log(chalk.gray(`  Token Name: ${tokenName}`));
      if (options.treasury) {
        console.log(chalk.gray(`  Treasury: ${options.treasury}`));
      }
      if (options.community) {
        console.log(chalk.gray(`  Community: ${options.community}`));
      }
      console.log();
      
      console.log(chalk.yellow('⏳ This may take a few minutes while transactions confirm on-chain...\n'));
      
      const response = await apiClient.invoke('deploy_contract', {
        template_type: 'DAITA_v2',
        token_symbol: tokenSymbol,
        token_name: tokenName,
        treasury_wallet: options.treasury || null,
        community_id: options.community || null
      });
      
      // Handle response wrapping
      const result = response.message || response;
      
      if (result.status !== 'OK') {
        throw new Error(result.message || 'Deployment failed');
      }
      
      const deployment = result.deployment;
      
      console.log(chalk.green('✅ Token contract deployed successfully!\n'));
      console.log(chalk.white('Contract Details:'));
      console.log(chalk.gray(`  Proxy Address:    ${deployment.proxy_address}`));
      console.log(chalk.gray(`  Implementation:   ${deployment.implementation_address}`));
      console.log(chalk.gray(`  Token Symbol:     ${deployment.token_symbol}`));
      console.log(chalk.gray(`  Token Name:       ${deployment.token_name}`));
      console.log(chalk.gray(`  Network:          ${deployment.network} (chainId: ${deployment.chain_id})`));
      console.log(chalk.gray(`  TX Hash:          ${deployment.tx_hash}`));
      console.log();
      
      if (deployment.network === 'polygon') {
        console.log(chalk.cyan(`View on Polygonscan: https://polygonscan.com/address/${deployment.proxy_address}`));
      } else if (deployment.network === 'amoy') {
        console.log(chalk.cyan(`View on Amoy: https://amoy.polygonscan.com/address/${deployment.proxy_address}`));
      }
      
      if (!options.community) {
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.gray(`  1. Create community:    descix community create -n "Name" -t ${tokenSymbol}`));
        console.log(chalk.gray(`  2. Link token:          descix community link-token -c <community-id> -a ${deployment.proxy_address}`));
      }
      console.log();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Link existing token contract to community
communityCommand
  .command('link-token')
  .description('Link an existing token contract to a community')
  .requiredOption('-c, --community <id>', 'Community ID to link to')
  .requiredOption('-a, --address <address>', 'Contract address to link')
  .option('-t, --token <symbol>', 'Token symbol (optional, uses contract symbol if not provided)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      console.log(chalk.cyan('\n🔗 Linking token contract to community...\n'));
      console.log(chalk.gray(`  Community ID:      ${options.community}`));
      console.log(chalk.gray(`  Contract Address:  ${options.address}`));
      if (options.token) {
        console.log(chalk.gray(`  Token Symbol:      ${options.token}`));
      }
      console.log();
      
      const response = await apiClient.invoke('link_contract_to_community', {
        community_id: options.community,
        contract_address: options.address,
        token_symbol: options.token || null
      });
      
      // Handle response wrapping
      const result = response.message || response;
      
      if (result.status !== 'OK') {
        throw new Error(result.message || 'Linking failed');
      }
      
      const link = result.link;
      
      console.log(chalk.green('✅ Token contract linked successfully!\n'));
      console.log(chalk.white('Link Details:'));
      console.log(chalk.gray(`  Community:        ${link.community_name} (${link.community_id})`));
      console.log(chalk.gray(`  Contract:         ${link.contract_address}`));
      console.log(chalk.gray(`  Token Symbol:     ${link.token_symbol}`));
      console.log(chalk.gray(`  Contract Type:    ${link.contract_type}`));
      console.log(chalk.gray(`  Network:          ${link.network}`));
      console.log();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Get contract details
communityCommand
  .command('contract')
  .description('Get details about a deployed contract')
  .option('-a, --address <address>', 'Contract address')
  .option('-t, --token <symbol>', 'Token symbol')
  .option('-c, --community <id>', 'Community ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      if (!options.address && !options.token && !options.community) {
        console.error(chalk.red('\n❌ Must provide --address, --token, or --community\n'));
        process.exit(1);
      }
      
      const response = await apiClient.invoke('get_contract_details', {
        contract_address: options.address || null,
        token_symbol: options.token || null,
        community_id: options.community || null
      });
      
      // Handle response wrapping
      const result = response.message || response;
      
      if (result.status === 'NOT_FOUND') {
        console.log(chalk.yellow('\n⚠ Contract not found\n'));
        return;
      }
      
      if (result.status !== 'OK' || !result.contract) {
        throw new Error(result.message || 'Failed to get contract details');
      }
      
      const contract = result.contract;
      
      console.log(chalk.cyan('\n📋 Contract Details\n'));
      console.log(chalk.gray(`  Address:          ${contract.address}`));
      if (contract.implementation_address) {
        console.log(chalk.gray(`  Implementation:   ${contract.implementation_address}`));
      }
      console.log(chalk.gray(`  Type:             ${contract.contract_type}`));
      console.log(chalk.gray(`  ERC Spec:         ${contract.erc_spec}`));
      console.log(chalk.gray(`  Token Symbol:     ${contract.token_symbol}`));
      console.log(chalk.gray(`  Token Name:       ${contract.token_name}`));
      console.log(chalk.gray(`  Chain:            ${contract.chain} (${contract.chain_id})`));
      if (contract.product_path) {
        console.log(chalk.gray(`  Linked To:        ${contract.product_path}`));
      }
      console.log(chalk.gray(`  Deployed At:      ${contract.deployed_at || 'N/A'}`));
      console.log(chalk.gray(`  Deployed By:      ${contract.deployed_by || 'N/A'}`));
      console.log(chalk.gray(`  TX Hash:          ${contract.deployment_tx_hash || 'N/A'}`));
      console.log();
      
      if (contract.chain === 'polygon') {
        console.log(chalk.cyan(`View on Polygonscan: https://polygonscan.com/address/${contract.address}`));
      }
      console.log();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// ============ App Commands ============

const appCommand = program
  .command('app')
  .description('App management operations');

appCommand
  .command('list')
  .description('List apps you have access to (purchases + owned)')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const response = await apiClient.invoke('fetch_my_purchases', { product_type: 'APP' });
      const apps = (response.message || response).apps || [];
      if (apps.length === 0) {
        console.log(chalk.yellow('\nNo apps found. Run bootstrap or purchase an app.\n'));
        return;
      }
      const idW = Math.max(6, ...apps.map(a => (a.app_id || '').length));
      const comW = Math.max(9, ...apps.map(a => (a.community_id || '').length));
      const nameW = Math.max(8, ...apps.map(a => (a.app_name || '').length));
      console.log('\n' + chalk.bold(
        'APP ID'.padEnd(idW + 2) + 'COMMUNITY'.padEnd(comW + 2) + 'APP NAME'
      ));
      console.log('─'.repeat(idW + comW + nameW + 4));
      for (const app of apps) {
        console.log(
          chalk.cyan((app.app_id || '').padEnd(idW + 2)) +
          chalk.gray((app.community_id || '').padEnd(comW + 2)) +
          (app.app_name || '')
        );
      }
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('init')
  // ONE PATH TO AN APP (CEO-D-2026-08-14): `app init` is THE app entry point — it creates the
  // app when it does not exist yet and then registers/scaffolds it locally. The separate
  // `app create` command is DELETED (no compat fence): two commands for one outcome is how apps
  // ended up half-made — created on the platform, never initialized — which is precisely the
  // state the DEV audit found (powch, sml, daita-ssgpod carrying zero knowledge bases).
  // Creation still routes through the single canonical server command create_app_for_community,
  // which composes the app_id and fails loud on a missing community / duplicate id / bad short
  // name. The server also guarantees the default KB, so no app can exist without one.
  .description('Create (if needed) and initialize an app: platform record + default KB + local workspace registration and scaffold. Idempotent. Pass -c to create a new app; omit it to initialize one that already exists.')
  .requiredOption('-a, --app <app_id>', 'App ID (e.g. daita). With -c this is the app NAME to create.')
  .option('-c, --community <id>', 'Community ID — REQUIRED to create an app that does not exist yet. The community must already be materialized in this environment.')
  .option('-s, --short <short_name>', 'SHORT id segment (no hyphens) used when creating; the app_id is composed server-side as {community}-{short}. Defaults to --app.')
  .option('--overwrite', 'When creating, overwrite an existing app record intentionally')
  .option('--kb <name>', 'Knowledge base name', 'General')
  .option('-p, --path <dir>', 'Local app directory (default: auto-detected or cwd)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      let appId = options.app;
      const kbId = options.kb || 'General';

      // Refuse an unusable -p BEFORE anything is written — server-side included. The same
      // resolver the workspace loader applies on every read decides it, so a value accepted here
      // is one the next read accepts too. Refusing only at registration came AFTER a `-c` create,
      // leaving a platform app with no local registration (measured 2026-09-18, daita-docs).
      const workspaceConfig = await WorkspaceConfig.tryLoad();
      if (options.path) {
        resolveWorkspacePath(workspaceConfig?.workspaceRoot || process.cwd(), options.path, appId);
      }

      // Resolve community_id from the Products registry to learn whether the app exists yet.
      let communityId;
      try {
        const productCtx = await apiClient.invoke('get_product_context', { app_id: appId });
        communityId = (productCtx.message || productCtx).community_id;
      } catch (e) {
        // Not in Products — either we create it below (-c given) or we fail loud.
      }

      if (!communityId) {
        if (!options.community) {
          throw new Error(
            `App '${appId}' does not exist yet. Pass -c <community> to create it: ` +
            `descix app init -a ${appId} -c <community> [-s <short>]`
          );
        }
        // CREATE leg — the canonical server path. It composes the unique app_id
        // ({community}-{short}) and is authoritative; we never compose it client-side.
        const response = await apiClient.invoke('create_app_for_community', {
          community_id: options.community,
          app_name: appId,
          short_name: options.short || undefined,
          create_skeleton: false,
          overwrite: options.overwrite,
        });
        const created = response.message || response;
        appId = created.app_id || appId;
        communityId = created.community_id || options.community;
        console.log(chalk.green(`\n✅ App created: ${appId}`));
        console.log(chalk.gray(`  Products:   Products/${appId}`));
        console.log(chalk.gray(`  Firestore:  Community/${communityId}/Apps/${appId}`));
      } else if (options.community && options.community !== communityId) {
        throw new Error(
          `App '${appId}' already exists in community '${communityId}', not '${options.community}'. ` +
          `Omit -c to initialize the existing app.`
        );
      }

      // 1. Workspace.json — register app if not already mapped
      const alreadyMapped = workspaceConfig?.getAppByAppId(appId);
      let appPath = alreadyMapped?.absolutePath;

      if (alreadyMapped && options.path) {
        throw new Error(
          `App '${appId}' is already mapped to '${alreadyMapped.localPath}'. ` +
          `Use 'descix app set-localpath -a ${appId} -p <new-path>' to update.`
        );
      }

      if (!alreadyMapped) {
        const localPath = options.path || '.';
        const wsRoot = workspaceConfig?.workspaceRoot || process.cwd();
        const cfg = workspaceConfig || new WorkspaceConfig({}, wsRoot);
        cfg.registerApp(communityId, appId, { localPath, kbId });
        await cfg.save(wsRoot);
        appPath = path.resolve(wsRoot, localPath);
        console.log(chalk.gray(`  workspace.json updated: ${appId} → ${localPath}`));
      }

      // 2. Create app folder structure (site, microservice, assets)
      if (appPath) {
        const siteDir = path.join(appPath, 'site');
        const msDir = path.join(appPath, 'microservice');
        const assetsDir = path.join(appPath, 'assets');
        await fs.mkdir(siteDir, { recursive: true });
        await fs.mkdir(msDir, { recursive: true });
        await fs.mkdir(assetsDir, { recursive: true });

        // Create template asset files if they don't exist
        const siPath = path.join(assetsDir, 'system_instructions.md');
        const descPath = path.join(assetsDir, 'app_description.md');
        try {
          await fs.access(siPath);
        } catch {
          await fs.writeFile(siPath, `# System Instructions for ${appId}\n\nYou are an AI assistant for the ${appId} application.\n`);
        }
        try {
          await fs.access(descPath);
        } catch {
          await fs.writeFile(descPath, `# ${appId}\n\nApplication description goes here.\n`);
        }
        console.log(chalk.gray(`  Created: site/, microservice/, assets/`));
      }

      // 3. Create KnowledgeBase Firestore doc (Git Mode — no Drive required)
      const kbResponse = await apiClient.invoke('init_git_mode_kb', { app_id: appId, kb_name: kbId });
      const kbResult = kbResponse.message || kbResponse;

      console.log(chalk.green(`\n✓ ${appId} initialized`));
      console.log(chalk.gray(`  Community: ${communityId}`));

      // A community's OWN app (app_id == community_id) mirrors its token symbol and icon from the
      // env-invariant descix-chain registry into this environment (CEO 2026-09-19). The app is
      // already initialized; a refusal here (not an admin of the community, or the community not in
      // the registry) is reported with the command that retries it, not treated as an init failure.
      if (appId === communityId) {
        const { refreshCommunityIdentity, printIdentityReceipt } = await import('../lib/commands/communityIdentity.js');
        try {
          printIdentityReceipt(communityId, await refreshCommunityIdentity(apiClient, communityId));
        } catch (err) {
          console.log(chalk.yellow(`\n  ⚠ Community identity not mirrored: ${err.message}`));
          console.log(chalk.gray(`    Retry with: descix community refresh-identity -c ${communityId}`));
        }
      }
      console.log(chalk.gray(`  KB: ${kbId} — ${kbResult.created ? 'created' : 'already exists'}\n`));
      console.log(chalk.gray(`  (every app is guaranteed a default KB at creation; an empty one`));
      console.log(chalk.gray(`   says so rather than answering from general knowledge)\n`));
      console.log(chalk.cyan('Next steps:'));
      // The manifest lives in THIS app's registered directory — never a guessed `apps/<id>/`,
      // which named a path that does not exist for any app registered elsewhere.
      const manifestPath = path.join(appPath, '.descix', 'manifests', `${kbId}.json`);
      console.log(chalk.gray(`  Create a corpus manifest at ${path.relative(process.cwd(), manifestPath) || manifestPath}`));
      console.log(chalk.gray(`  then run:`));
      console.log(chalk.white(`  descix kb corpus sync -a ${appId}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


// descix app media-upload — upload media/asset files to an app's GCS assets prefix via the
// API surface (WS-V1-PURGE Phase 1, item 2; media-via-API-surface PLATFORM half). Command body
// lives in lib/commands/media-upload.js (runMediaUpload) — see that module for the full
// contract (server-owned quota/path/permission checks, verbatim upload_headers ferrying).
appCommand
  .command('media-upload')
  .description('Upload media/asset files to an app\'s GCS assets prefix (200 MB per app today; app owners, community admins and platform admins may upload — returns asset references)')
  .requiredOption('-a, --app <id>', 'App ID (community is resolved server-side from Products)')
  .requiredOption('-f, --file <path...>', 'One or more local file paths to upload')
  .option('--prefix <relPath>', 'Optional sub-path under the app assets/ prefix (e.g. "shows/myshow")', '')
  .option('--json', 'Print the asset references as JSON (for scripting)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      await runMediaUpload(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });


appCommand
  .command('set-price')
  .description('Set app price in USDCX')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-p, --price <amount>', 'Price in USDCX (decimal number)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const price = parseFloat(options.price);
      if (isNaN(price) || price < 0) {
        throw new Error('Price must be a non-negative number');
      }
      
      const response = await apiClient.invoke('update_app_metadata', {
        community_id: options.community,
        app_id: options.app,
        price: price
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ App price updated!\n'));
      console.log(chalk.cyan(`  App: ${options.community}/${options.app}`));
      console.log(chalk.gray(`  Price: ${price} USDCX\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('set-name')
  .description('Set app display name')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('--name <name>', 'Display name for the app')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const response = await apiClient.invoke('update_app', {
        community_id: options.community,
        app_id: options.app,
        app_name: options.name
      });
      const result = response.message || response;

      console.log(chalk.green('\n✅ App display name updated!\n'));
      console.log(chalk.cyan(`  App: ${options.community}/${options.app}`));
      console.log(chalk.gray(`  Name: ${options.name}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('set-listed')
  .description('List or unlist your app in the app store (on: shown in the public store; off: not shown to non-admin visitors)')
  .argument('<state>', 'on or off')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .action(async (state, options) => {
    try {
      const wanted = { on: true, off: false }[String(state).toLowerCase()];
      if (wanted === undefined) {
        throw new Error(`set-listed takes 'on' or 'off', not '${state}'.`);
      }
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const response = await apiClient.invoke('update_app', {
        community_id: options.community,
        app_id: options.app,
        listed: wanted
      });
      const result = response.message || response;
      // The receipt is the value the SERVER holds after the write, never the value requested.
      const stored = result?.app?.listed;
      if (stored !== wanted) {
        throw new Error(`update_app returned listed=${JSON.stringify(stored)} for ${options.app}; expected ${wanted}. The store listing did not change.`);
      }

      console.log(chalk.green(`\n✅ App ${stored ? 'listed' : 'unlisted'}.\n`));
      console.log(chalk.cyan(`  App: ${options.community}/${options.app}`));
      console.log(chalk.gray(`  listed: ${stored}`));
      console.log(chalk.gray('  The store view is cached for up to 5 minutes, so the change can take that long to show.\n'));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('set-api-url')
  .description('Set API base URL for app\'s own backend')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-u, --url <url>', 'API base URL (e.g., https://api.example.com)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Validate URL format
      try {
        new URL(options.url);
      } catch {
        throw new Error('Invalid URL format');
      }
      
      const response = await apiClient.invoke('update_app_metadata', {
        community_id: options.community,
        app_id: options.app,
        api_base_url: options.url
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ API base URL updated!\n'));
      console.log(chalk.cyan(`  App: ${options.community}/${options.app}`));
      console.log(chalk.gray(`  API URL: ${options.url}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('set-repo')
  .description('Link a GitHub repository to your app')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('--repo <url>', 'SSH git URL (e.g., git@github.com:user/repo.git)')
  .option('--unlink', 'Remove the linked repository')
  .option('--branch <name>', 'Default branch', 'main')
  .option('--subfolder <path>', 'Subfolder within repo')
  .action(async (options) => {
    if (!options.repo && !options.unlink) {
      console.error('Either --repo <url> or --unlink is required.');
      process.exit(1);
    }
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const result = await apiClient.invoke('set_app_repo', {
        app_id: options.app,
        repo_url: options.unlink ? null : options.repo,
        repo_branch: options.branch,
        repo_subfolder: options.subfolder
      });
      if (result.cleared) {
        console.log(result.message);
      } else {
        console.log('\nRepository linked successfully.\n');
        console.log(result.instructions);
        console.log(`\nFingerprint: ${result.fingerprint}\n`);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

appCommand
  .command('invite')
  .description('Generate invite links to share your app')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('--type <type>', 'Invite type: try or install', 'install')
  .option('--hint <text>', 'Context for the AI agent (e.g., "Physics students, no coding background")')
  .option('--expires <duration>', 'Expiry duration (e.g., 30d, 7d, 24h)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const result = await apiClient.invoke('create_app_invite', {
        app_id: options.app,
        invite_type: options.type,
        agent_hint: options.hint,
        expires_in: options.expires
      });
      console.log(`\nInvite created for ${options.app}\n`);
      console.log(`  Try (browser):     ${result.try_url}`);
      console.log(`  Install (VS Code): ${result.install_url}`);
      console.log(`  Expires: ${result.expires_at}`);
      console.log(`  Token: ${result.token}\n`);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

appCommand
  .command('delete')
  .description('Delete an app with full cascade cleanup (Pinecone, GCS, Firestore, Products)')
  .requiredOption('-a, --app <app_id>', 'App ID to delete')
  .option('-c, --community <community_id>', 'Community ID (auto-resolved from Products if omitted)')
  .option('--dry-run', 'Preview what would be deleted without executing')
  .option('--soft', 'Soft delete only (mark as hidden, no cascade)')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const appId = options.app;
      const hardDelete = !options.soft;
      const dryRun = !!options.dryRun;

      // Resolve community_id if not provided (apiFront hydrates from Products)
      let communityId = options.community || null;

      if (dryRun) {
        console.log(chalk.cyan(`\n--- DRY RUN: delete ${appId} ---\n`));
      }

      const response = await apiClient.invoke('delete_app', {
        app_id: appId,
        community_id: communityId,
        hard_delete: hardDelete,
        dry_run: dryRun
      });

      const result = response.message || response;

      if (dryRun) {
        const m = result.deletion_manifest || result;
        console.log(chalk.bold('Deletion manifest:\n'));
        if (m.pinecone_only_orphan) {
          console.log(chalk.yellow(`  ** Pinecone-only orphan: no Firestore/Products records found **\n`));
        }
        if (m.app_doc) console.log(chalk.gray(`  Firestore App:     ${m.app_doc}`));
        if (m.products_doc) console.log(chalk.gray(`  Products Doc:      ${m.products_doc}`));
        if (m.knowledgebases?.length) {
          console.log(chalk.gray(`  Knowledge Bases:   ${m.knowledgebases.length}`));
          for (const kb of m.knowledgebases) {
            console.log(chalk.gray(`    - ${kb}`));
          }
        }
        if (m.pinecone_note) {
          console.log(chalk.yellow(`  Pinecone:          ${m.pinecone_note}`));
        } else {
          console.log(chalk.gray(`  Pinecone filter:   app_id == ${appId} (${m.pinecone_kb_count} KBs)`));
        }
        console.log(chalk.gray(`  GCS prefix:        ${m.gcs_prefix}`));
        console.log(chalk.gray(`  IPDocs:            ${m.ip_docs_count}`));
        if (m.service_manifests?.length) {
          console.log(chalk.gray(`  ServiceManifests:  ${m.service_manifests.join(', ')}`));
        }
        console.log(chalk.yellow('\n  No changes were made. Remove --dry-run to execute.\n'));
        return;
      }

      // Confirmation prompt (unless --yes)
      if (!options.yes && hardDelete) {
        const rl = createPromptSession({
          what: 'descix app delete',
          destructive: true,
          nonInteractiveForm: [
            'Re-run with --dry-run to see the plan without changing anything.',
            `descix app delete -a ${appId} --yes   # PERMANENTLY deletes the app (hard delete is the default; --soft only hides it)`
          ]
        });
        const answer = await rl.askRaw(chalk.yellow(`\n  Permanently delete ${appId}? This cannot be undone. [y/N] `));
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('\n  Aborted.\n'));
          return;
        }
      }

      // Display results
      if (result.cleanup) {
        const c = result.cleanup;
        console.log(chalk.green(`\n  App ${appId} deleted.\n`));
        console.log(chalk.gray(`  Pinecone vectors:  ${c.pinecone_deleted === -1 ? 'filter-deleted' : c.pinecone_deleted} (KBs: ${c.kbs_deleted?.join(', ') || 'none'})`));
        console.log(chalk.gray(`  GCS files:         ${c.gcs_deleted}`));
        console.log(chalk.gray(`  Firestore docs:    ${c.firestore_deleted} (IPDocs)`));
        console.log(chalk.gray(`  Products deleted:  ${c.products_deleted ? 'yes' : 'no'}`));
        if (c.service_manifests_deleted?.length) {
          console.log(chalk.gray(`  ServiceManifests:  ${c.service_manifests_deleted.join(', ')}`));
        }
        console.log();
      } else {
        console.log(chalk.green(`\n  ${result.message || `App ${appId} deleted.`}\n`));
      }
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error.message}\n`));
      process.exit(1);
    }
  });

appCommand
  .command('sync-assets')
  // Canonical asset-sync surface. The legacy Drive-mode `sync assets` DUPLICATE was removed in
  // WS-MCP-SURFACE-SPLIT Step 3 §5.5; this is now the sole path.
  .description('Sync local assets (system_instructions.md, app_description.md, icon.png) to platform.')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .option('-k, --kb <name>', 'Target KB for system_instructions', 'General')
  .option('-p, --path <dir>', 'App directory (default: auto-detected)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const fs = await import('fs');
      const path = await import('path');

      // Resolve app path via WorkspaceConfig (v2.1 — localPath from workspace.json)
      let appPath = options.path;
      if (!appPath) {
        try {
          const wsConfig = await WorkspaceConfig.load();
          const appConfig = wsConfig.getAppByAppId(options.app);
          if (appConfig?.absolutePath) {
            appPath = appConfig.absolutePath;
          }
        } catch { /* fall through */ }
      }
      if (!appPath) {
        console.error(chalk.red(`App '${options.app}' not found in workspace.json. Use -p to specify path.`));
        process.exit(1);
      }

      const assetsDir = path.default.join(appPath, 'assets');
      const assets = {};
      let found = 0;

      // system_instructions.md
      const siPath = path.default.join(assetsDir, 'system_instructions.md');
      if (fs.default.existsSync(siPath)) {
        assets.system_instructions = fs.default.readFileSync(siPath, 'utf8');
        found++;
        console.log(chalk.gray(`  Found: ${siPath}`));
      }

      // app_description.md
      const descPath = path.default.join(assetsDir, 'app_description.md');
      if (fs.default.existsSync(descPath)) {
        assets.app_description = fs.default.readFileSync(descPath, 'utf8');
        found++;
        console.log(chalk.gray(`  Found: ${descPath}`));
      }

      // icon.png
      const iconPath = path.default.join(assetsDir, 'icon.png');
      if (fs.default.existsSync(iconPath)) {
        assets.icon_base64 = fs.default.readFileSync(iconPath).toString('base64');
        found++;
        console.log(chalk.gray(`  Found: ${iconPath}`));
      }

      if (found === 0) {
        console.log(chalk.yellow(`\nNo assets found in ${assetsDir}`));
        console.log(chalk.gray('Expected: system_instructions.md, app_description.md, icon.png\n'));
        return;
      }

      console.log(chalk.gray(`\nSyncing ${found} asset(s) for ${options.app}...`));

      const response = await apiClient.invoke('sync_app_assets', {
        app_id: options.app,
        kb_name: options.kb,
        assets
      });

      const result = response.message || response;
      if (result.results) {
        for (const [key, val] of Object.entries(result.results)) {
          if (val.updated) {
            console.log(chalk.green(`  ${key}: synced${val.kb ? ` (KB: ${val.kb})` : ''}`));
          } else {
            console.log(chalk.red(`  ${key}: failed — ${val.error || 'unknown'}`));
          }
        }
      }
      console.log(chalk.green('\nAsset sync complete.\n'));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('set-localpath')
  .description('Update the local directory path for a mapped app')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .requiredOption('-p, --path <dir>', 'New local directory path')
  .action(async (options) => {
    try {
      const appId = options.app;
      const newPath = options.path;

      const workspaceConfig = await WorkspaceConfig.load();
      const wsRoot = workspaceConfig.workspaceRoot || process.cwd();

      // Read the RAW registry entry, never the RESOLVED one. getAppByAppId() resolves the stored
      // localPath, so on a workspace already carrying a rejected value it throws here — before
      // any write is attempted. That is what made this verb refuse exactly when it was needed,
      // while the rejection told the user to fix it with the config verb and never by hand.
      // This command is about to REPLACE that value; it has no business resolving it.
      //
      // Display value only. setLocalPath() is the SINGLE authority on whether the app is mapped
      // and refuses if it is not — deciding that here as well would be two derivations of one
      // fact, and they would not even agree: _buildAppIdMap (behind getAppEntry) requires BOTH
      // appId and localPath, while the live-entry walk matches on appId alone.
      const oldPath = workspaceConfig.getAppEntry(appId)?.localPath;

      // VALIDATE AT THE WRITE, through the LOADER'S OWN resolver — not a second copy of its rules.
      // If resolveWorkspacePath would reject this value on the next read, it is rejected now, and
      // nothing reaches disk. Writing a value the loader will refuse is what bricks a workspace.
      const absPath = resolveWorkspacePath(wsRoot, newPath, appId);

      // Hard-fail if path doesn't exist or is not a directory — checked at the path the LOADER
      // will resolve to, not at a CWD-relative path that only exists from where you happened to
      // be standing when you typed it.
      let stat;
      try {
        stat = await fs.stat(absPath);
      } catch {
        throw new Error(
          `Path does not exist: ${absPath}\n` +
          `  (localPath '${newPath}' resolved against workspace root ${wsRoot})`
        );
      }
      if (!stat.isDirectory()) {
        throw new Error(
          `Path is not a directory: ${absPath}\n` +
          `  (localPath '${newPath}' resolved against workspace root ${wsRoot})`
        );
      }

      // Write through the canonical setter, which covers env.platform AND env.products[]. The
      // loop this replaces walked env.products ONLY: on the platform app it matched nothing,
      // wrote nothing, and still printed success — a loud failure turned into a silent lie at
      // the one entry that matters most.
      await workspaceConfig.setLocalPath(appId, newPath);

      console.log(chalk.green(`\n✓ ${appId} local path updated`));
      console.log(chalk.gray(`  ${oldPath} → ${newPath}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('unmap')
  .description('Remove an app from the local workspace mapping (does not delete Firestore/Pinecone data)')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .action(async (options) => {
    try {
      const appId = options.app;

      const workspaceConfig = await WorkspaceConfig.load();
      const appConfig = workspaceConfig.getAppByAppId(appId);
      if (!appConfig) {
        throw new Error(`App '${appId}' is not mapped.`);
      }

      // Remove from env.products
      const products = workspaceConfig.env?.products || [];
      const idx = products.findIndex(p => p.appId === appId || p.app_id === appId);
      if (idx === -1) {
        throw new Error(`App '${appId}' is not found in env.products.`);
      }
      products.splice(idx, 1);

      const wsRoot = workspaceConfig.workspaceRoot || process.cwd();
      await workspaceConfig.save(wsRoot);

      console.log(chalk.green(`\n✓ ${appId} removed from workspace mapping`));
      console.log(chalk.gray(`  Pinecone vectors, Firestore docs, and Drive data are not affected.\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ App: set-port (WS-CLI-MESH-ROUTING-GAP) ============
//
// Canonical write path for an app's microservice.port in workspace.json.
// `descix microservice init` READS env.products[<app>].microservice.port and hard-fails
// if it is missing; this command is how that port is set, without hand-editing workspace.json.
// Backed by WorkspaceConfig.setMicroservicePort.
appCommand
  .command('set-port')
  .description('Set the microservice port for a mapped app (writes env.products[<app>].microservice.port). Pass "n" to remove.')
  .requiredOption('-a, --app <app_id>', 'App ID (must be mapped in workspace.json)')
  .requiredOption('-p, --port <port>', 'Microservice port number (1-65535), or "n" to remove')
  .action(async (options) => {
    try {
      const appId = options.app;
      const workspaceConfig = await WorkspaceConfig.load();

      // Disable case — setMicroservicePort(appId, null) removes microservice.port / cleans microservice.{}
      if (options.port === 'n' || options.port === 'N') {
        await workspaceConfig.setMicroservicePort(appId, null);
        console.log(chalk.green(`\n✓ Microservice port removed for ${appId}\n`));
        return;
      }

      const portNum = parseInt(options.port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(chalk.red('\n❌ Invalid port number. Provide an integer 1-65535, or "n" to remove.\n'));
        process.exit(1);
      }

      // setMicroservicePort mutates the live env entry and saves — and hard-fails (canonical
      // "not mapped in workspace.json" error) for an unmapped app, surfaced in the catch below.
      await workspaceConfig.setMicroservicePort(appId, portNum);

      console.log(chalk.green(`\n✓ Microservice port set for ${appId}`));
      console.log(chalk.cyan(`  Port: ${portNum}`));
      console.log(chalk.gray(`  Written to env.products[${appId}].microservice.port in workspace.json.`));
      console.log(chalk.gray(`  The gateway routes the microservice on this port; \`descix microservice init -a ${appId}\` can now scaffold it.\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ App: set-site (WS-SSGPOD — site.static workspace gap) ============
//
// Canonical write path for an app's site config in workspace.json — specifically site.static,
// the relative path the dev gateway's staticSitePlugin serves at /p/{appId}/ (resolved against
// the app's localPath; "." means the localPath itself). Optionally sets site.port for
// dev-server sites. Parallel to `descix app set-port` (microservice.port); closes the
// site.static gap so workspace.json never needs hand-editing (CEO-D-2026-06-02-SSGPOD-SITE-PREPROD).
// Backed by WorkspaceConfig.setStaticSite (parallel to setMicroservicePort).
// It writes ONLY the local workspace.json site.{} slot.
appCommand
  .command('set-site')
  .description("Set a mapped app static-site config (writes env.products[<app>].site.static, the relative dir served at /p/<app>/). Optionally --port; --unset clears site.{}.")
  .requiredOption('-a, --app <app_id>', 'App ID (must be mapped in workspace.json)')
  .option('--static <path>', 'Relative static-site path under the app localPath (e.g. "site"; "." = the localPath itself)')
  .option('--port <port>', 'Site dev-server port (1-65535) for framework dev sites; mutually optional with --static')
  .option('--unset', 'Remove site.static (and site.port) for the app, clearing the site.{} slot')
  .action(async (options) => {
    try {
      const appId = options.app;
      const workspaceConfig = await WorkspaceConfig.load();

      // --unset: remove both site.static and site.port (setStaticSite cleans up empty site.{})
      if (options.unset) {
        await workspaceConfig.setStaticSite(appId, { static: null, port: null });
        console.log(chalk.green(`\n✓ site config cleared for ${appId}\n`));
        return;
      }

      // Require at least one field to set — do not silently no-op.
      if (options.static === undefined && options.port === undefined) {
        console.error(chalk.red('\n❌ Nothing to set. Provide --static <path> and/or --port <n>, or --unset to clear.\n'));
        process.exit(1);
      }

      const fields = {};

      if (options.static !== undefined) {
        if (typeof options.static !== 'string' || options.static.trim() === '') {
          console.error(chalk.red('\n❌ --static requires a non-empty relative path (e.g. "site" or ".").\n'));
          process.exit(1);
        }
        fields.static = options.static;
      }

      if (options.port !== undefined) {
        const portNum = parseInt(options.port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          console.error(chalk.red('\n❌ Invalid port number. Provide an integer 1-65535.\n'));
          process.exit(1);
        }
        fields.port = portNum;
      }

      // setStaticSite mutates the live env entry and saves — and hard-fails (canonical
      // "not mapped in workspace.json" error) for an unmapped app, surfaced in the catch below.
      await workspaceConfig.setStaticSite(appId, fields);

      console.log(chalk.green(`\n✓ site config set for ${appId}`));
      if (fields.static !== undefined) console.log(chalk.cyan(`  site.static: ${fields.static}`));
      if (fields.port !== undefined)   console.log(chalk.cyan(`  site.port:   ${fields.port}`));
      console.log(chalk.gray(`  Written to env.products[${appId}].site in workspace.json.`));
      console.log(chalk.gray(`  The gateway serves site.static at /p/${appId}/ (staticSitePlugin); \`descix serve\` picks it up.\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


// ============ App: open (WS-SSGPOD — dev URL resolver) ============
//
// Resolves an app's LOCAL GATEWAY URL (the URL served by `descix serve`, which mirrors
// the production LB) and prints it; with --open, launches the default browser.
// Reuses the SDK resolver resolveAppGatewayUrl() — the same workspace.json read path
// behind buildWorkspaceProducts() that the PWA bakes into __WORKSPACE_PRODUCTS__ — so
// the URL matches what the app store routes to:
//   - env.platform        → https://localhost:{gatewayPort}/
//   - product (static)    → https://localhost:{gatewayPort}/p/{appId}
//   - product (dev-server)→ https://localhost:{gatewayPort}/p/{appId}
// Hard-fails clearly if the app is unmapped or has no site config.
appCommand
  .command('open')
  .description('Resolve (and optionally open) an app\'s local gateway dev URL. Hard-fails if the app has no site config.')
  .requiredOption('-a, --app <app_id>', 'App ID (must be mapped in workspace.json with a site)')
  .option('--open', 'Open the resolved URL in the default browser')
  .action(async (options) => {
    try {
      const appId = options.app;
      const { resolveAppGatewayUrl } = await import('@descix/app-sdk/dev');
      const workspaceConfig = await WorkspaceConfig.load();
      const workspaceRoot = workspaceConfig.workspaceRoot || process.cwd();

      // resolveAppGatewayUrl hard-fails (no site / unmapped / no workspace) — surfaced in catch.
      const resolved = resolveAppGatewayUrl(workspaceRoot, appId);

      console.log(chalk.green(`\n${appId} → ${resolved.url}`));
      console.log(chalk.gray(`  kind: ${resolved.kind}`));
      console.log(chalk.gray(`  via:  ${resolved.via}`));
      console.log(chalk.gray(`  (start the gateway with \`descix serve\` on port ${resolved.gatewayPort} if it is not already running)\n`));

      if (options.open) {
        // Use the platform-native opener — no extra npm dependency, no hardcoded fallback.
        const { spawn } = await import('node:child_process');
        const platform = process.platform;
        const opener = platform === 'darwin' ? 'open'
          : platform === 'win32' ? 'cmd'
          : 'xdg-open';
        const args = platform === 'win32' ? ['/c', 'start', '', resolved.url] : [resolved.url];
        const child = spawn(opener, args, { stdio: 'ignore', detached: true });
        child.on('error', (err) => {
          console.error(chalk.yellow(`  Could not launch browser (${err.message}). Open the URL above manually.`));
        });
        child.unref();
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


// ============ App: set-default-model (WS-CONFIG-BOOTSTRAP-FIX item #10) ============
//
// Updates Community/{c}/Apps/{a}.default_app_model. Per CEO inheritance chain:
//   options.model > kb.kb_model_override > app.default_app_model > levelConfig.model > DEFAULT_AI_MODEL
//
// --clear deletes the field via FieldValue.delete() (NOT null) so the resolver falls through
// cleanly to per-level platform defaults.

appCommand
  .command('set-default-model')
  .description('Set or clear App.default_app_model (model used when no KB override is set)')
  .requiredOption('-a, --app <app_id>', 'App ID (e.g. unk-cos)')
  .option('-m, --model <model_name>', 'Gemini model name (e.g. gemini-3.1-flash-lite). Mutually exclusive with --clear.')
  .option('--clear', 'Delete App.default_app_model via FieldValue.delete() (resets to platform-default inheritance)')
  .addHelpText('after', `
NOTE: Pinning a "Pro" model (e.g., gemini-2.5-pro, gemini-3.1-pro-preview) as
an app or KB override will fail at L1 — these models require thinking mode and
reject L1's thinkingBudget=0. If you intend an L1-compatible override, use a
"Flash" model (gemini-2.5-flash, gemini-3.1-flash-lite, gemini-3-flash-preview).
`)
  .action(async (options) => {
    try {
      // Forward the parent --env flag so the audit log records the target environment.
      const parentEnv = program.opts().env || null;
      await modelConfigCommands.runAppSetDefaultModel({ ...options, env: parentEnv });
    } catch (error) {
      console.error(chalk.red(`\n\u274c ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Knowledge Base Commands ============

const kbCommand = program
  .command('kb')
  .description('Knowledge base operations');

kbCommand
  .command('list')
  .description('List knowledge bases for an app')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .option('--cached', 'Show the fast cached vector counter instead of the TRUE live Pinecone count. The cached counter is written ONLY by the CLI/PWA sync path, so it reports 0 for KBs ingested by any other route even when their vectors retrieve. Default is the live count.')
  .addHelpText('after', `
By default the Vectors column is the TRUE live Pinecone count (server enumerates each
KB's vectors by id-prefix). The Source column shows how each count was obtained:
  live    = counted live from Pinecone (authoritative)
  cached  = the fast cached counter (--cached; may under-report; verify with a live run)
  unknown = live count requested but Pinecone enumeration failed — shown as '?', NOT a fake 0
`)
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      // Default to the TRUE live Pinecone count. --cached opts into the fast (possibly
      // stale) cached counter that only the sync path writes.
      const live = !options.cached;
      const response = await apiClient.invoke('list_knowledge_bases', {
        app_id: options.app,
        live
      });
      const result = response.message || response;
      const kbs = result.knowledge_bases || [];

      if (kbs.length === 0) {
        console.log(chalk.yellow(`\nNo knowledge bases found for app ${options.app}\n`));
        return;
      }

      // Render helpers live in ../lib/commands/kb-list-render.js (unit-tested there).
      const vectorCell = (kb) => kbVectorCell(kb);
      const sourceCell = (kb) => kbCountSource(kb, live);

      // Table output
      const nameW = Math.max(7, ...kbs.map(k => (k.name || '').length));
      const modelW = Math.max(5, ...kbs.map(k => (k.model || '').length));
      const vecW = Math.max(7, ...kbs.map(k => vectorCell(k).length));

      console.log('\n' + chalk.bold(
        'KB Name'.padEnd(nameW + 2) +
        'Model'.padEnd(modelW + 2) +
        'Instructions'.padEnd(14) +
        'Vectors'.padEnd(vecW + 2) +
        'Source'.padEnd(9) +
        'Last Sync'
      ));
      console.log('-'.repeat(nameW + modelW + 49));

      for (const kb of kbs) {
        const syncDate = kb.rag_last_sync
          ? new Date(kb.rag_last_sync._seconds ? kb.rag_last_sync._seconds * 1000 : kb.rag_last_sync).toISOString().split('T')[0]
          : '-';
        const src = sourceCell(kb);
        const srcColor = src === 'live' ? chalk.green : src === 'unknown' ? chalk.yellow : chalk.gray;
        console.log(
          chalk.cyan((kb.name || '').padEnd(nameW + 2)) +
          chalk.gray((kb.model || '').padEnd(modelW + 2)) +
          (kb.system_instructions === 'present' ? chalk.green('present') : chalk.gray('empty')).padEnd(14 + 10) +
          vectorCell(kb).padEnd(vecW + 2) +
          srcColor(src.padEnd(9)) +
          syncDate
        );
      }
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


kbCommand
  .command('delete')
  .description('Delete a knowledge base registry doc (refuses a non-empty KB unless --force)')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .requiredOption('-k, --kb <kb_name>', 'KB name')
  .option('--force', 'Purge the KB\'s live vectors and delete it even if non-empty. An empty KB deletes without this flag.')
  .addHelpText('after', `
Fail-safe: the server reads the TRUE live Pinecone count. A KB with live vectors (or an
undetermined count) is REFUSED unless --force. With --force the vectors are purged BEFORE
the registry doc is removed, so a removed doc never strands orphan vectors.`)
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const response = await apiClient.invoke('delete_knowledge_base', {
        app_id: options.app,
        kb_name: options.kb,
        force: !!options.force
      });
      const result = response.message || response;

      console.log(chalk.green('\n✅ Knowledge base deleted.\n'));
      console.log(chalk.cyan(`  KB: ${options.kb}`));
      console.log(chalk.gray(`  App: ${result.community_id || '?'}/${options.app}`));
      if (result.vectors_purged) {
        console.log(chalk.gray(`  Vectors purged: ${result.vectors_purged}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


// ============ KB: set-/clear-override-model (WS-CONFIG-BOOTSTRAP-FIX item #10) ============
//
// Updates Community/{c}/Apps/{a}/KnowledgeBases/{k}.kb_model_override.
// Per CEO practice, KB overrides should be MINIMIZED — only use when a specific KB needs
// a model different from App.default_app_model (e.g., a tuned model for one KB).
//
// clear-override-model deletes the field via FieldValue.delete() (NOT null) per tripwire #2.

kbCommand
  .command('set-override-model')
  .description('Set KB.kb_model_override (per-KB model selection)')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .requiredOption('-k, --kb <kb_name>', 'KB name')
  .requiredOption('-m, --model <model_name>', 'Gemini model name (e.g. gemini-2.5-pro)')
  .addHelpText('after', `
NOTE: Pinning a "Pro" model (e.g., gemini-2.5-pro, gemini-3.1-pro-preview) as
an app or KB override will fail at L1 — these models require thinking mode and
reject L1's thinkingBudget=0. If you intend an L1-compatible override, use a
"Flash" model (gemini-2.5-flash, gemini-3.1-flash-lite, gemini-3-flash-preview).
`)
  .action(async (options) => {
    try {
      const parentEnv = program.opts().env || null;
      await modelConfigCommands.runKbSetOverrideModel({ ...options, env: parentEnv });
    } catch (error) {
      console.error(chalk.red(`\n\u274c ${error.message}\n`));
      process.exit(1);
    }
  });

kbCommand
  .command('clear-override-model')
  .description('Delete KB.kb_model_override via FieldValue.delete() (resets to App.default_app_model inheritance)')
  .requiredOption('-a, --app <app_id>', 'App ID')
  .requiredOption('-k, --kb <kb_name>', 'KB name')
  .action(async (options) => {
    try {
      const parentEnv = program.opts().env || null;
      await modelConfigCommands.runKbClearOverrideModel({ ...options, env: parentEnv });
    } catch (error) {
      console.error(chalk.red(`\n\u274c ${error.message}\n`));
      process.exit(1);
    }
  });

// `kb chunk` and `kb sync` (low-level Git-mode steps) are REMOVED. Their implementations
// runKbChunk/runKbSync are deleted from lib/commands/kb.js. Both names exit non-zero naming
// `descix kb corpus sync`.
// EVERY retired kb-sync surface is registered here, by ITERATING the owner list -- no verb
// name is typed in this file. Adding a surface to RETIRED_KB_SYNC_SURFACES registers it;
// nothing can be registered without being in that list.
registerAllRetiredKbSync({ program, kb: kbCommand }, chalk.red);


// app records — APP DATA PLANE structured record store (CEO-D-2026-06-02-APP-DATA-PLANE)
// Treat your app like a database table: put/query/get/delete structured records
// with custom metadata. Records live in the app data plane (Firestore document
// collections), NOT the Pinecone KB. `query` is a STRUCTURED, strongly-consistent
// metadata-filtered scan (non-ANN) returning full records; for semantic ANN search
// use `descix chat`.
//
// Canonical surface: `descix app records ...` (commands app_records_*).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach the four records subcommands (put/query/get/delete) to a parent command.
 * @param {import('commander').Command} parent - the `records` parent command
 * @param {string} cmdPrefix - backend command prefix ('app_records')
 */
function attachRecordsSubcommands(parent, cmdPrefix) {
  parent
    .command('put')
    .description('Store/replace records in your app data store with custom metadata (your app as a database table). You supply file_id (+ optional chunk_idx); the id is built for you.')
    .requiredOption('-a, --app <app_id>', 'App ID')
    .requiredOption('-k, --kb <kb_id>', 'Record collection ID (acts like a table)')
    .requiredOption('-r, --records <json>', 'JSON array of records: [{ "file_id", "text"?, "chunk_idx"?, ...customMetadata }] — id is built from file_id (+ chunk_idx); pass a full "id" only for back-compat. Example: \'[{"file_id":"e1","text":"...","type":"episode","show":"x"}]\'')
    .option('--mode <mode>', 'upsert (default) | create — "create" is an atomic all-or-nothing conditional create: it fails if any key already exists and reports who holds it, instead of overwriting', 'upsert')
    .action(async (options) => {
      try {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);
        let records;
        try { records = JSON.parse(options.records); } catch (e) { throw new Error(`--records must be valid JSON array: ${e.message}`); }
        if (!Array.isArray(records)) throw new Error('--records must be a JSON array');
        const response = await apiClient.invoke(`${cmdPrefix}_put`, { app_id: options.app, kb_id: options.kb, records, mode: options.mode });
        const result = response.message || response;
        // A refused conditional create is a DEFINITE answer, not a warning: report it as a
        // failure with the holder hint and a non-zero exit so scripts branch on it correctly.
        if (result.claimed === false) {
          console.error(chalk.red(`\n❌ claim refused — ${result.message || 'key already exists'}\n`));
          process.exit(1);
        }
        console.log(chalk.green(`\n✓ ${result.message || 'records put'}\n`));
      } catch (error) {
        console.error(chalk.red(`\n❌ ${error.message}\n`));
        process.exit(1);
      }
    });

  parent
    .command('query')
    .description('STRUCTURED metadata-filtered scan (non-ANN) returning full records: "all records where type=episode AND show=X"')
    .requiredOption('-a, --app <app_id>', 'App ID')
    .requiredOption('-k, --kb <kb_id>', 'Record collection ID')
    .option('-f, --filter <json>', 'Metadata predicate JSON. Scalar fields: $eq/$ne/$in or a bare value; ARRAY fields: $contains. e.g. \'{"type":"episode","tags":{"$contains":"handoff"}}\'', '{}')
    .option('--fields <csv>', 'Comma-separated metadata projection (omit or "*" for all metadata)')
    .option('--limit <n>', 'Cap on returned records', (v) => parseInt(v, 10))
    .action(async (options) => {
      try {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);
        let filter;
        try { filter = JSON.parse(options.filter); } catch (e) { throw new Error(`--filter must be valid JSON: ${e.message}`); }
        const fields = options.fields ? options.fields.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        const params = { app_id: options.app, kb_id: options.kb, filter };
        if (fields) params.fields = fields;
        if (options.limit) params.limit = options.limit;
        const response = await apiClient.invoke(`${cmdPrefix}_query`, params);
        const result = response.message || response;
        console.log(chalk.gray(`\n${result.message || ''}`));
        console.log(JSON.stringify(result.records || [], null, 2));
        console.log();
      } catch (error) {
        console.error(chalk.red(`\n❌ ${error.message}\n`));
        process.exit(1);
      }
    });

  parent
    .command('get')
    .description('Fetch specific records by id (point lookup) with an arbitrary metadata projection')
    .requiredOption('-a, --app <app_id>', 'App ID')
    .requiredOption('-k, --kb <kb_id>', 'Record collection ID')
    .requiredOption('-i, --ids <csv>', 'Comma-separated record ids to fetch')
    .option('--fields <csv>', 'Comma-separated metadata projection (omit or "*" for all metadata)')
    .action(async (options) => {
      try {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);
        const ids = options.ids.split(',').map(s => s.trim()).filter(Boolean);
        const fields = options.fields ? options.fields.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        const params = { app_id: options.app, kb_id: options.kb, ids };
        if (fields) params.fields = fields;
        const response = await apiClient.invoke(`${cmdPrefix}_get`, params);
        const result = response.message || response;
        console.log(chalk.gray(`\n${result.message || ''}`));
        console.log(JSON.stringify(result.records || [], null, 2));
        console.log();
      } catch (error) {
        console.error(chalk.red(`\n❌ ${error.message}\n`));
        process.exit(1);
      }
    });

  parent
    .command('delete')
    .description('Delete records by id (or by file_id grouping key)')
    .requiredOption('-a, --app <app_id>', 'App ID')
    .requiredOption('-k, --kb <kb_id>', 'Record collection ID')
    .option('-i, --ids <csv>', 'Comma-separated record ids to delete')
    .option('--file-ids <csv>', 'Comma-separated file_id grouping keys to delete')
    .action(async (options) => {
      try {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);
        const ids = options.ids ? options.ids.split(',').map(s => s.trim()).filter(Boolean) : [];
        const file_ids = options.fileIds ? options.fileIds.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (ids.length === 0 && file_ids.length === 0) throw new Error('Provide --ids and/or --file-ids');
        const response = await apiClient.invoke(`${cmdPrefix}_delete`, { app_id: options.app, kb_id: options.kb, ids, file_ids });
        const result = response.message || response;
        console.log(chalk.green(`\n✓ ${result.message || 'records deleted'}\n`));
      } catch (error) {
        console.error(chalk.red(`\n❌ ${error.message}\n`));
        process.exit(1);
      }
    });
}

// Canonical: `descix app records ...`
const appRecordsCommand = appCommand
  .command('records')
  .description('Use your app as a queryable database (put/query/get/delete structured records with custom metadata). Backed by the app data plane (Firestore), not the Pinecone KB.');
attachRecordsSubcommands(appRecordsCommand, 'app_records');


// Corpus sub-commands (git-aware RAG sync via manifests)
const corpusCommand = kbCommand
  .command('corpus')
  .description('Git-aware corpus sync via manifests');

corpusCommand
  .command('sync')
  .description('Sync corpus files to Pinecone using manifest definitions')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('-c, --community <community_id>', 'Community ID (optional; resolved from Products when omitted)')
  .option('-k, --kb <name>', 'KB name (syncs specific manifest; default: all)')
  .option('-v, --verbose', 'Show verbose output')
  .option('--ref <ref>', 'Override the git ref for ALL manifest sources (e.g., --ref ws-admin-b1). Precedence: --ref > manifest source.ref > "main".')
  .option('--rebuild', 'Reconcile Pinecone against REMOTE state: enumerate remote file_ids, purge any not in the current corpus, then re-sync from scratch. NOT needed to remove deleted files — an ordinary sync already purges them, diffing the walk against sync-state\'s last_sync_commit (measured: a plain sync purged 1962 chunks across 124 stale blob SHAs). Use --rebuild ONLY when that local sync-state cannot be trusted: it is lost, hand-edited, or vectors were orphaned outside the history it tracks. Prompts before deleting unless --yes is supplied.')
  .option('--dry-run', 'Enumerate would-be-purged file_ids and would-be-upserted chunks without ANY Pinecone writes. Exit 0 if no drift, 1 if drift. Read-only.')
  .option('--show-walk', 'Print the resolved ref + the first 50 walked files BEFORE any Pinecone operations. Useful for verifying --ref / manifest source resolution.')
  .option('--yes', 'Skip the interactive purge confirmation in --rebuild mode. Use in scripting/CI.')
  .option('--skip-retrieval-canary', 'Skip the post-sync retrieval canary that confirms a synced chunk actually retrieves before reporting success (measured 2026-09-17: presence in Pinecone is not the same as searchable — the index can lag ~20 minutes after a large upsert/purge). Skipping costs nothing but SAVES one credit-metered query_knowledge_base call and up to ~25s; the sync then reports success on presence only, same as before this check existed. Prefer leaving this ON for anything user-facing; use it for CI/cost-sensitive automation that will verify separately.')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const result = await corpusCommands.runCorpusSync(apiClient, options);
      // Dry-run exit code per Deliverable A: 0 if no drift, 1 if drift would be applied.
      if (result && result.dryRun) {
        process.exit(result.drift ? 1 : 0);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

corpusCommand
  .command('status')
  .description('Show corpus sync state (files, chunks, last sync, resolved ref)')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('-k, --kb <name>', 'KB name (default: all)')
  .option('--ref <ref>', 'Preview status as if --ref were applied to a sync (does not change manifests)')
  .option('-v, --verbose', 'Show verbose output including change detection')
  .action(async (options) => {
    try {
      let apiClient = null;
      try {
        apiClient = new DeSciXApiClient();
        await apiClient.loadCredentials();
      } catch {
        // Status can work offline
      }

      await corpusCommands.runCorpusStatus(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ KB Doctor (M3, 2026-04-20) ============
// Compare the live corpus files against the last sync's walk (orphans / missing) and scan recent
// sync logs for per-file 0-chunk warnings. Exits 1 on orphans or missing files.
kbCommand
  .command('doctor')
  .description('Check a KB against its last sync by FILE IDENTITY: live corpus files that were not walked (orphans) and walked files that are not live (missing)')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-k, --kb <name>', 'KB name')
  .option('--live', 'Compute vectorCount from the TRUE live Pinecone scope (bypass the cached counter, which lies after an interrupted op)')
  .option('--reconcile', 'Compute the live count AND write it back to rag_vector_count so the cached read is truthful again (implies --live)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      await kbCommands.runKbDoctor(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Drive Commands ============

const driveCommand = program
  .command('drive')
  .description('Drive content authoring: pull from Drive, push staging to Drive');

driveCommand
  .command('pull')
  .description('Pull content from Drive and convert to local markdown')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('--folder <id_or_url>', 'Override Drive folder (raw ID or full Drive URL) — one-time import without modifying workspace.json')
  .option('-v, --verbose', 'Show verbose output')
  .option('--merge-mode <mode>', 'Merge mode: merge|overwrite|force-overwrite (default: merge)')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(async (options) => {
    try {
      let apiClient = null;
      try {
        apiClient = new DeSciXApiClient();
        await apiClient.loadCredentials();
      } catch {
        // Continue without API client
      }

      await kbCommands.runKbPull(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

driveCommand
  .command('push')
  .description('Push staging files to Drive')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('-v, --verbose', 'Show verbose output')
  .option('-i, --interactive', 'Enable interactive prompts for conflicts')
  .option('--on-conflict <action>', 'Conflict handling: overwrite|skip (default: overwrite)')
  .option('--no-move', 'Do not move files to .processed after upload')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(async (options) => {
    try {
      let apiClient = null;
      try {
        apiClient = new DeSciXApiClient();
        await apiClient.loadCredentials();
      } catch {
        // Continue without API client
      }

      await kbCommands.runKbPush(apiClient, {
        ...options,
        moveToProcessed: options.move !== false
      });
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Site Commands ============

const siteCommand = program
  .command('site')
  .description('Site lifecycle management: init, upload, status, list, delete');

// site init - Copy scaffold to app
siteCommand
  .command('init')
  .description('Initialize site scaffold in current app')
  .option('-f, --force', 'Overwrite existing site/ folder')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .action(async (options) => {
    try {
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      if (!ctx.communityId || !ctx.appId) {
        console.error(chalk.red('\n❌ No app context found.'));
        console.log(chalk.gray('  cd into an app directory, or use -c and -a flags\n'));
        process.exit(1);
      }
      
      const appConfig = workspaceConfig.getAppByAppId(ctx.appId);
      if (!appConfig) {
        console.error(chalk.red(`\n❌ ${unmappedAppMessage(ctx.appId)}\n`));
        process.exit(1);
      }

      const appPath = appConfig.absolutePath ||
        path.join(workspaceConfig.getWorkspaceRoot(), appConfig.localPath);

      console.log(chalk.cyan('\n📁 Adding site scaffold...\n'));
      
      const { copyScaffold } = await import('../lib/core/Hydrator.js');
      const stats = await copyScaffold('site', appPath, {
        verbose: true,
        force: options.force,
        substitute: { appId: ctx.appId, communityId: ctx.communityId }
      });
      
      console.log(chalk.green(`\n✅ Site scaffold added (${stats.copied} files)\n`));
      console.log(chalk.gray('  Next steps:'));
      console.log(chalk.gray('  - Edit site/index.html for your content'));
      console.log(chalk.gray('  - Run descix site upload to deploy\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// site upload - Deploy to GCS (context-aware, manifest-aware)
siteCommand
  .command('upload')
  .description('Upload site to GCS and update app metadata (uses .descix/manifests/site.json when present)')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('-p, --path <localPath>', 'Local directory to deploy (ignored when site manifest exists)', './site')
  .option('--preview', 'Deploy to preview path')
  .option('--dry-run', 'Show what would be uploaded and which server files would be removed')
  .option('--no-cache', 'Set Cache-Control: no-cache')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();

      // WS-DEPLOY-HARDENING item 7: `site upload` must never target a local backend by
      // inheritance. detectApiUrl() checks process.env.DESCIX_API_URL first, then
      // WorkspaceConfig.getApiUrl() (env.apiUrl, else the shipped PROD default), then
      // GlobalConfig. `--env` and `--api-url` are folded into DESCIX_API_URL by the
      // preAction hook BEFORE this action runs — so checking DESCIX_API_URL here reflects
      // whether THIS invocation named its target. A workspace pinned at a local backend
      // (env.apiUrl = https://localhost:4000) is a standing setting, not a deploy target:
      // site deploys go to a cloud env, so that combination is a hard failure.
      const resolvedApiUrl = await apiClient.ensureBaseUrl();
      const isLocalApiUrl = /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(?::\d+)?/i.test(resolvedApiUrl) ||
        /:4000(?:\/|$)/.test(resolvedApiUrl);
      const explicitlyResolvedViaEnv = !!process.env.DESCIX_API_URL;
      if (isLocalApiUrl && !explicitlyResolvedViaEnv) {
        console.error(chalk.red(
          `\n❌ Refusing site upload against a local backend (${resolvedApiUrl}). ` +
          `Site deploys target a cloud env — pass --env=<dev|demo|prod> or export DESCIX_API_URL=https://<env>.descix.net\n`
        ));
        process.exit(1);
      }

      await requireAuth(apiClient);

      // Load workspace context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);

      let communityId = ctx.communityId;
      const appId = ctx.appId;

      if (!appId) {
        console.error(chalk.red('\n❌ App ID required.'));
        console.log(chalk.gray('  Either provide -a flag, or cd into an app directory\n'));
        process.exit(1);
      }

      // Resolve app root from workspace config
      const appConfig = workspaceConfig.getAppByAppId(appId);

      // Derive communityId from workspace config if not provided.
      // Fallback: for NFT apps, community_id === app_id (convention).
      // The backend will validate this via hydrateCommunityIdFromProducts.
      if (!communityId) {
        communityId = appConfig?.communityId || appId;
      }
      const appRoot = appConfig?.absolutePath || path.resolve('.');

      // Check for site manifest (.descix/manifests/site.json)
      const { loadSiteManifest } = await import('../lib/core/ManifestLoader.js');
      const siteManifest = await loadSiteManifest(appRoot);

      // Import mime for content types
      const mime = (await import('mime-types')).default;
      const { GitUtils } = await import('@descix/sdk/integrations/git');
      // Provenance is read from the directory the FILES come from — the app root when a site
      // manifest names the sources, else the -p directory — never the caller's cwd. Reading cwd
      // recorded the WRONG repository's commit on every deploy made from outside the app repo
      // (measured 2026-09-18: daita-docs, whose files live in DeSciX/daita, was stamped with the
      // Unkamon commit it happened to be run from).
      const provenanceDir = siteManifest ? appRoot : path.resolve(options.path);
      const gitUtils = new GitUtils(provenanceDir);
      const gitStatus = await gitUtils.getStatus();

      let fileList;      // Array<{ path, hash, size, content_type }>
      let localFiles;    // Object for delta comparison { path: { hash, size } }
      let sourceLabel;   // For display

      if (siteManifest) {
        // ── Manifest-driven flow ──
        const { walkSite } = await import('../lib/core/SiteWalker.js');

        // Get env-specific build config from backend (GTM vars + base path)
        const buildConfigResult = await apiClient.invoke('get_site_build_config', {
          app_id: appId,
          community_id: communityId
        });
        // Canonical-contract ferry (engineering-culture mandate 2026-06-18): the server's
        // get_site_build_config owns the build-env schema — forward EVERY VITE_* key it
        // returns instead of hand-mirroring the field list (drift bug class; a hand mirror
        // silently dropped VITE_POWCH_FIRST_PARTY_ORIGINS, baking deny-by-default [] into
        // the Powch PWA and killing the first-party email ToS auto-grant).
        const buildEnvVars = Object.fromEntries(
          Object.entries(buildConfigResult.message || {}).filter(([k]) => k.startsWith('VITE_'))
        );
        console.log(chalk.cyan(`  Build env: base=${buildConfigResult.message.VITE_BASE_PATH}, gtm=${buildConfigResult.message.VITE_GTM_ID}\n`));

        // Run buildCommand if specified
        if (siteManifest.buildCommand) {
          if (options.dryRun) {
            console.log(chalk.yellow(`\n  Dry run - skipping build (${siteManifest.buildCommand})`));
            console.log(chalk.gray('  Build env vars that would be injected:'));
            Object.entries(buildEnvVars).forEach(([k, v]) => console.log(chalk.gray(`    ${k}=${v}`)));
          } else {
            console.log(chalk.cyan(`\n  Running build: ${siteManifest.buildCommand}\n`));
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            await execAsync(siteManifest.buildCommand, {
              cwd: appRoot,
              env: { ...process.env, ...buildEnvVars }
            });
            console.log(chalk.green('  Build completed.\n'));
          }
        }

        const walkResult = await walkSite(siteManifest, appRoot);
        sourceLabel = `manifest (${siteManifest._manifestPath})`;

        fileList = walkResult.files.map(f => ({
          path: f.deployPath,
          hash: f.hash,
          size: f.size,
          content_type: mime.lookup(f.deployPath) || 'application/octet-stream',
          _absolutePath: f.absolutePath  // kept for upload reads
        }));

        // Build localFiles object for delta comparison
        localFiles = {};
        for (const f of fileList) {
          localFiles[f.path] = { hash: f.hash, size: f.size };
        }
      } else {
        // ── Legacy flat-directory flow (unchanged) ──
        const localPath = path.resolve(options.path);
        sourceLabel = localPath;

        try {
          const stat = await fs.stat(localPath);
          if (!stat.isDirectory()) {
            throw new Error(`Path is not a directory: ${localPath}`);
          }
        } catch (err) {
          if (err.code === 'ENOENT') {
            throw new Error(`Directory not found: ${localPath}`);
          }
          throw err;
        }

        const rawFiles = await gitUtils.getFileHashes(localPath);
        localFiles = rawFiles;
        fileList = Object.entries(rawFiles).map(([filePath, info]) => ({
          path: filePath,
          hash: info.hash,
          size: info.size,
          content_type: mime.lookup(filePath) || 'application/octet-stream',
          _absolutePath: path.join(localPath, filePath)
        }));
      }

      console.log(chalk.cyan(`\n  Site Upload: ${appId} → GCS\n`));
      console.log(chalk.gray(`  Source: ${sourceLabel}`));
      console.log(chalk.gray(`  Target: ${communityId}/${appId}`));
      if (options.preview) console.log(chalk.yellow(`  Mode: PREVIEW`));
      if (gitStatus.isGitRepo) {
        console.log(chalk.gray(`  Git: ${gitStatus.branch} @ ${gitStatus.shortHash}`));
      }

      console.log(chalk.gray(`\n  Found ${fileList.length} files\n`));

      if (fileList.length === 0) {
        console.log(chalk.yellow('  No files found. Nothing to deploy.\n'));
        return;
      }

      // 1b. Refuse to publish backend source, an agent's persona, credentials or workspace
      // state — BEFORE any token is requested, so a dry run refuses too (SiteDenyLint).
      const { assertSitePublishable } = await import('../lib/core/SiteDenyLint.js');
      assertSitePublishable(fileList.map((f) => f.path));

      // 2. Request deploy token with file list
      const tokenResponse = await apiClient.invoke('get_site_deploy_token', {
        community_id: communityId,
        app_id: appId,
        files: fileList.map(f => ({ path: f.path, hash: f.hash, size: f.size, content_type: f.content_type })),
        preview: options.preview || false
      });

      const { signed_urls, upload_headers, existing_manifest, token_id, site_url } = tokenResponse.message;

      // 3. A deploy REPLACES the site: every file of this build is uploaded, and on confirm the
      // server deletes every site file this build does not contain (confirm_site_deploy).
      const filesToUpload = fileList;

      if (options.dryRun) {
        console.log(chalk.yellow('\n  Dry run - would upload:'));
        filesToUpload.forEach(f => console.log(chalk.gray(`  + ${f.path} (${(f.size / 1024).toFixed(1)}KB)`)));
        // The server's last deploy manifest names what it holds; the confirm step lists the
        // storage prefix itself, so this preview is the manifest's view of what would go.
        const lastDeployed = Object.keys(existing_manifest?.files || {});
        const wouldRemove = lastDeployed.filter(p => !(p in localFiles)).sort();
        if (wouldRemove.length > 0) {
          console.log(chalk.yellow('\n  Would remove from the server (in the last deploy, not in this build):'));
          wouldRemove.forEach(f => console.log(chalk.gray(`  - ${f}`)));
        }
        console.log(chalk.gray(`\n  Site URL: ${site_url}\n`));
        return;
      }

      // 4. Upload files directly to GCS using signed URLs
      console.log(chalk.gray(`\n  Uploading ${filesToUpload.length} files...`));

      let uploadedCount = 0;
      let uploadErrors = [];

      for (const file of filesToUpload) {
        const signedUrl = signed_urls[file.path];
        if (!signedUrl) {
          uploadErrors.push(`No signed URL for: ${file.path}`);
          continue;
        }

        try {
          const content = await fs.readFile(file._absolutePath);

          // Canonical contract (WS-DEPLOY-HARDENING item 4): the server binds Cache-Control
          // into the v4 signed URL signature (generateSiteUploadUrls/siteAssetCacheControl).
          // Ferry the exact header bag the server minted — never re-derive the policy
          // client-side. A mismatched header (including a client-side --no-cache override)
          // makes GCS return 403 signature-mismatch, so once the server ferries a bound
          // header for this path, --no-cache is a no-op for it (falls back to legacy
          // Content-Type-only behavior for paths the server didn't ferry a header for).
          const ferriedHeaders = upload_headers && upload_headers[file.path];
          const headers = ferriedHeaders || {
            'Content-Type': file.content_type,
            ...(options.noCache ? { 'Cache-Control': 'no-cache' } : {})
          };

          const response = await fetch(signedUrl, {
            method: 'PUT',
            headers,
            body: content
          });

          if (!response.ok) {
            uploadErrors.push(`Failed to upload ${file.path}: ${response.status} ${response.statusText}`);
            console.log(chalk.red(`  x ${file.path}`));
          } else {
            uploadedCount++;
            console.log(chalk.green(`  + ${file.path}`));
          }
        } catch (err) {
          uploadErrors.push(`Error uploading ${file.path}: ${err.message}`);
          console.log(chalk.red(`  x ${file.path}`));
        }
      }

      if (uploadErrors.length > 0) {
        uploadErrors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        throw new Error(`${uploadErrors.length} of ${filesToUpload.length} files failed to upload. The deploy was not confirmed and nothing was removed from the server.`);
      }

      // 5. Confirm deployment (ALWAYS call this to ensure DB is updated)
      const confirmResponse = await apiClient.invoke('confirm_site_deploy', {
        community_id: communityId,
        app_id: appId,
        token_id: token_id,
        manifest: {
          version: '1.0',
          app_id: appId,
          community_id: communityId,
          files: localFiles,
          source_path: siteManifest ? 'manifest' : options.path
        },
        git_info: gitStatus.isGitRepo ? {
          commit: gitStatus.shortHash,
          branch: gitStatus.branch
        } : null,
        preview: options.preview || false
      });

      const result = confirmResponse.message;

      console.log(chalk.green(`\n  Site uploaded successfully!\n`));
      console.log(chalk.cyan(`  URL: ${result.site_url}`));
      console.log(chalk.gray(`  Files: ${result.files_count}`));
      const pruned = Array.isArray(result.pruned_files) ? result.pruned_files : null;
      if (pruned === null) {
        throw new Error('confirm_site_deploy returned no pruned_files list: this server does not replace the site on deploy, so files from earlier builds may still be served.');
      }
      console.log(chalk.gray(`  Removed from the server: ${pruned.length}`));
      pruned.forEach(f => console.log(chalk.gray(`    - ${f}`)));
      console.log(chalk.gray(`  Deployed: ${result.deployed_at}`));
      if (result.preview) {
        console.log(chalk.yellow(`  Mode: PREVIEW`));
      }

      if (!options.preview) {
        console.log(chalk.gray(`\n  For local development, run:`));
        console.log(chalk.cyan(`    descix serve --app ${appId}\n`));
      }
      console.log('');

    } catch (error) {
      console.error(chalk.red(`\n  Upload failed: ${error.message}\n`));
      process.exit(1);
    }
  });


// site list - List deployed files (context-aware)
siteCommand
  .command('list')
  .description('List deployed site files')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('--preview', 'List preview site')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      const response = await apiClient.invoke('list_site_files', {
        community_id: communityId,
        app_id: appId,
        preview: options.preview || false
      });
      
      const result = response.message;
      
      console.log(chalk.cyan(`\n📂 Site Files: ${communityId}/${appId}${options.preview ? ' (preview)' : ''}\n`));
      console.log(chalk.gray(`  URL: ${result.site_url}`));
      console.log(chalk.gray(`  Files: ${result.files_count}\n`));
      
      if (result.files.length === 0) {
        console.log(chalk.gray('  No files deployed.\n'));
      } else {
        result.files.forEach(f => {
          const sizeKB = (f.size / 1024).toFixed(1);
          console.log(chalk.gray(`  ${f.path.padEnd(40)} ${sizeKB.padStart(8)}KB  ${f.contentType}`));
        });
        console.log('');
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// site status - Get deployment status (context-aware)
siteCommand
  .command('status')
  .description('Get deployment status and manifest')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('--preview', 'Check preview site')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      const response = await apiClient.invoke('get_site_manifest', {
        community_id: communityId,
        app_id: appId,
        preview: options.preview || false
      });
      
      const result = response.message;
      
      console.log(chalk.cyan(`\n📊 Site Status: ${communityId}/${appId}${options.preview ? ' (preview)' : ''}\n`));
      
      if (!result.exists) {
        console.log(chalk.yellow('  No site deployed.\n'));
        return;
      }
      
      const manifest = result.manifest;
      const deploy = manifest.deploy || {};
      
      console.log(chalk.gray(`  URL: ${result.site_url}`));
      console.log(chalk.gray(`  Deployed: ${deploy.deployed_at || 'unknown'}`));
      console.log(chalk.gray(`  By: ${deploy.deployed_by || 'unknown'}`));
      if (deploy.git_commit) {
        console.log(chalk.gray(`  Git: ${deploy.git_branch || 'unknown'} @ ${deploy.git_commit}`));
      }
      console.log(chalk.gray(`  Files: ${Object.keys(manifest.files || {}).length}`));
      console.log('');
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// site delete - Delete deployed site (context-aware)
siteCommand
  .command('delete')
  .description('Delete deployed site')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('--preview', 'Delete preview site only')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      if (!options.confirm) {
        const rl = createPromptSession({
          what: 'descix site delete',
          destructive: true,
          nonInteractiveForm: [`descix site delete -c ${communityId} -a ${appId} --confirm   # deletes the uploaded site files`]
        });

        const answer = await rl.askRaw(chalk.yellow(`\n⚠️  Delete site for ${communityId}/${appId}${options.preview ? ' (preview)' : ''}? (y/N) `));
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('\n  Cancelled.\n'));
          return;
        }
      }
      
      const response = await apiClient.invoke('delete_site_files', {
        community_id: communityId,
        app_id: appId,
        preview: options.preview || false
      });
      
      const result = response.message;
      
      if (result.success) {
        console.log(chalk.green(`\n✅ Site deleted successfully!`));
        console.log(chalk.gray(`  Files removed: ${result.deleted_count}\n`));
      } else {
        console.log(chalk.yellow(`\n⚠️  Deletion completed with errors:`));
        result.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        console.log(chalk.gray(`  Files removed: ${result.deleted_count}\n`));
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Microservice Commands ============

const microserviceCommand = program
  .command('microservice')
  .description('Microservice lifecycle management');

// microservice init - Copy scaffold to app
microserviceCommand
  .command('init')
  .description('Initialize microservice scaffold in current app')
  .option('-f, --force', 'Overwrite existing microservice/ folder')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .action(async (options) => {
    try {
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      if (!ctx.communityId || !ctx.appId) {
        console.error(chalk.red('\n❌ No app context found.'));
        console.log(chalk.gray('  cd into an app directory, or use -c and -a flags\n'));
        process.exit(1);
      }
      
      const appConfig = workspaceConfig.getAppByAppId(ctx.appId);
      if (!appConfig) {
        console.error(chalk.red(`\n❌ ${unmappedAppMessage(ctx.appId)}\n`));
        process.exit(1);
      }

      const appPath = appConfig.absolutePath ||
        path.join(workspaceConfig.getWorkspaceRoot(), appConfig.localPath);

      // Resolve microservice port from workspace.json before scaffold copy.
      // Hard-fail early if missing — a scaffolded microservice without a known port
      // cannot be routed by the gateway and cannot start on a deterministic port.
      const env = workspaceConfig.env || {};
      let microservicePort = null;
      if (env.platform?.appId === ctx.appId) {
        microservicePort = env.platform?.microservice?.port || null;
      } else if (Array.isArray(env.products)) {
        const productEntry = env.products.find(p => p.appId === ctx.appId);
        microservicePort = productEntry?.microservice?.port || null;
      }

      if (!microservicePort) {
        console.error(chalk.red(`\n❌ App '${ctx.appId}' has no microservice.port in workspace.json.`));
        console.error(chalk.red(`   A port is required so the gateway knows where to route traffic.`));
        console.log(chalk.gray(`\n   Set it with the config verb (never hand-edit workspace.json):`));
        console.log(chalk.gray(`     descix app set-port -a ${ctx.appId} --port <your-port>\n`));
        process.exit(1);
      }

      console.log(chalk.cyan('\n📁 Adding microservice scaffold...\n'));

      const { copyScaffold } = await import('../lib/core/Hydrator.js');
      const stats = await copyScaffold('microservice', appPath, {
        verbose: true,
        force: options.force,
        substitute: { appId: ctx.appId, communityId: ctx.communityId }
      });

      // Configuration Injection
      const microserviceDir = path.join(appPath, 'microservice');
      const defaultsPath = path.join(microserviceDir, 'defaults-config.json');
      const manifestPath = path.join(microserviceDir, 'manifest.json');
      const overridesPath = path.join(microserviceDir, 'dev-overrides.json');

      // 1. Inject Port into defaults-config.json.
      // IDENTITY IS NOT SET HERE. copyScaffold resolves {{APP_ID}}/{{COMMUNITY_ID}} during the
      // copy, so re-deriving them here would be a second derivation of one fact. The port is a
      // workspace-derived RUNTIME value with no scaffold token, so it stays.
      try {
        const defaultsContent = await fs.readFile(defaultsPath, 'utf-8');
        const defaults = JSON.parse(defaultsContent);
        defaults.LOCAL_PORT = microservicePort;
        await fs.writeFile(defaultsPath, JSON.stringify(defaults, null, 2));
        console.log(chalk.gray(`  ✓ Injected port into defaults-config.json`));
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not update defaults-config.json: ${err.message}`));
      }

      // 1b. Claim the scaffold's package.json for THIS service.
      // The template ships as "@descix/service-starter" — a real package name that is not
      // this developer's. Left unclaimed, every scaffolded service on the machine reports the
      // same identity to npm and to anything reading package.name, and `npm install` in the
      // service resolves against a name the developer does not own.
      try {
        const pkgPath = path.join(microserviceDir, 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        pkg.name = ctx.appId;
        pkg.description = `${ctx.appId} microservice on the DeSciX mesh`;
        pkg.version = '0.1.0';
        await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(chalk.gray(`  ✓ Claimed package.json as '${ctx.appId}'`));
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not claim package.json: ${err.message}`));
      }

      // 2. Inject Port into manifest.json.
      // IDENTITY IS NOT SET HERE. copyScaffold resolved {{APP_ID}}/{{COMMUNITY_ID}} during the
      // copy, so setting app_id/community_id/name again would be a second derivation of one fact —
      // the exact mirror-drift shape that let a scaffold ship `community_id: 'descix'` while this
      // block quietly wrote the right value into a different file.
      // No domain is injected. A service does not declare its own domain — the platform derives
      // it ({app_id}.{SITE_DOMAIN}) at registration, and refuses a manifest that declares one.
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        manifest.service.debugPort = microservicePort;
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(chalk.gray(`  ✓ Injected port into manifest.json`));
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not update manifest.json: ${err.message}`));
      }

      // 3. Inject Credentials into dev-overrides.json
      try {
        const apiClient = new DeSciXApiClient();
        const credentials = await apiClient.loadCredentials();
        
        if (credentials) {
          const overrides = {
            CORE_API_URL: apiClient.baseUrl ? `${apiClient.baseUrl}/apifront` : undefined,
            OWNER_WALLET_ADDRESS: credentials.walletAddress,
            OWNER_SIGNATURE: credentials.signature,
            OWNER_USER_ID: credentials.userId
          };
          
          // Merge with existing overrides if any
          let existingOverrides = {};
          try {
            const content = await fs.readFile(overridesPath, 'utf-8');
            existingOverrides = JSON.parse(content);
          } catch {}
          
          await fs.writeFile(overridesPath, JSON.stringify({ ...existingOverrides, ...overrides }, null, 2));
          console.log(chalk.gray(`  ✓ Injected owner credentials into dev-overrides.json`));
        }
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not update dev-overrides.json: ${err.message}`));
      }
      
      console.log(chalk.green(`\n✅ Microservice scaffold added (${stats.copied} files)\n`));
      console.log(chalk.gray('  Next steps:'));
      console.log(chalk.gray('  - Edit manifest.json to define your commands'));
      console.log(chalk.gray('  - Implement handlers in services/commandHandlers/'));
      console.log(chalk.gray('  - Run descix microservice register to register with gateway\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });


// microservice register - Register with gateway
microserviceCommand
  .command('register')
  .description('Register microservice with gateway (-r <local SERVICE_README>; git-mode only — no Drive)')
  .option('-m, --manifest <path>', 'Path to manifest.json', './manifest.json')
  .option('-r, --readme <path>', 'Path to local SERVICE_README file')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('--skip-readme-check', 'Skip SERVICE_README check (not recommended)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Auto-detect context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      // Read manifest.json
      const manifestPath = path.resolve(options.manifest);
      
      let manifest;
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(chalk.red(`❌ manifest.json not found at ${manifestPath}`));
          console.error(chalk.gray('\nCreate a manifest.json with your service configuration.'));
          console.error(chalk.gray('Use descix microservice init to scaffold a template.\n'));
          process.exit(1);
        }
        throw new Error(`Failed to parse manifest.json: ${error.message}`);
      }
      
      // Validate required fields
      if (!manifest.service?.name) {
        throw new Error('manifest.service.name is required');
      }
      
      // Use detected context if manifest fields are missing
      if (!manifest.service?.app_id && ctx.appId) {
        if (!manifest.service) manifest.service = {};
        manifest.service.app_id = ctx.appId;
      }
      if (!manifest.service?.community_id && ctx.communityId) {
        if (!manifest.service) manifest.service = {};
        manifest.service.community_id = ctx.communityId;
      }

      if (!manifest.service?.app_id) {
        throw new Error('manifest.service.app_id is required (or use -a flag)');
      }
      if (!manifest.service?.community_id) {
        throw new Error('manifest.service.community_id is required (or use -c flag)');
      }
      
      const serviceName = manifest.service?.name;
      
      if (!serviceName) {
        throw new Error('manifest.service.name is required');
      }
      
      const appId = manifest.service?.app_id;
      const communityId = manifest.service?.community_id;
      const readmeFileName = `SERVICE_README_${serviceName}.md`;
      
      console.log(chalk.cyan(`\n📦 Registering microservice: ${serviceName}\n`));
      console.log(chalk.gray(`  Community: ${communityId}`));
      console.log(chalk.gray(`  App: ${appId}`));
      console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}\n`));
      
      // Option 1: Local README file provided via --readme
      if (options.readme) {
        const readmePath = path.resolve(options.readme);
        console.log(chalk.cyan(`📄 Reading local README: ${readmePath}\n`));
        
        let readmeContent;
        try {
          readmeContent = await fs.readFile(readmePath, 'utf-8');
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.error(chalk.red(`❌ README file not found: ${readmePath}`));
            process.exit(1);
          }
          throw new Error(`Failed to read README: ${error.message}`);
        }
        
        // Register with local README content for vectorization
        const response = await apiClient.invoke('register_service', { 
          manifest,
          readme_content: readmeContent
        });
        
        console.log(chalk.green('✅ Microservice registered successfully!\n'));
        console.log(chalk.cyan(`  Service: ${serviceName}`));
        console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}`));
        console.log(chalk.gray(`  README vectorized for tell_me_how discovery\n`));
        
      // Option 2: Explicit skip — register without README vectorization (git-mode only).
      // (Drive-folder README fallback removed per CEO-D-2026-06-01-MESH-AUTH-DRIVE-REMOVAL:
      //  git corpus sync is the only canonical KB sync; -r <local README> is the only
      //  README source. Nothing reads SERVICE_README from Drive anymore.)
      } else if (options.skipReadmeCheck) {
        console.log(chalk.yellow('⚠️  Skipping README check (tool discovery will be limited)\n'));
        
        const response = await apiClient.invoke('register_service', { manifest });
        
        console.log(chalk.green('✅ Microservice registered successfully!\n'));
        console.log(chalk.cyan(`  Service: ${serviceName}`));
        console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}`));
        console.log(chalk.yellow(`  ⚠️  No README - service won't appear in tell_me_how results\n`));
        
      // No -r and no --skip-readme-check: instruct the LOCAL README path (never Drive).
      } else {
        outputServiceReadmeInstructions(serviceName, appId, communityId, manifest);
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Registration failed: ${error.message}\n`));
      process.exit(1);
    }
  });

// microservice vectorize - Vectorize SERVICE_README (context-aware)
microserviceCommand
  .command('vectorize')
  .description('Vectorize SERVICE_README for tell_me_how discovery')
  .option('-n, --name <name>', 'Service name (reads from manifest.json if not provided)')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('-r, --readme <path>', 'Path to SERVICE_README file')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Auto-detect context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      let communityId = ctx.communityId;
      let appId = ctx.appId;
      let serviceName = options.name;
      
      // Try to read from manifest.json if not provided
      if (!serviceName || !communityId || !appId) {
        try {
          // Try to find manifest.json in current or parent directories
          let manifestPath = './manifest.json';
          
          // Check current directory first
          try {
            await fs.access(manifestPath);
          } catch {
            // If not in current directory, try to find the microservice path for detected context
            if (ctx.appId && workspaceConfig.workspaceRoot) {
              const appConfig = workspaceConfig.getAppByAppId(ctx.appId);
              if (appConfig) {
                const microservicePath = path.join(
                  workspaceConfig.workspaceRoot, 
                  appConfig.localPath, 
                  'microservice'
                );
                manifestPath = path.join(microservicePath, 'manifest.json');
              }
            }
          }
          
          // console.log(chalk.gray(`  Reading manifest from: ${manifestPath}`));
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          if (!serviceName) serviceName = manifest.service?.name;
          if (!communityId) communityId = manifest.service?.community_id || ctx.communityId;
          if (!appId) appId = manifest.service?.app_id || ctx.appId;
        } catch (e) {
          // console.log(chalk.gray(`  Manifest not found or invalid: ${e.message}`));
          // manifest.json not found, use detected context
          if (!communityId) communityId = ctx.communityId;
          if (!appId) appId = ctx.appId;
        }
      }
      
      if (!serviceName) {
        console.error(chalk.red('\n❌ Service name required.'));
        console.log(chalk.gray('  Provide -n flag or ensure manifest.json exists in current directory.\n'));
        process.exit(1);
      }
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory.\n'));
        process.exit(1);
      }
      
      // Find README file
      let readmePath = options.readme;
      if (!readmePath) {
        // Try common locations
        const possiblePaths = [
          `./SERVICE_README_${serviceName}.md`,
          `./microservice/SERVICE_README_${serviceName}.md`,
          `./SERVICE_README.md`
        ];
        for (const p of possiblePaths) {
          try {
            await fs.access(p);
            readmePath = p;
            break;
          } catch {
            // Try next
          }
        }
      }
      
      if (!readmePath) {
        console.error(chalk.red(`\n❌ README file not found.`));
        console.log(chalk.gray(`  Expected: SERVICE_README_${serviceName}.md`));
        console.log(chalk.gray(`  Provide path with -r flag.\n`));
        process.exit(1);
      }
      
      readmePath = path.resolve(readmePath);
      console.log(chalk.cyan(`\n📄 Vectorizing README for service: ${serviceName}\n`));
      console.log(chalk.gray(`  Community: ${communityId}`));
      console.log(chalk.gray(`  App: ${appId}`));
      console.log(chalk.gray(`  README: ${readmePath}\n`));
      
      let readmeContent;
      try {
        readmeContent = await fs.readFile(readmePath, 'utf-8');
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(chalk.red(`❌ README file not found: ${readmePath}`));
          process.exit(1);
        }
        throw new Error(`Failed to read README: ${error.message}`);
      }
      
      const response = await apiClient.invoke('vectorize_service_readme', {
        service_name: serviceName,
        community_id: communityId,
        app_id: appId,
        readme_content: readmeContent
      });
      
      // Handle wrapped response
      const result = response.message || response;
      
      const isSuccess = result.status === 'OK' || 
                       (typeof result === 'string' && result.includes('vectorized')) ||
                       (result.message && result.message.includes('vectorized')) ||
                       result.chunks_created !== undefined;
      
      if (isSuccess) {
        let chunksCreated = result.chunks_created;
        if (!chunksCreated) {
          const msgStr = typeof result === 'string' ? result : result.message;
          const match = msgStr?.match(/(\d+) chunks/);
          if (match) chunksCreated = match[1];
        }
        
        console.log(chalk.green('✅ README vectorized successfully!\n'));
        console.log(chalk.gray(`  Chunks created: ${chunksCreated || 'unknown'}`));
        console.log(chalk.gray(`  Service will now appear in tell_me_how results\n`));
      } else {
        const errorMsg = result.message || result.error || JSON.stringify(result);
        console.error(chalk.red(`❌ Vectorization failed: ${errorMsg}\n`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Vectorization failed: ${error.message}\n`));
      process.exit(1);
    }
  });

// microservice list - List registered services
microserviceCommand
  .command('list')
  .description('List all registered microservices')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      // list_services is public, no auth required
      
      const response = await apiClient.invoke('list_services', {}, { allowGuest: true });
      const services = response.message?.services || response.services || [];
      
      console.log(chalk.green(`\n✅ Found ${services.length} registered microservices\n`));
      
      if (services.length === 0) {
        console.log(chalk.gray('  No microservices registered yet.\n'));
        return;
      }
      
      console.log(chalk.cyan('Microservices:'));
      services.forEach((s, idx) => {
        console.log(chalk.yellow(`  ${idx + 1}. ${s.name} (v${s.version || '?'})`));
        console.log(chalk.gray(`     Domain: ${s.domain}`));
        console.log(chalk.gray(`     Commands: ${s.commandCount || 0}`));
        console.log(chalk.gray(`     Status: ${s.status || 'unknown'}`));
        console.log();
      });
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// microservice health - Check service health
microserviceCommand
  .command('health <name>')
  .description('Check health of a registered microservice')
  .action(async (serviceName) => {
    try {
      const apiClient = new DeSciXApiClient();
      
      const response = await apiClient.invoke('service_health_check', { service_name: serviceName }, { allowGuest: true });
      const result = response.message || response;
      
      if (result.healthy) {
        console.log(chalk.green(`\n✅ Microservice '${serviceName}' is healthy\n`));
        console.log(chalk.gray(`  Status: ${result.statusCode}`));
        if (result.healthData) {
          console.log(chalk.gray(`  Data: ${JSON.stringify(result.healthData)}`));
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  Microservice '${serviceName}' is unhealthy\n`));
        console.log(chalk.gray(`  Error: ${result.error || 'Unknown'}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// microservice reload - Reload manifests (admin)
microserviceCommand
  .command('reload')
  .description('Reload microservice manifests')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      console.log(chalk.cyan('\n🔄 Reloading microservice manifests...\n'));
      
      const response = await apiClient.invoke('reload_service_manifests', {});
      const result = response.message || response;
      
      console.log(chalk.green(`✅ ${result}\n`));
      
      if (response.services) {
        console.log(chalk.gray(`  Services: ${response.services.join(', ')}\n`));
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// microservice register-delegate - Register delegate key
microserviceCommand
  .command('register-delegate')
  .description('Provision the service delegate key (SERVICE_KEY) that authenticates mesh/loopback calls — run this if your service gets HTTP 401 calling /apifront or another service')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('-s, --slot <id>', 'Service slot ID (uses first available if not provided)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Auto-detect context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      let communityId = ctx.communityId;
      let appId = ctx.appId;
      
      // Try manifest.json if not detected
      if (!communityId || !appId) {
        try {
          const manifestContent = await fs.readFile('./manifest.json', 'utf-8');
          const manifest = JSON.parse(manifestContent);
          if (!communityId) communityId = manifest.service?.community_id;
          if (!appId) appId = manifest.service?.app_id;
        } catch {
          // Not found
        }
      }
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, cd into an app directory, or have manifest.json present.\n'));
        process.exit(1);
      }
      
      console.log(chalk.cyan('\n🔑 Registering Service Delegate Key\n'));
      
      // Fetch entitlements
      const entitlementsResponse = await apiClient.invoke('fetch_my_purchases', {});
      const entitlements = entitlementsResponse.message || {};
      const allSlots = entitlements.service_slots || [];

      // Service slots come ONLY from subscriptions right now. NFT-based slots are FUTURE
      // functionality (app/NFT association is not wired yet) — never select them here.
      // CEO-D-2026-06-01-MESH-AUTH-DRIVE-REMOVAL (Fix C).
      const serviceSlots = allSlots.filter(slot => slot.type === 'subscription');

      if (serviceSlots.length === 0) {
        console.error(chalk.red('❌ No subscription service slot available.'));
        console.log(chalk.white('   Service slots are provided by a subscription. A subscription is required to'));
        console.log(chalk.white('   provision a delegate. (NFT-based slots are future functionality and are'));
        console.log(chalk.white('   not selectable yet.)'));
        process.exit(1);
      }

      // Select slot (subscription slots only)
      let selectedSlot = serviceSlots[0];
      if (options.slot) {
        selectedSlot = serviceSlots.find(s => (s.id || s.nft_id) === options.slot);
        if (!selectedSlot) {
          console.error(chalk.red(`❌ Subscription slot ${options.slot} not found in your entitlements.`));
          console.log(chalk.gray('   Only subscription slots are selectable. Run without -s to use the first available.'));
          process.exit(1);
        }
      }
      
      console.log(chalk.gray(`  Selected slot: ${selectedSlot.name} (${selectedSlot.type})\n`));
      
      // Generate key pair
      const crypto = await import('crypto');
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      console.log(chalk.gray('  Generating key pair...'));
      
      // Register with Virtual Registry
      const registerResponse = await apiClient.invoke('register_delegate', {
        slot_id: selectedSlot.nft_id || selectedSlot.id,
        slot_type: selectedSlot.type,
        public_key: publicKey,
        app_id: appId,
        community_id: communityId
      });
      
      console.log(chalk.green('  ✓ Delegate registered with Core\n'));
      
      // Save to dev-overrides.json
      const overridesPath = path.resolve(process.cwd(), 'dev-overrides.json');
      let overrides = {};
      
      try {
        const content = await fs.readFile(overridesPath, 'utf-8');
        overrides = JSON.parse(content);
      } catch (e) {
        // File doesn't exist, start fresh
      }
      
      overrides.SERVICE_KEY = {
        privateKey,
        publicKey,
        slotId: selectedSlot.nft_id || selectedSlot.id,
        slotType: selectedSlot.type,
        appId: appId,
        communityId: communityId,
        createdAt: new Date().toISOString()
      };
      
      await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2));
      console.log(chalk.green(`✅ Key saved to dev-overrides.json\n`));
      console.log(chalk.gray(`  Path: ${overridesPath}\n`));
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// microservice restart - Kill + relaunch a local microservice (DEV only)
microserviceCommand
  .command('restart <name>')
  .description('Restart a local microservice (DEV only; DEMO/PROD use deploy scripts)')
  .option('--env <env>', 'Target environment: dev | demo | prod', 'dev')
  .action(async (name, options) => {
    try {
      const { restartMicroservice } = await import('../lib/commands/microservice-restart.js');
      const { runHealth } = await import('../lib/commands/health.js');
      await restartMicroservice({
        name,
        env: options.env,
        deps: { runHealth }
      });
      console.log();
    } catch (error) {
      console.error(chalk.red(`\n${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Role Commands ============

const roleCommand = program
  .command('role')
  .description('Role management operations');

roleCommand
  .command('create')
  .description('Create a new role')
  .requiredOption('--scope <scope>', 'Scope: PLATFORM, COMMUNITY, or APP')
  .requiredOption('--scope-id <id>', 'Scope ID (community_id or app_id)')
  .requiredOption('--role-id <id>', 'Role ID (e.g., "member", "admin")')
  .requiredOption('--name <name>', 'Role display name')
  .option('--description <text>', 'Role description')
  .option('--price-usdsci <amount>', 'Price in USDCX (default: 0 = free)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const price = options.priceUsdsci ? parseFloat(options.priceUsdsci) : 0;
      if (isNaN(price) || price < 0) {
        throw new Error('Price must be a non-negative number');
      }
      
      const response = await apiClient.invoke('create_role', {
        scope: options.scope,
        scope_id: options.scopeId,
        role_id: options.roleId,
        role_name: options.name,
        role_description: options.description || '',
        price_usdsci: price
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Role created successfully!\n'));
      console.log(chalk.cyan(`  Role ID: ${options.roleId}`));
      console.log(chalk.gray(`  Scope: ${options.scope}/${options.scopeId}`));
      console.log(chalk.gray(`  Price: ${price} USDCX\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ Incentives Commands ============

const referralCommand = program
  .command('referral')
  .description('Referral and incentive operations');

referralCommand
  .command('create')
  .description('Generate a referral code for a community/app')
  .requiredOption('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID (optional)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('generate_referral_code', {
        community_id: options.community,
        app_id: options.app || null
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Referral code generated!\n'));
      console.log(chalk.cyan(`  Code: ${result.referral_code || result.code}`));
      console.log(chalk.gray(`  Community: ${options.community}`));
      if (options.app) {
        console.log(chalk.gray(`  App: ${options.app}`));
      }
      console.log(chalk.gray(`\n  Share this code to earn REF points!\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Get user stats (REP/REF/DIP) for a community')
  .requiredOption('-c, --community <id>', 'Community ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('get_user_community_stats', {
        community_id: options.community
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ User Stats\n'));
      console.log(chalk.cyan(`  Community: ${options.community}`));
      console.log(chalk.gray(`  REP: ${result.rep || 0}`));
      console.log(chalk.gray(`  REF: ${result.ref || 0}`));
      console.log(chalk.gray(`  DIP: ${result.dip || 0}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });


// ============ Chat Commands ============

program
  .command('chat [question...]')
  .description('Chat with an app agent. Usage: descix chat "Your question" or descix chat -q "Your question"')
  .option('-c, --community <id>', 'Community ID (optional; server resolves it from Products)')
  .option('-a, --app <id>', 'App ID (required unless run from inside a mapped app directory)')
  .option('-q, --question <text>', 'Question to ask (alternative to positional argument)')
  .option('-k, --kb <id...>', 'Knowledge Base ID(s) — repeat for multi-KB, use * for all')
  .option('--apps <ids>', 'Comma-separated app IDs for cross-app query')
  .option('--level <n>', 'Intelligence level (1-5)', parseInt)
  .option('--model <name>', 'Explicit model override')
  .option('--thinking <budget>', 'Thinking token budget (-1=dynamic, 0=off, N=fixed)', parseInt)
  .option('--tokens', 'Show token usage in response footer')
  .option('--new', 'Start a new conversation (clear session)')
  .action(async (questionArgs, options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      // Get question from positional args or -q option
      const question = options.question || (questionArgs && questionArgs.join(' '));
      if (!question) {
        console.error(chalk.red('Error: Question required. Usage: descix chat "Your question" or descix chat -q "Your question"'));
        process.exit(1);
      }

      // Multi-app mode: --apps daita,unk-beast
      if (options.apps) {
        const appIds = options.apps.split(',').map(s => s.trim());
        const apps = appIds.map(id => {
          const kbNames = options.kb && !options.kb.includes('General') ? options.kb : undefined;
          return kbNames ? { app_id: id, knowledgebase_names: kbNames } : { app_id: id };
        });

        console.log(chalk.gray(`Asking ${appIds.join(', ')}...`));

        const response = await apiClient.invoke('ask_multiple_apps', {
          apps,
          user_input: question,
          intelligence_level: options.level,
          model: options.model,
          thinking_budget: options.thinking,
          streaming: false
        });
        const result = response.message || response;

        console.log(chalk.green('\n\u2705 Response:\n'));
        console.log(chalk.white(result.response || result.text || JSON.stringify(result, null, 2)));

        if (result.apps_queried) {
          console.log(chalk.cyan(`\nApps queried: ${result.apps_queried.join(', ')}`));
        }

        const sources = result.sources || [];
        if (sources.length > 0) {
          console.log(chalk.cyan('\n\ud83d\udcda Sources:'));
          sources.forEach((src, i) => {
            const fileName = src.fileName || src.file_path || src.source || src;
            const fileId = src.fileId || src.id || '';
            const score = src.score || src.similarity || 0;
            const scoreStr = score ? ` (score: ${score.toFixed(3)})` : '';
            const idStr = fileId ? ` [ID: ${fileId}]` : '';
            console.log(chalk.gray(`   ${i + 1}. ${fileName}${idStr}${scoreStr}`));
          });
        }

        // Token usage footer
        if (options.tokens && result.usage) {
          const u = result.usage;
          const thinkStr = u.thinking_tokens ? ` + ${u.thinking_tokens} thinking` : '';
          console.log(chalk.gray(`\n[${result.model_used || 'unknown'} | ${u.input_tokens} in + ${u.output_tokens} out${thinkStr} = ${u.total_tokens} tokens]`));
        }
        console.log('');
        return;
      }

      // Single-app mode.
      // WS-R7-PREREQS (CEO-D-2026-07-04-R7-PREREQS-RESCOPE ruling 3): the hardcoded
      // communityId||'descix' / appId||'agent' fallbacks are REMOVED. app_id must be
      // resolvable (flag or workspace context) — FAIL LOUD otherwise. community_id is
      // server-authoritative: the response carries the Products-resolved value and the
      // session file is keyed from it.
      let communityId = options.community || null;
      let appId = options.app || null;

      if (!communityId || !appId) {
        try {
          const wsConfig = await WorkspaceConfig.tryLoad();
          if (wsConfig) {
            const detected = wsConfig.detectContext();
            if (detected) {
              communityId = communityId || detected.communityId || null;
              appId = appId || detected.appId || null;
            }
          }
        } catch {
          // No workspace context — resolution below decides, no defaults
        }
      }

      if (!appId) {
        console.error(chalk.red(
          'Error: no app resolved. Pass -a/--app <app_id> or run from inside an app directory ' +
          'mapped in .descix/workspace.json. (The legacy hardcoded descix/agent fallback was ' +
          'removed — it silently mis-keyed sessions.)'
        ));
        process.exit(1);
      }

      // Session continuity: exact key when the community is known client-side; otherwise
      // the app's newest session file (app_id is globally unique) carries the thread.
      let previousInteractionId = null;
      if (!options.new) {
        if (communityId) {
          previousInteractionId = await getSessionInteractionId(communityId, appId);
        } else {
          const sessions = await findSessionsForApp(appId);
          if (sessions.length > 0) {
            previousInteractionId = await getSessionInteractionId(sessions[0].communityId, appId);
          }
        }
      } else {
        await clearAppSessions(communityId, appId);
      }

      // Resolve KB param — single or multi.
      //
      // ws-mcp-surface-basics — ONE NORMALIZATION OWNER. `descix chat` and the
      // ask_question_to_app MCP tool are not two backends: both invoke the SAME
      // ask_question_to_app command over /apifront/. The only thing that had diverged was the
      // CLIENT-SIDE default — the CLI substituted a hardcoded 'General' while MCP callers sent
      // nothing and let the server decide. That hardcoded fallback (anti-pattern #7) is why the
      // CLI reported "Default KB not found" against apps whose KBs are not named 'General': the
      // CLI asserted a KB the app never had. When the caller names no KB we now send NO kb param
      // and the server's resolver (pineconeService.resolveKbNameScope, fed by
      // utils.DEFAULT_KNOWLEDGEBASE_NAME) is the sole owner of what "default" means.
      const kbList = options.kb || null;
      const useMultiKb = !!kbList && (kbList.length > 1 || kbList.includes('*'));

      console.log(chalk.gray(`Asking ${communityId ? communityId + '/' : ''}${appId}...`));

      const invokeParams = {
        app_id: appId,
        user_input: question,
        previous_interaction_id: previousInteractionId,
        streaming: false,
        intelligence_level: options.level,
        model: options.model,
        thinking_budget: options.thinking,
      };

      if (useMultiKb) {
        invokeParams.knowledgebase_names = kbList;
      } else if (kbList) {
        invokeParams.knowledgebase_name = kbList[0];
      }

      // Stale-thread self-heal. Exactly ONE retry, and only for the typed 400 — see
      // isStaleThreadError and the asymmetry note above it. Anything else (including the 403
      // "this thread is not yours") propagates untouched to the catch below, which prints it
      // and exits non-zero.
      let response;
      let healedFromInteractionId = null;
      try {
        response = await apiClient.invoke('ask_question_to_app', invokeParams);
      } catch (error) {
        if (!isStaleThreadError(error, previousInteractionId)) throw error;

        healedFromInteractionId = previousInteractionId;
        await clearAppSessions(communityId, appId);

        // Single retry with no thread — byte-identical to what `--new` would have sent.
        // NO loop: if this one fails, its error propagates.
        previousInteractionId = null;
        invokeParams.previous_interaction_id = null;
        response = await apiClient.invoke('ask_question_to_app', invokeParams);
      }

      // Notice goes to STDERR, deliberately. stdout stays exactly the answer (and stays
      // valid JSON for any `--json`-style consumer), while a human at a terminal always sees
      // it and a `| jq` pipeline can never swallow it. The user must never be left believing
      // continuity survived when it did not.
      if (healedFromInteractionId) {
        console.error(chalk.yellow(
          `Note: the previous conversation thread for ${appId} was no longer available ` +
          `(expired or retired) — it has been discarded and a NEW thread was started. ` +
          `This answer does not carry any earlier context.`
        ));
      }

      const result = response.message || response;

      // Save new interaction_id for next message, keyed by the SERVER-resolved
      // community (authoritative — Products-hydrated). Client-resolved (-c flag /
      // workspace context) is only accepted when the server did not return one
      // (older backend); with NEITHER available this FAILS LOUD after printing the
      // response — the session must never be keyed under a guessed community.
      if (result.interaction_id) {
        const authoritativeCommunityId = result.community_id || communityId;
        if (!authoritativeCommunityId) {
          console.log(chalk.white(result.response || result.text || ''));
          console.error(chalk.red(
            '\nError: cannot key the chat session — the server did not return community_id ' +
            'and none was resolvable client-side. The response above was NOT session-saved. ' +
            'Pass -c/--community, or update the backend (ask_question_to_app must return the ' +
            'Products-resolved community_id per CEO-D-2026-07-04-R7-PREREQS-RESCOPE).'
          ));
          process.exit(1);
        }
        await saveSessionAuthoritative(authoritativeCommunityId, appId, result.interaction_id);
      }

      console.log(chalk.green('\n\u2705 Response:\n'));
      console.log(chalk.white(result.response || result.text || JSON.stringify(result, null, 2)));

      const sources = result.sources || response.sources || response.message?.sources || [];
      if (sources && sources.length > 0) {
        console.log(chalk.cyan('\n\ud83d\udcda Sources:'));
        sources.forEach((src, i) => {
          const fileName = src.fileName || src.file_path || src.source || src;
          const fileId = src.fileId || src.id || '';
          const score = src.score || src.similarity || 0;
          const scoreStr = score ? ` (score: ${score.toFixed(3)})` : '';
          const idStr = fileId ? ` [ID: ${fileId}]` : '';
          console.log(chalk.gray(`   ${i + 1}. ${fileName}${idStr}${scoreStr}`));
        });
      }

      // Token usage footer
      if (options.tokens && result.usage) {
        const u = result.usage;
        const thinkStr = u.thinking_tokens ? ` + ${u.thinking_tokens} thinking` : '';
        const levelStr = options.level ? `level ${options.level}` : `level ${result.usage?.intelligence_level || '2'}`;
        console.log(chalk.gray(`\n[${result.model_used || 'unknown'} | ${levelStr} | ${u.input_tokens} in + ${u.output_tokens} out${thinkStr} = ${u.total_tokens} tokens]`));
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('new-chat')
  .description('Clear chat session for an app (start fresh conversation)')
  .option('-c, --community <id>', 'Community ID (optional; clears only that community key)')
  .option('-a, --app <id>', 'App ID (required)')
  .action(async (options) => {
    try {
      // WS-R7-PREREQS: hardcoded descix/agent fallbacks REMOVED — an app id is required.
      const appId = options.app || null;
      if (!appId) {
        console.error(chalk.red('Error: -a/--app <app_id> is required (the legacy hardcoded descix/agent fallback was removed).'));
        process.exit(1);
      }
      const cleared = await clearAppSessions(options.community || null, appId);
      const scope = options.community ? `${options.community}/${appId}` : appId;
      console.log(chalk.green(`Chat session cleared for ${scope} (${cleared} session file(s)). Next chat will start fresh.`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ Purchases Command ============

program
  .command('purchases')
  .description('List your purchased communities and apps')
  .action(async () => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // APP entitlements: use the product_type:'APP' fast-path. The no-filter call
      // returns the STORE BUNDLE (which has no top-level `apps` key — apps are nested
      // under each community), so `result.apps` was always undefined → "Apps (0)" even
      // when the user holds entitlements. The fast-path returns the user's actual
      // purchased App objects (userManagement.js fetch_my_purchases APP branch).
      const appResp = await apiClient.invoke('fetch_my_purchases', { product_type: 'APP' });
      const appResult = appResp.message || appResp;
      const apps = appResult.apps || [];

      // COMMUNITY entitlements: the standard call exposes the user's owned community
      // IDs via `my_community_ids` (the top-level `communities` field is the store
      // catalog, not the user's overlay).
      const response = await apiClient.invoke('fetch_my_purchases', {});
      const result = response.message || response;
      const communityIds = result.my_community_ids || [];

      console.log(chalk.green('\n✅ Your Purchases:\n'));
      console.log(chalk.cyan(`Communities (${communityIds.length}):`));
      communityIds.forEach((cid, idx) => {
        console.log(chalk.yellow(`  ${idx + 1}. ${cid}`));
      });
      console.log();
      console.log(chalk.cyan(`Apps (${apps.length}):`));
      apps.forEach((a, idx) => {
        console.log(chalk.yellow(`  ${idx + 1}. ${a.app_name || a.app_id} (${a.community_id}/${a.app_id})`));
      });
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ Configuration Commands ============

const configCommand = program
  .command('config')
  .description('Manage CLI configuration');

configCommand
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      await configCommands.show();
    } catch (error) {
      fail(error);
    }
  });

// `config set-url` is RETIRED, and it is retired LOUDLY rather than deleted outright: a deleted
// subcommand only earns commander's "unknown command", which names no replacement. It used to
// assign a top-level `apiUrl` that save() never serialized, then print a success banner over a
// value that landed nowhere — the file was re-stamped and the origin never moved. Hidden from
// --help; any invocation exits non-zero naming the three surfaces that actually set the origin.
configCommand
  .command('set-url', { hidden: true })
  .description('retired — see error text')
  .argument('[url]')
  .allowUnknownOption()
  .action(() => {
    fail(new Error(
      '"descix config set-url" is retired: it never wrote the origin it reported (a retired top-level\n' +
      'key that nothing reads). Set the API origin where it is read, env.apiUrl, with one of:\n' +
      `  ${TOP_LEVEL_API_URL_REMEDY}`
    ));
  });

configCommand
  .command('init')
  .description('Pin this workspace to an environment (requires the global --env dev|demo|prod)')
  // `--dev` DELETED, not deprecated: its absence meant PRODUCTION, so the most common
  // invocation (`descix config init`) wrote a prod origin nobody named. There is no default.
  //
  // `--env` IS NOT REDECLARED HERE, and that is the fix, not an omission. It was declared both
  // globally (program.option, above) and on this subcommand; Commander 14 binds `--env dev` to
  // the ROOT program, so this action received `{}` and threw "requires an environment" — the
  // command REJECTED THE FLAG ITS OWN --help ADVERTISED. Measured on published 1.0.4, and worse
  // than a missing command: the CLI printed `descix config init --env dev` as the remedy for an
  // unconfigured origin (origin.js DEFAULT_ORIGIN_SOURCE) and that exact copy-pasted string
  // exited 1. Two declarations of one flag is the mirror-drift class; one owner is the cure.
  .option('--url <url>', 'Explicit origin (for a self-hosted or port-forwarded gateway)')
  .option('-g, --global', 'Save to global config (~/.descixrc)')
  .addHelpText('after', '\nEnvironment comes from the global flag:\n' +
    '  descix config init --env dev|demo|prod\n')
  .action(async (options) => {
    try {
      await configCommands.init(program.opts().env, options);
    } catch (error) {
      fail(error);
    }
  });

configCommand
  .command('set-env')
  .description('Set target environment persistently (updates workspace.json, auto-reconnects)')
  .argument('<env>', 'Environment: dev, demo, prod, or custom name')
  .option('-u, --url <url>', 'API URL override (for custom environments)')
  .action(async (env, options) => {
    try {
      await configCommands.setEnv(env, options);
    } catch (error) {
      fail(error);
    }
  });

configCommand
  .command('set-gateway-port')
  .description('Set the port `descix serve` listens on (env.gateway.port)')
  .argument('<port>', 'Port number 1-65535, or "none" to remove')
  .action(async (port) => {
    try {
      await configCommands.setGatewayPort(port === 'none' ? null : port);
    } catch (error) {
      fail(error);
    }
  });

configCommand
  .command('set-dev-certs')
  .description('Point local dev servers at your own TLS cert pair (env.devCerts) — the gateway AND every app behind it')
  .option('-d, --dir <path>', 'Directory holding cert.pem + key.pem')
  .option('-c, --cert <path>', 'Certificate file')
  .option('-k, --key <path>', 'Private key file')
  .option('--clear', 'Remove the setting and fall back to the SDK-tracked SAN pair')
  .action(async (options) => {
    try {
      await configCommands.setDevCerts(options);
    } catch (error) {
      fail(error);
    }
  });

configCommand
  .command('set-powch-url')
  .description('Set where Powch lives (env.powchUrl) — its OWN origin; Powch is cross-origin from the shell by design')
  .argument('<url>', 'Powch origin (e.g. https://powch.dev.descix.net), or "none" to remove')
  .action(async (url) => {
    try {
      await configCommands.setPowchUrl(url === 'none' ? null : url);
    } catch (error) {
      fail(error);
    }
  });

configCommand
  .command('set-site-url')
  .description('Set the App Shell origin `descix serve` proxies / to (env.siteUrl)')
  .argument('<url>', 'App Shell origin, or "none" to remove')
  .action(async (url) => {
    try {
      await configCommands.setSiteUrl(url === 'none' ? null : url);
    } catch (error) {
      fail(error);
    }
  });

// ============ Store Search Commands ============

const storeCommand = program
  .command('store')
  .description('Store search operations');

storeCommand
  .command('search')
  .description('Search store catalog (communities, apps, products, documents)')
  .option('-q, --query <text>', 'Search query')
  .option('-t, --type <types>', 'Entity types (comma-separated: COMMUNITY,APP,KB,IPDOC,ROLE)')
  .option('-c, --community <id>', 'Filter by community ID')
  .option('-a, --app <id>', 'Filter by app ID')
  .option('-k, --kb <id>', 'Filter by knowledge base ID')
  .option('--price-min <number>', 'Minimum price filter')
  .option('--price-max <number>', 'Maximum price filter')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('-l, --limit <number>', 'Number of results', '20')
  .option('--offset <number>', 'Pagination offset', '0')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const params = {
        query: options.query || '',
        entity_types: options.type ? options.type.split(',').map(t => t.trim()) : [],
        community_id: options.community || null,
        app_id: options.app || null,
        kb_id: options.kb || null,
        price_min: options.priceMin ? parseFloat(options.priceMin) : null,
        price_max: options.priceMax ? parseFloat(options.priceMax) : null,
        tags: options.tags ? options.tags.split(',').map(t => t.trim()) : [],
        limit: parseInt(options.limit),
        offset: parseInt(options.offset)
      };
      
      const response = await apiClient.invoke('search_store', params);
      const result = response.message || response;
      
      console.log(chalk.green(`\n✅ Found ${result.total || result.results?.length || 0} results\n`));
      
      if (result.query) {
        console.log(chalk.cyan(`Query: "${result.query}"\n`));
      }
      
      (result.results || []).forEach((r, idx) => {
        const num = idx + 1 + parseInt(options.offset);
        console.log(chalk.yellow(`${num}. [${r.entity_type}] ${r.name}`));
        if (r.description) {
          console.log(chalk.gray(`   ${r.description.substring(0, 150)}...`));
        }
        if (r.price !== undefined && r.price > 0) {
          console.log(chalk.cyan(`   Price: ${r.price} USDCX`));
        }
        if (r.community_id) {
          console.log(chalk.gray(`   Community: ${r.community_id}`));
        }
        if (r.app_id) {
          console.log(chalk.gray(`   App: ${r.community_id}/${r.app_id}`));
        }
        if (r.score !== undefined) {
          console.log(chalk.gray(`   Score: ${(r.score * 100).toFixed(1)}%`));
        }
        console.log();
      });
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

storeCommand
  .command('generate-summary')
  .description('Generate AI summary for an entity')
  .requiredOption('-t, --type <type>', 'Entity type (COMMUNITY, APP, KB, IPDOC)')
  .requiredOption('-i, --id <id>', 'Entity ID')
  .option('-c, --community <id>', 'Community ID (required for APP, KB, IPDOC)')
  .option('-a, --app <id>', 'App ID (required for KB, IPDOC)')
  .option('-k, --kb <id>', 'KB ID (required for IPDOC)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const params = {
        entity_type: options.type,
        entity_id: options.id,
        community_id: options.community || null,
        app_id: options.app || null,
        kb_id: options.kb || null
      };
      
      console.log(chalk.gray(`Generating summary for ${options.type} ${options.id}...`));
      
      const response = await apiClient.invoke('generate_entity_summary', params);
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Summary generated!\n'));
      console.log(chalk.cyan(`Entity: ${result.entity_name} (${result.entity_type})\n`));
      console.log(chalk.white(result.summary));
      console.log();
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Output AI-friendly instructions for creating SERVICE_README
 * Designed for both human developers and AI agents (like Cursor) to use directly
 */
function outputServiceReadmeInstructions(serviceName, appId, communityId, manifest) {
  const readmeFileName = `SERVICE_README_${serviceName}.md`;
  const commands = Object.entries(manifest.commands || {});
  
  // Generate command documentation from manifest
  let commandDocs = '';
  for (const [cmdName, cmdConfig] of commands) {
    const params = cmdConfig.inputSchema?.properties || {};
    const required = cmdConfig.inputSchema?.required || [];
    
    commandDocs += `### ${cmdName}
**Description:** ${cmdConfig.description || 'No description provided'}
**Use when:** [Describe scenarios when this command should be used]
**Prerequisites:** ${cmdConfig.guestAllowed ? 'None (guest allowed)' : 'User must be authenticated'}
**Parameters:**
`;
    for (const [paramName, paramConfig] of Object.entries(params)) {
      const isRequired = required.includes(paramName);
      commandDocs += `- \`${paramName}\` (${isRequired ? 'required' : 'optional'}, ${paramConfig.type || 'any'}): ${paramConfig.description || 'No description'}\n`;
    }
    
    commandDocs += `
**Example:**
\`\`\`json
{
  "command": "${cmdName}",
  "params": { ${required.map(r => `"${r}": "value"`).join(', ')} }
}
\`\`\`

`;
  }

  console.log(chalk.red(`
╔════════════════════════════════════════════════════════════════════╗
║  SERVICE_README Required                                            ║
╚════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`Your microservice needs a ${readmeFileName} file for tool discovery.

📁 Required file: ${readmeFileName} (local file in your microservice directory)
▶️  Pass it explicitly:  descix microservice register -r ./${readmeFileName}
   (or re-run with --skip-readme-check to register without tool discovery)

This README is vectorized and used by the \`tell_me_how\` command to help
users and AI agents discover your service's capabilities.

To create this file, use the following template:
`));

  console.log(chalk.yellow(`---BEGIN TEMPLATE---`));
  console.log(chalk.white(`# ${serviceName} Service

## Overview
[One paragraph description of what this service does and when to use it.
Include the key use cases and benefits.]

## Available Commands

${commandDocs || '### [command_name]\n**Description:** [what this command does]\n**Use when:** [scenarios]\n**Prerequisites:** [requirements]\n**Parameters:**\n- \\`param1\\` (required, string): [description]\n\n**Example:**\n\\`\\`\\`json\n{\n  "command": "[command_name]",\n  "params": { "param1": "value" }\n}\n\\`\\`\\`\n'}
## Common Workflows

[Describe how commands work together for common tasks]

## Troubleshooting

[Common errors and how to resolve them]
`));
  console.log(chalk.yellow(`---END TEMPLATE---`));

  console.log(chalk.white(`
After creating the file:

1. Upload ${readmeFileName} to the app's Drive folder
   Location: Your Drive > [DeSciX folder] > ${communityId} > ${appId}/

2. Re-run this command:
   descix microservice register -m ${manifest ? './manifest.json' : '<path-to-manifest>'}

💡 Tip: Your AI coding assistant (like Cursor) can create this file for you
   using the template above. Just ask it to "create the SERVICE_README file".
`));
}

// ============ Clone Command ============

program
  .command('clone')
  .description('Clone a DeSciX app repository')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('--path <dir>', 'Target directory')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      await runClone(apiClient, { app_id: options.app, targetPath: options.path });
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ MCP Commands ============

import { runClone } from '../lib/commands/clone.js';

const mcpCommand = program
  .command('mcp')
  .description('MCP server operations');


mcpCommand
  .command('execute')
  .description('Execute a registered MCP tool by name with JSON parameters')
  .requiredOption('--tool <name>', 'Tool/command name (e.g., beast_get_initiatives, beast_update_stream)')
  .option('--params <json>', 'JSON parameters for the tool', '{}')
  .option('-a, --app <app_id>', 'App context (sets app_id in params if not already present)')
  .option('--json', 'Output raw JSON response')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await apiClient.initialize();
      await requireAuth(apiClient);

      // Parse JSON params
      let params;
      try {
        params = JSON.parse(options.params);
      } catch (parseError) {
        console.error(chalk.red(`Invalid JSON in --params: ${parseError.message}`));
        console.error(chalk.gray('Example: --params \'{"initiative_id": "agentic-memory"}\''));
        process.exit(1);
      }

      // Inject app_id if provided via --app flag and not already in params
      if (options.app && !params.app_id) {
        params.app_id = options.app;
      }

      progress(options, chalk.gray(`Executing ${options.tool}...`));

      const response = await apiClient.invoke(options.tool, params);

      if (options.json) {
        // Raw JSON output for piping/scripting
        console.log(JSON.stringify(response, null, 2));
      } else {
        // Human-readable output
        const result = response.message || response;

        if (result.success !== undefined) {
          console.log(chalk.green(`\nSuccess: ${result.message || 'Command executed successfully'}`));
        } else {
          console.log(chalk.green('\nResult:'));
        }

        // Pretty-print the result, excluding verbose fields
        const displayResult = typeof result === 'object' ? result : { response: result };
        console.log(chalk.white(JSON.stringify(displayResult, null, 2)));
      }

      console.log('');
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.response) {
        console.error(chalk.gray(JSON.stringify(error.response, null, 2)));
      }
      process.exit(1);
    }
  });

// ============ Intelligent Tool Discovery ============

program
  .command('tell-me-how')
  .description('Discover platform tools using natural language (Intelligent MCP Mesh)')
  .argument('<question>', 'What do you want to accomplish? Use natural language.')
  .option('-s, --scope <scope>', 'Search scope (validated against the published tell_me_how enum): bootstrap, artifact, project, entitlements (default), discovery', 'entitlements')
  .option('-j, --json', 'Output raw JSON response')
  .action(async (question, options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const { scope, json: jsonOutput } = options;
      
      // Validate scope against the PUBLISHED enum, never a hand-copy. This list used to be a
      // third mirror (['project','entitlements','discovery']) of a contract owned in
      // @descix/platform-api/mcp-tools, and on 2026-08-18 all three copies disagreed: the handler
      // knew 6 scopes, the published enum 4, this CLI 3 — so 'artifact' and 'bootstrap' were
      // rejected here despite working on the wire. One owner, read at runtime.
      const { NATIVE_MCP_TOOLS } = await import('@descix/platform-api/mcp-tools');
      const validScopes = NATIVE_MCP_TOOLS
        .find(t => t.name === 'tell_me_how')?.inputSchema?.properties?.scope?.enum;
      if (!Array.isArray(validScopes) || validScopes.length === 0) {
        console.error(chalk.red("tell_me_how scope enum missing from @descix/platform-api/mcp-tools — cannot validate."));
        process.exit(1);
      }
      if (!validScopes.includes(scope)) {
        console.error(chalk.red(`Invalid scope '${scope}'. Must be one of: ${validScopes.join(', ')}`));
        process.exit(1);
      }
      
      // Project context for 'project' scope, read from the v2.1 workspace.
      //
      // This previously read `primaryCommunity`, `directoryMappings` and `defaultContext` — all
      // v1-format keys. A v2.1 workspace ({version, workspaceRoot, type, env{...}, driveConfig})
      // has NONE of them, so this always produced {community_ids:[], app_ids:[]} and the server
      // rejected every call with "project scope requires project_context with community_ids or
      // app_ids". `--scope project` was dead on this surface for exactly as long as v2.1 has been
      // the format.
      //
      // v2.1 carries APP IDS ONLY (env.platform.appId, env.products[].appId) — no community ids.
      // We therefore send app_ids alone and let the server resolve ownership from Products.
      // Deriving a community_id by splitting an app_id would violate the platform invariant that
      // app ids are OPAQUE to routing and lookups.
      let project_context = null;
      if (scope === 'project') {
        let wsConfig;
        try {
          const { WorkspaceConfig } = await import('../lib/workspace-config.js');
          wsConfig = await WorkspaceConfig.load(process.cwd());
        } catch (e) {
          // RELAY the loader's own diagnosis; do not re-derive a remedy here. This site used to
          // print "Run 'descix init' first" for EVERY failure, including a corrupt-but-present
          // workspace.json — prescribing an overwrite of the file it had just failed to read,
          // and discarding the loader's message that said exactly what was wrong.
          console.error(chalk.red(e.message));
          console.error(chalk.gray(`    Or use --scope entitlements, which needs no workspace.`));
          process.exit(1);
        }
        const appIds = new Set();
        if (wsConfig?.env?.platform?.appId) appIds.add(wsConfig.env.platform.appId);
        for (const product of wsConfig?.env?.products || []) {
          if (product?.appId) appIds.add(product.appId);
        }
        // Fail LOUD rather than sending an empty context the server can only reject.
        if (appIds.size === 0) {
          console.error(chalk.red("project scope: no apps found in .descix/workspace.json (env.platform.appId / env.products[].appId)."));
          console.error(chalk.gray("    Use --scope entitlements, or add products to the workspace."));
          process.exit(1);
        }
        project_context = { app_ids: Array.from(appIds) };
      }
      
      console.log(chalk.cyan(`\n🔍 Searching for tools... (scope: ${scope})\n`));
      console.log(chalk.gray(`   Question: "${question}"\n`));
      
      const response = await apiClient.invoke('tell_me_how', {
        question,
        scope,
        project_context
      });
      
      const result = response.message || response;
      
      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      
      // Format output for human consumption
      if (result.status === 'ERROR') {
        console.error(chalk.red(`\n❌ ${result.message}\n`));
        process.exit(1);
      }
      
      console.log(chalk.green(`\n💡 ${result.explanation || 'Results found'}\n`));
      
      const tools = result.recommended_tools || [];
      if (tools.length > 0) {
        console.log(chalk.cyan('Recommended Tools:'));
        console.log(chalk.cyan('─'.repeat(50)));
        
        tools.forEach((tool, idx) => {
          console.log(chalk.yellow(`\n${idx + 1}. ${tool.command || tool.service}`));
          console.log(chalk.gray(`   ${tool.description || 'No description'}`));
          if (tool.community_id && tool.app_id) {
            console.log(chalk.gray(`   Source: ${tool.community_id}/${tool.app_id}`));
          }
          if (tool.relevance_score) {
            console.log(chalk.gray(`   Relevance: ${(tool.relevance_score * 100).toFixed(1)}%`));
          }
        });
        
        console.log(chalk.cyan('\n─'.repeat(50)));
      }
      
      // Show purchase requirements for discovery scope
      if (scope === 'discovery' && result.requires_purchase?.length > 0) {
        console.log(chalk.yellow('\n⚠️  Some tools require purchase:\n'));
        result.requires_purchase.forEach(item => {
          console.log(chalk.gray(`   • ${item.service} - ${item.reason}`));
        });
      }
      
      // Show next steps
      if (tools.length > 0) {
        console.log(chalk.white('\n📝 Next Steps:\n'));
        console.log(chalk.gray('   1. Use the recommended tool via MCP or CLI'));
        console.log(chalk.gray('   2. Example MCP call:'));
        console.log(chalk.gray(`      execute_remote_command({ command: "${tools[0].command || tools[0].service}", params: {...} })`));
        console.log(chalk.gray('   3. Or use the CLI:'));
        console.log(chalk.gray(`      descix <command> [options]`));
      }
      
      console.log();
      
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Local Gateway Command ============

program
  .command('serve')
  .description('Start the unified local gateway (one HTTPS origin: App Shell at /, your app at /p/<app>, /apifront to the API)')
  .option('-p, --port <port>', 'Gateway port for this run (default: env.gateway.port, else 5173)')
  .option('-w, --workspace <path>', 'Workspace root override')
  .option('--site-url <url>', 'App Shell target for this run (default: env.siteUrl, a local platform site, else the API origin)')
  .option('-a, --app <id>', 'App to serve standalone (default: detected from the directory you are standing in)')
  .action(async (options) => {
    try {
      const { runServe } = await import('../lib/commands/serve.js');
      await runServe({
        // No default here: an unset flag must stay UNSET so the gateway's
        // resolveGatewayPort can see env.gateway.port. A CLI-side default would
        // shadow the workspace's own port — the map/server disagreement bug.
        port: options.port !== undefined ? parseInt(options.port, 10) : undefined,
        workspaceRoot: options.workspace || process.cwd(),
        siteUrl: options.siteUrl,
        app: options.app,
      });
    } catch (error) {
      console.error(chalk.red('Gateway error:', error.message));
      process.exit(1);
    }
  });

// ============ Dev Certs Commands ============

const devCertsCommand = program
  .command('dev-certs')
  .description('TLS dev-cert trust status for `descix serve` — passkey sign-in needs this cert trusted once per machine');

devCertsCommand
  .command('check')
  .description('Check whether the dev-server cert is trusted for https://localhost (exit 0 only when trusted)')
  .option('--json', 'Output raw JSON')
  .action(async (options) => {
    try {
      const { runDevCertsCheck } = await import('../lib/commands/dev-certs.js');
      await runDevCertsCheck(options);
    } catch (error) {
      fail(error);
    }
  });

devCertsCommand
  .command('trust')
  .description('Trust the dev-server cert in the macOS keychain (prompts for your password)')
  .action(async () => {
    try {
      const { runDevCertsTrust } = await import('../lib/commands/dev-certs.js');
      await runDevCertsTrust();
    } catch (error) {
      fail(error);
    }
  });

// ============ Quickstart Command ============

program
  .command('quickstart')
  .description('One-command setup: auth → workspace → agent files → MCP config')
  .option('-u, --url <url>', 'API URL override')
  .option('-c, --community <id>', 'Community ID for the new workspace')
  .option('-a, --app <name>', 'App name for the new workspace')
  .option('-y, --yes', 'Skip the confirmation — with -c and -a, quickstart runs without a terminal')
  .action(async (options) => {
    // Every failure prints as a message and exits 1 — never a stack trace. A new developer's AI
    // assistant runs this non-interactively, and an uncaught refusal read as a crash (2026-09-19).
    try {
      const { generateAgentFiles, generateMcpConfig, generateClaudeCodeMcpConfig } = await import('../lib/agent-files.js');
      const { WalletFileManager } = await import('../lib/wallet-file.js');

      console.log(chalk.cyan('\n🚀 DeSciX Quickstart\n'));

      const workspaceRoot = process.cwd();

      // Step 1: Auth — login if no wallet.json
      const walletPath = WalletFileManager.getWalletPath(workspaceRoot);
      let needsLogin = true;
      try {
        const wallet = await WalletFileManager.loadWalletFile(walletPath);
        if (wallet && WalletFileManager.hasValidSession(wallet)) {
          console.log(chalk.green(`✓ Already authenticated as ${wallet.userId}`));
          needsLogin = false;
        }
      } catch { /* no wallet */ }

      if (needsLogin) {
        const loginOptions = {};
        if (options.url) loginOptions.url = options.url;
        await authCommands.loginDevice(loginOptions);
      }

      // Step 2: Workspace init — create workspace.json only when there is none ANYWHERE UP THE TREE.
      //
      // WHERE THE WORKSPACE ROOT IS has ONE OWNER: WorkspaceConfig.findWorkspaceRoot, which walks UP
      // exactly as load() does. This step used to derive it a THIRD time with fs.access on the target
      // path only (the wizard guard was the second). Run from a SUBDIRECTORY of an existing
      // workspace, that check saw nothing, runInit created a NESTED workspace.json whose
      // workspaceRoot pointed at the subdirectory, and it SHADOWED the parent for every later
      // resolution — silently, with "Quickstart complete!" and exit 0.
      //
      // quickstart is an ONBOARDING flow: a user who asked to be set up and already IS set up has
      // SUCCEEDED, so this SKIPS and REPORTS and continues.
      const existingRoot = await WorkspaceConfig.findWorkspaceRoot(workspaceRoot);
      if (existingRoot) {
        console.log(chalk.green('✓ Workspace already initialized'));
        if (path.resolve(existingRoot) !== path.resolve(workspaceRoot)) {
          console.log(chalk.gray(`  Workspace root: ${existingRoot}`));
          console.log(chalk.gray(`  You are in a subdirectory of it. Not creating a second workspace`));
          console.log(chalk.gray(`  here — a nested one would shadow the root for every command run`));
          console.log(chalk.gray(`  from this directory.`));
        }
      } else {
        console.log(chalk.cyan('\n📋 Initialize Workspace\n'));
        // runInit's signature is (apiClient, options). Passing a single object put it in the
        // apiClient slot and left options defaulting to {}, so `path` was silently discarded and
        // runInit fell back to process.cwd(). It was MASKED here only because workspaceRoot IS
        // process.cwd() in this action — the argument was in the wrong slot regardless, and would
        // have written the workspace to the wrong directory the moment that stopped being true.
        // This action has no apiClient of its own; null is passed explicitly rather than implied.
        await runInit(null, { path: workspaceRoot, community: options.community, app: options.app, yes: options.yes });
      }

      // EVERY REMAINING STEP TARGETS THE RESOLVED ROOT, not the directory the command was typed in.
      // They read the workspace to learn the app, community and origin they must state, so pointing
      // them at a subdirectory that deliberately has no workspace.json makes them hard-fail on the
      // absence this command just chose to preserve. Resolving the root once and ferrying it is the
      // same one-owner rule that fixed the check above.
      const targetRoot = existingRoot || workspaceRoot;

      // Step 3: Generate agent instruction files
      console.log(chalk.cyan('\n📋 Generating Agent Instructions\n'));
      const written = await generateAgentFiles(targetRoot);
      for (const f of written) {
        console.log(chalk.green(`  ✓ ${f}`));
      }

      // Step 4: Generate .vscode/mcp.json (skipped if DeSciX extension handles MCP)
      const mcpWritten = await generateMcpConfig(targetRoot);
      if (mcpWritten) {
        console.log(chalk.green('  ✓ .vscode/mcp.json'));
      } else {
        console.log(chalk.green('  ✓ MCP handled by DeSciX extension (mcp.json skipped)'));
      }
      // Claude Code reads project MCP servers from .mcp.json — written regardless of the VS Code case.
      await generateClaudeCodeMcpConfig(targetRoot);
      console.log(chalk.green('  ✓ .mcp.json (Claude Code)'));

      // Step 5: Copy SDK assets
      const { pullSdkAssets } = await import('../lib/sdk-assets.js');
      await pullSdkAssets(targetRoot);
      console.log(chalk.green('  ✓ .descix/sdk-assets/'));

      // Done
      console.log(chalk.green('\n✅ Quickstart complete!\n'));
      console.log(chalk.white('Open your editor — the AI knows about DeSciX.\n'));
      console.log(chalk.gray('  Copilot / Cline / Claude Code will have DeSciX MCP tools'));
      console.log(chalk.gray('  Ask: "What DeSciX tools do I have?"\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ MCP Server Command (for npx usage) ============

program
  .command('mcp-serve')
  .description('Start MCP server for Cursor/VS Code integration (used by npx)')
  .action(async () => {
    try {
      await import('./mcp-server.js');
    } catch (error) {
      console.error(chalk.red('MCP server error:', error.message));
      process.exit(1);
    }
  });

// ============ Public-vs-admin help listing (CEO ruling, see lib/command-visibility.js) ============
//
// The class comes from the server (`get_command_surface`, guest-allowed) at the moment help is
// about to render — never a committed table. Only a help-rendering invocation pays the network
// cost: isHelpInvocation() is a fast, offline, syntactic check (no parsing, no I/O) so every
// ordinary command keeps running at today's speed. `--admin` / `DESCIX_ADMIN=1` skip this
// entirely, which is what "show everything" means — nothing is ever hidden unless this block
// explicitly hides it.
const rawArgv = process.argv.slice(2);
const adminMode = rawArgv.includes('--admin') || process.env.DESCIX_ADMIN === '1';

/** Read `--flag <value>` or `--flag=<value>` out of raw argv, pre-parse — Commander has not run yet at this point. */
function rawFlagValue(argv, flag) {
  const i = argv.indexOf(flag);
  if (i !== -1) return argv[i + 1];
  const joined = argv.find((tok) => tok.startsWith(`${flag}=`));
  return joined === undefined ? undefined : joined.slice(flag.length + 1);
}

if (!adminMode && isHelpInvocation(program, rawArgv, { valueFlags: ['--env', '--api-url'], booleanFlags: ['--admin'] })) {
  // Apply --api-url / --env BEFORE constructing the client. The `preAction` hook above does the
  // same thing but only ever fires before an ACTION runs — Commander short-circuits straight to
  // help output without one, so for a help-rendering invocation this is the only place that
  // ever applies these flags. Without it, `descix --api-url https://X --help` silently asked
  // the DEFAULT origin (not X) whether each command is admin.
  applyGlobalOriginOverride({ apiUrl: rawFlagValue(rawArgv, '--api-url'), env: rawFlagValue(rawArgv, '--env') });

  // BOUNDED, regardless of what the underlying HTTP client's own timeout is: "help must stay
  // fast" is a promise about THIS invocation, not about how patient axios feels like being
  // against an origin that accepts the TCP connection and then never answers.
  const SURFACE_FETCH_TIMEOUT_MS = 5000;
  let timeoutHandle;
  try {
    const apiClient = new DeSciXApiClient();
    await apiClient.ensureInitialized();
    const { commands } = await Promise.race([
      getCommandSurface(apiClient.baseUrl, apiClient),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`timed out after ${SURFACE_FETCH_TIMEOUT_MS}ms`)),
          SURFACE_FETCH_TIMEOUT_MS
        );
        timeoutHandle.unref?.(); // never itself the reason the process stays alive
      }),
    ]);
    applyVisibility(program, commands);
  } catch (error) {
    // FAIL LOUD ABOUT THE DEGRADATION, NEVER SILENTLY: help must still render (everything
    // visible, the safe default) — offline, an old server without the command, or any other
    // fetch failure is not a reason to hang or crash `--help`.
    console.error(chalk.gray(
      `(admin-only commands could not be filtered from this listing: ${error.message}. Showing everything. Use --admin to always see everything.)`
    ));
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// Parse arguments
await program.parseAsync(process.argv);

// Show help if no command provided
if (!rawArgv.length) {
  program.outputHelp();
}

