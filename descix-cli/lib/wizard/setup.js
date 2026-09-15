/**
 * Interactive Setup Wizard
 * 
 * Bootstraps MCP connectivity so the AI agent can guide workspace configuration.
 * 
 * Steps:
 * 0. API Configuration (select environment)
 * 1. Authentication (device login or wallet)
 * 2. Fetch Entitlements (communities/apps user owns)
 * 3. Pull SDK Agent Assets (instructions, templates, rules)
 * 4. MCP Configuration (mcp.json + rules file with entitlements)
 * 5. Create workspace.json (with _needsAgentSetup flag)
 * 6. Register SDK Service (vectorize for tell_me_how)
 * 
 * After setup, the AI agent uses the rules file and local SDK assets
 * to help the user map folders to apps and configure workspace.json.
 * 
 * All operations use HTTP API client - no service imports
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
// "May I prompt?" has ONE OWNER. The wizard is interactive BY NATURE; it still asks the owner.
import { requireInteractive } from '../interactive.js';
import { DeSciXApiClient } from '../api-client.js';
import { ENV_ORIGINS } from '@descix/app-sdk/dev';
import { requireAuth, isAuthenticated } from '../auth-guard.js';
import { WorkspaceConfig } from '../workspace-config.js';
import * as authCommands from '../commands/auth.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SDK version for tracking
const SDK_VERSION = '2.0.0';

// ============ Helper Functions ============

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Pull SDK agent assets to local workspace
 * Copies agent-assets/ to .descix/sdk-assets/ for local AI agent access
 * @param {string} workspacePath - Workspace root path
 * @returns {Promise<boolean>} True if assets were copied
 */
async function pullSdkAssets(workspacePath) {
  // agent-assets is in the SDK root, which is ../../.. from wizard/setup.js
  const sdkAssetsSource = path.join(__dirname, '../../../agent-assets');
  const sdkAssetsTarget = path.join(workspacePath, '.descix/sdk-assets');
  
  try {
    // Check if source exists
    await fs.access(sdkAssetsSource);
    
    // Copy recursively
    await copyDir(sdkAssetsSource, sdkAssetsTarget);
    
    return true;
  } catch (error) {
    // Source doesn't exist (development mode or not packaged)
    return false;
  }
}

/**
 * Generate customized rules file from template
 * Uses agent-assets/rules/descix_mcp.template.mdc with placeholder substitution
 * @param {string} workspacePath - Workspace root path
 * @param {Object} entitlements - User's entitlements from fetch_my_purchases
 * @param {string} primaryCommunity - User's primary community
 * @returns {Promise<boolean>} True if rules file was generated
 */
async function generateRulesFile(workspacePath, entitlements, primaryCommunity) {
  const templatePath = path.join(__dirname, '../../../agent-assets/rules/descix_mcp.template.mdc');
  const rulesDir = path.join(workspacePath, '.cursor/rules');
  const rulesPath = path.join(rulesDir, 'descix_mcp.mdc');
  
  try {
    // Read template
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Summarize entitlements for embedding (avoid huge JSON in rules file)
    const entitlementsSummary = {
      communities: (entitlements.communities || []).map(c => ({
        id: c.community_id || c.id,
        name: c.community_name || c.name
      })),
      apps: (entitlements.apps || []).map(a => ({
        community: a.community_id,
        id: a.app_id || a.id,
        name: a.app_name || a.name
      }))
    };
    
    // Customize with workspace-specific values
    const customized = template
      .replace(/\{\{SDK_ASSETS_PATH\}\}/g, '.descix/sdk-assets')
      .replace(/\{\{PRIMARY_COMMUNITY\}\}/g, primaryCommunity || 'daita')
      .replace(/\{\{ENTITLEMENTS_JSON\}\}/g, JSON.stringify(entitlementsSummary, null, 2))
      .replace(/\{\{SDK_VERSION\}\}/g, SDK_VERSION)
      .replace(/\{\{WORKSPACE_PATH\}\}/g, workspacePath);
    
    // Write customized rules
    await fs.mkdir(rulesDir, { recursive: true });
    await fs.writeFile(rulesPath, customized, 'utf-8');
    
    return true;
  } catch (error) {
    // Template doesn't exist, fall back to simple template
    return false;
  }
}

/**
 * Auto-register SDK service for tell_me_how discovery
 * Vectorizes SERVICE_README_sdk.md so SDK tools are discoverable
 * @param {DeSciXApiClient} apiClient - Authenticated API client
 * @returns {Promise<boolean>} True if registration succeeded
 */
