/**
 * DeSciX CLI Init Command
 *
 * Creates .descix/workspace.json (template-based creation is via PWA/Admin CLI).
 */

import chalk from 'chalk';
import readline from 'readline';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WorkspaceConfig } from '../workspace-config.js';
import { generateAgentFiles } from '../agent-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create readline interface for interactive prompts
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask for text input with optional default
 */
function askInput(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Ask a yes/no question
 */
function askYesNo(rl, question, defaultYes = true) {
  return new Promise((resolve) => {
    const suffix = defaultYes ? '(Y/n)' : '(y/N)';
    rl.question(`${question} ${suffix}: `, (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '') {
        resolve(defaultYes);
      } else {
        resolve(trimmed === 'y' || trimmed === 'yes');
      }
    });
  });
}

/**
 * Run the init command
 * @param {Object} apiClient - API client (optional, for listing communities)
 * @param {Object} options - Command options
 */
export async function runInit(apiClient, options = {}) {
  const rl = createPrompt();
  const projectPath = options.path ? path.resolve(options.path) : process.cwd();
  
  console.log(chalk.cyan('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║     DeSciX Workspace Initialization        ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════╝\n'));

  try {
    const descixDir = join(projectPath, '.descix');
    const configPath = join(descixDir, 'workspace.json');
    let hasExisting = false;
    try {
      await fs.access(configPath);
      hasExisting = true;
    } catch {
      // No existing config
    }

    if (hasExisting && !options.force) {
      const overwrite = await askYesNo(rl, chalk.yellow('Workspace already initialized. Overwrite?'), false);
      if (!overwrite) {
        console.log(chalk.gray('\nInitialization cancelled.\n'));
        rl.close();
        return {};
      }
    }

    let communityId = options.community;
    if (!communityId) {
      if (apiClient) {
        try {
          const response = await apiClient.invoke('find_communities', {});
          const communities = response.message?.communities || [];
          if (communities.length > 0) {
            console.log(chalk.cyan('Available Communities:'));
            communities.slice(0, 10).forEach((c, i) => {
              console.log(chalk.gray(`  ${i + 1}. ${c.community_id} (${c.community_name})`));
            });
            if (communities.length > 10) console.log(chalk.gray(`  ... and ${communities.length - 10} more`));
            console.log();
          }
        } catch {
          // ignore
        }
      }
      communityId = await askInput(rl, chalk.white('Community ID'));
      if (!communityId) {
        console.log(chalk.red('\n❌ Community ID is required.\n'));
        rl.close();
        return {};
      }
    }

    const defaultAppName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9]/g, '_');
    let appName = options.app;
    if (!appName) {
      appName = await askInput(rl, chalk.white('App name'), defaultAppName);
      if (!appName) {
        console.log(chalk.red('\n❌ App name is required.\n'));
        rl.close();
        return {};
      }
    }

    const appId = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    console.log(chalk.cyan('\n─── Summary ───\n'));
    console.log(chalk.white(`  Project:   ${projectPath}`));
    console.log(chalk.white(`  Community: ${communityId}`));
    console.log(chalk.white(`  App:       ${appName} (${appId})`));

    const proceed = await askYesNo(rl, chalk.white('\nProceed?'), true);
    if (!proceed) {
      console.log(chalk.gray('\nCancelled.\n'));
      rl.close();
      return {};
    }

    console.log(chalk.gray('\nWriting .descix/workspace.json...\n'));
    const config = new WorkspaceConfig({ version: '2.0', type: 'workspace', communities: {} }, projectPath);
    config.registerApp(communityId, appId, { localPath: '.', kbId: 'General' });
    await config.save(projectPath);

    console.log(chalk.green('Created:'));
    console.log(chalk.green('  ✓ .descix/workspace.json'));

    // Generate agent instruction files with correct context
    try {
      const agentFilesWritten = await generateAgentFiles(projectPath);
      for (const f of agentFilesWritten) {
        console.log(chalk.green(`  ✓ ${f}`));
      }
    } catch {
      // Agent file generation is best-effort
    }

    console.log(chalk.cyan('\n─── Next Steps ───\n'));
    console.log(chalk.white(`  1. descix app init -a ${appId} -c ${communityId}    # register app on platform`));
    console.log(chalk.white(`  2. descix update kb -c ${communityId} -a ${appId}   # sync KB to Pinecone`));
    console.log(chalk.white(`  3. descix chat -c ${communityId} -a ${appId} -q "test"  # verify RAG\n`));
    console.log(chalk.green('✅ Workspace initialized.\n'));
    rl.close();
    return { created: ['.descix/workspace.json'], skipped: [], warnings: [] };

  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * Non-interactive init: writes .descix/workspace.json only.
 * @param {Object} options - { path?, communityId, appName? }
 * @returns {Promise<Object>} { created, skipped, warnings }
 */
export async function initWorkspace(options) {
  const projectPath = options.path ? path.resolve(options.path) : process.cwd();
  const communityId = options.communityId;
  const appName = options.appName || path.basename(projectPath).toLowerCase().replace(/[^a-z0-9]/g, '_');
  const appId = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (!communityId) {
    throw new Error('communityId is required');
  }
  const config = new WorkspaceConfig({ version: '2.0', type: 'workspace', communities: {} }, projectPath);
  config.registerApp(communityId, appId, { localPath: '.', kbId: 'General' });
  await config.save(projectPath);

  // Generate agent instruction files with workspace context
  const created = ['.descix/workspace.json'];
  try {
    const agentFilesWritten = await generateAgentFiles(projectPath);
    created.push(...agentFilesWritten);
  } catch {
    // Best-effort
  }

  return {
    created,
    skipped: [],
    warnings: [],
    nextSteps: [`descix app init -a ${appId} -c ${communityId}`, `descix update kb -c ${communityId} -a ${appId}`]
  };
}

export default { runInit, initWorkspace };
