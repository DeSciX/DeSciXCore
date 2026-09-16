#!/usr/bin/env node
/**
 * generate-verb-invokes.mjs
 *
 * Regenerates lib/verb-invokes.generated.json — THE committed map of
 * `"cli verb path" -> ["backend command", ...]`, derived by statically walking bin/descix.js's
 * commander tree and following every literal invoke()/invokeRaw() call reachable from each
 * verb's action handler (see scripts/lib/verb-invoke-graph.mjs for the full contract and its
 * scope boundaries).
 *
 * This is the ONE generated fact the CLI's help-hiding decision reads at runtime (bin/descix.js
 * looks up a verb's invoked commands here, then asks the server's `get_command_surface` for each
 * command's visibility) — there is no committed class table anywhere in this repo.
 *
 * USAGE:
 *   node scripts/generate-verb-invokes.mjs           # regenerate and write
 *   node scripts/generate-verb-invokes.mjs --check    # regenerate in-memory, diff against the
 *                                                        committed file, exit 1 if stale (no write)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVerbInvokeMap } from './lib/verb-invoke-graph.mjs';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(CLI_ROOT, 'lib', 'verb-invokes.generated.json');

const checkOnly = process.argv.includes('--check');

const { map, diagnostics } = buildVerbInvokeMap(CLI_ROOT);
const serialized = JSON.stringify(map, null, 2) + '\n';

if (checkOnly) {
  const existing = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : null;
  if (existing !== serialized) {
    console.error(
      `generate-verb-invokes --check: ${path.relative(CLI_ROOT, OUT_PATH)} is STALE ` +
      `(committed file does not match a fresh regeneration from bin/descix.js + lib/**). ` +
      `Run: node scripts/generate-verb-invokes.mjs`
    );
    process.exit(1);
  }
  console.log(`generate-verb-invokes --check: up to date (${diagnostics.verbCount} verbs, ${diagnostics.commandCount} distinct commands).`);
  process.exit(0);
}

fs.writeFileSync(OUT_PATH, serialized);
console.log(
  `generate-verb-invokes: wrote ${path.relative(CLI_ROOT, OUT_PATH)} ` +
  `(${diagnostics.verbCount} verbs, ${diagnostics.commandCount} distinct commands, ` +
  `${diagnostics.dynamicSites.length} dynamic invoke call sites skipped).`
);
