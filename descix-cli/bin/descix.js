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
import { runAppWizard } from '../lib/commands/app-wizard.js';
import * as buyCommands from '../lib/commands/buy.js';
import { runInit } from '../lib/commands/init.js';
import * as folderCommands from '../lib/commands/folder.js';
import * as updateCommands from '../lib/commands/update.js';
import { runStatus } from '../lib/commands/status.js';
import { runDoctor } from '../lib/commands/doctor.js';
import * as kbCommands from '../lib/commands/kb.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const program = new Command();

program
  .name('descix')
  .description('DeSciX CLI - Unified command-line interface')
  .version('1.0.0');

// ============ Authentication Commands (No Auth Required) ============


program
  .command('login')
  .description('Authenticate with DeSciX via device login (opens browser)')
  .option('-u, --url <url>', 'API URL override')
  .option('--dev', 'Use development server (https://localhost:4000)')
  .option('--wallet', 'Use direct wallet connection (advanced, not yet implemented)')
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

// ============ Init Command (Git-aware workspace setup) ============

program
  .command('init')
  .description('Initialize workspace for DeSciX app development (Git-aware)')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <name>', 'App name')
  .option('-p, --path <path>', 'Project path (defaults to current directory)')
  .option('-f, --force', 'Overwrite existing workspace.json')
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

// ============ Sync Commands ============

const syncCommand = program
  .command('sync')
  .description('Content sync operations (context-aware)');

// Context-aware sync: assets
syncCommand
  .command('assets')
  .description('Sync app assets (icon, description, system_instructions) - context-aware')
  .option('--push', 'Push local assets to Drive (default)')
  .option('--pull', 'Pull assets from Drive to local')
  .option('--status', 'Show sync status without syncing')
  .option('-c, --community <id>', 'Community ID (uses context if not provided)')
  .option('-a, --app <id>', 'App ID (uses context if not provided)')
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
      
      if (options.status) {
        console.log(chalk.cyan(`\n📊 Asset Sync Status: ${communityId}/${appId}\n`));
        // TODO: Implement status check
        console.log(chalk.gray('  Status check not yet implemented for assets.\n'));
        return;
      }
      
      if (options.pull) {
        console.log(chalk.cyan(`\n📥 Pulling assets from Drive: ${communityId}/${appId}\n`));
        // TODO: Implement pull
        console.log(chalk.gray('  Pull not yet implemented. Use descix update app for push.\n'));
        return;
      }
      
      // Default: push
      await updateCommands.updateApp(options);
      
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// Context-aware sync: kb
syncCommand
  .command('kb')
  .description('Sync knowledge base files - context-aware')
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

