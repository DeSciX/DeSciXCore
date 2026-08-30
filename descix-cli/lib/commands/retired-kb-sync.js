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
 * form of mirror drift. The retired set is enumerated ONCE here. bin/descix.js registers by
 * ITERATING this list via registerAllRetiredKbSync() -- it does not name any retired verb
 * itself -- and tests/kb-sync-single-surface.test.js asserts against the same list. So the
 * drift is closed in BOTH directions: a surface added to the list is registered, and a
 * surface cannot be registered without being in the list.
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
  { id: 'sync',      parent: 'program', name: 'sync',  invocation: 'descix sync',      registered: true  },
  { id: 'sync.kb',   parent: 'sync',    name: 'kb',    invocation: 'descix sync kb',   registered: true  },
  { id: 'kb.chunk',  parent: 'kb',      name: 'chunk', invocation: 'descix kb chunk',  registered: true  },
  { id: 'kb.sync',   parent: 'kb',      name: 'sync',  invocation: 'descix kb sync',   registered: true  },
  // registered:false -- `update` survives for app/site, so this one is a dispatcher branch
  // inside the live `update` command rather than a commander registration of its own.
  { id: 'update.kb', parent: 'update',  name: 'kb',    invocation: 'descix update kb', registered: false },
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
 * Refuse a retired invocation LOUDLY and exit non-zero.
 *
 * MEASURED, not assumed: a `throw` from updateAuto is NOT swallowed — updateAuto's own catch
 * prints the message before rethrowing, so both forms reach the user and exit 1. This exists
 * for two smaller, real reasons: (1) ONE owner for the refusal, so the dispatcher branch and
 * updateAuto's kb branch cannot drift into different wording or different exit codes; and
 * (2) a deliberate retirement is not a crash, so it should not be framed as "✖ Update failed".
 *
 * @param {string} invocation - the retired invocation, e.g. 'descix update kb'
 * @param {(s:string)=>string} red - chalk.red or equivalent
 * @returns {never}
 */
export function refuseRetiredKbSync(invocation, red) {
  console.error(red(`\n❌ ${retiredKbSyncMessage(invocation)}\n`));
  process.exit(1);
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

/**
 * Register EVERY retired surface by iterating RETIRED_KB_SYNC_SURFACES.
 *
 * This is what makes the one-owner claim true rather than merely asserted: bin/descix.js
 * calls this once and never names a retired verb itself, so a retired surface cannot be
 * registered without appearing in the list above.
 *
 * @param {Record<string, import('commander').Command>} roots - seed parents, e.g. { program, kb }
 * @param {(s:string)=>string} red - chalk.red or equivalent
 * @returns {Record<string, import('commander').Command>} roots plus each registered surface by id
 */
export function registerAllRetiredKbSync(roots, red) {
  const byId = { ...roots };
  for (const s of RETIRED_KB_SYNC_SURFACES) {
    if (!s.registered) continue;
    const parent = byId[s.parent];
    if (!parent) {
      throw new Error(
        `retired-kb-sync: no parent '${s.parent}' available for '${s.invocation}'. ` +
        'Seed it in the roots map or order the list so the parent is registered first.'
      );
    }
    byId[s.id] = registerRetiredKbSync(parent, s.name, s.invocation, red);
  }
  return byId;
}
