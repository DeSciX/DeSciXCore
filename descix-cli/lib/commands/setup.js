/**
 * Setup Command - Streamlined Developer Setup
 * SDK Architecture V2
 * 
 * Flow:
 * 1. Check prerequisites (gcloud, ADC, Drive access)
 * 2. Trigger Device Login with setup_mode=true
 * 3. PWA handles workspace configuration
 * 4. CLI hydrates local workspace from PWA response (via Hydrator)
 * 5. Create GETTING STARTED.md in each app
 * 6. Show actionable next steps with actual folder structure
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import inquirer from 'inquirer';
import { checkGcloud, checkAdc } from './doctor.js';
import * as authCommands from './auth.js';
import { GlobalConfig } from '../global-config.js';
import { WorkspaceConfig } from '../workspace-config.js';
import { findIDEMarker } from '../core/PathContext.js';
import * as driveADC from '../google-storage-adc.js';
import { DeSciXApiClient } from '../api-client.js';

/**
 * Run the streamlined setup wizard
 * @param {object} options - Command options
 */
export async function runSetup(options = {}) {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║       DeSciX Developer Setup               ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════╝\n'));

  const spinner = ora('Checking prerequisites...').start();
  
  try {
    // 1. Check Prerequisites
    
    // 1a. Check gcloud CLI is installed
    const gcloudRes = await checkGcloud();
    if (!gcloudRes.ok) {
      spinner.fail('Prerequisites check failed');
      console.log(chalk.red('\n✗ Google Cloud SDK (gcloud) not found.\n'));
      console.log(chalk.yellow('Install gcloud CLI:'));
      console.log(chalk.cyan('  https://cloud.google.com/sdk/docs/install\n'));
      console.log(chalk.yellow('Then authenticate with Drive access:'));
      console.log(chalk.cyan('  gcloud auth application-default login \\'));
      console.log(chalk.cyan('    --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive\n'));
      process.exit(1);
    }
    spinner.text = 'gcloud CLI found, checking ADC...';

    // 1b. Check ADC file exists
    const adcRes = await checkAdc();
    if (!adcRes.ok) {
      spinner.fail('Prerequisites check failed');
      console.log(chalk.red('\n✗ ADC Credentials not configured.\n'));
      console.log(chalk.yellow('Run the following command to authenticate:'));
      console.log(chalk.cyan('  gcloud auth application-default login \\'));
      console.log(chalk.cyan('    --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive\n'));
      process.exit(1);
    }
    spinner.text = 'ADC configured, verifying Drive access...';

    // 1c. Verify Drive access actually works (for --dev mode)
    if (options.dev) {
      try {
        const user = await driveADC.verifyDriveAuth();
        spinner.succeed(`Prerequisites met - Drive access verified (${user.emailAddress})`);
      } catch (error) {
        spinner.fail('Prerequisites check failed');
        console.log(chalk.red('\n✗ Drive authentication failed.\n'));
        console.log(chalk.gray(`   Error: ${error.message}\n`));
        console.log(chalk.yellow('ADC credentials exist but Drive access failed.'));
        console.log(chalk.yellow('This may mean you need to re-authenticate with Drive scopes:\n'));
        console.log(chalk.cyan('  gcloud auth application-default login \\'));
        console.log(chalk.cyan('    --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive\n'));
        process.exit(1);
      }
    } else {
      spinner.succeed('Prerequisites met');
    }

    // 2. Confirm Workspace Root
    console.log(chalk.cyan('\nStep 2: Workspace Root'));
    
    // Detect IDE workspace root
    const detectedRoot = await findIDEMarker(process.cwd());
    let workspaceRoot;
    
    if (detectedRoot) {
      // Found IDE marker - confirm with user
      const { confirmed } = await inquirer.prompt([{
        type: 'input',
        name: 'confirmed',
        message: `Workspace root detected: ${chalk.cyan(detectedRoot)}\nPress Enter to confirm or type a different path:`,
        default: detectedRoot
      }]);
      workspaceRoot = confirmed || detectedRoot;
    } else {
      // No IDE marker found - ask user to enter path
      console.log(chalk.yellow('Could not detect Cursor/VSCode workspace.'));
      const { entered } = await inquirer.prompt([{
        type: 'input',
        name: 'entered',
        message: 'Enter workspace root path:',
        default: process.cwd()
      }]);
      workspaceRoot = entered;
    }
    
    // Validate workspace root exists
    try {
      const stat = await fs.stat(workspaceRoot);
      if (!stat.isDirectory()) {
        throw new Error('Not a directory');
      }
    } catch (error) {
      console.log(chalk.red(`\n✗ Path does not exist or is not a directory: ${workspaceRoot}\n`));
      process.exit(1);
    }
    
    console.log(chalk.gray(`   Workspace root: ${workspaceRoot}`));
    
    // 3. Trigger Device Login (Setup Mode)
    console.log(chalk.cyan('\nStep 3: Workspace Configuration'));
    console.log(chalk.white('We will open your browser to configure your workspace.'));
    console.log(chalk.gray('You will be able to select existing apps or create new ones.\n'));

    // Load global config to check environment
    const globalConfig = await GlobalConfig.load();
    const loginOptions = {
      setup: true,
      workspaceRoot, // Pass confirmed workspace root to login
      ...options
    };

    if (globalConfig.environment === 'development' || options.dev) {
      loginOptions.dev = true;
      if (!loginOptions.url) {
        loginOptions.url = 'https://localhost:4000';
      }
      
      // Update global config to development if not already
      if (globalConfig.environment !== 'development' || globalConfig.api_url !== loginOptions.url) {
        globalConfig.environment = 'development';
        globalConfig.api_url = loginOptions.url;
        await globalConfig.save();
        console.log(chalk.gray(`   Updated global config to development (${loginOptions.url})`));
      }
    }

    // This handles the entire flow: login -> PWA config -> hydrate workspace (via Hydrator)
    await authCommands.loginDevice(loginOptions);

    // 4. Re-save workspace config with absolute paths
    let workspaceConfigObj = null;
    let appPaths = [];
    
    try {
      const configPath = path.join(workspaceRoot, '.descix', 'workspace.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(configContent);
      
      // Create WorkspaceConfig instance and re-save to compute absolute paths
      workspaceConfigObj = new WorkspaceConfig(configData);
      await workspaceConfigObj.save(workspaceRoot);
      
      // Collect all app paths from v2 env format (env.platform + env.products)
      const allEnvProducts = [
        workspaceConfigObj.env?.platform,
        ...(Array.isArray(workspaceConfigObj.env?.products) ? workspaceConfigObj.env.products : [])
      ].filter(p => p?.appId && p?.localPath);

      for (const product of allEnvProducts) {
        appPaths.push({
          appId: product.appId,
          localPath: product.localPath,
          fullPath: path.join(workspaceRoot, product.localPath)
        });
      }

      // Create GETTING STARTED.md in each app
      for (const app of appPaths) {
        await createGettingStartedFile(app.fullPath, app.appId);
      }

      // 4.5 Per-app scaffold setup — Git Mode vs Drive Mode
      // Git Mode: no driveConfig returned by auth (CLI with local .md files → Pinecone)
      // Drive Mode: driveConfig present (PWA/server-side Drive→GCS→Pinecone pipeline)
      const isGitMode = !workspaceConfigObj.driveConfig;

      if (isGitMode) {
        // Git Mode: create local kb/General directory for each app.
        // KB Firestore doc is created separately via `descix app init -a <appId>`.
        for (const app of appPaths) {
          const kbDir = path.join(app.fullPath, 'kb', 'General');
          await fs.mkdir(kbDir, { recursive: true });
          console.log(chalk.gray(`  ✓ kb/General created for ${app.appId}`));
        }

        // Grant entitlements for all workspace apps (Gap 6).
        // Powch device-login users have user.id = wallet_address, but bootstrap set
        // owner_id = ADC email. grant_app_entitlement writes an explicit purchase doc
        // so fetch_my_purchases fast-path returns the app for any authenticated user.
        const postLoginApi = new DeSciXApiClient();
        for (const app of appPaths) {
          try {
            await postLoginApi.invoke('grant_app_entitlement', { app_id: app.appId });
            console.log(chalk.gray(`  ✓ Entitlement granted for ${app.appId}`));
          } catch (err) {
            console.log(chalk.yellow(`  ⚠️  Could not grant entitlement for ${app.appId}: ${err.message}`));
          }
        }
      } else {
        // Drive Mode: scaffold site/microservice via Hydrator
        const readline = await import('readline');
        const { copyScaffold } = await import('../core/Hydrator.js');

        for (const app of appPaths) {
          console.log(chalk.cyan(`\n📦 Configure ${app.appId}:\n`));

          const rl1 = readline.createInterface({ input: process.stdin, output: process.stdout });
          const wantSite = await new Promise(resolve => {
            rl1.question(chalk.white('  Do you want a CodeSite for this app? (y/N): '), answer => {
              rl1.close();
              resolve(answer.toLowerCase() === 'y');
            });
          });

          if (wantSite) {
            try {
              const stats = await copyScaffold('site', app.fullPath, { verbose: false });
              console.log(chalk.green(`  ✓ Site scaffold added (${stats.copied} files)`));
              console.log(chalk.gray(`    Run "descix site upload" to deploy`));

              const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
              const wantPort = await new Promise(resolve => {
                rl2.question(chalk.white('  Set up local dev server port? (enter port or n to skip): '), answer => {
                  rl2.close();
                  resolve(answer);
                });
              });

              if (wantPort && wantPort !== 'n' && wantPort !== 'N') {
                const portNum = parseInt(wantPort);
                if (!isNaN(portNum) && portNum > 0 && portNum < 65536) {
                  const envEntry = workspaceConfigObj.env?.products?.find(p => p.appId === app.appId)
                    || (workspaceConfigObj.env?.platform?.appId === app.appId ? workspaceConfigObj.env.platform : null);
                  if (envEntry) {
                    if (!envEntry.site) envEntry.site = {};
                    envEntry.site.port = portNum;
                    envEntry.site.devCommand = 'npm run dev';
                    await workspaceConfigObj.save(workspaceRoot);
                    console.log(chalk.green(`  ✓ Local port ${portNum} registered`));
                  }
                }
              }
            } catch (err) {
              console.log(chalk.yellow(`  ⚠️  Could not add site scaffold: ${err.message}`));
            }
          }

          const rl3 = readline.createInterface({ input: process.stdin, output: process.stdout });
          const wantMicroservice = await new Promise(resolve => {
            rl3.question(chalk.white('  Do you want a microservice for this app? (y/N): '), answer => {
              rl3.close();
              resolve(answer.toLowerCase() === 'y');
            });
          });

          if (wantMicroservice) {
            try {
              const stats = await copyScaffold('microservice', app.fullPath, { verbose: false });
              console.log(chalk.green(`  ✓ Microservice scaffold added (${stats.copied} files)`));
              console.log(chalk.gray(`    Edit manifest.json, then run "descix microservice register"`));
            } catch (err) {
              console.log(chalk.yellow(`  ⚠️  Could not add microservice scaffold: ${err.message}`));
            }
          }
        }
      }
      
    } catch (error) {
      // Workspace config not found or invalid, continue with generic message
      console.log(chalk.gray(`   Note: Could not update workspace config: ${error.message}`));
    }

    // 5. Show post-setup summary
    console.log(chalk.cyan('\n╔════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║       Setup Complete!                      ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════╝\n'));
    
    // Show actual app structure
    if (appPaths.length > 0) {
      console.log(chalk.white('📁 Apps configured:\n'));
      for (const app of appPaths) {
        console.log(chalk.cyan(`  ${app.localPath}/`));
        console.log(chalk.gray(`     ├── kb/General/     # Add .md files here`));
        console.log(chalk.gray(`     └── GETTING STARTED.md`));
      }
      console.log('');
    }

    console.log(chalk.gray('  🔐 Authentication credentials saved to .descix/wallet.json'));
    console.log('');

    console.log(chalk.cyan('Next Steps:\n'));
    if (appPaths.length > 0) {
      const firstApp = appPaths[0];
      console.log(chalk.white('  1. Initialize KB for each app:'));
      console.log(chalk.yellow(`     descix app init -a ${firstApp.appId}`));
      console.log('');
      console.log(chalk.white('  2. Add markdown files to the KB directory:'));
      console.log(chalk.gray(`     ${firstApp.localPath}/kb/General/`));
      console.log('');
      console.log(chalk.white('  3. Sync to Pinecone:'));
      console.log(chalk.yellow(`     descix update kb -a ${firstApp.appId}`));
      console.log('');
      console.log(chalk.white('  4. Chat:'));
      console.log(chalk.yellow(`     descix chat -a ${firstApp.appId} "Your question"`));
    } else {
      console.log(chalk.white('  1. Initialize KB: descix app init -a <appId>'));
      console.log(chalk.white('  2. Sync KB: descix update kb -a <appId>'));
      console.log(chalk.white('  3. Chat: descix chat -a <appId> "Your question"'));
    }
    console.log('');
    console.log(chalk.gray('📄 See GETTING STARTED.md in each app folder for detailed instructions.\n'));
    console.log(chalk.gray('💡 Not sure what to do? Try: npx descix tell-me-how "your question"\n'));

  } catch (error) {
    // authCommands.loginDevice handles its own error printing mostly
    if (spinner.isSpinning) {
      spinner.fail('Setup failed');
    }
    if (!error.message.includes('Login failed')) {
        console.error(chalk.red(`\n❌ ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * Create GETTING STARTED.md in an app directory
 */
async function createGettingStartedFile(appPath, appId) {
  const communityId = appId; // communityId is server-authoritative in V2; use appId as placeholder
  const gettingStartedPath = path.join(appPath, 'GETTING STARTED.md');
  
  // Don't overwrite if exists
  try {
    await fs.access(gettingStartedPath);
    return; // File exists, skip
  } catch {
    // File doesn't exist, create it
  }
  
  const content = `# Getting Started with ${appId}

Welcome to your DeSciX app! This guide covers the basic CLI commands.

## App Context

When you're in this directory, CLI commands automatically detect your app:
- **Community:** ${communityId}
- **App:** ${appId}

## Knowledge Base Commands

### Add Content to Your KB

1. Copy files to \`kb/staging/\`:
   \`\`\`bash
   cp ~/Documents/my-doc.pdf kb/staging/
   cp ~/notes/*.md kb/staging/
   \`\`\`

2. Build your knowledge base:
   \`\`\`bash
   npx descix kb build
   \`\`\`

   This command:
   - Uploads staging files to Drive
   - Pulls and converts all files
   - Generates embeddings and syncs to Pinecone

### Individual KB Commands

\`\`\`bash
# Push local files to Drive
npx descix kb push

# Pull and convert files from Drive
npx descix kb pull

# Generate chunks for RAG
npx descix kb chunk

# Sync chunks to Pinecone
npx descix kb sync

# Check sync status
npx descix kb status
\`\`\`

## Using Flags from Anywhere

If you're not in the app directory, use flags:

\`\`\`bash
npx descix kb build -c ${communityId} -a ${appId}
\`\`\`

## Site Commands

\`\`\`bash
# Add site scaffold
npx descix site init

# Deploy site to GCS
npx descix site upload

# Register local dev server port
npx descix site servelocal 3000
\`\`\`

## Microservice Commands

\`\`\`bash
# Add microservice scaffold  
npx descix microservice init

# Register microservice with gateway
npx descix microservice register

# Vectorize SERVICE_README for discovery
npx descix microservice vectorize
\`\`\`

## Need Help?

\`\`\`bash
# Ask the AI for guidance
npx descix tell-me-how "your question here"

# Show all commands
npx descix --help

# Show command help
npx descix kb --help
\`\`\`

## Folder Structure

\`\`\`
${appId}/
├── assets/
│   ├── app_description.md
│   ├── system_instructions.md
│   └── icon.png
├── kb/
│   ├── staging/          # Your files to upload
│   ├── General/          # Converted text files
│   └── chunks/           # Generated JSON chunks
├── site/                 # (optional) Static site
├── microservice/         # (optional) Backend service
└── GETTING STARTED.md    # This file
\`\`\`
`;

  try {
    await fs.writeFile(gettingStartedPath, content, 'utf-8');
  } catch (error) {
    // Silently fail - not critical
  }
}

export default { runSetup };
