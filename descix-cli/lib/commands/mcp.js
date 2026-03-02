/**
 * MCP Commands
 * 
 * MCP server setup and configuration commands
 * All operations use HTTP API client - no service imports
 */

import chalk from 'chalk';
import ora from 'ora';
import { DeSciXApiClient } from '../api-client.js';
import { requireAuth } from '../auth-guard.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load workspace config from JSON file
 */
async function loadWorkspaceConfig(workspaceRoot = process.cwd()) {
  const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      primaryCommunity: 'descix',
      directoryMappings: {},
      additionalContexts: [],
      defaultContext: {
        communityId: 'descix',
        appId: 'agent',
        kbId: 'General'
      }
    };
  }
}

/**
 * Deploy descix_mcp.mdc rules file to .cursor/rules/
 */
async function deployRulesFile(workspaceRoot = process.cwd()) {
  const rulesDir = path.join(workspaceRoot, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });
  
  const templatePath = path.join(__dirname, '../../templates/descix_mcp.mdc');
  const rulesPath = path.join(rulesDir, 'descix_mcp.mdc');
  
  try {
    // Check if template exists
    await fs.access(templatePath);
    
    // Copy template to rules directory
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Check if rules file already exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(rulesPath, 'utf-8');
    } catch {
      // File doesn't exist, that's fine
    }
    
    // Only write if content is different (avoid unnecessary writes)
    if (existingContent !== templateContent) {
      await fs.writeFile(rulesPath, templateContent, 'utf-8');
      return true; // File was deployed
    }
    
    return false; // File already exists with same content
  } catch (error) {
    // Template might not exist in development, that's okay
    console.error(chalk.yellow(`Warning: Could not deploy rules file: ${error.message}`));
    return false;
  }
}

/**
 * Initialize MCP server for workspace
 */
