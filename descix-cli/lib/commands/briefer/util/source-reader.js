/**
 * source-reader.js — shared helpers for extractors that read source files,
 * compute citation SHAs, and verify regex / grep results.
 *
 * Per WS-DESCIX-BRIEFER-CLI M2 design (regex-with-checksum, not AST):
 *   - Read a file from disk.
 *   - Verify a regex matches in the expected line range.
 *   - Compute a SHA-256 (first 12 hex chars) of the cited line range.
 *   - HARD-FAIL via BrieferExtractorError if the file is missing or the
 *     regex doesn't match — never fall back to a default string.
 *
 * Why regex+SHA over AST (decided 2026-05-26):
 *   - No new npm dep (avoids @babel/parser, ~3MB of churn).
 *   - All M2 extractions are simple literals, regex-friendly constructs,
 *     or grep-style negative-claim checks.
 *   - SHA-of-line-range captures "construct moved or changed shape" with
 *     the same fidelity AST would give for these targets.
 *   - AST can be added later as a per-extractor opt-in if a target needs it.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

/**
 * Resolve an absolute path inside the repo root for an extractor target.
 *
 * @param {object} cliPaths   { repoRoot, ... } from index.js::resolveCliPaths()
 * @param {string} relPath    Repo-root-relative path (e.g., "DeSciX/DeSciX_Cloud/.../update-mesh-routing.js")
 */
export function resolveRepoPath(cliPaths, relPath) {
  if (!cliPaths || !cliPaths.repoRoot) {
    throw new Error('resolveRepoPath: cliPaths.repoRoot is required');
  }
  return path.join(cliPaths.repoRoot, relPath);
}

/**
 * Read a source file, HARD-FAIL with BRIEFER-SRC-NOT-FOUND if missing.
 *
 * @returns {Promise<{absPath: string, lines: string[], raw: string}>}
 */
export async function readSourceFile({ cliPaths, relPath, section }) {
  const absPath = resolveRepoPath(cliPaths, relPath);
  let raw;
  try {
    raw = await fs.readFile(absPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new BrieferExtractorError({
        code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND,
        section,
        source: relPath,
        expected: `file present at ${absPath}`,
        recovery: `Restore the file at ${relPath} or update the extractor's relPath if the file was intentionally moved.`,
        detail: err.message
      });
    }
    throw err;
  }
  return { absPath, lines: raw.split(/\r?\n/), raw };
}

/**
 * SHA-256 (first 12 hex chars) of a string. Used for citation SHA stamps.
 */
export function sha12(text) {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex').slice(0, 12);
}

/**
 * Compute SHA-12 of a line range from a file's split lines array.
 * Line numbers are 1-indexed inclusive (matches how lines are quoted in citations).
 *
 * @param {string[]} lines  file split by /\r?\n/
 * @param {number} start    1-indexed start line (inclusive)
 * @param {number} end      1-indexed end line (inclusive)
 */
export function sha12OfRange(lines, start, end) {
  if (start < 1) start = 1;
  if (end > lines.length) end = lines.length;
  // Re-join with \n — we hash the canonical newline form, not the on-disk form.
  return sha12(lines.slice(start - 1, end).join('\n'));
}

/**
 * Find a regex in a file and verify it lands inside an expected line range.
 *
 * Returns { lineNumber, match, range, sha } if found AND inside range.
 * HARD-FAILS with BRIEFER-SRC-NOT-FOUND if the regex doesn't match at all.
 * HARD-FAILS with BRIEFER-PARSE-FAIL if it matches outside the expected range.
 *
 * @param {object} args
 * @param {string[]} args.lines       file split by /\r?\n/
 * @param {RegExp}   args.regex
 * @param {string}   args.section     "§3 routing" etc.
 * @param {string}   args.source      "update-mesh-routing.js:120" etc.
 * @param {string}   args.expected    Description of the construct shape expected
 * @param {string}   args.recovery    What the operator should do
 * @param {[number,number]} [args.expectedRange]  1-indexed inclusive expected line range
 */
