/**
 * ROW 2: A REFUSAL MUST NEVER PRESCRIBE A VERB THE CALLER CANNOT SUCCESSFULLY RUN.
 *
 * This is ONE mechanism for the WHOLE CLASS, not a patch on one message. Every refusal in this
 * CLI that tells the caller to run `descix <verb>` is found by scanning the source, and every
 * verb it names is resolved against the CLI's OWN registered command tree. A refusal that
 * prescribes a verb the CLI does not have strands the caller completely: they are refused, told
 * what to run, and the thing they are told to run does not exist.
 *
 * Why this class is worth a gate rather than N edits: a verb gets renamed or retired in one
 * commit, and every refusal that named it goes silently wrong in files nobody opened. The
 * prescription and the command tree are two derivations of one fact; without a gate they drift,
 * and they drift toward a message that reads perfectly and helps nobody.
 *
 * WHY NOT `descix <verb> --help`: measured 2026-09-15 — commander exits 0 and prints the ROOT
 * help for an unknown command, so `node bin/descix.js totally-bogus-verb --help` returns 0 just
 * like a real verb. A gate built on that predicate cannot fail. The command tree is therefore
 * enumerated from the help LISTINGS, where a missing verb is genuinely absent.
 *
 * COVERAGE BOUNDARY — printed on GREEN as well as RED (see the console.log at the end):
 *   READS  : bin/**.js and lib/**.js. For each refusal opener (`throw new Error(`,
 *            `console.error(`, `chalk.red(`) it reads forward to the balancing paren, so a verb
 *            on a later line of a template literal is still seen.
 *   CATCHES: a prescribed verb that is NOT a registered command (deleted, renamed, typo'd).
 *   DOES NOT CATCH: a verb that EXISTS but will refuse this particular caller for a different
 *            reason (auth, entitlement, or a state precondition). That is a real member of row
 *            2's class and it is NOT mechanically decidable from the source — it needs the
 *            judgment check, and `descix app set-localpath` was exactly that case: registered,
 *            prescribed, and refusing. It is closed in bin/descix.js, not here.
 *   ALSO NOT READ: tests/, scaffolds/, node_modules, .wt/ worktrees; refusal text produced
 *            server-side; refusals that prescribe a non-descix remedy.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'bin', 'descix.js');
const OPENERS = [/throw new Error\(/g, /console\.error\(/g, /chalk\.red\(/g];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Every refusal site naming a `descix <verb>`, as { file, line, verb }. */
function censusOfPrescriptions() {
  const found = [];
  for (const file of [...walk(path.join(ROOT, 'bin')), ...walk(path.join(ROOT, 'lib'))]) {
    const src = fs.readFileSync(file, 'utf8');
    for (const opener of OPENERS) {
      opener.lastIndex = 0;
      let m;
      while ((m = opener.exec(src))) {
        let depth = 0, end = m.index;
        for (let i = m.index + m[0].length - 1; i < src.length && i < m.index + 4000; i++) {
          if (src[i] === '(') depth++;
          else if (src[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
        }
        const block = src.slice(m.index, end + 1);
        const line = src.slice(0, m.index).split('\n').length;
        for (const v of new Set([...block.matchAll(/descix ([a-z][a-z-]*(?: [a-z][a-z-]*)?)/g)].map(x => x[1]))) {
          found.push({ file: path.relative(ROOT, file), line, verb: v });
        }
      }
    }
  }
  return found;
}

/**
 * The CLI's registered command tree, read from its own help listings.
 *
 * `--admin` ALWAYS: the CLI now hides admin-only verbs from the DEFAULT `--help` listing
 * (lib/command-visibility.js). Hiding is a listing convenience, never a deletion — a hidden
 * verb is exactly as REGISTERED (and exactly as valid a prescription target) as a visible one.
 * Without `--admin` this gate loses "microservice list" and everything under "drive" the moment
 * they're admin-hidden, and flags their real, working prescriptions as dead. `--admin` also
 * skips the network surface-fetch entirely (see bin/descix.js), so this stays offline.
 */
function registeredCommands() {
  const listing = (args) => {
    const out = execFileSync(process.execPath, [CLI, '--admin', ...args, '--help'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const section = out.split(/^Commands:$/m)[1];
    if (!section) return [];
    return [...section.matchAll(/^\s{2}([a-z][a-z0-9-]*)/gm)].map(m => m[1]).filter(n => n !== 'help');
  };
  const tree = new Set();
  for (const top of listing([])) {
    tree.add(top);
    for (const sub of listing([top])) tree.add(`${top} ${sub}`);
  }
  return tree;
}

test('every refusal that prescribes a `descix <verb>` prescribes a REGISTERED one', () => {
  const tree = registeredCommands();

  // SELF-CHECK: the gate must be able to tell a real verb from a fabricated one. Without this
  // row, an empty or broken tree would make every assertion below pass vacuously.
  assert.ok(tree.has('app set-localpath'), 'command tree must contain a known-good verb');
  assert.ok(!tree.has('totally-bogus-verb'), 'command tree must NOT contain a fabricated verb');
  assert.ok(tree.size > 20, `command tree looks empty (${tree.size}) — the gate would pass vacuously`);

  const census = censusOfPrescriptions();
  assert.ok(census.length > 0, 'census found no prescriptions at all — the scanner is broken');

  const dead = census.filter(({ verb }) => {
    const parts = verb.split(' ');
    // A two-word match may be "<group> <sub>" or a real verb followed by prose. Accept either
    // the full path or the leading token being a registered leaf command.
    return !tree.has(verb) && !(parts.length === 2 && tree.has(parts[0]) && !tree.has(`${parts[0]} ${parts[1]}`) && ![...tree].some(t => t.startsWith(parts[0] + ' ')));
  });

  console.log(
    `[refusal-verb gate] ${census.length} prescriptions across ${new Set(census.map(c => c.file)).size} files ` +
    `checked against ${tree.size} registered commands. CATCHES: prescribed verbs that do not exist. ` +
    `DOES NOT CATCH: verbs that exist but refuse this caller (auth/entitlement/state) — judgment, not mechanism. ` +
    `RUN BY: npm test.`
  );

  assert.deepEqual(
    dead.map(d => `${d.file}:${d.line} prescribes "descix ${d.verb}"`),
    [],
    'a refusal names a verb this CLI does not have — the caller is refused and then sent nowhere'
  );
});
