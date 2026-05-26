/**
 * Meta-test: anti-regression guard for the "upsert-without-purge" silent-failure pattern.
 *
 * Closed under WS-BEAST-INGEST-FAIL-LOUD (DN-2). The bug class: any CLI driver that
 * calls Syncer.upsertChunks (or pineconeService.upsertVectors) without ALSO calling
 * deleteStaleChunksByFileId (or deleteStaleChunks) silently leaves orphaned chunks
 * in Pinecone when source content changes. Retrieval scoring then favors the older,
 * keyword-dense chunks, masking fresh facts (the original "DEMO is TODO" recurrence).
 *
 * This test scans lib/commands/ and bin/ for any function-scoped block that contains
 * an upsertChunks call but lacks a corresponding stale-purge call. The check is
 * structural — same function body, both calls visible.
 *
 * Opt-out marker: if a code path legitimately should not purge (e.g., a streaming
 * upsert where the caller manages purge separately), the function may include the
 * comment marker `SYNCER-NO-STALE-PURGE:` followed by a justification on the same
 * or adjacent line. This makes the exception explicit and reviewable in PRs.
 *
 * Run: `node --test tests/syncer-stale-purge-anti-regression.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');

/** Files we audit. We scan lib/commands/ (driver-level callers) and bin/ (the CLI entrypoint). */
const SCAN_ROOTS = [
  path.join(CLI_ROOT, 'lib', 'commands'),
  path.join(CLI_ROOT, 'bin')
];

/** Files we explicitly skip — they implement the primitives themselves, not callers. */
const SKIP_FILES = new Set([
  // Syncer.js is the primitive; its internal use of upsertChunks is the implementation.
  path.join(CLI_ROOT, 'lib', 'core', 'Syncer.js')
]);

const UPSERT_PATTERN = /\bupsertChunks\s*\(/;
const PURGE_PATTERN = /\b(deleteStaleChunksByFileId|deleteStaleChunks)\s*\(/;
const OPTOUT_MARKER = /SYNCER-NO-STALE-PURGE:/;

async function collectJsFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'tests') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await collectJsFiles(fullPath);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      if (!SKIP_FILES.has(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * Scan a file for upsert-without-purge violations.
 *
 * Heuristic: split the file into function-sized blocks by walking braces from each
 * `function`/`async function`/`=>` declaration. For each block that contains an
 * upsertChunks call AND no purge call AND no opt-out marker, report a violation.
 *
 * This is intentionally conservative — false positives are correctable by either
 * adding the purge call or annotating with the opt-out marker.
 */
async function scanFile(file) {
  const content = await fs.readFile(file, 'utf-8');

  // Quick reject: file has no upsertChunks calls.
  if (!UPSERT_PATTERN.test(content)) return [];

  const violations = [];
  // Find every function-like declaration and walk its body.
  // We use a simple brace-balanced walk; this is good enough for our codebase (no
  // exotic template-literal-inside-function patterns near upsert calls).
  const fnStarts = [];
  const fnDeclRe = /(?:^|\n)\s*(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let m;
  while ((m = fnDeclRe.exec(content)) !== null) {
    fnStarts.push({ name: m[1], idx: m.index + m[0].length - 1 }); // idx points at the opening `{`
  }
  // Also catch arrow function methods at top-level (rare in our drivers but possible).
  const arrowRe = /(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
  while ((m = arrowRe.exec(content)) !== null) {
    fnStarts.push({ name: m[1], idx: m.index + m[0].length - 1 });
  }

  for (const fn of fnStarts) {
    // Walk braces from fn.idx
    let depth = 0;
    let endIdx = fn.idx;
    for (let i = fn.idx; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { endIdx = i; break; }
      }
    }
    const body = content.slice(fn.idx, endIdx + 1);
    if (!UPSERT_PATTERN.test(body)) continue;
    if (PURGE_PATTERN.test(body)) continue;
    if (OPTOUT_MARKER.test(body)) continue;
    // Locate the upsert call line for the report
    const upsertLineMatch = body.match(UPSERT_PATTERN);
    const upsertOffset = upsertLineMatch ? body.indexOf(upsertLineMatch[0]) : 0;
    const lineNumber = content.slice(0, fn.idx + upsertOffset).split('\n').length;
    violations.push({
      file,
      fn: fn.name,
      lineNumber,
      snippet: body.split('\n').find(l => UPSERT_PATTERN.test(l))?.trim() || '(unknown)'
    });
  }
  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────

test('syncer-stale-purge anti-regression: every upsertChunks caller in lib/commands or bin must also purge stale (or opt out)', async () => {
  const allFiles = [];
  for (const root of SCAN_ROOTS) {
    const files = await collectJsFiles(root);
    allFiles.push(...files);
  }

  const allViolations = [];
  for (const file of allFiles) {
    const violations = await scanFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    const report = allViolations.map(v =>
      `  ${path.relative(CLI_ROOT, v.file)}:${v.lineNumber}  fn=${v.fn}  → ${v.snippet}`
    ).join('\n');
    assert.fail(
      `Found ${allViolations.length} function(s) calling upsertChunks without a stale-purge call:\n${report}\n\n` +
      'Each function must also call deleteStaleChunksByFileId (preferred) or deleteStaleChunks ' +
      'to close DN-2 (stale chunks accumulate in Pinecone otherwise). ' +
      'If the omission is intentional, add a comment marker `SYNCER-NO-STALE-PURGE: <reason>` ' +
      'inside the function body so the exception is explicit in code review.'
    );
  }

  assert.equal(allViolations.length, 0, 'Zero upsert-without-purge violations expected in lib/commands or bin');
});