export async function init() {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  console.log(chalk.cyan('\n🚀 DeSciX MCP Workspace Setup\n'));
  
  const spinner = ora('Initializing...').start();
  
  try {
    spinner.text = 'Loading communities...';
    
    // Query communities via HTTP
    const response = await apiClient.invoke('find_communities', {}, { allowGuest: false });
    const result = response.message || response;
    const communities = result.communities || [];
    spinner.succeed(`Found ${communities.length} communities`);
    
    console.log(chalk.cyan('\nAvailable communities:'));
    communities.forEach((c, idx) => {
      console.log(chalk.gray(`  ${idx + 1}. ${c.community_name} (${c.community_id})`));
    });
    
    // Use default community for now (can be enhanced with prompts)
    const primaryCommunity = 'descix';
    
    // Generate .descix/workspace.json
    const workspaceRoot = process.cwd();
    const config = {
      primaryCommunity,
      directoryMappings: {},
      additionalContexts: [],
      defaultContext: {
        communityId: primaryCommunity,
        appId: 'docs',
        kbId: 'sdk'
      }
    };
    
    spinner.start('Creating configuration files...');
    
    const descixDir = path.join(workspaceRoot, '.descix');
    await fs.mkdir(descixDir, { recursive: true });
    const configPath = path.join(descixDir, 'workspace.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✅ Created .descix/workspace.json'));
    
    // Create .cursor/mcp.json
    const cursorDir = path.join(workspaceRoot, '.cursor');
    await fs.mkdir(cursorDir, { recursive: true });
    
    const cursorConfig = {
      mcpServers: {
        'descix-rag': {
          command: 'node',
          args: ['node_modules/@descix/cli/bin/mcp-server.js'],
          cwd: '${workspaceFolder}'
        }
      }
    };
    
    const cursorConfigPath = path.join(cursorDir, 'mcp.json');
    await fs.writeFile(cursorConfigPath, JSON.stringify(cursorConfig, null, 2));
    console.log(chalk.green('✅ Created .cursor/mcp.json'));
    
    // Deploy rules file
    spinner.text = 'Deploying agent rules file...';
    const rulesDeployed = await deployRulesFile(workspaceRoot);
    if (rulesDeployed) {
      console.log(chalk.green('✅ Deployed .cursor/rules/descix_mcp.mdc'));
    } else {
      console.log(chalk.gray('  Rules file already exists'));
    }
    
    spinner.succeed('Configuration complete!');
    
    console.log(chalk.cyan('\n📋 Next Steps:\n'));
    console.log(chalk.white('1. Restart Cursor (Cmd/Ctrl + Shift + P → "Reload Window")\n'));
    console.log(chalk.white('2. MCP will automatically use your credentials!\n'));
    console.log(chalk.gray('Test with: descix mcp test\n'));
    
  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Test MCP server via HTTP
 */
export async function test(options = {}) {
  const apiClient = new DeSciXApiClient();
  await requireAuth(apiClient);
  
  const spinner = ora('Testing MCP server...').start();
  
  try {
    const config = await loadWorkspaceConfig(process.cwd());
    
    spinner.text = `Querying ${config.defaultContext.communityId}/${config.defaultContext.appId}/${config.defaultContext.kbId}...`;
    
    // Get RAG status via HTTP
    const statusResponse = await apiClient.invoke('get_kb_rag_status', {
      app_id: config.defaultContext.appId,
      kb_id: config.defaultContext.kbId
    }, { allowGuest: false });
    
    const status = statusResponse.message || statusResponse;
    
    if (!status.enabled) {
      spinner.warn(chalk.yellow('RAG not enabled for this knowledge base'));
      console.log(chalk.gray('Enable RAG with: descix rag sync -c ' + config.defaultContext.communityId + ' -a ' + config.defaultContext.appId + ' -k ' + config.defaultContext.kbId));
      throw new Error('RAG not enabled');
    }
    
    const query = options.query || 'What is this knowledge base about?';
    const queryResponse = await apiClient.invoke('query_knowledge_base', {
      app_id: config.defaultContext.appId,
      kb_id: config.defaultContext.kbId,
      query: query,
      limit: 3
    }, { allowGuest: false });
    
    const result = queryResponse.message?.results || queryResponse.results || [];
    
    spinner.succeed(chalk.green('MCP server working!'));
    console.log(chalk.cyan(`\nQuery: "${query}"\n`));
    console.log(chalk.white(`Found ${result.length} results\n`));
    
    result.forEach((r, idx) => {
      console.log(chalk.yellow(`${idx + 1}. ${r.fileName || r.file_path} (${((r.similarity || 0) * 100).toFixed(1)}% match)`));
      console.log(chalk.gray(`   ${(r.content || '').substring(0, 100)}...`));
      console.log();
    });
    
  } catch (error) {
    spinner.fail('Test failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Show MCP configuration
 */
export async function config() {
  try {
    const config = await loadWorkspaceConfig(process.cwd());
    console.log(chalk.cyan('\nWorkspace Configuration:\n'));
    console.log(JSON.stringify({
      primaryCommunity: config.primaryCommunity,
      directoryMappings: config.directoryMappings,
      additionalContexts: config.additionalContexts,
      defaultContext: config.defaultContext
    }, null, 2));
    console.log();
  } catch (error) {
    console.error(chalk.red('Error loading config:', error.message));
    throw error;
  }
}

/**
 * Quickstart - one-command setup
 */
export async function quickstart(options = {}) {
  const apiClient = new DeSciXApiClient();
  
  console.log(chalk.cyan('\n🚀 DeSciX MCP Quick Start\n'));
  
  // Check if authenticated
  try {
    await requireAuth(apiClient);
  } catch (error) {
    console.log(chalk.yellow('⚠️  Authentication required first.\n'));
    console.log(chalk.white('Run: descix login\n'));
    throw new Error('Authentication required');
  }
  
  // Run setup wizard
  const { runSetupWizard } = await import('../wizard/setup.js');
  await runSetupWizard();
  
  // Deploy rules file after wizard completes
  const workspaceRoot = process.cwd();
  await deployRulesFile(workspaceRoot);
  console.log(chalk.green('✅ Deployed .cursor/rules/descix_mcp.mdc'));
}