async function autoRegisterSdkService(apiClient) {
  // SDK SERVICE_README is in the SDK root
  const readmePath = path.join(__dirname, '../../../SERVICE_README_sdk.md');
  
  try {
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    // Vectorize for tell_me_how discovery
    await apiClient.invoke('vectorize_service_readme', {
      service_name: 'sdk',
      community_id: 'daita',
      app_id: 'docs',
      readme_content: readmeContent
    });
    
    return true;
  } catch (error) {
    // README doesn't exist or vectorization failed
    return false;
  }
}

/**
 * Get MCP server configuration
 * Uses direct command if CLI is installed, otherwise suggests install
 * @returns {Object} { command, args } for MCP server
 */
function getMcpServerConfig() {
  // Use direct descix command - simpler and no npm download needed
  // Requires CLI to be installed globally first via:
  //   npm install -g https://app.descix.net/sdk/descix-cli-1.0.0.tgz
  // or during development:
  //   npm install -g /path/to/descix-cli-1.0.0.tgz
  return {
    command: 'descix',
    args: ['mcp-serve'],
    type: 'global'
  };
}

/**
 * Refuse to run when a workspace already exists here.
 *
 * quickstart CREATES a workspace. It has no migration or merge semantics, so running it over a
 * present one can only destroy information. This is a REFUSAL and deliberately NOT a prompt:
 * an agent caller hangs forever on a question, and a refusal is machine-readable where a
 * question is not.
 *
 * WHERE THE WORKSPACE ROOT IS has ONE OWNER: WorkspaceConfig.findWorkspaceRoot, which walks UP
 * from the start directory exactly as load() does. This guard CONSUMES it. It used to derive the
 * answer a SECOND time by reading the TARGET PATH ONLY, and the two derivations disagreed in the
 * case that matters: run from a SUBDIRECTORY of an existing workspace, the target-path check saw
 * nothing, the wizard proceeded, and it wrote a NESTED workspace.json that SHADOWS the parent for
 * every later load() — because load() walks up and stops at the FIRST one it finds. The second
 * derivation is DELETED, not left beside the owner.
 *
 * A nested workspace is not an unsupported topology, it is the BUG: because resolution walks UP,
 * a nested file is unreachable by design from below EXCEPT by shadowing its parent. There is no
 * escape hatch here and no flag to request one.
 *
 * findWorkspaceRoot stats the file, so a PRESENT-BUT-UNREADABLE workspace is still FOUND and still
 * refused — the corrupt-looks-absent case this guard exists to stop is preserved.
 *
 * @param {string} startDir - directory the wizard was invoked in
 * @throws {Error} naming the root it found and what is there, when a workspace exists at or ABOVE
 *                 startDir
 */
