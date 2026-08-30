/**
 * THE ONE OWNER of every write the CLI makes ABOUT ITS OWN EXECUTION.
 *
 * WHY THIS EXISTS (measured 2026-08-30). `bin/mcp-server.js` speaks JSON-RPC over stdio, so its
 * stdout IS the protocol stream. Driving one `tools/call` put 130 bytes of non-JSON-RPC text into
 * that stream, from `console.log` calls in `lib/api-client.js`, on the credential-refresh path —
 * which fires exactly when a token expires, the moment a long-running MCP session is least able
 * to survive a corrupt frame.
 *
 * THE SCOPE IS THE MEASURED IMPORT GRAPH, NOT A GREP. Walking the real import graph from
 * `bin/mcp-server.js` (static and dynamic), 12 files are reachable carrying 74 `console.log`
 * sites — `lib/api-client.js` 9 and `lib/commands/auth.js` 65. The package-wide count is 1108;
 * that number is not the target and never was. Everything on the reachable graph writes through
 * here.
 *
 * WHY A WRITER AND NOT A WRAPPER. There WAS already a fix, and its shape is the lesson:
 * `mcpListTools()` monkey-patched `console.log = console.error` for the duration of ONE call and
 * restored it in a `finally`. A call-site workaround for a write-site defect — it protected the
 * one path its author was looking at and left every other path through `invoke()`/`invokeRaw()`
 * corrupting the stream. It is DELETED in the same change that makes it unnecessary; a fix that
 * does not sweep the workarounds it invalidates leaves a time bomb primed toward silence.
 *
 * STDERR, ALWAYS, WITH NO MODE SWITCH. A stream decision that can be configured is one that will
 * eventually be configured wrongly, and the caller who gets it wrong is a protocol transport that
 * cannot report its own corruption. On a terminal stderr is still visible to the human, so the
 * interactive login flow reads exactly as before; what changes is that `descix login > file` no
 * longer captures the prompts, because prompts were never the command's OUTPUT.
 *
 * WHAT DOES NOT BELONG HERE: anything the user ASKED FOR — a command's JSON document, a report
 * like `config show`, a value meant to be piped. Those are OUTPUT and they belong on stdout.
 * `bin/descix.js::progress()` owns the narrower question of where human progress text goes when
 * `--json` makes stdout a data channel; this owns the general one.
 */

/**
 * Write a diagnostic / human-progress line. Same call shape as console.log; always stderr.
 * @param {...any} args
 */
export function diag(...args) {
    console.error(...args);
}