// Context-aware sync: site
syncCommand
  .command('site')
  .description('Sync CodeSite to GCS - context-aware')
  .option('--push', 'Deploy to GCS (default)')
  .option('--preview', 'Deploy to preview URL')
  .option('--status', 'Show deployment status')
  .option('--port <number>', 'Register local dev server port')
  .option('-c, --community <id>', 'Community ID (uses context if not provided)')
  .option('-a, --app <id>', 'App ID (uses context if not provided)')
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
      
      if (options.status) {
        console.log(chalk.cyan(`\n📊 Site Status: ${communityId}/${appId}\n`));
        const response = await apiClient.invoke('get_site_manifest', {
          community_id: communityId, app_id: appId
        });
        const result = response.message || response;
        if (result.manifest) {
          console.log(chalk.gray(`  Files: ${Object.keys(result.manifest.files || {}).length}`));
          console.log(chalk.gray(`  URL: ${result.site_url}\n`));
        } else {
          console.log(chalk.gray('  No site deployed.\n'));
        }
        return;
      }
      
      // Default: push
      await updateCommands.updateSite({ 
        ...options,
        preview: options.preview,
        port: options.port ? parseInt(options.port) : undefined
      });
      
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

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
  .requiredOption('-c, --community <id>', 'Community ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('get_community', { community_id: options.community }, { allowGuest: false });
      const result = response.message || response;
      const community = result.community;
      
      console.log(chalk.green('\n✅ Community Information:\n'));
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
  .description('Community creation is via PWA (Workspace Config). Admins: use descix-admin community create')
  .action(async () => {
    console.log(chalk.cyan('\n📦 Community creation\n'));
    console.log(chalk.white('Create communities in the PWA (Workspace Config / Device Setup).'));
    console.log(chalk.white('Platform admins can use: descix-admin community create -n "Name" -t SYMBOL\n'));
    console.log(chalk.gray('  descix-admin uses the same workspace root and .descix/wallet.json as this CLI.\n'));
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
  .description('Initialize local workspace and Firestore KB for an app (idempotent)')
  .requiredOption('-a, --app <app_id>', 'App ID (e.g. daita)')
  .option('--kb <name>', 'Knowledge base name', 'General')
  .option('-p, --path <dir>', 'Local app directory (default: auto-detected or cwd)')
  .option('-c, --community <community_id>', 'Community to create app in (if not yet in Products registry)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      const appId = options.app;
      const kbId = options.kb || 'General';

      // Resolve community_id from Products registry
      let communityId;
      try {
        const productCtx = await apiClient.invoke('get_product_context', { app_id: appId });
        communityId = (productCtx.message || productCtx).community_id;
      } catch (e) {
        // Product not found — fall through to creation below
      }
      // Product missing or returned null community_id — create if --community was provided
      if (!communityId) {
        if (options.community) {
          console.log(chalk.gray(`  App '${appId}' not in Products registry. Creating in community '${options.community}'...`));
          await apiClient.invoke('create_app_for_community', {
            community_id: options.community,
            app_name: appId,
          });
          communityId = options.community;
          console.log(chalk.green(`  ✓ Created App + Products + Purchase for ${appId}`));
        } else {
          throw new Error(`App '${appId}' not found in Products registry. Use --community to create it.`);
        }
      }

      // 1. Workspace.json — register app if not already mapped
      const workspaceConfig = await WorkspaceConfig.tryLoad();
      const alreadyMapped = workspaceConfig?.getAppByAppId(appId);
      let appPath = alreadyMapped?.absolutePath;

      if (!alreadyMapped) {
        const localPath = options.path || '.';
        const wsRoot = workspaceConfig?.workspaceRoot || process.cwd();
        const cfg = workspaceConfig || new WorkspaceConfig({}, wsRoot);
        cfg.registerApp(communityId, appId, { localPath, kbId });
        await cfg.save(wsRoot);
        appPath = path.resolve(wsRoot, localPath);
        console.log(chalk.gray(`  workspace.json updated: ${appId} → ${localPath}`));
      }

      // 2. Create rigid app folder structure (site, kb, microservice)
      if (appPath) {
        const siteDir = path.join(appPath, 'site');
        const kbDir = path.join(appPath, 'kb', kbId);
        const msDir = path.join(appPath, 'microservice');
        await fs.mkdir(siteDir, { recursive: true });
        await fs.mkdir(kbDir, { recursive: true });
        await fs.mkdir(msDir, { recursive: true });
        console.log(chalk.gray(`  Created: site/, kb/${kbId}/, microservice/`));
      }

      // 3. Create KnowledgeBase Firestore doc (Git Mode — no Drive required)
      const kbResponse = await apiClient.invoke('init_git_mode_kb', { app_id: appId, kb_name: kbId });
      const kbResult = kbResponse.message || kbResponse;

      console.log(chalk.green(`\n✓ ${appId} initialized`));
      console.log(chalk.gray(`  Community: ${communityId}`));
      console.log(chalk.gray(`  KB: ${kbId} — ${kbResult.created ? 'created' : 'already exists'}\n`));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.gray(`  Add markdown files to kb/${kbId}/ then run:`));
      console.log(chalk.white(`  descix update kb -a ${appId}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('register-folder')
  .description('Register your base Drive folder (must be shared with dip@descix.net)')
  .option('-u, --url <folderUrl>', 'Drive folder URL or ID')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      if (!options.url) {
        console.error(chalk.red('Error: Folder URL or ID required. Use -u or --url'));
        process.exit(1);
      }
      
      const response = await apiClient.invoke('register_base_folder', {
        folder_url: options.url
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Folder registered successfully!\n'));
      console.log(chalk.cyan(`  Folder ID: ${result.folder_id}`));
      console.log(chalk.gray(`  Folder Name: ${result.folder_name}\n`));
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('create')
  .description('Create an app in a community. --quick with -c/-a for CLI-driven creation.')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <name>', 'App name')
  .option('--quick', 'Create app via CLI (registers in Products, creates Drive skeleton); requires -c and -a')
  .option('--overwrite', 'Overwrite existing (with --quick)')
  .action(async (options) => {
    try {
      if (options.quick && options.community && options.app) {
        const apiClient = new DeSciXApiClient();
        await requireAuth(apiClient);

        // Ensure Drive base folder is registered in workspace.json
        let wsConfig;
        try {
          wsConfig = await WorkspaceConfig.load(process.cwd());
        } catch {
          console.error(chalk.red('\n❌ No workspace found. Run `descix init` first.\n'));
          process.exit(1);
        }
        const baseFolderId = wsConfig.driveConfig?.base_folder_id;

        if (!baseFolderId) {
          console.log(chalk.yellow('\n⚠  No Drive base folder registered in workspace.json.'));
          console.log(chalk.white('  App creation requires a shared Drive folder for KB and asset storage.'));
          console.log(chalk.white('  Share a Google Drive folder with dip@descix.net, then provide its URL.\n'));

          const readline = await import('readline');
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const folderUrl = await new Promise((resolve) => {
            rl.question(chalk.cyan('  Drive folder URL or ID: '), (answer) => {
              rl.close();
              resolve(answer.trim());
            });
          });

          if (!folderUrl) {
            console.error(chalk.red('\n❌ Drive folder is required for app creation.\n'));
            process.exit(1);
          }

          // Register the folder via backend (validates sharing + extracts folder ID)
          const regResponse = await apiClient.invoke('register_base_folder', {
            folder_url: folderUrl
          });
          const regResult = regResponse.message || regResponse;
          console.log(chalk.green(`  ✓ Folder registered: ${regResult.folder_name} (${regResult.folder_id})`));

          // Persist to workspace.json
          wsConfig.driveConfig = { base_folder_id: regResult.folder_id };
          await wsConfig.save();
          console.log(chalk.green('  ✓ Saved to workspace.json\n'));
        }

        const response = await apiClient.invoke('create_app_for_community', {
          community_id: options.community,
          app_name: options.app,
          create_skeleton: true,
          overwrite: options.overwrite
        });
        const result = response.message || response;
        console.log(chalk.green('\n✅ App created successfully!\n'));
        console.log(chalk.cyan(`  App ID:     ${result.app_id}`));
        console.log(chalk.cyan(`  Community:  ${result.community_id}`));
        console.log(chalk.gray(`  Products:   Products/${result.app_id}`));
        console.log(chalk.gray(`  Firestore:  Community/${result.community_id}/Apps/${result.app_id}`));
        if (result.skeleton_result) {
          console.log(chalk.gray(`  Drive:      ${result.skeleton_result.folder_id || 'created'}`));
        }
        console.log(chalk.cyan('\n  Next: descix app init -a ' + result.app_id + '\n'));
        return;
      }
      console.log(chalk.cyan('\n📦 App creation\n'));
      console.log(chalk.white('Create apps in the PWA (Device Setup / App Manager) or via CLI:\n'));
      console.log(chalk.white('  descix app create --quick -c <community> -a <app-name>\n'));
      console.log(chalk.gray('This registers the app in the Products registry, creates Firestore'));
      console.log(chalk.gray('documents, grants entitlement, and creates Drive skeleton.\n'));
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

appCommand
  .command('upload')
  .description('Upload local files to app knowledge base')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-p, --path <localPath>', 'Local folder path')
  .option('-k, --kb <id>', 'Knowledge Base ID', 'General')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Read files from local path
      const localPath = options.path;
      const stats = await fs.stat(localPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${localPath}`);
      }
      
      console.log(chalk.gray(`Reading files from ${localPath}...`));
      
      // Recursively read files
      const files = [];
      async function readDir(dirPath, basePath = '') {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            await readDir(fullPath, relPath);
          } else if (entry.isFile()) {
            const content = await fs.readFile(fullPath, 'utf-8');
            files.push({
              name: entry.name,
              path: relPath,
              content: Buffer.from(content).toString('base64')  // Base64 encode
            });
          }
        }
      }
      
      await readDir(localPath);
      
      if (files.length === 0) {
        throw new Error('No files found in the specified directory');
      }
      
      console.log(chalk.gray(`Found ${files.length} files. Uploading...`));
      
      const response = await apiClient.invoke('upload_files_to_kb', {
        community_id: options.community,
        app_id: options.app,
        kb_id: options.kb,
        files: files
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Files uploaded successfully!\n'));
      console.log(chalk.cyan(`  Uploaded: ${result.uploaded || 0} files`));
      console.log(chalk.gray(`  Total Vectors: ${result.totalVectors || 0}\n`));
      
      if (result.errors && result.errors.length > 0) {
        console.log(chalk.yellow('  Errors:'));
        result.errors.forEach(err => {
          console.log(chalk.red(`    - ${err.file}: ${err.error}`));
        });
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('upload-tree')
  .description('Upload folder tree with subfolders as KBs')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-p, --path <localPath>', 'Local folder path')
  .option('--confirm', 'Confirm each subfolder as KB')
  .option('--dry-run', 'Show what would be uploaded without uploading')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const readline = await import('readline');
      
      const localPath = options.path;
      const stats = await fs.stat(localPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${localPath}`);
      }
      
      console.log(chalk.gray(`Scanning ${localPath}...\n`));
      
      // Find top-level subdirectories
      const entries = await fs.readdir(localPath, { withFileTypes: true });
      const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      const rootFiles = entries.filter(e => e.isFile() && !e.name.startsWith('.'));
      
      if (subdirs.length === 0) {
        throw new Error('No subdirectories found. Use "app upload" for single KB upload.');
      }
      
      console.log(chalk.cyan(`Found ${subdirs.length} subdirectories:\n`));
      
      // Count files in each subdirectory
      const subdirInfo = [];
      for (const dir of subdirs) {
        const dirPath = path.join(localPath, dir.name);
        const files = await readDirectoryFiles(dirPath);
        subdirInfo.push({
          name: dir.name,
          path: dirPath,
          fileCount: files.length
        });
        console.log(chalk.gray(`  [${subdirInfo.length}] ${dir.name}/ (${files.length} files)`));
      }
      
      if (rootFiles.length > 0) {
        console.log(chalk.yellow(`\n  Note: ${rootFiles.length} root-level files will go to "General" KB\n`));
      }
      
      if (options.dryRun) {
        console.log(chalk.cyan('\n✅ Dry run complete. Use without --dry-run to upload.\n'));
        return;
      }
      
      // Confirm each subdirectory if --confirm flag
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const askYesNo = (question, defaultYes = true) => {
        return new Promise((resolve) => {
          const suffix = defaultYes ? '(Y/n)' : '(y/N)';
          rl.question(`${question} ${suffix}: `, (answer) => {
            const trimmed = answer.trim().toLowerCase();
            resolve(trimmed === '' ? defaultYes : (trimmed === 'y' || trimmed === 'yes'));
          });
        });
      };
      
      const kbsToUpload = [];
      for (const info of subdirInfo) {
        if (options.confirm) {
          const proceed = await askYesNo(`Create KB "${info.name}" and upload ${info.fileCount} files?`, true);
          if (!proceed) {
            console.log(chalk.gray(`  Skipping ${info.name}\n`));
            continue;
          }
        }
        kbsToUpload.push(info);
      }
      
      rl.close();
      
      if (kbsToUpload.length === 0) {
        console.log(chalk.yellow('\n⚠️  No KBs selected for upload.\n'));
        return;
      }
      
      // Upload each subdirectory as a KB
      for (const info of kbsToUpload) {
        console.log(chalk.cyan(`\n📦 Uploading to KB "${info.name}"...`));
        
        // Create KB if it doesn't exist
        try {
          await apiClient.invoke('create_skeleton_kb', {
            community_id: options.community,
            app_id: options.app,
            kb_name: info.name
          });
          console.log(chalk.gray(`  ✓ KB "${info.name}" created`));
        } catch (err) {
          // KB might already exist, continue
          if (!err.message.includes('already exists')) {
            console.log(chalk.yellow(`  ⚠️  Could not create KB: ${err.message}`));
          }
        }
        
        // Read files from subdirectory
        const files = await readDirectoryFiles(info.path);
        
        if (files.length === 0) {
          console.log(chalk.yellow(`  ⚠️  No files found in ${info.name}/`));
          continue;
        }
        
        // Upload in batches
        const BATCH_SIZE = 10;
        let uploaded = 0;
        let errors = [];
        
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(files.length / BATCH_SIZE);
          
          try {
            process.stdout.write(chalk.gray(`    Batch ${batchNum}/${totalBatches}...`));
            const response = await apiClient.invoke('upload_files_to_kb', {
              community_id: options.community,
              app_id: options.app,
              kb_id: info.name,
              files: batch
            });
            const result = response.message || response;
            uploaded += result.uploaded || batch.length;
            if (result.errors) {
              errors.push(...result.errors);
            }
            console.log(chalk.green(' ✓'));
          } catch (err) {
            console.log(chalk.red(` ✗ ${err.message}`));
            errors.push({ batch: batchNum, error: err.message });
          }
        }
        
        console.log(chalk.green(`  ✅ Uploaded ${uploaded} files to KB "${info.name}"`));
        if (errors.length > 0) {
          console.log(chalk.yellow(`    ⚠️  ${errors.length} errors during upload`));
        }
      }
      
      // Handle root files if any
      if (rootFiles.length > 0) {
        console.log(chalk.cyan(`\n📦 Uploading ${rootFiles.length} root files to "General" KB...`));
        const rootFilesData = [];
        for (const file of rootFiles) {
          const filePath = path.join(localPath, file.name);
          const content = await fs.readFile(filePath);
          rootFilesData.push({
            name: file.name,
            path: file.name,
            content: content.toString('base64')
          });
        }
        
        try {
          const response = await apiClient.invoke('upload_files_to_kb', {
            community_id: options.community,
            app_id: options.app,
            kb_id: 'General',
            files: rootFilesData
          });
          const result = response.message || response;
          console.log(chalk.green(`  ✅ Uploaded ${result.uploaded || 0} root files`));
        } catch (err) {
          console.log(chalk.yellow(`  ⚠️  Could not upload root files: ${err.message}`));
        }
      }
      
      console.log(chalk.green('\n✅ Upload tree complete!\n'));
      
      // Helper function to read directory files
      async function readDirectoryFiles(dirPath, basePath = '') {
        const files = [];
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            const subFiles = await readDirectoryFiles(fullPath, relPath);
            files.push(...subFiles);
          } else if (entry.isFile()) {
            // Skip hidden files
            if (entry.name.startsWith('.')) {
              continue;
            }
            const content = await fs.readFile(fullPath);
            files.push({
              name: entry.name,
              path: relPath,
              content: content.toString('base64')
            });
          }
        }
        
        return files;
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

appCommand
  .command('sync')
  .description('Sync knowledge base (vectorize files in Drive folder)')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID', 'General')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('sync_knowledge_base', {
        community_id: options.community,
        app_id: options.app,
        kb_id: options.kb
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Sync initiated!\n'));
      console.log(chalk.cyan(`  KB: ${options.community}/${options.app}/${options.kb}`));
      if (result.note) {
        console.log(chalk.gray(`  Note: ${result.note}\n`));
      }
    } catch (error) {
      console.error(chalk.red(error.message));
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
  .command('deploy')
  .description('Deploy a microservice for an app you own (registers manifest.json)')
  .option('-m, --manifest <path>', 'Path to manifest.json (default: ./manifest.json)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      // Read manifest.json from current directory or specified path
      const manifestPath = path.resolve(options.manifest || './manifest.json');
      
      console.log(chalk.cyan(`\n📦 Deploying microservice from ${manifestPath}\n`));
      
      let manifest;
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(chalk.red(`❌ manifest.json not found at ${manifestPath}`));
          console.error(chalk.gray('\nCreate a manifest.json with your service configuration.'));
          console.error(chalk.gray('See DeSciX_Core/descix-cli/templates/scaffolds/microservice/manifest.json for a template.\n'));
          process.exit(1);
        }
        throw new Error(`Failed to parse manifest.json: ${error.message}`);
      }
      
      // Validate required fields
      if (!manifest.service?.name) {
        throw new Error('manifest.service.name is required');
      }
      if (!manifest.service?.app_id) {
        throw new Error('manifest.service.app_id is required (the app you own)');
      }
      if (!manifest.service?.community_id) {
        throw new Error('manifest.service.community_id is required');
      }
      if (!manifest.service?.domain) {
        throw new Error('manifest.service.domain is required');
      }
      
      console.log(chalk.gray(`  Service: ${manifest.service.name}`));
      console.log(chalk.gray(`  App: ${manifest.service.community_id}/${manifest.service.app_id}`));
      console.log(chalk.gray(`  Domain: ${manifest.service.domain}`));
      console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}\n`));
      
      // Call register_service
      const response = await apiClient.invoke('register_service', { manifest });
      const result = response.message || response;
      
      console.log(chalk.green('✅ Microservice deployed successfully!\n'));
      console.log(chalk.cyan(`  Service: ${manifest.service.name}`));
      console.log(chalk.gray(`  Commands registered: ${Object.keys(manifest.commands || {}).length}`));
      
      if (response.app_updated) {
        console.log(chalk.gray(`  App api_base_url: ${response.api_base_url}`));
      }
      
      console.log(chalk.gray('\n  The service manifest cache will refresh within 5 minutes.'));
      console.log(chalk.gray('  For immediate effect, an admin can run: descix microservice reload\n'));
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Deployment failed: ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Knowledge Base Commands ============

const kbCommand = program
  .command('kb')
  .description('Knowledge base operations');

kbCommand
  .command('create')
  .description('Create a new knowledge base in an app')
  .requiredOption('-c, --community <id>', 'Community ID')
  .requiredOption('-a, --app <id>', 'App ID')
  .requiredOption('-k, --kb <id>', 'Knowledge Base ID')
  .option('--drive-folder <id>', 'Google Drive folder ID (optional, will create if not provided)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const response = await apiClient.invoke('create_skeleton_kb', {
        community_id: options.community,
        app_id: options.app,
        kb_name: options.kb,
        drive_folder_id: options.driveFolder || null
      });
      const result = response.message || response;
      
      console.log(chalk.green('\n✅ Knowledge Base created successfully!\n'));
      console.log(chalk.cyan(`  KB ID: ${options.kb}`));
      console.log(chalk.gray(`  App: ${options.community}/${options.app}`));
      if (result.drive_folder_id) {
        console.log(chalk.gray(`  Drive Folder: ${result.drive_folder_id}\n`));
      }
    } catch (error) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Phase 0 CLI-Centric KB Processing Commands
kbCommand
  .command('pull')
  .description('Pull KB content from Drive and convert to local markdown')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
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

kbCommand
  .command('chunk')
  .description('Generate chunks from local markdown files')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('-s, --chunk-size <size>', 'Chunk size in characters (default: 512)')
  .option('-o, --overlap <size>', 'Overlap between chunks (default: 64)')
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
  .description('Sync local chunks to Pinecone via service layer')
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

kbCommand
  .command('build')
  .description('Full KB pipeline: [push staging] → pull → chunk → sync')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('-s, --chunk-size <size>', 'Chunk size in characters (default: 2000)')
  .option('-o, --overlap <size>', 'Overlap between chunks (default: 500)')
  .option('-v, --verbose', 'Show verbose output')
  .option('-i, --interactive', 'Enable interactive prompts for conflicts')
  .option('--skip-staging', 'Skip staging push step')
  .option('--merge-mode <mode>', 'Pull merge mode: merge|overwrite|force-overwrite (default: merge)')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      await kbCommands.runKbBuild(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

kbCommand
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

kbCommand
  .command('status')
  .description('Show KB sync status (local vs Pinecone)')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      await kbCommands.runKbStatus(apiClient, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

kbCommand
  .command('compare')
  .description('Show file-level deltas between local and Drive')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .option('-k, --kb <id>', 'Knowledge Base ID (default: General)')
  .option('--staging', 'Only show staging → Drive delta')
  .option('--local', 'Only show local KB ↔ Drive delta')
  .action(async (options) => {
    try {
      await kbCommands.runKbCompare(null, options);
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
      
      const appConfig = workspaceConfig.getApp(ctx.communityId, ctx.appId);
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

// site upload - Deploy to GCS (context-aware, replaces deploy)
siteCommand
  .command('upload')
  .description('Upload site to GCS and update app metadata')
  .option('-c, --community <id>', 'Community ID (auto-detects from context)')
  .option('-a, --app <id>', 'App ID (auto-detects from context)')
  .option('-p, --path <localPath>', 'Local directory to deploy', './site')
  .option('--preview', 'Deploy to preview path')
  .option('--full', 'Force full upload (ignore delta)')
  .option('--dry-run', 'Show what would be deployed')
  .option('--no-cache', 'Set Cache-Control: no-cache')
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
      
      // Import GitUtils for file hashing
      const { GitUtils } = await import('@descix/sdk/integrations/git');
      const mime = (await import('mime-types')).default;
      
      const localPath = path.resolve(options.path);
      
      // Check if directory exists
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
      
      // Get Git status
      const gitUtils = new GitUtils(process.cwd());
      const gitStatus = await gitUtils.getStatus();
      
      console.log(chalk.cyan(`\n🚀 Site Upload: ${localPath} → GCS\n`));
      console.log(chalk.gray(`  Target: ${communityId}/${appId}`));
      if (options.preview) console.log(chalk.yellow(`  Mode: PREVIEW`));
      if (gitStatus.isGitRepo) {
        console.log(chalk.gray(`  Git: ${gitStatus.branch} @ ${gitStatus.shortHash}`));
      }
      
      // 1. Compute local file hashes
      const localFiles = await gitUtils.getFileHashes(localPath);
      const fileList = Object.entries(localFiles).map(([filePath, info]) => ({
        path: filePath,
        hash: info.hash,
        size: info.size,
        content_type: mime.lookup(filePath) || 'application/octet-stream'
      }));
      
      console.log(chalk.gray(`\n  Found ${fileList.length} files\n`));
      
      if (fileList.length === 0) {
        console.log(chalk.yellow('  No files found in directory. Nothing to deploy.\n'));
        return;
      }
      
      // 2. Request deploy token with file list
      const tokenResponse = await apiClient.invoke('get_site_deploy_token', {
        community_id: communityId,
        app_id: appId,
        files: fileList,
        preview: options.preview || false
      });
      
      const { signed_urls, existing_manifest, token_id, site_url } = tokenResponse.message;
      
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
        console.log(chalk.yellow('\n📋 Dry run - would upload:'));
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
        console.log(chalk.green('\n✅ Site already up to date on GCS.'));
        console.log(chalk.gray('  Ensuring app metadata is synchronized...'));
        // Fall through to confirm_site_deploy to ensure DB is updated with relative path
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
            const content = await fs.readFile(path.join(localPath, file.path));
            
            const response = await fetch(signedUrl, {
              method: 'PUT',
              headers: { 
                'Content-Type': file.content_type,
                ...(options.noCache ? { 'Cache-Control': 'no-cache' } : {})
              },
              body: content
            });
            
            if (!response.ok) {
              uploadErrors.push(`Failed to upload ${file.path}: ${response.status} ${response.statusText}`);
              console.log(chalk.red(`  ✗ ${file.path}`));
            } else {
              uploadedCount++;
              console.log(chalk.green(`  ✓ ${file.path}`));
            }
          } catch (err) {
            uploadErrors.push(`Error uploading ${file.path}: ${err.message}`);
            console.log(chalk.red(`  ✗ ${file.path}`));
          }
        }
        
        if (uploadErrors.length > 0) {
          console.log(chalk.yellow(`\n⚠️  ${uploadErrors.length} errors during upload:`));
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
          source_path: options.path
        },
        git_info: gitStatus.isGitRepo ? {
          commit: gitStatus.shortHash,
          branch: gitStatus.branch
        } : null,
        preview: options.preview || false
      });
      
      const result = confirmResponse.message;
      
      console.log(chalk.green(`\n✅ Site uploaded successfully!\n`));
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
      console.error(chalk.red(`\n❌ Upload failed: ${error.message}\n`));
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
      
      const communityId = ctx.communityId;
      const appId = ctx.appId;
      
      if (!communityId || !appId) {
        console.error(chalk.red('\n❌ Community and App ID required.'));
        console.log(chalk.gray('  Either provide -c and -a flags, or cd into an app directory\n'));
        process.exit(1);
      }
      
      const appConfig = workspaceConfig.getApp(communityId, appId);
      if (!appConfig) {
        console.error(chalk.red('\n❌ App not found in workspace.json.'));
        console.log(chalk.gray('  Run "npx descix init" to set up your workspace.\n'));
        process.exit(1);
      }
      
      // Handle disable case
      if (port === 'n' || port === 'N') {
        if (appConfig.site) {
          delete appConfig.site.port;
          if (Object.keys(appConfig.site).length === 0) {
            delete appConfig.site;
          }
        }
        await workspaceConfig.save();
        console.log(chalk.green(`\n✅ Local site server disabled for ${communityId}/${appId}\n`));
        return;
      }
      
      // Handle port registration
      if (!port) {
        // Show current status
        const currentPort = appConfig.site?.port;
        if (currentPort) {
          console.log(chalk.cyan(`\n📍 Local site server: port ${currentPort}`));
          console.log(chalk.gray(`  App: ${communityId}/${appId}\n`));
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
      
      if (!appConfig.site) appConfig.site = {};
      appConfig.site.port = portNum;
      if (!appConfig.site.devCommand) {
        appConfig.site.devCommand = 'npm run dev';
      }
      
      await workspaceConfig.save();
      console.log(chalk.green(`\n✅ Local site server registered!`));
      console.log(chalk.cyan(`  Port: ${portNum}`));
      console.log(chalk.gray(`  App: ${communityId}/${appId}`));
      console.log(chalk.gray(`\n  The PWA will proxy /apps/${communityId}/${appId}/* to localhost:${portNum}\n`));
      
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
      
      const appConfig = workspaceConfig.getApp(ctx.communityId, ctx.appId);
      if (!appConfig) {
        console.error(chalk.red('\n❌ App not found in workspace.json.'));
        console.log(chalk.gray('  Run "npx descix init" to set up your workspace.\n'));
        process.exit(1);
      }
      
      const appPath = appConfig.absolutePath || 
        path.join(workspaceConfig.getWorkspaceRoot(), appConfig.localPath);
      
      console.log(chalk.cyan('\n📁 Adding microservice scaffold...\n'));
      
      const { copyScaffold } = await import('../lib/core/Hydrator.js');
      const stats = await copyScaffold('microservice', appPath, { 
        verbose: true, 
        force: options.force 
      });
      
      // Configuration Injection
      const microserviceDir = path.join(appPath, 'microservice');
      const defaultsPath = path.join(microserviceDir, 'defaults-config.json');
      const overridesPath = path.join(microserviceDir, 'dev-overrides.json');
      
      // 1. Inject Context into defaults-config.json
      try {
        const defaultsContent = await fs.readFile(defaultsPath, 'utf-8');
        const defaults = JSON.parse(defaultsContent);
        defaults.community_id = ctx.communityId;
        defaults.app_id = ctx.appId;
        await fs.writeFile(defaultsPath, JSON.stringify(defaults, null, 2));
        console.log(chalk.gray(`  ✓ Injected context into defaults-config.json`));
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ Could not update defaults-config.json: ${err.message}`));
      }
      
      // 2. Inject Credentials into dev-overrides.json
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
  .description('Register microservice with gateway (requires SERVICE_README)')
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
        
      // Option 2: Check for SERVICE_README in Drive folder
      } else if (!options.skipReadmeCheck) {
        console.log(chalk.cyan(`🔍 Checking for ${readmeFileName} in app Drive folder...\n`));
        
        const checkResponse = await apiClient.invoke('check_service_readme_exists', {
          community_id: communityId,
          app_id: appId,
          service_name: serviceName
        });
        
        const readmeExists = checkResponse.message?.exists || checkResponse.exists || false;
        
        if (!readmeExists) {
          // Output AI-friendly instructions for creating the README
          outputServiceReadmeInstructions(serviceName, appId, communityId, manifest);
          process.exit(1);
        }
        
        console.log(chalk.green(`✅ Found ${readmeFileName}\n`));
        
        // Read README content from Drive
        const readmeResponse = await apiClient.invoke('get_service_readme_content', {
          community_id: communityId,
          app_id: appId,
          service_name: serviceName
        });
        
        const readmeContent = readmeResponse.message?.content || readmeResponse.content || '';
        
        // Register with README content for vectorization
        const response = await apiClient.invoke('register_service', { 
          manifest,
          readme_content: readmeContent
        });
        
        console.log(chalk.green('✅ Microservice registered successfully!\n'));
        console.log(chalk.cyan(`  Service: ${serviceName}`));
        console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}`));
        console.log(chalk.gray(`  README vectorized for tell_me_how discovery\n`));
        
      // Option 3: Skip README check
      } else {
        // Skip README check - register without vectorization
        console.log(chalk.yellow('⚠️  Skipping README check (tool discovery will be limited)\n'));
        
        const response = await apiClient.invoke('register_service', { manifest });
        
        console.log(chalk.green('✅ Microservice registered successfully!\n'));
        console.log(chalk.cyan(`  Service: ${serviceName}`));
        console.log(chalk.gray(`  Commands: ${Object.keys(manifest.commands || {}).length}`));
        console.log(chalk.yellow(`  ⚠️  No README - service won't appear in tell_me_how results\n`));
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
            if (ctx.communityId && ctx.appId && workspaceConfig.workspaceRoot) {
              const appConfig = workspaceConfig.getApp(ctx.communityId, ctx.appId);
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
  .description('Register service delegate key for Intelligent Mesh')
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
      const serviceSlots = entitlements.service_slots || [];
      
      if (serviceSlots.length === 0) {
        console.error(chalk.red('❌ No service slots available.'));
        console.log(chalk.white('   You need a "Runner NFT" or Subscription to create a service.'));
        process.exit(1);
      }
      
      // Select slot
      let selectedSlot = serviceSlots[0];
      if (options.slot) {
        selectedSlot = serviceSlots.find(s => (s.nft_id || s.id) === options.slot);
        if (!selectedSlot) {
          console.error(chalk.red(`❌ Slot ${options.slot} not found in your entitlements.`));
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

// ============ Chat Commands ============

program
  .command('chat [question...]')
  .description('Chat with an app agent. Usage: descix chat "Your question" or descix chat -q "Your question"')
  .option('-c, --community <id>', 'Community ID (defaults to descix)')
  .option('-a, --app <id>', 'App ID (defaults to agent)')
  .option('-q, --question <text>', 'Question to ask (alternative to positional argument)')
  .option('-k, --kb <id>', 'Knowledge Base ID', 'General')
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
      
      // Auto-detect app from current directory if not specified
      let communityId = options.community;
      let appId = options.app;
      
      if (!communityId || !appId) {
        try {
          const { PathContext } = await import('../lib/core/PathContext.js');
          const ctx = await PathContext.tryLoad();
          if (ctx) {
            const detected = ctx.detectContext();
            if (detected) {
              communityId = communityId || detected.communityId;
              appId = appId || detected.appId;
            }
          }
        } catch {
          // Fall through to defaults
        }
      }
      
      // Fall back to defaults if still not set
      communityId = communityId || 'descix';
      appId = appId || 'agent';
      
      // Get session interaction_id unless --new flag
      let previousInteractionId = null;
      if (!options.new) {
        previousInteractionId = await getSessionInteractionId(communityId, appId);
      } else {
        // Clear session if --new flag
        await clearSession(communityId, appId);
      }
      
      console.log(chalk.gray(`Asking ${communityId}/${appId}...`));
      
      const response = await apiClient.invoke('ask_question_to_app', {
        app_id: appId,
        knowledgebase_name: options.kb,
        user_input: question,
        previous_interaction_id: previousInteractionId,
        streaming: false
      });
      const result = response.message || response;
      
      // Save new interaction_id for next message
      if (result.interaction_id) {
        await saveSessionInteractionId(communityId, appId, result.interaction_id);
      }
      
      console.log(chalk.green('\n✅ Response:\n'));
      console.log(chalk.white(result.response || result.text || JSON.stringify(result, null, 2)));
      
      const sources = result.sources || response.sources || response.message?.sources || [];
      if (sources && sources.length > 0) {
        console.log(chalk.cyan('\n📚 Sources:'));
        sources.forEach((src, i) => {
          const fileName = src.fileName || src.file_path || src.source || src;
          const fileId = src.fileId || src.id || '';
          const score = src.score || src.similarity || 0;
          const scoreStr = score ? ` (score: ${score.toFixed(3)})` : '';
          const idStr = fileId ? ` [ID: ${fileId}]` : '';
          console.log(chalk.gray(`   ${i + 1}. ${fileName}${idStr}${scoreStr}`));
        });
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
  .option('-c, --community <id>', 'Community ID (defaults to descix)')
  .option('-a, --app <id>', 'App ID (defaults to agent)')
  .action(async (options) => {
    try {
      const communityId = options.community || 'descix';
      const appId = options.app || 'agent';
      await clearSession(communityId, appId);
      console.log(chalk.green(`Chat session cleared for ${communityId}/${appId}. Next chat will start fresh.`));
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
      
      const response = await apiClient.invoke('fetch_my_purchases', {});
      const result = response.message || response;
      
      const communities = result.communities || [];
      const apps = result.apps || [];
      
      console.log(chalk.green('\n✅ Your Purchases:\n'));
      console.log(chalk.cyan(`Communities (${communities.length}):`));
      communities.forEach((c, idx) => {
        console.log(chalk.yellow(`  ${idx + 1}. ${c.community_name} (${c.community_id})`));
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
  .command('set-sync-mode')
  .description('Set KB sync mode for an app (git or drive)')
  .argument('<mode>', 'Sync mode: "git" (local-first) or "drive" (PWA-first)')
  .option('-c, --community <id>', 'Community ID')
  .option('-a, --app <id>', 'App ID')
  .action(async (mode, options) => {
    try {
      await configCommands.setSyncMode(mode, options);
    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

// ============ Documentation Commands ============

const docsCommand = program
  .command('docs')
  .description('Documentation operations');

docsCommand
  .command('sync')
  .description('Sync README/ folder to platform-docs KB for RAG search')
  .option('--path <path>', 'Path to README folder (default: ./README)', './README')
  .action(async (options) => {
    try {
      const apiClient = new DeSciXApiClient();
      await requireAuth(apiClient);
      
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const readmePath = path.resolve(options.path || './README');
      
      console.log(chalk.cyan(`\n📚 Syncing documentation to platform-docs KB\n`));
      console.log(chalk.gray(`Reading from: ${readmePath}\n`));
      
      // Check if README folder exists
      try {
        const stats = await fs.stat(readmePath);
        if (!stats.isDirectory()) {
          throw new Error(`Path is not a directory: ${readmePath}`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`README folder not found: ${readmePath}`);
        }
        throw error;
      }
      
      // Recursively read all .md files
      const files = [];
      async function readDir(dirPath, basePath = '') {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = path.join(basePath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and .git
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
              continue;
            }
            await readDir(fullPath, relPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = await fs.readFile(fullPath, 'utf-8');
            files.push({
              name: entry.name,
              path: relPath,
              content: Buffer.from(content).toString('base64')  // Base64 encode
            });
          }
        }
      }
      
      await readDir(readmePath);
      
      if (files.length === 0) {
        throw new Error('No .md files found in README folder');
      }
      
      console.log(chalk.gray(`Found ${files.length} markdown files. Uploading...\n`));
      
      // Upload files to platform-docs KB
      const response = await apiClient.invoke('upload_files_to_kb', {
        community_id: 'descix',
        app_id: 'platform-docs',
        kb_id: 'General',
        files: files
      });
      const result = response.message || response;
      
      console.log(chalk.green(`\n✅ Uploaded ${result.uploaded || 0} files\n`));
      
      // Sync to RAG
      console.log(chalk.gray('Syncing to RAG vectors...\n'));
      const syncResponse = await apiClient.invoke('sync_knowledge_base', {
        community_id: 'descix',
        app_id: 'platform-docs',
        kb_id: 'General'
      });
      const syncResult = syncResponse.message || syncResponse;
      
      console.log(chalk.green('✅ Documentation synced to RAG!\n'));
      console.log(chalk.cyan(`  Total Vectors: ${syncResult.vectorCount || result.totalVectors || 0}\n`));
      
      if (result.errors && result.errors.length > 0) {
        console.log(chalk.yellow('  Errors:'));
        result.errors.forEach(err => {
          console.log(chalk.red(`    - ${err.file}: ${err.error}`));
        });
      }
      
      console.log(chalk.gray('\nQuery documentation with: descix rag query -c descix -a platform-docs -k General -q "your question"\n'));
      
    } catch (error) {
      console.error(chalk.red(error.message));
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

📁 Required file: ${readmeFileName}
📍 Location: Google Drive folder for app '${appId}' in community '${communityId}'

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

// ============ MCP Commands ============

import * as mcpCommands from '../lib/commands/mcp.js';

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

// ============ Folder Commands ============

const folderCommand = program
  .command('folder')
  .description('Drive folder management');

folderCommand
  .command('set')
  .description('Set folder ID for an entity')
  .option('--user <folderId>', 'Set user base folder')
  .option('--community <communityId>', 'Set community folder (requires folderId positional)')
  .option('--app <communityApp>', 'Set app folder: "community app" (requires folderId positional)')
  .option('--kb <communityAppKb>', 'Set KB folder: "community app kb" (requires folderId positional)')
  .argument('[folderId]', 'Folder ID (for community/app/kb)')
  .action(async (folderId, options) => {
    try {
      await folderCommands.setFolder({ ...options, folderId });
    } catch (error) {
      process.exit(1);
    }
  });

folderCommand
  .command('get')
  .description('Get folder info for an entity')
  .option('--user', 'Get user base folder')
  .option('--community <communityId>', 'Get community folder')
  .option('--app <communityApp>', 'Get app folder: "community app"')
  .option('--kb <communityAppKb>', 'Get KB folder: "community app kb"')
  .action(async (options) => {
    try {
      await folderCommands.getFolder(options);
    } catch (error) {
      process.exit(1);
    }
  });

folderCommand
  .command('allocate')
  .description('Allocate a new folder for an entity')
  .option('--app <communityApp>', 'Allocate app folder: "community app"')
  .option('--kb <communityAppKb>', 'Allocate KB folder: "community app kb"')
  .option('-n, --name <name>', 'Custom folder name')
  .action(async (options) => {
    try {
      await folderCommands.allocateFolder(options);
    } catch (error) {
      process.exit(1);
    }
  });

folderCommand
  .command('validate <folderId>')
  .description('Validate folder access')
  .action(async (folderId, options) => {
    try {
      await folderCommands.validateFolder(folderId, options);
    } catch (error) {
      process.exit(1);
    }
  });

// ============ Update Commands (Context-Driven) ============

const updateCommand = program
  .command('update')
  .description('Context-driven resource sync (auto-detects from workspace)')
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

    // Step 4: Generate .vscode/mcp.json
    await generateMcpConfig(workspaceRoot);
    console.log(chalk.green('  ✓ .vscode/mcp.json'));

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

