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
import { WorkspaceConfig } from '../lib/workspace-config.js';
import { GlobalConfig } from '../lib/global-config.js';
import * as authCommands from '../lib/commands/auth.js';
import * as configCommands from '../lib/commands/config.js';
import * as buyCommands from '../lib/commands/buy.js';
import * as creditsCommands from '../lib/commands/credits.js';
import * as airdropCommands from '../lib/commands/airdrop.js';
import { runInit } from '../lib/commands/init.js';
import * as updateCommands from '../lib/commands/update.js';
import { runStatus } from '../lib/commands/status.js';
import { runDoctor } from '../lib/commands/doctor.js';
import { runHealth } from '../lib/commands/health.js';
import * as kbCommands from '../lib/commands/kb.js';
import { kbVectorCell, kbCountSource } from '../lib/commands/kb-list-render.js';
import * as corpusCommands from '../lib/commands/corpus.js';
import * as modelConfigCommands from '../lib/commands/model-config.js';
import * as brieferCommand from '../lib/commands/briefer/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const program = new Command();

program
  .name('descix')
  .description('DeSciX CLI - Unified command-line interface')
  .version('1.0.0')
  .option('--env <name>', 'Target environment: dev, demo, prod (overrides API URL)')
  .option('--api-url <url>', 'Direct API URL override (e.g., https://demo.descix.net)');

// ============ Global Environment Override ============
// Maps --env flag to DESCIX_API_URL before any command runs.
// detectApiUrl() in api-client.js checks process.env.DESCIX_API_URL first.

// Derive ephemeral --env URL map from the canonical WorkspaceConfig.ENV_MAP
const ENV_URL_MAP = Object.fromEntries(
  Object.entries(WorkspaceConfig.ENV_MAP).map(([k, v]) => [k, v.url])
);

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();

  // --api-url takes highest priority
  if (opts.apiUrl) {
    process.env.DESCIX_API_URL = opts.apiUrl;
    return;
  }

  // --env maps to known URLs
  if (opts.env) {
    const envName = opts.env.toLowerCase();
    if (!(envName in ENV_URL_MAP)) {
      console.error(chalk.red(`Unknown environment: ${opts.env}. Use: dev, demo, prod`));
      process.exit(1);
    }
    const url = ENV_URL_MAP[envName];
    if (url) {
      process.env.DESCIX_API_URL = url;
    }
    // For 'dev', don't set — let workspace.json resolve naturally
  }
});

// ============ Authentication Commands (No Auth Required) ============


