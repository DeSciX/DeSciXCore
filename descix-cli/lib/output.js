/**
 * CLI output — ONE OWNER of the "human progress vs. --json data channel" split.
 *
 * Relocated from bin/descix.js (WS-MEDIA-QUOTA) so lib/commands/* modules can share it
 * without bin/ -> lib/ layering going backwards. This is a move, not a duplication: bin/descix.js
 * imports `progress` from here instead of defining its own copy.
 */

/**
 * Emit human-facing PROGRESS for a command that can also emit JSON.
 *
 * When `--json` is set, stdout is a DATA CHANNEL: it must contain the JSON document and
 * nothing else, or every scripted consumer breaks. Progress then goes to stderr, where a
 * human piping stdout still sees it. Without `--json`, stdout is the human channel and
 * progress belongs there.
 *
 * ONE OWNER of that decision. Before this existed, each --json command re-decided it by
 * calling console.log directly, and both of them got it wrong: `mcp execute --json` prefixed
 * the document with "Executing <tool>..." and `app media-upload --json` prefixed it with a
 * header, a per-file listing and a per-file +/x line. Both exited 0, so a consumer saw a
 * success code and an unparseable stream. Measured 2026-08-21/22 (seat BEAST): two seats had
 * independently hand-rolled prefix-stripping workarounds (`tail -n +2`, `raw.find('[')`)
 * rather than reporting it.
 *
 * @param {Object} options - the command's parsed options (read for .json)
 * @param {...any} args - passed through to console.log / console.error
 */
export function progress(options, ...args) {
  if (options && options.json) console.error(...args);
  else console.log(...args);
}
