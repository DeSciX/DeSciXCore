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
import { WorkspaceConfig, assertNoParentWorkspace } from '../workspace-config.js';
import { refreshCommunityIdentity, printIdentityReceipt } from './communityIdentity.js';
import { generateAgentFiles } from '../agent-files.js';
import { scaffoldAppRepo } from '../app-scaffold.js';

/**
 * @param {Object} apiClient an authenticated DeSciXApiClient
 * @param {{app: string, community?: string, short?: string, overwrite?: boolean, kb?: string}} options
 * @returns {Promise<{appId: string, communityId: string, appPath: string, kbId: string}>}
 */
export async function runAppInit(apiClient, options) {
  let appId = options.app;
  let kbId = options.kb || 'General';
  let createdHere = false;

  // v3 single-app: THIS directory becomes (or already is) the workspace root. A workspace at an
  // ANCESTOR is a refusal, loud, BEFORE anything is written anywhere — the walk-up used to
  // silently register a nested checkout into the parent workspace (the measured trap).
  await assertNoParentWorkspace(process.cwd());
  const workspaceConfig = await WorkspaceConfig.tryLoad(process.cwd());

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
    createdHere = true;
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

  // MAPPING AN EXISTING APP ADOPTS ITS KNOWLEDGE BASES AND NEVER CREATES ONE (measured
  // 2026-10-10: mapping `egpt` without --kb created an empty `General` on PROD beside its
  // real `Corpus`). One existing KB → adopted; several → --kb must name one of THEM; a named
  // KB that does not exist is a refusal, never a create. Only the CREATE leg above may create,
  // because only a brand-new app has nothing to adopt.
  if (!createdHere) {
    const kbResp = await apiClient.invoke('list_knowledge_bases', { community_id: communityId, app_id: appId });
    const existingKbs = ((kbResp.message || kbResp).knowledge_bases || []).map((kb) => kb.name);
    if (options.kb) {
      if (!existingKbs.includes(options.kb)) {
        throw new Error(
          `App '${appId}' has no KB named '${options.kb}' — it has: ${existingKbs.join(', ') || '(none)'}.\n` +
          `Mapping an existing app never creates a KB; name one that exists with --kb, or create ` +
          `one deliberately with its own verb.`
        );
      }
      kbId = options.kb;
    } else if (existingKbs.length === 1) {
      kbId = existingKbs[0];
    } else if (existingKbs.length > 1) {
      throw new Error(
        `App '${appId}' has ${existingKbs.length} knowledge bases: ${existingKbs.join(', ')}.\n` +
        `Name the one this repo syncs with --kb <name>.`
      );
    }
    // zero KBs: every app is guaranteed a default KB at creation, so an empty list is a
    // platform-side anomaly — keep the declared kbId and let the sync surface report it.
  }

  // 1. Workspace.json — THIS repo root is the workspace root and holds exactly this app (v3).
  // registerApp is idempotent for the same id and REFUSES a different one: a repo that already
  // holds another app errors loudly instead of being silently re-pointed.
  const wsRoot = workspaceConfig?.workspaceRoot || process.cwd();
  const cfg = workspaceConfig || new WorkspaceConfig({ version: '3.0' }, wsRoot);
  cfg.registerApp(communityId, appId, { kbId });
  await cfg.save(wsRoot);
  const appPath = wsRoot;
  console.log(chalk.gray(`  workspace.json: env.app = ${appId} (this repo root)`));

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
  for (const f of await scaffoldAppRepo(appPath, { appId, communityId })) console.log(chalk.green(`  ✓ ${f}`));

  // 3. The default KB — CREATE leg only (see the adopt block above: map never creates).
  let kbResult = null;
  if (createdHere) {
    const kbResponse = await apiClient.invoke('init_git_mode_kb', { app_id: appId, kb_name: kbId });
    kbResult = kbResponse.message || kbResponse;
  }

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
  console.log(chalk.gray(`  KB: ${kbId} — ${kbResult ? (kbResult.created ? 'created' : 'already exists') : 'adopted (existing app; map never creates)'}\n`));
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
