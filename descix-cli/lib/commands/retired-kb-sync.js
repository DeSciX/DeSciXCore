/**
 * ONE OWNER for the retirement of every superseded KB-sync surface.
 *
 * CEO 2026-08-29: "there should never be a deprecated path and then everything else is a
 * waterfall of problems." The CLI exposes exactly ONE kb sync surface — `descix kb corpus
 * sync` (git-synced manifest). Every other sync path is DELETED: its implementation is gone
 * and its old name exits NON-ZERO naming the replacement. That is not a compat fence — a
 * compat fence is a path that still WORKS under an old name. These do not work at all.
 *
 * Why a module and not a literal at each site: two derivations of one fact is the general
 * form of mirror drift. The retired set is enumerated ONCE here; bin/descix.js registers
 * from this list and tests/kb-sync-single-surface.test.js asserts against this same list,
 * so a registration and its gate cannot disagree.
 */

/** The single canonical KB sync surface. Named in every refusal. */
export const CANONICAL_KB_SYNC = 'descix kb corpus sync';

/** The verb that creates a KB — `kb corpus sync`'s dependency (I4). */
export const CANONICAL_KB_CREATE = 'descix kb create';

/**
 * Every KB-sync surface retired by ws-devplane-cli-kb-surface-single-canonical-sync.
 * `invocation` is what a user types; `parent` is the commander parent it hung off.
 */
export const RETIRED_KB_SYNC_SURFACES = [
  { invocation: 'descix sync',       name: 'sync',   parent: 'program', note: 'group had no surviving children' },
  { invocation: 'descix sync kb',    name: 'kb',     parent: 'sync',    note: 'context-aware wrapper' },
  { invocation: 'descix kb chunk',   name: 'chunk',  parent: 'kb',      note: 'low-level chunk step' },
  { invocation: 'descix kb sync',    name: 'sync',   parent: 'kb',      note: 'low-level upsert step' },
  { invocation: 'descix update kb',  name: 'kb',     parent: 'update',  note: 'dispatcher branch' },
];

/** Implementations deleted with those surfaces. No exported symbol survives without a caller (I3). */
export const DELETED_KB_SYNC_SYMBOLS = [
  'runKbChunk',
  'runKbSync',
  'runKbBuild',
  'runKbStatus',
  'runKbCompare',
  'updateKB',
];

/**
 * The single refusal message. Fails loud and names the replacement — never warns, never falls back.
 * @param {string} invocation - the retired invocation the user typed, e.g. 'descix kb chunk'
 * @returns {string}
 */
export function retiredKbSyncMessage(invocation) {
  return (
    `\`${invocation}\` has been REMOVED. There is no replacement flag and no fallback.\n\n` +
    `Use the one canonical KB sync surface:\n` +
    `  ${CANONICAL_KB_SYNC} -a <app_id> [-k <kb_name>]\n\n` +
    `It syncs from a git-tracked corpus manifest (.descix/manifests/), which the removed ` +
    `path could not do. If the KB does not exist yet, create it first with ` +
    `\`${CANONICAL_KB_CREATE}\`.`
  );
}

/**
 * Register a retired invocation so it exits NON-ZERO naming the canonical surface.
 * Accepts and ignores any args/options the old surface took, so an old script fails with
 * this message rather than a confusing commander parse error.
 *
 * @param {import('commander').Command} parent - commander parent to attach to
 * @param {string} name - the retired command name
 * @param {string} invocation - full invocation used in the message
 * @param {(s:string)=>string} red - chalk.red or equivalent
 */
export function registerRetiredKbSync(parent, name, invocation, red) {
  return parent
    .command(name, { hidden: true })
    .description(`REMOVED — use \`${CANONICAL_KB_SYNC}\``)
    .allowUnknownOption(true)
    // helpOption(false) is load-bearing: commander intercepts `--help` BEFORE the action and
    // exits 0. A retired surface must exit NON-ZERO however it is invoked — `descix kb chunk`
    // and `descix kb chunk --help` must both fail and name the replacement. Without this, the
    // most natural way a user probes a dead verb is the one way it appears to still work.
    .helpOption(false)
    .argument('[args...]', 'ignored')
    .action(() => {
      console.error(red(`\n❌ ${retiredKbSyncMessage(invocation)}\n`));
      process.exit(1);
    });
}
