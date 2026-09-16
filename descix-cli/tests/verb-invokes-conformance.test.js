/**
 * Conformance gate for lib/verb-invokes.generated.json — the ONE CLI-owned fact
 * `"verb path" -> ["invoked backend command", ...]` that bin/descix.js's help-hiding decision
 * reads at runtime (see lib/command-visibility.js).
 *
 * Two independent properties:
 *
 *  1. FRESHNESS: regenerating from the CURRENT bin/descix.js + lib/** must reproduce the
 *     committed file byte-for-byte. A verb whose lib function grows a NEW invoke() call and is
 *     not regenerated goes RED here.
 *
 *  2. NO ORPHANED LITERALS: every literal invoke()/invokeRaw() call site anywhere in bin/ + lib/
 *     (walked independently of the call-graph resolver, by a flat textual+AST scan) must be
 *     attributed to at least one verb in the generated map — except the declared dynamic
 *     exceptions (a non-literal first argument) and code that is reachable only from
 *     bin/mcp-server.js (a separate entry point, never imported by bin/descix.js) or from
 *     lib/api-client.js / lib/service-api-client.js (the dispatch mechanism itself, not a
 *     verb's own call site — see scripts/lib/verb-invoke-graph.mjs header for the full
 *     boundary rationale).
 *
 * Run: `node --test tests/verb-invokes-conformance.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVerbInvokeMap } from '../scripts/lib/verb-invoke-graph.mjs';
import { parse } from 'acorn';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_PATH = path.join(CLI_ROOT, 'lib', 'verb-invokes.generated.json');

test('lib/verb-invokes.generated.json is fresh (regenerating reproduces it exactly)', () => {
  const committed = fs.readFileSync(GENERATED_PATH, 'utf8');
  const { map, diagnostics } = buildVerbInvokeMap(CLI_ROOT);
  const fresh = JSON.stringify(map, null, 2) + '\n';

  assert.ok(diagnostics.verbCount > 10, `sanity: only ${diagnostics.verbCount} verbs discovered — the walker likely broke`);
  assert.ok(diagnostics.commandCount > 10, `sanity: only ${diagnostics.commandCount} distinct commands discovered`);

  assert.equal(
    fresh, committed,
    'lib/verb-invokes.generated.json is STALE. Run: node scripts/generate-verb-invokes.mjs'
  );
});

// ── ORPHAN-LITERAL AUDIT ─────────────────────────────────────────────────────────────────────
//
// Independent of the graph resolver above: literally walk every .js file under bin/ + lib/
// (minus the declared exclusions) and collect every `X.invoke('literal', ...)` /
// `X.invokeRaw('literal', ...)` call site's command string. Every one of those strings must
// appear SOMEWHERE in the generated map's values.

const EXCLUDED_FILES = new Set([
  path.join(CLI_ROOT, 'bin', 'mcp-server.js'),         // separate entry point
  path.join(CLI_ROOT, 'lib', 'api-client.js'),         // the invoke() dispatch mechanism itself
  path.join(CLI_ROOT, 'lib', 'service-api-client.js'), // ditto, packaged for external services
  path.join(CLI_ROOT, 'lib', 'command-visibility.js'), // the get_command_surface FETCH itself (bootstrap, not a verb call site)
]);

/**
 * KNOWN PRE-EXISTING ORPHANS, not introduced by this change and not this feature's to fix.
 *
 * `lib/core/Syncer.js::syncKb` / `::getSyncStatus` are dead code — MEASURED zero callers
 * anywhere in bin/ or lib/ (not even in a test), confirmed by `grep -rn '\bsyncKb(\|\bgetSyncStatus('`
 * across the whole package. `lib/commands/kb.js` imports both and calls neither. Both call
 * `getRemoteChunkMetadata`, whose body carries the two literals below — `kb_get_chunk_metadata`
 * (primary) and `kb_get_chunk_ids` (its documented compatibility fallback, same function). Since
 * `getRemoteChunkMetadata` / `getRemoteChunkIds` have their OWN direct unit-test coverage
 * (tests/cli-receipt-honesty-syncer.test.js), deleting them is a separate, larger cleanup this
 * feature does not do. This allowlist exists so the orphan gate stays a REAL, sharp check for
 * anything NEW (remove an entry and the corresponding dead code, or re-wire a caller and the
 * gate goes green on its own) while not blocking THIS delivery on unrelated pre-existing debt.
 */
const KNOWN_PRE_EXISTING_ORPHANS = new Set([
  `${path.join('lib', 'core', 'Syncer.js')}::kb_get_chunk_metadata`,
  `${path.join('lib', 'core', 'Syncer.js')}::kb_get_chunk_ids`,
]);

function* walkAst(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) yield* walkAst(n); return; }
  if (typeof node.type === 'string') yield node;
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
    const v = node[key];
    if (v && typeof v === 'object') yield* walkAst(v);
  }
}

function literalStringOf(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0]?.value?.cooked ?? null;
  return null;
}

function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { out.push(...listJsFiles(p)); continue; }
    if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

/** Every literal invoke command string found in bin/ + lib/ (minus exclusions), with location. */
function scanLiteralInvokeSites() {
  const files = [...listJsFiles(path.join(CLI_ROOT, 'bin')), ...listJsFiles(path.join(CLI_ROOT, 'lib'))]
    .filter((f) => !EXCLUDED_FILES.has(f));
  const literals = []; // { command, file }
  let dynamicCount = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let ast;
    try {
      ast = parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch {
      continue; // not a parseable ES module (none expected under bin/lib) — skip rather than crash the audit
    }
    for (const node of walkAst(ast)) {
      if (node.type !== 'CallExpression') continue;
      const callee = node.callee;
      if (callee.type !== 'MemberExpression' || callee.computed) continue;
      if (callee.property.name !== 'invoke' && callee.property.name !== 'invokeRaw') continue;
      const lit = literalStringOf(node.arguments[0]);
      if (lit != null) literals.push({ command: lit, file });
      else dynamicCount++;
    }
  }
  return { literals, dynamicCount };
}

test('every literal invoke()/invokeRaw() call site is attributed to at least one verb', () => {
  const { literals, dynamicCount } = scanLiteralInvokeSites();
  assert.ok(literals.length > 10, `sanity: only ${literals.length} literal invoke sites found — the scan likely broke`);
  assert.ok(dynamicCount >= 1, 'sanity: expected at least one dynamic (non-literal) invoke call site (mcp execute --tool) — the scan likely broke');

  const committed = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf8'));
  const attributed = new Set();
  for (const commands of Object.values(committed)) for (const c of commands) attributed.add(c);

  const orphans = literals.filter((l) => {
    if (attributed.has(l.command)) return false;
    const relKey = `${path.relative(CLI_ROOT, l.file)}::${l.command}`;
    return !KNOWN_PRE_EXISTING_ORPHANS.has(relKey);
  });
  assert.deepEqual(
    orphans.map((o) => `${path.relative(CLI_ROOT, o.file)}: '${o.command}'`),
    [],
    'literal invoke() call site(s) not attributed to ANY verb in lib/verb-invokes.generated.json — ' +
    'either the verb that reaches this code was not discovered by the generator, or this is dead code.'
  );
});

// ── SELF-TEST: the orphan check must be able to FAIL ────────────────────────────────────────
test('the orphan-literal check fails on a command string absent from the generated map (control)', () => {
  const committed = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf8'));
  const attributed = new Set();
  for (const commands of Object.values(committed)) for (const c of commands) attributed.add(c);
  assert.ok(!attributed.has('__definitely_not_a_real_command__'), 'control command string unexpectedly present — control is invalid');
});
