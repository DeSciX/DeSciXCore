/**
 * `descix app init` — THE path to an app (CEO-D-2026-08-14): creates the app when it does not exist
 * yet, then registers and scaffolds it locally. `descix quickstart` runs the same function, so the
 * two cannot disagree about what an initialized app is.
 *
 * THE APP ID IS THE SERVER'S. With -c, the -a value is a NAME and create_app_for_community composes
 * the id ({community}-{short}); this module registers whatever id the server returns and never
 * composes one. `descix init` used to record the NAME as the app id, so the workspace and CLAUDE.md
 * named `myapp` while the platform held `daita-myapp` (devx review 2026-09-19, D2). The agent
 * instruction files are therefore written HERE, after the id exists, and nowhere earlier.
 */
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { WorkspaceConfig, resolveWorkspacePath } from '../workspace-config.js';
import { refreshCommunityIdentity, printIdentityReceipt } from './communityIdentity.js';
import { generateAgentFiles } from '../agent-files.js';

/**
 * @param {Object} apiClient an authenticated DeSciXApiClient
 * @param {{app: string, community?: string, short?: string, overwrite?: boolean, kb?: string, path?: string}} options
 * @returns {Promise<{appId: string, communityId: string, appPath: string, kbId: string}>}
 */
export async function runAppInit(apiClient, options) {
  let appId = options.app;
  const kbId = options.kb || 'General';

  // Refuse an unusable -p BEFORE anything is written — server-side included. The same resolver
  // the workspace loader applies on every read decides it, so a value accepted here is one the
  // next read accepts too. Refusing only at registration came AFTER a `-c` create, leaving a
  // platform app with no local registration (measured 2026-09-18, daita-docs).
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
    if (appId !== options.app) {
      console.log(chalk.gray(`  The platform composed the id from the community and the name you gave.`));
      console.log(chalk.gray(`  Use -a ${appId} in every later command.`));
    }
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

  const wsRoot = workspaceConfig?.workspaceRoot || process.cwd();
  if (!alreadyMapped) {
    const localPath = options.path || '.';
    const cfg = workspaceConfig || new WorkspaceConfig({}, wsRoot);
    cfg.registerApp(communityId, appId, { localPath, kbId });
    await cfg.save(wsRoot);
    appPath = path.resolve(wsRoot, localPath);
    console.log(chalk.gray(`  workspace.json updated: ${appId} → ${localPath}`));
  }

  // 2. Create app folder structure (site, microservice, assets)
  const assetsDir = path.join(appPath, 'assets');
  await fs.mkdir(path.join(appPath, 'site'), { recursive: true });
  await fs.mkdir(path.join(appPath, 'microservice'), { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
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

  // 4. Agent instruction files, now that the workspace names an id the platform issued. Files the
  // developer has customised (no BOOTSTRAP marker) are left alone by generateAgentFiles.
  const written = await generateAgentFiles(wsRoot);
  for (const f of written) console.log(chalk.green(`  ✓ ${f}`));

  console.log(chalk.cyan('\nNext steps:'));
  // The manifest lives in THIS app's registered directory — never a guessed `apps/<id>/`,
  // which named a path that does not exist for any app registered elsewhere.
  const manifestPath = path.join(appPath, '.descix', 'manifests', `${kbId}.json`);
  console.log(chalk.gray(`  Create a corpus manifest at ${path.relative(process.cwd(), manifestPath) || manifestPath}`));
  console.log(chalk.gray(`  then run:`));
  console.log(chalk.white(`  descix kb corpus sync -a ${appId}\n`));

  return { appId, communityId, appPath, kbId };
}
