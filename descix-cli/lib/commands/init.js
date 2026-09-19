/**
 * DeSciX CLI Init Command
 *
 * Creates .descix/workspace.json (template-based creation is via PWA/Admin CLI).
 */

import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// clone.js is imported dynamically inside the invite flow to avoid circular deps
import { WorkspaceConfig } from '../workspace-config.js';
// The canonical KB-sync surface is owned by retired-kb-sync.js. Consume the constant: a literal
// spelled here is a second derivation of the same fact, and the removed verb this replaced
// reached a developer who had done everything right.
import { CANONICAL_KB_SYNC } from './retired-kb-sync.js';
// "May I prompt?" has ONE OWNER. init does not derive it, and holds no TTY check of its own.
import { createLazyPromptSession } from '../interactive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run the init command
 * @param {Object} apiClient - API client (optional, for listing communities)
 * @param {Object} options - Command options
 */
export async function runInit(apiClient, options = {}) {
  // The session is built only when a question is actually asked, and is still gated then: under
  // a non-TTY an unanswered question throws NonInteractiveError (bin/descix.js prints it and
  // exits 1) — it can never hang on an open pipe, nor exit 0 having written nothing. With every
  // answer given as a flag, nothing is asked, so an AI assistant or a script can run init.
  const rl = createLazyPromptSession({
    what: 'descix init',
    nonInteractiveForm: [
      'descix init -c <community> -a <app> --yes',
      '  (add --force to replace an existing .descix/workspace.json)',
      '',
      'Nothing has been changed. An existing .descix/workspace.json is left as it is.'
    ]
  });
  const projectPath = options.path ? path.resolve(options.path) : process.cwd();

  // If --from-invite provided, resolve the invite first to pre-fill context
  if (options.fromInvite) {
    if (!apiClient) {
      console.error(chalk.red('\n❌ Authentication required for --from-invite. Run "descix login" first.\n'));
      rl.close();
      return {};
    }
    try {
      console.log(chalk.cyan('Resolving invite...\n'));
      const inviteData = await apiClient.invoke('resolve_invite', { invite_token: options.fromInvite });

      // Write app.json seed file
      const descixDir = join(projectPath, '.descix');
      await fs.mkdir(descixDir, { recursive: true });
      const appJson = {
        version: '1.0',
        invite_token: options.fromInvite,
        invite_type: inviteData.invite_type,
        app_id: inviteData.app_id,
        community_id: inviteData.community_id,
        app_name: inviteData.app_name,
        agent_hint: inviteData.agent_hint,
        kb_ready: inviteData.kb_ready,
        has_repo: inviteData.has_repo
      };
      await fs.writeFile(join(descixDir, 'app.json'), JSON.stringify(appJson, null, 2));

      console.log(chalk.green(`Invite resolved: ${inviteData.app_name} (${inviteData.community_id}/${inviteData.app_id})`));
      if (inviteData.agent_hint) {
        console.log(chalk.gray(`Agent hint: ${inviteData.agent_hint}`));
      }

      // Auto-fill community and app for the rest of init
      options.community = options.community || inviteData.community_id;
      options.app = options.app || inviteData.app_id;

      // Offer to clone if repo exists
      if (inviteData.has_repo) {
        console.log(chalk.cyan('\nThis app has a linked repository.'));
        const { runClone } = await import('./clone.js');
        await runClone(apiClient, { app_id: inviteData.app_id });
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed to resolve invite: ${error.message}\n`));
      rl.close();
      return {};
    }
  }
  
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

    // An existing workspace is EXTENDED, never replaced. It may carry the environment the developer
    // chose with `descix config init --env dev` — env.apiUrl / env.environment, owned by the config
    // verbs — and init used to write a brand-new file over it, silently moving a DEV workspace to
    // PROD (measured 2026-09-19: DEV before, `config show` said prod after). --force now restarts
    // only the APP registrations; the environment is kept either way.
    const existingConfig = hasExisting ? await WorkspaceConfig.load(projectPath) : null;

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
      communityId = await rl.ask(chalk.white('Community ID'));
      if (!communityId) {
        console.log(chalk.red('\n❌ Community ID is required.\n'));
        rl.close();
        return {};
      }
    }

    const defaultAppName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9]/g, '_');
    let appName = options.app;
    if (!appName) {
      appName = await rl.ask(chalk.white('App name'), defaultAppName);
      if (!appName) {
        console.log(chalk.red('\n❌ App name is required.\n'));
        rl.close();
        return {};
      }
    }

    console.log(chalk.cyan('\n─── Summary ───\n'));
    console.log(chalk.white(`  Project:   ${projectPath}`));
    console.log(chalk.white(`  Community: ${communityId}`));
    console.log(chalk.white(`  App name:  ${appName}`));

    const proceed = options.yes ? true : await rl.askYesNo(chalk.white('\nProceed?'), true);
    if (!proceed) {
      console.log(chalk.gray('\nCancelled.\n'));
      rl.close();
      return {};
    }

    console.log(chalk.gray(`\n${existingConfig ? 'Updating' : 'Writing'} .descix/workspace.json...\n`));
    const config = existingConfig || new WorkspaceConfig({ version: '2.1', type: 'workspace', env: {} }, projectPath);
    if (existingConfig && options.force && config.env) {
      config.env.products = [];
      delete config.env.platform;
    }
    // NO APP IS REGISTERED HERE. The app id is the platform's: `app init` creates the app and
    // registers the id the server returns (with -c it is composed from the community and the
    // name). Recording the NAME here as the id left the workspace and CLAUDE.md naming an app the
    // platform does not have (devx review 2026-09-19, D2). The agent instruction files state that
    // id, so `app init` writes them too, once it exists.
    await config.save(projectPath);
    // A NEW workspace records the environment this run used (`descix --env dev init …`), through
    // the same owner `config init` uses — otherwise the workspace carried no environment and the
    // very next command fell back to PROD, although the developer had just chosen DEV. An EXISTING
    // workspace keeps its own environment: that choice belongs to the config verbs.
    if (!existingConfig && options.env) {
      await config.setEnvironment(options.env);
    }

    console.log(chalk.green(`${existingConfig ? 'Updated' : 'Created'}:`));
    console.log(chalk.green('  ✓ .descix/workspace.json'));

    console.log(chalk.cyan('\n─── Next Steps ───\n'));
    console.log(chalk.white(`  1. descix login                                  # if you are not signed in`));
    console.log(chalk.white(`  2. descix app init -a ${appName} -c ${communityId}`));
    console.log(chalk.gray(`     Creates the app and registers the id the platform issues for it (with -c the`));
    console.log(chalk.gray(`     id is ${communityId}-<name>), then writes CLAUDE.md and the other agent files.`));
    console.log(chalk.gray(`  3. Create the corpus manifest app init names, then:`));
    console.log(chalk.white(`     ${CANONICAL_KB_SYNC} -a <the id app init printed>\n`));
    console.log(chalk.green('✅ Workspace initialized.\n'));
    rl.close();
    return { created: ['.descix/workspace.json'], skipped: [], warnings: [] };

  } catch (error) {
    rl.close();
    throw error;
  }
}

export default { runInit };
