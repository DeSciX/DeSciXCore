/**
 * The ONE OWNER of "what did the developer actually type to get here".
 *
 * WHY (measured 2026-08-27): the gateway's error messages hardcoded `descix serve`. TWO bins
 * now reach this gateway — `descix serve` from @descix/cli and `descix-app serve` from
 * @descix/sdk's app half — so a hardcoded name tells half the readers to run a command they
 * have not installed. A remedy the reader cannot execute is worse than no remedy: it sends
 * them looking for the wrong package.
 *
 * It lives in its own module because the alternative was a second copy of the same four lines
 * in the second file that needed it, which is the mirror drift this codebase keeps paying for.
 */

/** The bin name from argv, without directory or extension. Falls back to the CLI's name. */
export function invokedBin() {
  const argv1 = process.argv[1];
  if (!argv1) return 'descix';
  const base = argv1.split(/[/\\]/).pop().replace(/\.[cm]?js$/, '');
  return base || 'descix';
}
