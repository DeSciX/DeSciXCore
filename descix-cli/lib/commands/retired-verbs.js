/**
 * ONE OWNER for every retired CLI verb: a table and one refusal.
 *
 * A retired verb's implementation is deleted; its NAME stays registered, hidden, so typing it
 * exits non-zero naming the replacement instead of earning commander's "unknown command". That
 * is not a compat fence: nothing here works under an old name.
 *
 * bin/descix.js calls registerAllRetiredVerbs() once and names no retired verb itself, and no
 * other module registers a hidden command (tests/retired-verbs-one-path.test.js). Retiring a verb
 * is one row in RETIRED_VERBS.
 */

import chalk from 'chalk';
import { TOP_LEVEL_API_URL_REMEDY } from '../workspace-config.js';
import { MICROSERVICE_AUTH_MODEL } from './microservice-auth-model.js';
import { CANONICAL_KB_SYNC, kbCreateInvocation } from './kb-sync-surface.js';

const kbSyncRefusal = (invocation) =>
  `❌ \`${invocation}\` has been REMOVED. There is no replacement flag and no fallback.\n\n` +
  `Use the one canonical KB sync surface:\n` +
  `  ${CANONICAL_KB_SYNC} -a <app_id> [-k <kb_name>]\n\n` +
  `It syncs from a git-tracked corpus manifest (.descix/manifests/), which the removed ` +
  `path could not do. If the KB does not exist yet, create it first with ` +
  `\`${kbCreateInvocation()}\`.`;
const KB_SYNC_DESCRIPTION = `REMOVED — use \`${CANONICAL_KB_SYNC}\``;

const AIRDROP_QUEUE_REFUSAL = (invocation) =>
  `❌ \`${invocation}\` has been REMOVED: the pending_migrations queue it previewed (lane B) no longer ` +
  `exists, and neither does the server command behind it.\n\n` +
  `Distributions run through the offers rail on daita-sam (act plan + the role holder's own wallet signs).`;

const CRYPTO_QUOTE_REFUSAL = (invocation) =>
  `❌ \`${invocation}\` has been REMOVED: the platform no longer sells through crypto payment quotes, ` +
  `and the commands behind it are gone.\n\n` +
  `Buy AI credits with \`descix credits buy --usd <amount>\` (prints a Stripe Checkout URL from Powch), ` +
  `or in the Powch Buy menu.`;

/**
 * Every retired verb. `invocation` is what a user types; `parent` is the id of the commander
 * parent it hangs off (a root passed to registerAllRetiredVerbs, or an earlier row); `refusal`
 * renders the full text printed on refusal.
 */
export const RETIRED_VERBS = Object.freeze([
  // The KB sync surfaces superseded by `descix kb corpus sync`.
  { id: 'sync', parent: 'program', name: 'sync', invocation: 'descix sync',
    description: KB_SYNC_DESCRIPTION, refusal: kbSyncRefusal },
  { id: 'sync.kb', parent: 'sync', name: 'kb', invocation: 'descix sync kb',
    description: KB_SYNC_DESCRIPTION, refusal: kbSyncRefusal },
  { id: 'kb.chunk', parent: 'kb', name: 'chunk', invocation: 'descix kb chunk',
    description: KB_SYNC_DESCRIPTION, refusal: kbSyncRefusal },
  { id: 'kb.sync', parent: 'kb', name: 'sync', invocation: 'descix kb sync',
    description: KB_SYNC_DESCRIPTION, refusal: kbSyncRefusal },
  // It assigned a top-level `apiUrl` that save() never serialized and printed success over it.
  { id: 'config.set-url', parent: 'config', name: 'set-url', invocation: 'descix config set-url',
    description: 'retired — see error text',
    refusal: () =>
      '"descix config set-url" is retired: it never wrote the origin it reported (a retired top-level\n' +
      'key that nothing reads). Set the API origin where it is read, env.apiUrl, with one of:\n' +
      `  ${TOP_LEVEL_API_URL_REMEDY}` },
  // There is no per-app microservice delegate key (CEO-D-2026-06-02-APP-DATA-PLANE).
  { id: 'microservice.register-delegate', parent: 'microservice', name: 'register-delegate',
    invocation: 'descix microservice register-delegate', description: 'removed — see error text',
    refusal: () =>
      '"descix microservice register-delegate" has been removed: there is no per-app microservice ' +
      'delegate key.\n' + MICROSERVICE_AUTH_MODEL },
  // Lane B (the pending_migrations queue) is struck (CEO word Unkamon 1530eb6, daita-sam#4).
  { id: 'airdrop', parent: 'program', name: 'airdrop', invocation: 'descix airdrop',
    description: 'removed — see error text', refusal: (invocation) => AIRDROP_QUEUE_REFUSAL(invocation) },
  { id: 'airdrop.execute-queue', parent: 'airdrop', name: 'execute-queue',
    invocation: 'descix airdrop execute-queue', description: 'removed — see error text',
    refusal: (invocation) => AIRDROP_QUEUE_REFUSAL(invocation) },
  // Cloud's crypto-purchase rail is deleted (CEO "cloud rails: A", eabadir/DeSciXCloud#39).
  { id: 'buy', parent: 'program', name: 'buy', invocation: 'descix buy',
    description: 'removed — see error text', refusal: CRYPTO_QUOTE_REFUSAL },
  ...['quote', 'status', 'poll', 'chains'].map((name) => ({
    id: `buy.${name}`, parent: 'buy', name, invocation: `descix buy ${name}`,
    description: 'removed — see error text', refusal: CRYPTO_QUOTE_REFUSAL,
  })),
]);

/** Implementations deleted with the KB sync surfaces. No exported symbol survives without a caller. */
export const DELETED_KB_SYNC_SYMBOLS = Object.freeze([
  'runKbChunk',
  'runKbSync',
  'runKbBuild',
  'runKbStatus',
  'runKbCompare',
  'updateKB',
]);

/** The exact text a retired verb prints. */
export function retiredVerbRefusal(verb) {
  return verb.refusal(verb.invocation);
}

/** THE refusal: print the verb's text and exit non-zero. Never warns, never falls back. */
export function refuseRetiredVerb(verb) {
  console.error(chalk.red(`\n${retiredVerbRefusal(verb)}\n`));
  process.exit(1);
}

/**
 * Register every row of RETIRED_VERBS, hidden, under its parent. Each accepts and ignores the old
 * arguments and options so an old script fails with the refusal rather than a commander parse
 * error. helpOption(false) is load-bearing: commander answers `--help` BEFORE the action and exits
 * 0, so without it the most natural way to probe a dead verb is the one way it appears to work.
 *
 * @param {Record<string, import('commander').Command>} roots - seed parents by id, e.g. { program, kb, config, microservice }
 * @returns {Record<string, import('commander').Command>} roots plus each registered verb by id
 */
export function registerAllRetiredVerbs(roots) {
  const byId = { ...roots };
  for (const verb of RETIRED_VERBS) {
    const parent = byId[verb.parent];
    if (!parent) {
      throw new Error(
        `retired-verbs: no parent '${verb.parent}' available for '${verb.invocation}'. ` +
        'Seed it in the roots map or order the table so the parent is registered first.'
      );
    }
    byId[verb.id] = parent
      .command(verb.name, { hidden: true })
      .description(verb.description)
      .allowUnknownOption(true)
      .helpOption(false)
      .argument('[args...]', 'ignored')
      .action(() => refuseRetiredVerb(verb));
  }
  return byId;
}