export function findInLines({ lines, regex, section, source, expected, recovery, expectedRange = null }) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(regex);
    if (m) {
      const lineNumber = i + 1;
      if (expectedRange) {
        const [lo, hi] = expectedRange;
        if (lineNumber < lo || lineNumber > hi) {
          throw new BrieferExtractorError({
            code: BRIEFER_ERROR_CODES.PARSE_FAIL,
            section,
            source,
            expected: `${expected} inside lines ${lo}-${hi}`,
            recovery,
            detail: `Regex matched at line ${lineNumber}, outside expected range.`
          });
        }
      }
      return { lineNumber, match: m, line: lines[i] };
    }
  }
  throw new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND,
    section,
    source,
    expected,
    recovery,
    detail: `Regex ${regex} did not match any line.`
  });
}

/**
 * Render a citation object with computed SHA for a known line range.
 *
 * @param {object} args
 * @param {string} args.file          Repo-relative path
 * @param {string} args.lines         "82-202" or "120"
 * @param {string} args.anchor        Short human label
 * @param {string[]} args.fileLines   The file's split-lines array
 * @returns {{file, lines, sha, anchor}}
 */
export function makeCitation({ file, lines: lineSpec, anchor, fileLines }) {
  const [startStr, endStr] = lineSpec.includes('-') ? lineSpec.split('-') : [lineSpec, lineSpec];
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  const sha = sha12OfRange(fileLines, start, end);
  return { file, lines: lineSpec, anchor, sha };
}

/**
 * Slice a line range from a file's split-lines array into a verbatim block.
 * 1-indexed inclusive.
 */
export function sliceRange(lines, start, end) {
  if (start < 1) start = 1;
  if (end > lines.length) end = lines.length;
  return lines.slice(start - 1, end).join('\n');
}

/**
 * Run a grep-style search across multiple files. Returns array of
 * { file, lineNumber, line } for every match. Uses Node fs (no shell).
 *
 * Per scope §6 "Negative-claim grep gates" — if matches.length > 0 the caller
 * is expected to throw BRIEFER-NEGATIVE-CLAIM.
 *
 * @param {object} args
 * @param {string} args.repoRoot
 * @param {string[]} args.relPaths   files OR directories (dirs are walked recursively, .js only)
 * @param {RegExp} args.regex
 * @param {Set<string>} [args.excludePaths]  repo-relative path substrings to skip
 */
export async function grepFiles({ repoRoot, relPaths, regex, excludePaths = new Set() }) {
  const matches = [];
  for (const rel of relPaths) {
    const abs = path.join(repoRoot, rel);
    let stat;
    try { stat = await fs.stat(abs); }
    catch { continue; }
    if (stat.isDirectory()) {
      await walkAndGrep(abs, repoRoot, regex, matches, excludePaths);
    } else if (stat.isFile()) {
      await grepOneFile(abs, repoRoot, regex, matches, excludePaths);
    }
  }
  return matches;
}

async function walkAndGrep(absDir, repoRoot, regex, matches, excludePaths) {
  let entries;
  try { entries = await fs.readdir(absDir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.')) continue;
    const full = path.join(absDir, e.name);
    const rel = path.relative(repoRoot, full);
    if ([...excludePaths].some(x => rel.includes(x))) continue;
    if (e.isDirectory()) {
      await walkAndGrep(full, repoRoot, regex, matches, excludePaths);
    } else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.sh'))) {
      await grepOneFile(full, repoRoot, regex, matches, excludePaths);
    }
  }
}

async function grepOneFile(absPath, repoRoot, regex, matches, excludePaths) {
  const rel = path.relative(repoRoot, absPath);
  if ([...excludePaths].some(x => rel.includes(x))) return;
  let raw;
  try { raw = await fs.readFile(absPath, 'utf-8'); }
  catch { return; }
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      matches.push({ file: rel, lineNumber: i + 1, line: lines[i] });
    }
  }
}

/**
 * Optional gcloud probe. Returns null if gcloud is unavailable OR command
 * fails — callers decide whether to hard-fail or render a "skipped" note.
 *
 * Per scope §3 routing extractor: gcloud is BEST-EFFORT for the verification
 * block, MANDATORY only when --env=demo|prod AND scope says hard-fail.
 *
 * Returns: { ok: true, json } | { ok: false, error }
 */
export function tryGcloudJson(args) {
  try {
    const out = execFileSync('gcloud', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, json: JSON.parse(out) };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}
