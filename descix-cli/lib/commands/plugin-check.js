/**
 * `descix plugin check [dir]` — run the claude.ai plugin limits on a plugin directory before it
 * is published.
 *
 * Every rule, limit and file walk belongs to lib/core/ClaudePluginLimits.js; this module calls
 * validatePluginDir and renders what it returns. It names no limit of its own.
 *
 * Exit codes: 0 clean · 1 at least one violation · 2 a file could not be read
 * (CLAUDE_PLUGIN_UNREADABLE), so a value that was never measured is never reported as passing.
 */
import path from 'path';
import { validatePluginDir } from '../core/ClaudePluginLimits.js';

export const PLUGIN_CHECK_EXIT = Object.freeze({ CLEAN: 0, VIOLATION: 1, UNREADABLE: 2 });

/** One violation as one line: file (relative to the checked directory when inside it), field, rule,
 * and the measured length or offending characters. */
export function formatViolation(v, root) {
  const rel = path.relative(root, v.file);
  const file = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : v.file;
  let measured;
  if (typeof v.length === 'number') measured = `length ${v.length} (limit ${v.limit})`;
  else if (Array.isArray(v.offending)) measured = `offending ${v.offending.map((c) => `'${c}'`).join(' ')}`;
  else throw new Error(`plugin check: violation ${JSON.stringify(v)} carries neither length nor offending — ClaudePluginLimits changed its violation shape`);
  return `${file}  ${v.field}  ${v.rule}  ${measured}`;
}

/**
 * @param {string|undefined} dir defaults to the current directory
 * @param {{ cwd?: string, out?: (s: string) => void, err?: (s: string) => void }} [io]
 * @returns {Promise<number>} the exit code
 */
export async function runPluginCheck(dir, { cwd = process.cwd(), out = console.log, err = console.error } = {}) {
  const target = path.resolve(cwd, dir ?? '.');
  let violations;
  try {
    violations = await validatePluginDir(target);
  } catch (e) {
    if (e.code === 'CLAUDE_PLUGIN_UNREADABLE') {
      err(`plugin check: could not read ${e.message}`);
      return PLUGIN_CHECK_EXIT.UNREADABLE;
    }
    throw e;
  }
  if (violations.length === 0) {
    out(`plugin check: OK — ${target} meets every claude.ai plugin limit.`);
    return PLUGIN_CHECK_EXIT.CLEAN;
  }
  out(`plugin check: ${violations.length} violation${violations.length === 1 ? '' : 's'} of the claude.ai plugin limits in ${target}`);
  for (const v of violations) out(`  ${formatViolation(v, target)}`);
  return PLUGIN_CHECK_EXIT.VIOLATION;
}
