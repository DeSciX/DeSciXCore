/**
 * `descix kb create` — create a knowledge base on an EXISTING app, and the one CLI caller of the
 * platform command that mints a KB (`init_git_mode_kb`). `app init`'s create leg consumes
 * initKnowledgeBase() too, so the two paths cannot disagree about what creating a KB sends or what
 * its reply means.
 *
 * init_git_mode_kb is idempotent on the server: an existing KB answers `created: false`. The verb
 * that was asked to CREATE refuses that answer (exit 1) rather than reporting a KB it did not make.
 * Every server refusal (not an admin of the app, the app not found, a bad name) passes through with
 * its own code and message.
 */
import chalk from 'chalk';
import { CANONICAL_KB_SYNC } from './kb-sync-surface.js';

/**
 * Invoke init_git_mode_kb and return its reply bag. A reply that does not say whether the KB was
 * created is a refusal here: the caller would otherwise decide it succeeded without asking.
 *
 * @param {{ invoke: Function }} apiClient
 * @param {{ appId: string, kbName: string, systemInstructions?: string }} args
 * @returns {Promise<{ created: boolean, community_id?: string, app_id?: string, kb_name?: string, message?: string }>}
 */
export async function initKnowledgeBase(apiClient, { appId, kbName, systemInstructions }) {
  if (!appId) throw new Error('initKnowledgeBase: appId is required');
  if (!kbName) throw new Error('initKnowledgeBase: kbName is required');
  const params = { app_id: appId, kb_name: kbName };
  if (systemInstructions !== undefined) params.system_instructions = systemInstructions;
  const response = await apiClient.invoke('init_git_mode_kb', params);
  const result = response?.message ?? response;
  if (!result || typeof result.created !== 'boolean') {
    throw new Error(
      `init_git_mode_kb returned no 'created' verdict for KB '${kbName}' on '${appId}': ` +
      `${JSON.stringify(response)}`
    );
  }
  return result;
}

/**
 * `descix kb create -a <app_id> --kb <kb_name> [--system-instructions <text>]`.
 * Throws (the caller exits 1) on every refusal, including an existing KB.
 */
export async function runKbCreate(apiClient, options) {
  const appId = options.app;
  const kbName = options.kb;
  if (!appId) throw new Error('-a, --app <app_id> is required');
  if (!kbName) throw new Error('-k, --kb <kb_name> is required');

  const result = await initKnowledgeBase(apiClient, {
    appId, kbName, systemInstructions: options.systemInstructions,
  });

  if (!result.created) {
    const err = new Error(
      `KB '${kbName}' already exists on '${appId}'; nothing was created. ` +
      `Run \`descix kb list -a ${appId}\` to see its KBs.`
    );
    err.code = 'KB_EXISTS';
    throw err;
  }

  console.log(chalk.green('\n✅ Knowledge base created.\n'));
  console.log(chalk.cyan(`  KB: ${result.kb_name}`));
  console.log(chalk.gray(`  App: ${result.community_id}/${result.app_id}`));
  console.log(chalk.gray(`  Next: add .descix/manifests/${kbName}.json, then run \`${CANONICAL_KB_SYNC} -a ${appId} -k ${kbName}\`\n`));
  return result;
}