program
  .command('login')
  .description('Authenticate with DeSciX via device login (opens browser)')
  .option('-u, --url <url>', 'API URL override')
  .option('--dev', 'Use development server (https://localhost:4000)')
  .option('--wallet', 'Use direct wallet connection (advanced, not yet implemented)')
  .option('--no-oauth', 'Skip the OAuth long-lived token leg (wallet-signature login only)')
  .option('--scope <scope>', 'OAuth scope to request (default: mcp:read mcp:tools mcp:write mcp:admin)')
  .action(async (options) => {
    try {
      // Handle --dev flag
      if (options.dev) {
        const workspaceConfig = await WorkspaceConfig.tryLoad(process.cwd());
        if (workspaceConfig) {
          workspaceConfig.apiUrl = 'https://localhost:4000';
          workspaceConfig.environment = 'development';
          await workspaceConfig.save(process.cwd());
        } else {
          const gc = await GlobalConfig.load();
          gc.api_url = 'https://localhost:4000';
          gc.environment = 'development';
          await gc.save();
        }
        console.log(chalk.cyan('✓ Configured for development (https://localhost:4000)\n'));
      }
      
      if (options.wallet) {
        await authCommands.loginWallet();
      } else {
        await authCommands.loginDevice(options);
      }
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Clear saved credentials')
  .action(async () => {
    try {
      await authCommands.logout();
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command('admin-login')
  .description('Bootstrap CLI credentials for platform admins (requires admin group membership)')
  .requiredOption('-e, --email <email>', 'Admin email (must be in platform admin Google Group)')
  .option('-u, --url <url>', 'API URL override')
  .option('--dev', 'Use development server (https://localhost:4000)')
  .action(async (options) => {
    try {
      if (options.dev) {
        const workspaceConfig = await WorkspaceConfig.tryLoad(process.cwd());
        if (workspaceConfig) {
          workspaceConfig.apiUrl = 'https://localhost:4000';
          workspaceConfig.environment = 'development';
          await workspaceConfig.save(process.cwd());
        } else {
          const gc = await GlobalConfig.load();
          gc.api_url = 'https://localhost:4000';
          gc.environment = 'development';
          await gc.save();
        }
        console.log(chalk.cyan('Configured for development (https://localhost:4000)\n'));
      }
      await authCommands.adminLogin(options);
    } catch (error) {
      process.exit(1);
    }
  });

// ============ Init Command (Git-aware workspace setup) ============

program
  .command('init')
  .description('Initialize workspace for DeSciX app development (Git-aware)')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <name>', 'App name')
  .option('-p, --path <path>', 'Project path (defaults to current directory)')
  .option('-f, --force', 'Overwrite existing workspace.json')
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
      process.exit(1);
    }
  });

program
  .command('reconnect')
  .description('Reconnect using saved wallet credentials')
  .action(async () => {
    try {
      await authCommands.reconnect();
    } catch (error) {
      process.exit(1);
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
      await runHealth({ ...options, env });
    } catch (error) {
      console.error(chalk.red(`\nHealth check error: ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Briefer Command (Code-Grounded Mental Model Regen) ============
// WS-DESCIX-BRIEFER-CLI M1: CLI scaffolding + extractor contract.
// See DeSciX/DeSciX_Core/descix-cli/lib/commands/briefer/ for implementation.
// Scope doc: docs/design/ws-descix-briefer-cli.md
// Briefer target: DeSciX/V2_docs/architecture/platform-must-know-briefer.md

program
  .command('briefer')
  .description('Regenerate platform-must-know-briefer.md from live code + gcloud + Firestore (HARD-FAIL on drift)')
  .option('--env <name>', 'Target environment: dev|demo|prod (also accepted at the top level: descix --env=demo briefer ...)')
  .option('--out <path>', 'Override output path (default: workspace-root/DeSciX/V2_docs/architecture/platform-must-know-briefer.md)')
  .option('--check', 'Drift-detection mode: regen to memory, diff against canonical, non-zero exit on drift')
  .option('-v, --verbose', 'Print per-source paths, citations, and timings')
  .action(async (options) => {
    try {
      // Resolve --env in priority order: subcommand explicit > program parent > 'dev'.
      // Commander would otherwise silently default to 'dev' even when the parent
      // --env=demo is supplied (because the subcommand owns its own flag space).
      const parentEnv = program.opts().env || null;
      const env = options.env || parentEnv || 'dev';
      await brieferCommand.runBriefer({ ...options, env });
    } catch (error) {
      console.error(chalk.red(`\n❌ Briefer command failed: ${error.message}\n`));
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
      process.exit(1);
    }
  });

buyCommand
  .command('status <quoteId>')
  .description('Check status of a payment quote')
  .action(async (quoteId) => {
    try {
      await buyCommands.checkStatus(quoteId);
    } catch (error) {
      process.exit(1);
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
      process.exit(1);
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
      process.exit(1);
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
      process.exit(1);
    }
  });

creditsCommand
  .command('buy')
  .description('Buy AI credits with USD (Stripe checkout)')
  .requiredOption('--usd <amount>', 'USD amount of credits to buy')
  .option('--return-base <url>', 'Base URL for the checkout success/cancel landing (default https://descix.net)')
  .action(async (options) => {
    try {
      await creditsCommands.buyCredits({ usd: options.usd, returnBase: options.returnBase });
    } catch (error) {
      process.exit(1);
    }
  });

creditsCommand
  .command('grant')
  .description('ADMIN: grant AI credits to a user')
  .requiredOption('--user <user_id>', 'Target user id')
  .requiredOption('--usd <amount>', 'USD amount to grant')
  .requiredOption('--reason <text>', 'Audit reason')
  .action(async (options) => {
    try {
      await creditsCommands.grantCredits(options);
    } catch (error) {
      process.exit(1);
    }
  });

creditsCommand
  .command('refund')
  .description('ADMIN: remove AI credits from a user (e.g. after a Stripe refund)')
  .requiredOption('--user <user_id>', 'Target user id')
  .requiredOption('--usd <amount>', 'USD amount to remove')
  .requiredOption('--reason <text>', 'Audit reason')
  .action(async (options) => {
    try {
      await creditsCommands.refundCredits(options);
    } catch (error) {
      process.exit(1);
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
      process.exit(1);
    }
  });

// ============ Sync Commands ============

const syncCommand = program
  .command('sync')
  .description('Content sync operations (context-aware)');

// [WS-MCP-SURFACE-SPLIT Step 3 §5.5] `sync assets` (legacy Drive-mode) DELETED —
// canonical is `descix app sync-assets`. The shared updateCommands.updateApp() body is
// intentionally RETAINED here: the `update [type]` dispatcher (`update app`/`all`/auto)
// still consumes it and is a separate Tier-3 decision.

// Context-aware sync: kb
syncCommand
  .command('kb')
  // [DUPLICATE:WS-MCP-STEP3] `sync kb` wraps updateKB() (runKbChunk + runKbSync via
  // context resolution) — a DUPLICATE of `kb corpus sync` (canonical, git-manifest).
  // Tier 3: BLOCKED from deletion because `.descix/sync-kb-sources.sh` (org KB-ingestion
  // automation) still invokes `kb chunk`/`kb sync`. MARK only — do NOT delete until that
  // script migrates to a corpus manifest (plan §5.4b / consolidated-triage TIER 3).
  .description('[DUPLICATE → use `descix kb corpus sync`] Sync knowledge base files - context-aware. Slated for removal in WS-MCP Step 3 Tier 3 (blocked on sync-kb-sources.sh migration).')
  .argument('[stage]', 'Specific stage: stage1, stage2, stage3, all (default: all)')
  .option('--push', 'Push local to Drive (Stage 1)')
  .option('--pull', 'Pull from Drive to local (Stage 1)')
  .option('--status', 'Show sync status')
  .option('-c, --community <id>', 'Community ID (uses context if not provided)')
  .option('-a, --app <id>', 'App ID (uses context if not provided)')
  .option('-k, --kb <name>', 'KB name (default: General)')
  .action(async (stage, options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Load workspace context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      const kbId = options.kb || ctx.kbId || 'General';
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      if (options.status) {
        console.log(chalk.cyan(`\n📊 KB Sync Status: ${communityId}/${appId}/${kbId}\n`));
        // Call existing status logic
        const stages = stage === 'stage1' ? [1] : stage === 'stage2' ? [2] : stage === 'stage3' ? [3] : [1, 2, 3];
        
        for (const s of stages) {
          if (s === 2) {
            const response = await apiClient.invoke('get_drive_gcs_sync_status', {
              community_id: communityId, app_id: appId, kb_id: kbId
            });
            const result = response.message || response;
            console.log(chalk.yellow('Stage 2: Drive → GCS'));
            console.log(chalk.gray(`  To Extract: ${result.to_extract || 0}`));
            console.log(chalk.gray(`  In Sync: ${result.in_sync || 0}\n`));
          }
          if (s === 3) {
            const response = await apiClient.invoke('get_gcs_pinecone_sync_status', {
              community_id: communityId, app_id: appId, kb_id: kbId
            });
            const result = response.message || response;
            console.log(chalk.yellow('Stage 3: GCS → Pinecone'));
            console.log(chalk.gray(`  To Vectorize: ${result.to_vectorize || 0}`));
            console.log(chalk.gray(`  Total Vectors: ${result.total_vectors || 0}\n`));
          }
        }
        return;
      }
      
      // Determine what to sync
      const stage1Only = stage === 'stage1' || options.push;
      const stageToRun = stage || 'all';
      
      console.log(chalk.cyan(`\n📤 KB Sync: ${communityId}/${appId}/${kbId} (${stageToRun})\n`));
      
      await updateCommands.updateKB({ 
        ...options,
        kb: kbId,
        stage1Only: stage1Only,
        skipStage1: stage === 'stage2' || stage === 'stage3'
      });
      
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// [WS-MCP-SURFACE-SPLIT Step 3 §5.5] `sync site` DELETED — canonical is `descix site upload`
// (manifest-aware; injects build-time GTM/base-path env vars `sync site` lacked). The shared
// updateCommands.updateSite() body is intentionally RETAINED: the `update [type]` dispatcher
// (`update site`/`all`/auto) still consumes it and is a separate Tier-3 decision. The SHARED
// backend commands (get_site_deploy_token/confirm_site_deploy/get_site_manifest) are untouched.

// ============ Community/App Commands ============

const communityCommand = program
  .command('community')
  .description('Community operations');

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
  .description('[ADMIN] Create a new community with token contract (requires platform admin, deploys to live Polygon)')
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
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => {
          rl.question(chalk.yellow(`  Create community "${options.name}" with token ${tokenSymbol} on live Polygon? [y/N] `), resolve);
        });
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
  .description('[ADMIN] Delete a community with full cascade cleanup (all apps, KBs, vectors, GCS)')
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
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => {
          rl.question(chalk.yellow(`\n  Permanently delete community "${manifest.community_name}" and all ${manifest.app_count} app(s)? This cannot be undone. [y/N] `), resolve);
        });
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
  .description('[ADMIN] Rename a community_id across all surfaces (Firestore, Products, Pinecone metadata, ServiceManifests, descix-chain registry). On-chain contract + token symbol are UNTOUCHED. Dry-run first.')
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
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => rl.question(
          chalk.yellow(`\n  Execute rename ${oldId} -> ${newId}? Re-tags ${plan.pinecone.matched} vector(s) and deletes Community/${oldId} after verifying Community/${newId}. [y/N] `),
          resolve
        ));
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
        console.log(chalk.gray(`  1. Create community:    descix community create -n "Name" -t ${tokenSymbol} -p ./path --no-token-contract`));
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
  // [WS-MCP-SURFACE-SPLIT Step 3 §5.1] `app init` is the WORKSPACE-REGISTER + KB-init leg of
  // app-create only. App CREATION is the single canonical path `create_app_for_community`
  // (CLI: `descix app create --quick -c <community> -a <app>`). The former `-c/--community`
  // conditional-create branch was removed here so there is exactly one create path.
  .description('Initialize local workspace and Firestore KB for an existing app (idempotent, workspace-register + KB-init). To create an app first: `descix app create --quick -c <community> -a <app>`.')
  .requiredOption('-a, --app <app_id>', 'App ID (e.g. daita)')
  .option('--kb <name>', 'Knowledge base name', 'General')
  .option('-p, --path <dir>', 'Local app directory (default: auto-detected or cwd)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const appId = options.app;
      const kbId = options.kb || 'General';

      // Resolve community_id from Products registry (app must already exist)
      let communityId;
      try {
        const productCtx = await apiClient.invoke('get_product_context', { app_id: appId });
        communityId = (productCtx.message || productCtx).community_id;
      } catch (e) {
        // Product not found — app init does NOT create apps; direct to the canonical create path
      }
      if (!communityId) {
        throw new Error(`App '${appId}' not found in Products. Create it first: descix app create --quick -c <community> -a ${appId}`);
      }

      // 1. Workspace.json — register app if not already mapped
      const workspaceConfig = await WorkspaceConfig.tryLoad();
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
      console.log(chalk.gray(`  KB: ${kbId} — ${kbResult.created ? 'created' : 'already exists'}\n`));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray(`  Create a corpus manifest at apps/${appId}/.descix/manifests/${kbId}.json`));
      console.log(chalk.gray(`  then run:`));
      console.log(chalk.white(`  descix kb corpus sync -a ${appId}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('create')
  // WS-MCP-SURFACE-SPLIT Step 3 §5.1: app creation now has ONE canonical path.
  // `app create --quick` is the CLI wrapper over the backend `create_app_for_community`
  // tool; `app init`'s former create branch was removed (init is workspace-register + KB-init
  // only). Use `app create --quick` to create, then `app init` to scaffold + register locally.
  .description('Create an app in a community (CLI wrapper over create_app_for_community). --quick with -c/-a required for CLI-driven creation; then run `descix app init -a <app_id>`.')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <name>', 'App display name')
  .option('-s, --short <short_name>', 'SHORT id segment (no hyphens). The unique app_id is composed as {community}-{short}. Keep it short, e.g. "frqtl" -> egpt-frqtl. Defaults to --app if omitted.')
  .option('--quick', 'Create app via CLI (registers in Products + Firestore, grants entitlement; Drive-free); requires -c and -a')
  .option('--overwrite', 'Overwrite existing (with --quick)')
  .action(async (options) => {
    try {
      if (options.quick && options.community && options.app) {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);

        // V2 app creation is Drive-free (WS-V1-PURGE Phase 1, audit #1).
        // create_app_for_community registers Products + Firestore App doc + grants
        // entitlement (developer-permission checked server-side). No Drive base folder
        // is required: KB sync is the Git manifest path (`descix kb corpus sync`),
        // never Drive. create_skeleton is OFF — the Drive skeleton is a removed V1 step.
        // CANONICAL (CEO-D-2026-06-08): the server composes the unique app_id as
        // {community}-{short_name}, fails loud on a missing community / duplicate id /
        // a short name containing '-'. We forward short_name + overwrite; we do NOT
        // compose the id client-side (the server is authoritative).
        const response = await apiClient.invoke('create_app_for_community', {
          community_id: options.community,
          app_name: options.app,
          short_name: options.short || undefined,
          create_skeleton: false,
          overwrite: options.overwrite
        });
        const result = response.message || response;
        console.log(chalk.green('\n✅ App created successfully!\n'));
        console.log(chalk.cyan(`  App ID:     ${result.app_id}`));
        console.log(chalk.cyan(`  Community:  ${result.community_id}`));
        console.log(chalk.gray(`  Products:   Products/${result.app_id}`));
        console.log(chalk.gray(`  Firestore:  Community/${result.community_id}/Apps/${result.app_id}`));
        console.log(chalk.cyan('\n  Next: descix app init -a ' + result.app_id + '\n'));
        return;
      }
      console.log(chalk.cyan('\n📦 App creation\n'));
      console.log(chalk.white('Create apps in the PWA (Device Setup / App Manager) or via CLI:\n'));
      console.log(chalk.white('  descix app create --quick -c <community> -a <app-name> [-s <short>]\n'));
      console.log(chalk.gray('The unique app_id is composed as {community}-{short} (short defaults to'));
      console.log(chalk.gray('the app name). Pick a SHORT name with NO hyphens, e.g. -c egpt -s frqtl'));
      console.log(chalk.gray('=> egpt-frqtl. The community must already exist or creation fails loud.\n'));
      console.log(chalk.gray('This registers the app in the Products registry, creates the Firestore'));
      console.log(chalk.gray('App doc, and grants entitlement. KB sync is `descix kb corpus sync`'));
      console.log(chalk.gray('(Git manifest) — no Drive folder is required.\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// descix app media-upload — upload media/asset files to an app's GCS assets prefix via the
// API surface (WS-V1-PURGE Phase 1, item 2; media-via-API-surface PLATFORM half).
// This is the canonical, filesystem-free way to get app media (podcast audio, cover art,
// etc.) into the platform: request a short-lived signed PUT token from the API surface
// (`get_asset_upload_token` over /apifront, user-session authed), upload each file straight
// to GCS, and print the ASSET REFERENCES. An app microservice then fetches an uploaded asset
// by reference over the Core broker via `get_app_asset` (no shared local filesystem needed).
appCommand
  .command('media-upload')
  .description('Upload media/asset files to an app\'s GCS assets prefix via the API surface (returns asset references)')
  .requiredOption('-a, --app <id>', 'App ID (community is resolved server-side from Products)')
  .requiredOption('-f, --file <path...>', 'One or more local file paths to upload')
  .option('--prefix <relPath>', 'Optional sub-path under the app assets/ prefix (e.g. "shows/myshow")', '')
  .option('--json', 'Print the asset references as JSON (for scripting)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const path = await import('path');
      const mime = (await import('mime-types')).default;

      const appId = options.app;
      const localFiles = Array.isArray(options.file) ? options.file : [options.file];
      const subPrefix = (options.prefix || '').replace(/^\/+|\/+$/g, '');

      // Build the upload descriptor list: object path under assets/ = [subPrefix/]basename.
      const fileDescriptors = [];
      for (const localPath of localFiles) {
        const abs = path.resolve(localPath);
        let stat;
        try {
          stat = await fs.stat(abs);
        } catch {
          console.error(chalk.red(`\n❌ File not found: ${abs}\n`));
          process.exit(1);
        }
        if (!stat.isFile()) {
          console.error(chalk.red(`\n❌ Not a file: ${abs}\n`));
          process.exit(1);
        }
        const base = path.basename(abs);
        const objectPath = subPrefix ? `${subPrefix}/${base}` : base;
        fileDescriptors.push({
          path: objectPath,
          content_type: mime.lookup(abs) || 'application/octet-stream',
          size: stat.size,
          _absolutePath: abs
        });
      }

      console.log(chalk.cyan(`\n  Media Upload: ${appId} → GCS assets/\n`));
      fileDescriptors.forEach(f => console.log(chalk.gray(`  • ${f.path} (${(f.size / 1024).toFixed(1)}KB, ${f.content_type})`)));

      // 1. Request a signed-PUT upload token over the API surface.
      const tokenResponse = await apiClient.invoke('get_asset_upload_token', {
        app_id: appId,
        files: fileDescriptors.map(f => ({ path: f.path, content_type: f.content_type, size: f.size }))
      });
      const token = tokenResponse.message || tokenResponse;
      const { signed_urls, objects } = token;

      // 2. PUT each file directly to GCS using its signed URL.
      console.log(chalk.gray(`\n  Uploading ${fileDescriptors.length} file(s)...`));
      const uploaded = [];
      const errors = [];
      for (const f of fileDescriptors) {
        const signedUrl = signed_urls?.[f.path];
        if (!signedUrl) {
          errors.push(`No signed URL for: ${f.path}`);
          console.log(chalk.red(`  x ${f.path}`));
          continue;
        }
        try {
          const content = await fs.readFile(f._absolutePath);
          const resp = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': f.content_type },
            body: content
          });
          if (!resp.ok) {
            errors.push(`Failed ${f.path}: ${resp.status} ${resp.statusText}`);
            console.log(chalk.red(`  x ${f.path}`));
          } else {
            const obj = (objects || []).find(o => o.path === f.path) || {};
            // The asset REFERENCE an app handler / get_app_asset consumes: the gs:// URI.
            const gcsRef = obj.gcs_path
              ? `gs://${token.bucket}/${obj.gcs_path}`
              : null;
            uploaded.push({
              path: f.path,
              ref: gcsRef,
              gcs_path: obj.gcs_path || null,
              public_url: obj.public_url || null,
              content_type: f.content_type,
              size: f.size
            });
            console.log(chalk.green(`  + ${f.path}`));
          }
        } catch (err) {
          errors.push(`Error ${f.path}: ${err.message}`);
          console.log(chalk.red(`  x ${f.path}`));
        }
      }

      if (errors.length > 0) {
        console.log(chalk.yellow(`\n  ${errors.length} error(s):`));
        errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      }

      if (uploaded.length === 0) {
        console.error(chalk.red('\n❌ No files uploaded.\n'));
        process.exit(1);
      }

      if (options.json) {
        console.log('\n' + JSON.stringify({ app_id: appId, assets: uploaded }, null, 2) + '\n');
      } else {
        console.log(chalk.green(`\n  ✅ Uploaded ${uploaded.length} asset(s).\n`));
        console.log(chalk.cyan('  Asset references (pass these to your app handler; the service fetches via get_app_asset):'));
        uploaded.forEach(u => {
          console.log(chalk.white(`    ${u.path}`));
          console.log(chalk.gray(`      ref:        ${u.ref}`));
          console.log(chalk.gray(`      public_url: ${u.public_url}`));
        });
        console.log();
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

appCommand
  .command('set-codesite')
  .description('Set CodeSite URL/path for an app (use "descix site servelocal" for local dev port)')
  .option('-c, --community <id>', 'Community ID (uses context if not provided)')
  .option('-a, --app <id>', 'App ID (uses context if not provided)')
  .requiredOption('-u, --url <url>', 'CodeSite URL (GCS path or HTTPS URL)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Load workspace context
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      const response = await apiClient.invoke('update_app_metadata', {
        community_id: communityId,
        app_id: appId,
        ip_site_gcs_path_url: options.url
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ CodeSite URL updated!\n'));
      console.log(chalk.cyan(`  App: ${communityId}/${appId}`));
      console.log(chalk.gray(`  CodeSite URL: ${options.url}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
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
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => {
          rl.question(chalk.yellow(`\n  Permanently delete ${appId}? This cannot be undone. [y/N] `), resolve);
        });
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
      const appConfig = workspaceConfig.getAppByAppId(appId);
      if (!appConfig) {
        throw new Error(`App '${appId}' is not mapped. Run 'descix app init -a ${appId}' first.`);
      }

      // Hard-fail if path doesn't exist or is not a directory
      let stat;
      try {
        stat = await fs.stat(newPath);
      } catch {
        throw new Error(`Path does not exist: ${newPath}`);
      }
      if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${newPath}`);
      }

      // Update the localPath in workspace.json
      const wsRoot = workspaceConfig.workspaceRoot || process.cwd();
      const oldPath = appConfig.localPath;
      appConfig.localPath = newPath;

      // Update env.products entry
      const products = workspaceConfig.env?.products || [];
      for (const product of products) {
        if (product.appId === appId || product.app_id === appId) {
          product.localPath = newPath;
          break;
        }
      }
      await workspaceConfig.save(wsRoot);

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
// Backed by WorkspaceConfig.setMicroservicePort (parallel to setSitePort).
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
// Backed by WorkspaceConfig.setStaticSite (parallel to setSitePort/setMicroservicePort).
//
// NOTE: This is NOT `set-codesite` — that writes the Firestore ip_site_gcs_path_url (a prod
// concern). set-site writes ONLY the local workspace.json site.{} slot.
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
  .command('create')
  .description('Create a new knowledge base in an app')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-k, --kb <id>', 'Knowledge Base ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('create_skeleton_kb', {
        community_id: options.community,
        app_id: options.app,
        kb_name: options.kb
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Knowledge Base created successfully!\n'));
      console.log(chalk.cyan(`  KB ID: ${options.kb}`));
      console.log(chalk.gray(`  App: ${options.community}/${options.app}`));
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

// Phase 0 CLI-Centric KB Processing Commands

kbCommand
  .command('chunk')
  // [DUPLICATE:WS-MCP-STEP3] Low-level Git-mode chunk step (local md -> chunks). Superseded
  // for app KB sync by `kb corpus sync` (git-manifest). Tier 3: BLOCKED — `.descix/sync-kb-sources.sh`
  // (org KB-ingestion automation) invokes `kb chunk`/`kb sync` directly. MARK only; delete only
  // after that script migrates to a corpus manifest (plan §5.4b / consolidated-triage TIER 3).
  .description('[DUPLICATE → use `descix kb corpus sync`] Generate chunks from local markdown files. Low-level Git-mode step; slated for removal in WS-MCP Step 3 Tier 3 (blocked on sync-kb-sources.sh migration).')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('-s, --chunk-size <size>', 'Chunk size in characters (default: 512)')
  .option('-o, --overlap <size>', 'Overlap between chunks (default: 64)')
  .option('-m, --metadata <json>', 'Custom metadata JSON to attach to all chunks (e.g. \'{"source":"beast","domain":"training"}\')')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (options) => {
    try {
      await kbCommands.runKbChunk(options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

kbCommand
  .command('sync')
  // [DUPLICATE:WS-MCP-STEP3] Low-level Git-mode sync step (local chunks -> Pinecone). Superseded
  // for app KB sync by `kb corpus sync` (git-manifest). Tier 3: BLOCKED — `.descix/sync-kb-sources.sh`
  // (org KB-ingestion automation) invokes `kb chunk`/`kb sync` directly. MARK only; delete only
  // after that script migrates to a corpus manifest (plan §5.4b / consolidated-triage TIER 3).
  // NOTE: distinct from `sync kb` (top-level `sync` group) which wraps chunk+sync via context.
  .description('[DUPLICATE → use `descix kb corpus sync`] Sync local chunks to Pinecone via service layer. Low-level Git-mode step; slated for removal in WS-MCP Step 3 Tier 3 (blocked on sync-kb-sources.sh migration).')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      await kbCommands.runKbSync(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });


// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
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
    .action(async (options) => {
      try {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);
        let records;
        try { records = JSON.parse(options.records); } catch (e) { throw new Error(`--records must be valid JSON array: ${e.message}`); }
        if (!Array.isArray(records)) throw new Error('--records must be a JSON array');
        const response = await apiClient.invoke(`${cmdPrefix}_put`, { app_id: options.app, kb_id: options.kb, records });
        const result = response.message || response;
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
    .option('-f, --filter <json>', 'Metadata predicate JSON, e.g. \'{"type":"episode","show":{"$eq":"X"}}\'', '{}')
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
  .option('--rebuild', 'Reconcile Pinecone against the current manifest walk: enumerate remote file_ids, purge any not in the current corpus, then re-sync from scratch. Use to recover from accumulated stale-chunk drift. Prompts before deleting unless --yes is supplied.')
  .option('--dry-run', 'Enumerate would-be-purged file_ids and would-be-upserted chunks without ANY Pinecone writes. Exit 0 if no drift, 1 if drift. Read-only.')
  .option('--show-walk', 'Print the resolved ref + the first 50 walked files BEFORE any Pinecone operations. Useful for verifying --ref / manifest source resolution.')
  .option('--yes', 'Skip the interactive purge confirmation in --rebuild mode. Use in scripting/CI.')
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
// Compare local sync-state vs Pinecone vectorCount and scan recent sync
// logs for per-file 0-chunk warnings. Exits non-zero on drift > threshold.
kbCommand
  .command('doctor')
  .description('Detect drift between local sync-state and live Pinecone vector count')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-k, --kb <name>', 'KB name')
  .option('-t, --threshold <ratio>', 'Drift threshold as a fraction (default: 0.05)', parseFloat)
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
  .description('Site lifecycle management: init, upload, servelocal');

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
        console.error(chalk.red('\n❌ App not found in workspace.json.'));
        console.log(chalk.gray('  Run "npx descix init" to set up your workspace.\n'));
        process.exit(1);
      }

      const appPath = appConfig.absolutePath ||
        path.join(workspaceConfig.getWorkspaceRoot(), appConfig.localPath);

      console.log(chalk.cyan('\n📁 Adding site scaffold...\n'));
      
      const { copyScaffold } = await import('../lib/core/Hydrator.js');
      const stats = await copyScaffold('site', appPath, { 
        verbose: true, 
        force: options.force 
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
  .option('--full', 'Force full upload (ignore delta)')
  .option('--dry-run', 'Show what would be deployed')
  .option('--no-cache', 'Set Cache-Control: no-cache')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();

      // WS-DEPLOY-HARDENING item 7: `site upload` must never silently target a stale local
      // backend. detectApiUrl() checks process.env.DESCIX_API_URL first, then falls back to
      // workspace.json's derived localhost URL for DEV (WorkspaceConfig.getApiUrl()), then
      // GlobalConfig, then production. `--env` (except dev, by design — "let workspace.json
      // resolve naturally") and `--api-url` are folded into DESCIX_API_URL by the preAction
      // hook BEFORE this action runs — so checking DESCIX_API_URL here reflects whether the
      // resolution took the explicit path or the silent fallback path. Site deploys target a
      // cloud env, so a local resolution reached via the silent fallback is a hard failure.
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
      const gitUtils = new GitUtils(process.cwd());
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

      // 2. Request deploy token with file list
      const tokenResponse = await apiClient.invoke('get_site_deploy_token', {
        community_id: communityId,
        app_id: appId,
        files: fileList.map(f => ({ path: f.path, hash: f.hash, size: f.size, content_type: f.content_type })),
        preview: options.preview || false
      });

      const { signed_urls, upload_headers, existing_manifest, token_id, site_url } = tokenResponse.message;

      // 3. Determine delta
      let filesToUpload = fileList;
      let filesToDelete = [];

      if (!options.full && existing_manifest) {
        const delta = gitUtils.compareSyncState(localFiles, existing_manifest);
        filesToUpload = fileList.filter(f =>
          delta.added.includes(f.path) || delta.modified.includes(f.path)
        );
        filesToDelete = delta.deleted;

        console.log(chalk.gray(`  Delta: ${delta.added.length} added, ${delta.modified.length} modified, ${delta.unchanged.length} unchanged, ${delta.deleted.length} deleted`));
      }

      if (options.dryRun) {
        console.log(chalk.yellow('\n  Dry run - would upload:'));
        if (filesToUpload.length === 0) {
          console.log(chalk.gray('  (no files to upload)'));
        } else {
          filesToUpload.forEach(f => console.log(chalk.gray(`  + ${f.path} (${(f.size / 1024).toFixed(1)}KB)`)));
        }
        if (filesToDelete.length > 0) {
          console.log(chalk.yellow('\nWould delete:'));
          filesToDelete.forEach(f => console.log(chalk.gray(`  - ${f}`)));
        }
        console.log(chalk.gray(`\n  Site URL: ${site_url}\n`));
        return;
      }

      if (filesToUpload.length === 0) {
        console.log(chalk.green('\n  Site already up to date on GCS.'));
        console.log(chalk.gray('  Ensuring app metadata is synchronized...'));
        // Fall through to confirm_site_deploy to ensure DB is updated
      } else {
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
          console.log(chalk.yellow(`\n  ${uploadErrors.length} errors during upload:`));
          uploadErrors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        }
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
      console.log(chalk.gray(`  Deployed: ${result.deployed_at}`));
      if (result.preview) {
        console.log(chalk.yellow(`  Mode: PREVIEW`));
      }

      if (!options.preview) {
        console.log(chalk.gray(`\n  For local development, run:`));
        console.log(chalk.cyan(`    descix site servelocal <port>\n`));
      }
      console.log('');

    } catch (error) {
      console.error(chalk.red(`\n  Upload failed: ${error.message}\n`));
      process.exit(1);
    }
  });

// site servelocal - Register local dev server port
siteCommand
  .command('servelocal [port]')
  .description('Register local dev server port (or "n" to disable)')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .action(async (port, options) => {
    try {
      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);

      const appId = ctx.appId;

      if (!appId) {
        console.error(chalk.red('\n❌ App ID required.'));
        console.log(chalk.gray('  Either provide -a flag, or cd into an app directory\n'));
        process.exit(1);
      }

      // Handle disable case — setSitePort(appId, null) removes site.port / cleans site.{}
      if (port === 'n' || port === 'N') {
        await workspaceConfig.setSitePort(appId, null);
        console.log(chalk.green(`\n✅ Local site server disabled for ${appId}\n`));
        return;
      }

      // Handle status query (no port argument)
      if (!port) {
        const appConfig = workspaceConfig.getAppByAppId(appId);
        if (!appConfig) {
          console.error(chalk.red('\n❌ App not found in workspace.json.'));
          console.log(chalk.gray('  Run "npx descix init" to set up your workspace.\n'));
          process.exit(1);
        }
        // Read site.port from the live env entry (not from the constructed copy)
        let liveEntry = null;
        if (workspaceConfig.env?.platform?.appId === appId) {
          liveEntry = workspaceConfig.env.platform;
        } else if (Array.isArray(workspaceConfig.env?.products)) {
          liveEntry = workspaceConfig.env.products.find(p => p.appId === appId) || null;
        }
        const currentPort = liveEntry?.site?.port;
        if (currentPort) {
          console.log(chalk.cyan(`\n📍 Local site server: port ${currentPort}`));
          console.log(chalk.gray(`  App: ${appId}\n`));
        } else {
          console.log(chalk.yellow(`\n⚠️  No local site server configured.`));
          console.log(chalk.gray(`  Usage: descix site servelocal <port>\n`));
        }
        return;
      }

      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(chalk.red('\n❌ Invalid port number.\n'));
        process.exit(1);
      }

      // setSitePort mutates the live env entry and saves — no stale-copy problem
      await workspaceConfig.setSitePort(appId, portNum);
      console.log(chalk.green(`\n✅ Local site server registered!`));
      console.log(chalk.cyan(`  Port: ${portNum}`));
      console.log(chalk.gray(`  App: ${appId}`));
      console.log(chalk.gray(`\n  The gateway will proxy /p/${appId}/* to localhost:${portNum}\n`));

    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
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
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question(chalk.yellow(`\n⚠️  Delete site for ${communityId}/${appId}${options.preview ? ' (preview)' : ''}? (y/N) `), resolve);
        });
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
        console.error(chalk.red('\n❌ App not found in workspace.json.'));
        console.log(chalk.gray('  Run "npx descix init" to set up your workspace.\n'));
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
        console.log(chalk.gray(`\n   Add a port to workspace.json under env.products entry for '${ctx.appId}':`));
        console.log(chalk.gray(`     "microservice": { "port": <your-port> }`));
        console.log(chalk.gray(`\n   A 'descix app set-port' command for this is tracked as WS-CLI-MESH-ROUTING-GAP.\n`));
        process.exit(1);
      }

      console.log(chalk.cyan('\n📁 Adding microservice scaffold...\n'));

      const { copyScaffold } = await import('../lib/core/Hydrator.js');
      const stats = await copyScaffold('microservice', appPath, {
        verbose: true,
        force: options.force
      });

      // Configuration Injection
      const microserviceDir = path.join(appPath, 'microservice');
      const defaultsPath = path.join(microserviceDir, 'defaults-config.json');
      const manifestPath = path.join(microserviceDir, 'manifest.json');
      const overridesPath = path.join(microserviceDir, 'dev-overrides.json');

      // 1. Inject Context + Port into defaults-config.json
      try {
        const defaultsContent = await fs.readFile(defaultsPath, 'utf-8');
        const defaults = JSON.parse(defaultsContent);
        defaults.community_id = ctx.communityId;
        defaults.app_id = ctx.appId;
        defaults.LOCAL_PORT = microservicePort;
        await fs.writeFile(defaultsPath, JSON.stringify(defaults, null, 2));
        console.log(chalk.gray(`  ✓ Injected context + port into defaults-config.json`));
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not update defaults-config.json: ${err.message}`));
      }

      // 2. Inject Context + Port into manifest.json
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        manifest.service.app_id = ctx.appId;
        manifest.service.community_id = ctx.communityId;
        manifest.service.name = ctx.appId;
        manifest.service.domain = `${ctx.appId}.descix.net`;
        manifest.service.debugPort = microservicePort;
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(chalk.gray(`  ✓ Injected context + port into manifest.json`));
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

// microservice deploy - Cloud Run deploy (broker-first; no per-app LB for non-core apps)
// WS-MCP-SURFACE-SPLIT §4b: this is the REAL Admin/local deploy (Admin SDK) — it stays fully
// functional for operator/CI use (EVP/COS deploy runbooks invoke it). It is intentionally NOT
// advertised over MCP (not mcp:true), so the PUBLIC surface sees no deploy tool. The public
// "microservice deploy" is "coming soon" (a no-op) — satisfied here by absence from the MCP
// listing, NOT by neutering this admin path. Do not stub this out.
microserviceCommand
  .command('deploy')
  .description('[ADMIN/LOCAL] Deploy microservice to Cloud Run (uses deploy-service-env.sh; powch re-provisions platform NEG only). Public MCP deploy is coming soon; this real deploy is Admin/local-only.')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('--env <env>', 'Target environment: dev|demo|prod')
  .option('--dry-run', 'Print deploy plan without executing gcloud')
  .option('--skip-register', 'Skip manifest registration after deploy (service may self-register on boot)')
  .action(async (options, command) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);

      const workspaceConfig = await WorkspaceConfig.load();
      const ctx = workspaceConfig.resolveContextWithOptions(options);
      const appId = ctx.appId;

      if (!appId) {
        console.error(chalk.red('\n❌ App ID required.'));
        console.log(chalk.gray('  cd into an app directory, or use -a flag\n'));
        process.exit(1);
      }

      const parentEnv = command?.parent?.opts?.()?.env;
      const deployEnv = (options.env || parentEnv || workspaceConfig.env?.environment)?.toLowerCase();
      if (!deployEnv || !['dev', 'demo', 'prod'].includes(deployEnv)) {
        console.error(chalk.red('\n❌ --env is required (dev|demo|prod).'));
        console.log(chalk.gray('  Example: descix --env demo microservice deploy -a powch\n'));
        process.exit(1);
      }

      const workspaceRoot = workspaceConfig.getWorkspaceRoot();
      if (!workspaceRoot) {
        throw new Error('Could not resolve workspace root (.descix/workspace.json not found)');
      }

      const deployScript = path.join(
        workspaceRoot,
        'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh'
      );

      try {
        await fs.access(deployScript);
      } catch {
        throw new Error(`Deploy script not found: ${deployScript}`);
      }

      console.log(chalk.cyan(`\n🚀 Deploying microservice: ${appId} (${deployEnv})\n`));
      if (options.dryRun) {
        console.log(chalk.yellow('  Dry run — gcloud deploy will not execute\n'));
      }

      const { spawnSync } = await import('child_process');
      const result = spawnSync('bash', [deployScript, appId, deployEnv], {
        cwd: path.dirname(deployScript),
        env: {
          ...process.env,
          ECHO_MODE: options.dryRun ? 'true' : 'false'
        },
        stdio: 'inherit'
      });

      if (result.status !== 0) {
        process.exit(result.status || 1);
      }

      if (options.skipRegister) {
        console.log(chalk.gray('\n  Skipped manifest registration (--skip-register).\n'));
        return;
      }

      const microserviceDir = workspaceConfig.getMicroservicePath(appId);
      if (!microserviceDir) {
        console.log(chalk.yellow('\n⚠️  Deploy complete. Run descix microservice register to register manifest.\n'));
        return;
      }

      const manifestPath = path.join(microserviceDir, 'manifest.json');
      try {
        await fs.access(manifestPath);
      } catch {
        console.log(chalk.yellow('\n⚠️  Deploy complete. No manifest.json — run descix microservice register when ready.\n'));
        return;
      }

      console.log(chalk.cyan('\n📦 Registering microservice manifest...\n'));
      const registerArgs = [
        process.argv[1],
        'microservice',
        'register',
        '-m', manifestPath,
        '-a', appId
      ];
      if (ctx.communityId) {
        registerArgs.push('-c', ctx.communityId);
      }

      const registerResult = spawnSync(process.execPath, registerArgs, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env
      });

      if (registerResult.status !== 0) {
        console.log(chalk.yellow('\n⚠️  Cloud Run deploy succeeded but manifest registration failed.'));
        console.log(chalk.gray(`  Retry: descix microservice register -m ${manifestPath} -a ${appId}\n`));
        process.exit(registerResult.status || 1);
      }

      console.log(chalk.green('\n✅ Microservice deploy complete (Cloud Run + manifest registration).\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Deploy failed: ${error.message}\n`));
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
  .description('Reload microservice manifests (admin only)')
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

const repCommand = program
  .command('rep')
  .description('Reputation operations');

repCommand
  .command('grant')
  .description('Grant REP points to a user (admin/dev only)')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-u, --user <id>', 'User ID')
  .requiredOption('-a, --amount <amount>', 'REP amount to grant')
  .option('--reason <text>', 'Reason for granting REP')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const amount = parseInt(options.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a positive integer');
      }
      
      const response = await apiClient.invoke('increment_rep', {
        community_id: options.community,
        user_id: options.user,
        amount: amount,
        reason: options.reason || 'CLI grant'
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ REP granted!\n'));
      console.log(chalk.cyan(`  User: ${options.user}`));
      console.log(chalk.gray(`  Community: ${options.community}`));
      console.log(chalk.gray(`  Amount: +${amount} REP`));
      console.log(chalk.gray(`  New Total: ${result.new_total || result.rep || 'N/A'}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// ============ Chat Session Management ============

/**
 * Get interaction_id from session file
 * @param {string} communityId 
 * @param {string} appId 
 * @returns {Promise<string|null>}
 */
async function getSessionInteractionId(communityId, appId) {
    const sessionPath = path.join(os.homedir(), '.descix', 'sessions', `${communityId}_${appId}.json`);
    try {
        const data = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
        return data.interaction_id || null;
    } catch {
        return null;
    }
}

/**
 * Save interaction_id to session file
 * @param {string} communityId 
 * @param {string} appId 
 * @param {string} interactionId 
 */
async function saveSessionInteractionId(communityId, appId, interactionId) {
    const sessionDir = path.join(os.homedir(), '.descix', 'sessions');
    await fs.mkdir(sessionDir, { recursive: true });
    const sessionPath = path.join(sessionDir, `${communityId}_${appId}.json`);
    await fs.writeFile(sessionPath, JSON.stringify({ 
        interaction_id: interactionId, 
        updated: Date.now() 
    }, null, 2));
}

/**
 * Clear session file
 * @param {string} communityId 
 * @param {string} appId 
 */
async function clearSession(communityId, appId) {
    const sessionPath = path.join(os.homedir(), '.descix', 'sessions', `${communityId}_${appId}.json`);
    try {
        await fs.unlink(sessionPath);
    } catch {
        // File doesn't exist, that's fine
    }
}

/**
 * WS-R7-PREREQS (CEO-D-2026-07-04-R7-PREREQS-RESCOPE ruling 3) session helpers.
 *
 * Session files are keyed {community_id}_{app_id}.json where community_id is the
 * SERVER-resolved value (returned by app-scoped commands). Before the server response
 * arrives the community may be unknown client-side — app_id is globally unique on the
 * platform (product_id === app_id), so `*_{appId}.json` identifies the app's sessions
 * unambiguously and the newest file is the current thread.
 */

/**
 * List existing session files for an app, newest first.
 * @param {string} appId
 * @returns {Promise<Array<{communityId: string, path: string, updated: number}>>}
 */
async function findSessionsForApp(appId) {
    const sessionDir = path.join(os.homedir(), '.descix', 'sessions');
    const suffix = `_${appId}.json`;
    let entries = [];
    try {
        entries = await fs.readdir(sessionDir);
    } catch {
        return [];
    }
    const results = [];
    for (const name of entries) {
        if (!name.endsWith(suffix)) continue;
        const communityId = name.slice(0, name.length - suffix.length);
        if (!communityId) continue;
        const filePath = path.join(sessionDir, name);
        let updated = 0;
        try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            updated = data.updated || 0;
        } catch {
            continue; // unreadable session file — skip, do not guess
        }
        results.push({ communityId, path: filePath, updated });
    }
    results.sort((a, b) => b.updated - a.updated);
    return results;
}

/**
 * Save the session under the AUTHORITATIVE community key and self-heal: remove any
 * session files for the same app keyed under a DIFFERENT community (e.g. the legacy
 * hardcoded 'descix_*' mis-keys this fix removes). One app = one live session file.
 * @param {string} communityId - server-resolved community_id
 * @param {string} appId
 * @param {string} interactionId
 */
async function saveSessionAuthoritative(communityId, appId, interactionId) {
    const stale = (await findSessionsForApp(appId)).filter(s => s.communityId !== communityId);
    await saveSessionInteractionId(communityId, appId, interactionId);
    for (const st of stale) {
        try { await fs.unlink(st.path); } catch { /* already gone */ }
    }
}

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
        if (communityId) {
          await clearSession(communityId, appId);
        } else {
          for (const st of await findSessionsForApp(appId)) {
            try { await fs.unlink(st.path); } catch { /* already gone */ }
          }
        }
      }

      // Resolve KB param — single or multi
      const kbList = options.kb || ['General'];
      const useMultiKb = kbList.length > 1 || kbList.includes('*');

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
      } else {
        invokeParams.knowledgebase_name = kbList[0];
      }

      const response = await apiClient.invoke('ask_question_to_app', invokeParams);
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
      if (options.community) {
        await clearSession(options.community, appId);
        console.log(chalk.green(`Chat session cleared for ${options.community}/${appId}. Next chat will start fresh.`));
      } else {
        const sessions = await findSessionsForApp(appId);
        for (const st of sessions) {
          try { await fs.unlink(st.path); } catch { /* already gone */ }
        }
        console.log(chalk.green(`Chat session cleared for ${appId} (${sessions.length} session file(s)). Next chat will start fresh.`));
      }
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
      process.exit(1);
    }
  });

configCommand
  .command('set-url')
  .description('Set API URL')
  .argument('<url>', 'API URL (e.g., https://localhost:4000)')
  .option('-g, --global', 'Save to global config (~/.descixrc)')
  .action(async (url, options) => {
    try {
      await configCommands.setUrl(url, options);
    } catch (error) {
      process.exit(1);
    }
  });

configCommand
  .command('init')
  .description('Initialize configuration')
  .option('--dev', 'Initialize for development (https://localhost:4000)')
  .option('-g, --global', 'Save to global config (~/.descixrc)')
  .action(async (options) => {
    try {
      const env = options.dev ? 'dev' : 'prod';
      await configCommands.init(env, options);
    } catch (error) {
      process.exit(1);
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
      process.exit(1);
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

import * as mcpCommands from '../lib/commands/mcp.js';
import { runClone } from '../lib/commands/clone.js';

const mcpCommand = program
  .command('mcp')
  .description('MCP server operations');

mcpCommand
  .command('init')
  .description('Initialize MCP server for this workspace')
  .action(async () => {
    try {
      await mcpCommands.init();
    } catch (error) {
      process.exit(1);
    }
  });

mcpCommand
  .command('test')
  .description('Test MCP server with a sample query')
  .option('-q, --query <text>', 'Test query', 'What is this knowledge base about?')
  .action(async (options) => {
    try {
      await mcpCommands.test(options);
    } catch (error) {
      process.exit(1);
    }
  });

mcpCommand
  .command('config')
  .description('Show current workspace configuration')
  .action(async () => {
    try {
      await mcpCommands.config();
    } catch (error) {
      process.exit(1);
    }
  });

mcpCommand
  .command('quickstart')
  .description('One-command setup: authenticate, configure, and test')
  .action(async () => {
    try {
      await mcpCommands.quickstart();
    } catch (error) {
      process.exit(1);
    }
  });

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

      console.log(chalk.gray(`Executing ${options.tool}...`));

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
  .option('-s, --scope <scope>', 'Search scope: project, entitlements (default), discovery', 'entitlements')
  .option('-j, --json', 'Output raw JSON response')
  .action(async (question, options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const { scope, json: jsonOutput } = options;
      
      // Validate scope
      const validScopes = ['project', 'entitlements', 'discovery'];
      if (!validScopes.includes(scope)) {
        console.error(chalk.red(`Invalid scope '${scope}'. Must be one of: ${validScopes.join(', ')}`));
        process.exit(1);
      }
      
      // Get project context for 'project' scope
      let project_context = null;
      if (scope === 'project') {
        try {
          const { WorkspaceConfig } = await import('../lib/workspace-config.js');
          const wsConfig = await WorkspaceConfig.load(process.cwd());
          if (wsConfig) {
            // Extract community_ids from primaryCommunity and directoryMappings
            const communityIds = new Set();
            const appIds = new Set();
            
            if (wsConfig.primaryCommunity) {
              communityIds.add(wsConfig.primaryCommunity);
            }
            
            // Extract from directoryMappings
            for (const mapping of Object.values(wsConfig.directoryMappings || {})) {
              if (mapping.communityId) communityIds.add(mapping.communityId);
              if (mapping.appId) appIds.add(mapping.appId);
            }
            
            // Extract from defaultContext
            if (wsConfig.defaultContext?.communityId) {
              communityIds.add(wsConfig.defaultContext.communityId);
            }
            if (wsConfig.defaultContext?.appId) {
              appIds.add(wsConfig.defaultContext.appId);
            }
            
            project_context = {
              community_ids: Array.from(communityIds),
              app_ids: Array.from(appIds)
            };
          }
        } catch (e) {
          console.error(chalk.yellow(`⚠️  Could not read .descix/workspace.json for project scope`));
          console.error(chalk.gray(`    Run 'descix init' first, or use --scope entitlements`));
          process.exit(1);
        }
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

// ============ Update Commands (Context-Driven) ============

const updateCommand = program
  .command('update')
  // [DUPLICATE:WS-MCP-STEP3] The `update [type]` dispatcher (app/kb/site/all/auto) is a
  // DUPLICATE family: `update app` -> updateApp() (== `sync assets`), `update site` ->
  // updateSite() (== `sync site`, == `site upload`), `update kb` -> updateKB() (runKbChunk+
  // runKbSync, == `sync kb`, superseded by `kb corpus sync`). Tier 3: this whole family + the
  // shared updateApp()/updateSite() bodies are the remaining home of the legacy Drive updateApp
  // and duplicate updateSite AFTER Step-3 Tier 2 removed the `sync assets`/`sync site` blocks.
  // `update kb` deletion is additionally blocked by `.descix/sync-kb-sources.sh`. MARK only —
  // deletion needs the Tier-3 `update`-family design decision (consolidated-triage §5.4b).
  .description('[DUPLICATE → app: `app sync-assets`; site: `site upload`; kb: `kb corpus sync`] Context-driven resource sync (auto-detects from workspace). Slated for removal in WS-MCP Step 3 Tier 3.')
  .argument('[type]', 'Update type: app, kb, site, all (auto-detects if not specified)')
  .option('-c, --community <id>', 'Community ID (optional; app_id sufficient for Unified Registry)')
  .option('-a, --app <id>', 'App ID (globally unique; required if not in app directory)')
  .option('--kb <name>', 'Specific KB to update (for kb type)')
  .option('--stage1', 'KB: Local to Drive only (skip vectorization)')
  .option('--preview', 'Site: Deploy to preview URL')
  .option('--build <cmd>', 'Site: Run build command first')
  .option('--full', 'Force full sync (ignore delta)')
  .option('--port <number>', 'Site: Register local dev server port')
  .action(async (type, options) => {
    try {
      switch (type) {
        case 'app':
          await updateCommands.updateApp(options);
          break;
        case 'kb':
          await updateCommands.updateKB({ ...options, stage1Only: options.stage1 });
          break;
        case 'site':
          await updateCommands.updateSite({ 
            ...options,
            port: options.port ? parseInt(options.port) : undefined
          });
          break;
        case 'all':
          await updateCommands.updateAll(options);
          break;
        default:
          // Auto-detect
          await updateCommands.updateAuto(options);
      }
    } catch (error) {
      process.exit(1);
    }
  });

// ============ Local Gateway Command ============

program
  .command('serve')
  .description('Start the unified local gateway (reverse-proxy for PWA, Core, Powch, microservices)')
  .option('-p, --port <port>', 'Gateway port', '5173')
  .option('-w, --workspace <path>', 'Workspace root override')
  .action(async (options) => {
    try {
      const { runServe } = await import('../lib/commands/serve.js');
      await runServe({
        port: parseInt(options.port, 10),
        workspaceRoot: options.workspace || process.cwd(),
      });
    } catch (error) {
      console.error(chalk.red('Gateway error:', error.message));
      process.exit(1);
    }
  });

// ============ Quickstart Command ============

program
  .command('quickstart')
  .description('One-command setup: auth → workspace → agent files → MCP config')
  .option('-u, --url <url>', 'API URL override')
  .option('--dev', 'Use development server (https://localhost:4000)')
  .action(async (options) => {
    const { generateAgentFiles, generateMcpConfig } = await import('../lib/agent-files.js');
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
      if (options.dev) loginOptions.dev = true;
      await authCommands.loginDevice(loginOptions);
    }

    // Step 2: Workspace init — create workspace.json if missing
    const wsConfigPath = path.join(workspaceRoot, '.descix', 'workspace.json');
    let hasWorkspace = false;
    try {
      await fs.access(wsConfigPath);
      hasWorkspace = true;
      console.log(chalk.green('✓ Workspace already initialized'));
    } catch { /* missing */ }

    if (!hasWorkspace) {
      console.log(chalk.cyan('\n📋 Initialize Workspace\n'));
      await runInit({ path: workspaceRoot });
    }

    // Step 3: Generate agent instruction files
    console.log(chalk.cyan('\n📋 Generating Agent Instructions\n'));
    const written = await generateAgentFiles(workspaceRoot);
    for (const f of written) {
      console.log(chalk.green(`  ✓ ${f}`));
    }

    // Step 4: Generate .vscode/mcp.json (skipped if DeSciX extension handles MCP)
    const mcpWritten = await generateMcpConfig(workspaceRoot);
    if (mcpWritten) {
      console.log(chalk.green('  ✓ .vscode/mcp.json'));
    } else {
      console.log(chalk.green('  ✓ MCP handled by DeSciX extension (mcp.json skipped)'));
    }

    // Step 5: Copy SDK assets
    try {
      const { pullSdkAssets } = await import('../lib/wizard/setup.js');
      const pulled = await pullSdkAssets(workspaceRoot);
      if (pulled) console.log(chalk.green('  ✓ .descix/sdk-assets/'));
    } catch { /* setup.js pullSdkAssets may not be exported — skip */ }

    // Done
    console.log(chalk.green('\n✅ Quickstart complete!\n'));
    console.log(chalk.white('Open your editor — the AI knows about DeSciX.\n'));
    console.log(chalk.gray('  Copilot / Cline / Claude Code will have DeSciX MCP tools'));
    console.log(chalk.gray('  Ask: "What DeSciX tools do I have?"\n'));
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

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