async function refuseIfWorkspacePresent(startDir) {
  const workspaceRoot = await WorkspaceConfig.findWorkspaceRoot(startDir);
  if (!workspaceRoot) return; // ordinary first run — nothing up the tree to protect

  const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
  const nested = path.resolve(workspaceRoot) !== path.resolve(startDir);

  let raw;
  try {
    raw = await fs.readFile(configPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return; // stat'd a moment ago; it vanished in between
    throw new Error(
      `Refusing to run quickstart: ${configPath} exists but could not be read (${err.message}).\n` +
      (nested ? `It is the workspace root for ${workspaceRoot}, which CONTAINS ${startDir}.\n` : '') +
      'Quickstart will not write over a file it cannot inspect.'
    );
  }

  let found;
  try {
    const parsed = JSON.parse(raw);
    const version = parsed && parsed.version ? parsed.version : 'no version field';
    found = `version ${version}`;
  } catch (err) {
    found = `unparseable JSON (${err.message})`;
  }

  throw new Error(
    (nested
      ? `Refusing to create a workspace here — ${startDir} is already INSIDE the workspace ` +
        `rooted at ${workspaceRoot}.\n` +
        `  Existing workspace: ${configPath} (${found})\n` +
        '\nCreating a second workspace.json in this subdirectory would SHADOW that one: workspace ' +
        'resolution walks UP and stops at the FIRST file it finds, so every later command run from ' +
        'here would silently use the new file instead of the real one.\n'
      : `Refusing to overwrite ${configPath} — a workspace is already configured here (${found}).\n` +
        '\nquickstart CREATES a workspace; it does not migrate or merge an existing one, and ' +
        'writing over this file would destroy whatever it holds.\n') +
    '\nTo change the workspace you already have, use the verbs that own it' +
    (nested ? ` (run them from ${workspaceRoot}):\n` : ':\n') +
    '  descix config show                 # what is configured right now\n' +
    '  descix config set-env <env>        # retarget the environment\n' +
    '  descix config set-url <url>        # retarget the API origin\n' +
    '  descix config set-gateway-port <n> # change the gateway port\n' +
    '  descix app init                    # register another app in this workspace\n'
  );
}

// ============ Main Wizard ============

/**
 * Run the interactive setup wizard
 */
export async function runSetupWizard(options = {}) {
  // ONE derivation of the workspace root, shared by the guard and the write it protects.
  const workspaceRoot = process.cwd();

  // BEFORE the banner and before every side effect: this wizard also writes
  // .cursor/mcp.json and pulls SDK assets, so a guard placed further down would
  // refuse only after those had already landed.
  await refuseIfWorkspacePresent(workspaceRoot);

  console.log(chalk.cyan('\n┌─────────────────────────────────────────────────┐'));
  console.log(chalk.cyan('│        Welcome to DeSciX CLI/MCP Setup          │'));
  console.log(chalk.cyan('├─────────────────────────────────────────────────┤'));
  console.log(chalk.cyan('│  This wizard will:                              │'));
  console.log(chalk.cyan('│  1. Configure API endpoint                      │'));
  console.log(chalk.cyan('│  2. Authenticate with DeSciX (required)         │'));
  console.log(chalk.cyan('│  3. Fetch your entitlements                     │'));
  console.log(chalk.cyan('│  4. Pull SDK agent assets locally               │'));
  console.log(chalk.cyan('│  5. Configure Cursor MCP integration            │'));
  console.log(chalk.cyan('│  6. Register SDK for tool discovery             │'));
  console.log(chalk.cyan('│                                                 │'));
  console.log(chalk.cyan('│  After setup, the AI agent will help you        │'));
  console.log(chalk.cyan('│  configure your workspace folders.              │'));
  console.log(chalk.cyan('└─────────────────────────────────────────────────┘\n'));

  const spinner = ora('Initializing...').start();

  try {
    // Step 0: Configure API endpoint
    spinner.stop();
    console.log(chalk.cyan('\n📋 Step 0: API Configuration\n'));
    
    let apiUrl = options.url || process.env.DESCIX_API_URL;
    
    if (!apiUrl) {
      requireInteractive({ what: 'descix setup', question: 'which environment?', nonInteractiveForm: ['descix setup is an interactive wizard and has no non-interactive form. Run it in a terminal.'] });
      const { environment } = await inquirer.prompt([
        {
          type: 'list',
          name: 'environment',
          message: 'Which environment are you connecting to?',
          choices: [
            { name: `Production (${ENV_ORIGINS.prod})`, value: 'production' },
            { name: 'Local Development (localhost:4000)', value: 'local' },
            { name: 'Custom URL', value: 'custom' }
          ],
          default: 'production'
        }
      ]);
      
      if (environment === 'production') {
        apiUrl = ENV_ORIGINS.prod;
      } else if (environment === 'local') {
        apiUrl = 'https://localhost:4000';
      } else {
        requireInteractive({ what: 'descix setup', question: 'custom API URL?', nonInteractiveForm: ['descix setup is an interactive wizard and has no non-interactive form. Run it in a terminal.'] });
        const { customUrl } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customUrl',
            message: 'Enter API URL:',
            default: 'https://localhost:4000',
            validate: (input) => {
              if (!input.startsWith('http://') && !input.startsWith('https://')) {
                return 'URL must start with http:// or https://';
              }
              return true;
            }
          }
        ]);
        apiUrl = customUrl;
      }
    }
    
    console.log(chalk.green(`✓ API endpoint: ${apiUrl}\n`));
    
    spinner.start('Connecting to DeSciX...');
    const apiClient = new DeSciXApiClient({ baseUrl: apiUrl });
    spinner.succeed('Connected to DeSciX');

    // Step 1: Authentication (required)
    console.log(chalk.cyan('\n📋 Step 1: Authentication\n'));
    
    // Pass the API URL to login commands
    const authOptions = { url: apiUrl };
    
    const isAuth = await isAuthenticated(apiClient);
    
    if (!isAuth) {
      console.log(chalk.yellow('⚠️  Authentication is required to use DeSciX CLI/MCP.\n'));
      
      requireInteractive({ what: 'descix setup', question: 'which authentication method?', nonInteractiveForm: ['descix setup is an interactive wizard and has no non-interactive form. Run it in a terminal.'] });
      const { authMethod } = await inquirer.prompt([
        {
          type: 'list',
          name: 'authMethod',
          message: 'How would you like to authenticate?',
          choices: [
            { name: 'Device Login (recommended - opens browser)', value: 'device' },
            { name: 'Direct Wallet Connection (advanced)', value: 'wallet' }
          ],
          default: 'device'
        }
      ]);

      if (authMethod === 'device') {
        await authCommands.loginDevice(authOptions);
      } else {
        await authCommands.loginWallet();
      }
    } else {
      console.log(chalk.green('✅ Already authenticated\n'));
    }

    // Verify authentication
    await requireAuth(apiClient);
    console.log(chalk.green('✅ Authentication verified\n'));

    // Step 2: Fetch Entitlements
    console.log(chalk.cyan('\n📋 Step 2: Fetching Entitlements\n'));
    
    let entitlements = { communities: [], apps: [], service_slots: [] };
    spinner.start('Fetching your entitlements...');
    
    try {
      const purchasesResult = await apiClient.invoke('fetch_my_purchases', {});
      if (purchasesResult && purchasesResult.status !== 'ERROR') {
        entitlements = {
          communities: purchasesResult.communities || [],
          apps: purchasesResult.apps || [],
          service_slots: purchasesResult.service_slots || []
        };
        spinner.succeed(`Found ${entitlements.communities.length} communities, ${entitlements.apps.length} apps`);
        
        // Display entitlements
        if (entitlements.communities.length > 0) {
          console.log(chalk.gray('\n  Communities:'));
          for (const c of entitlements.communities) {
            console.log(chalk.gray(`    - ${c.community_name || c.name || c.community_id} (${c.community_id || c.id})`));
          }
        }
        if (entitlements.apps.length > 0) {
          console.log(chalk.gray('\n  Apps:'));
          for (const a of entitlements.apps.slice(0, 5)) {
            console.log(chalk.gray(`    - ${a.community_id}/${a.app_id || a.id}`));
          }
          if (entitlements.apps.length > 5) {
            console.log(chalk.gray(`    ... and ${entitlements.apps.length - 5} more`));
          }
        }
        console.log('');
      } else {
        spinner.warn('Could not fetch entitlements (will use defaults)');
      }
    } catch (error) {
      spinner.warn('Could not fetch entitlements: ' + error.message);
    }

    // Step 3: Pull SDK Assets
    console.log(chalk.cyan('\n📋 Step 3: Pulling SDK Agent Assets\n'));
    
    spinner.start('Pulling SDK agent assets...');
    const assetsPulled = await pullSdkAssets(workspaceRoot);
    
    if (assetsPulled) {
      spinner.succeed('SDK agent assets pulled');
      console.log(chalk.gray('  Created: .descix/sdk-assets/'));
      console.log(chalk.gray('    - instructions/ (onboarding, packaging types, etc.)'));
      console.log(chalk.gray('    - templates/ (app scaffolds)'));
      console.log(chalk.gray('    - rules/ (agent instructions template)\n'));
    } else {
      spinner.warn('SDK agent assets not found (development mode)');
      console.log(chalk.gray('  Skipped: .descix/sdk-assets/\n'));
    }

    // Derive primary community from entitlements
    let primaryCommunity = 'daita';
    if (entitlements.communities.length > 0) {
      primaryCommunity = entitlements.communities[0].community_id || entitlements.communities[0].id || 'daita';
    }

    // Step 4: MCP Configuration
    console.log(chalk.cyan('\n📋 Step 4: MCP Configuration\n'));
    
    requireInteractive({ what: 'descix setup', question: 'configure MCP now?', nonInteractiveForm: ['descix setup is an interactive wizard and has no non-interactive form. Run it in a terminal.'] });
    const { setupMCP } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupMCP',
        message: 'Set up Cursor MCP integration?',
        default: true
      }
    ]);

    if (setupMCP) {
      spinner.start('Creating MCP configuration...');
      
      // Use npx approach for reliability (like Pinecone does)
      const mcpServer = getMcpServerConfig();
      
      // Create .cursor/mcp.json
      const cursorDir = path.join(workspaceRoot, '.cursor');
      await fs.mkdir(cursorDir, { recursive: true });
      
      // Build MCP server config - npx handles all dependencies
      const mcpServerConfig = {
        command: mcpServer.command,
        args: mcpServer.args
      };
      
      // Read existing config if present to preserve other servers
      let existingConfig = { mcpServers: {} };
      const cursorConfigPath = path.join(cursorDir, 'mcp.json');
      try {
        const existing = await fs.readFile(cursorConfigPath, 'utf-8');
        existingConfig = JSON.parse(existing);
        if (!existingConfig.mcpServers) {
          existingConfig.mcpServers = {};
        }
      } catch {
        // No existing config, that's fine
      }
      
      // Add/update descix server
      existingConfig.mcpServers['descix'] = mcpServerConfig;
      
      await fs.writeFile(cursorConfigPath, JSON.stringify(existingConfig, null, 2));
      
      spinner.succeed('MCP configuration created');
      console.log(chalk.gray(`  Created: .cursor/mcp.json`));
      console.log(chalk.gray(`  Server: ${mcpServer.command} ${mcpServer.args.join(' ')}`));
      
      // Deploy customized rules file with entitlements
      spinner.start('Generating customized agent rules...');
      
      const rulesGenerated = await generateRulesFile(workspaceRoot, entitlements, primaryCommunity);
      
      if (rulesGenerated) {
        spinner.succeed('Agent rules file generated with entitlements');
        console.log(chalk.gray(`  Created: .cursor/rules/descix_mcp.mdc`));
        console.log(chalk.gray(`  - Embedded ${entitlements.communities.length} communities`));
        console.log(chalk.gray(`  - Embedded ${entitlements.apps.length} apps`));
        console.log(chalk.gray(`  - References local SDK assets at .descix/sdk-assets/\n`));
      } else {
        // Fall back to simple template
        spinner.info('Using simple rules template');
        const rulesDir = path.join(workspaceRoot, '.cursor', 'rules');
        await fs.mkdir(rulesDir, { recursive: true });
        
        const templatePath = path.join(__dirname, '../../templates/descix_mcp.mdc');
        const rulesPath = path.join(rulesDir, 'descix_mcp.mdc');
        
        try {
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          await fs.writeFile(rulesPath, templateContent, 'utf-8');
          console.log(chalk.gray(`  Created: .cursor/rules/descix_mcp.mdc\n`));
        } catch (error) {
          console.log(chalk.gray(`  Skipped: .cursor/rules/descix_mcp.mdc\n`));
        }
      }
    }

    // Step 5: Create workspace config
    spinner.start('Creating workspace configuration...');
    
    // The SHAPE of this file is owned by WorkspaceConfig and it is written ONLY via save().
    // This used to build a config literal and call fs.writeFile directly — no existence check,
    // no parse check, no save() — which both clobbered present workspaces and stamped a
    // version '2.0' shape on a v2.1 platform. The version is the owner's concern now.
    //
    // The env NAME comes from the owner's own ENV_MAP rather than being re-derived from the URL
    // here; an origin the owner does not know is recorded as DEV carrying its explicit URL,
    // because inventing a label at this call site would be a second derivation of one fact.
    const envName = (Object.entries(WorkspaceConfig.ENV_MAP)
      .find(([, entry]) => entry.url === apiUrl) || ['dev'])[0];

    const workspace = new WorkspaceConfig({ type: 'workspace' }, workspaceRoot);
    const { configPath } = await workspace.setEnvironment(envName, apiUrl);
    
    spinner.succeed('Workspace configured');
    console.log(chalk.gray(`  Created: .descix/workspace.json\n`));

    // Step 6: Auto-register SDK service for tell_me_how discovery
    console.log(chalk.cyan('\n📋 Step 6: Registering SDK Service\n'));
    
    spinner.start('Registering SDK for tell_me_how discovery...');
    const sdkRegistered = await autoRegisterSdkService(apiClient);
    
    if (sdkRegistered) {
      spinner.succeed('SDK service registered');
      console.log(chalk.gray('  SDK tools now discoverable via tell_me_how\n'));
    } else {
      spinner.warn('Could not register SDK service (will work without discovery)');
      console.log(chalk.gray('  SDK tools available but not indexed for search\n'));
    }

    // Done!
    console.log(chalk.green('\n✅ MCP Setup Complete!\n'));
    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray('  1. Restart Cursor (Cmd/Ctrl + Shift + P → "Reload Window")'));
    console.log(chalk.gray('  2. Ask the AI agent: "Help me configure my workspace"\n'));
    
    console.log(chalk.white('The AI agent will:'));
    console.log(chalk.gray('  - Read your entitlements and show available apps'));
    console.log(chalk.gray('  - Help you map local folders to DeSciX apps'));
    console.log(chalk.gray('  - Analyze folder structure and recommend packaging types'));
    console.log(chalk.gray('  - Register apps in workspace.json\n'));
    
    console.log(chalk.white('If MCP fails, use CLI directly:'));
    console.log(chalk.gray('  descix purchases              # View your entitlements'));
    console.log(chalk.gray('  descix tell-me-how "question" # Discover tools'));
    console.log(chalk.gray('  descix app sync-assets -a Y   # Sync app assets'));
    console.log(chalk.gray('  descix kb corpus sync -a Y    # Sync knowledge base\n'));

  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

