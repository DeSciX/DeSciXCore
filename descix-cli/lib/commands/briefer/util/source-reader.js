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
import { execFileSync, execFile } from 'child_process';
import https from 'https';
import { promisify } from 'util';

const execFileP = promisify(execFile);
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


// ─────────────────────────────────────────────────────────────────────────────
// M3 — env-aware live-state probes (gcloud + Firestore REST)
//
// These helpers replace the M2 best-effort tryGcloudJson() pattern for sections
// that NEED live state to be authoritative (§2 environments, §3 routing, §4
// microservice-deploy, §5 entitlements).
//
// Contract per scope §M3 / feedback_no-hardcoded-fallbacks:
//   - --env=demo|prod → gcloud probe MUST succeed; failure → HARD-FAIL with
//     code BRIEFER-GCLOUD-FAIL and an actionable remediation message.
//   - --env=dev       → gcloud probe is SKIPPED (DEV is local; no LB / no
//     cloud Firestore). Caller emits a "DEV: gcloud probes skipped" stanza.
//   - Each successful probe yields a citation with source=gcloud and a
//     sha-of-output-slice so --check detects drift in LIVE STATE, not just
//     code state. Two-sided drift detection: code OR cloud changes both
//     trigger.
//
// Spawn pattern: child_process.execFile (NOT exec) for safety — arguments are
// passed as an array, never shell-interpolated. Timeout 30s; on timeout we
// HARD-FAIL (not fallback), per the no-hardcoded-fallbacks rule.
// ─────────────────────────────────────────────────────────────────────────────

const GCLOUD_TIMEOUT_MS = 30_000;

/**
 * Run a gcloud command and return parsed JSON, with env-aware HARD-FAIL
 * semantics.
 *
 * @param {object} args
 * @param {string[]} args.command   gcloud argv (e.g., ['compute','url-maps','describe','foo','--format=json']).
 * @param {string}   args.env       'dev' | 'demo' | 'prod' (REQUIRED — controls failure semantics).
 * @param {string}   args.section   Briefer section label for error messages.
 * @param {string}   args.anchor    Short label embedded in the citation (e.g., 'lb-url-map').
 * @param {string}   [args.expected] Construct shape description on failure.
 * @param {string}   [args.recovery] Operator recovery hint on failure.
 *
 * @returns {Promise<null | {json:any, raw:string, citation:object}>}
 *   - null when env==='dev' (probe intentionally skipped — caller emits stanza).
 *   - { json, raw, citation } on success. citation has shape:
 *       { source:'gcloud', probe:<argv-as-string>, env, anchor, sha, lines }
 *
 * HARD-FAILS with BrieferExtractorError code=GCLOUD_FAIL when env!=='dev' AND
 * the probe fails (auth, empty output, JSON parse fail, timeout).
 */
export async function probeGcloudJson({ command, env, section, anchor, expected, recovery }) {
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error('probeGcloudJson: command must be a non-empty argv array');
  }
  if (!env) {
    throw new Error('probeGcloudJson: env is required');
  }
  if (!section || !anchor) {
    throw new Error('probeGcloudJson: section and anchor are required');
  }

  if (env === 'dev') {
    return null;
  }

  const probeStr = 'gcloud ' + command.join(' ');
  let raw;
  try {
    const { stdout } = await execFileP('gcloud', command, {
      encoding: 'utf-8',
      timeout: GCLOUD_TIMEOUT_MS,
      maxBuffer: 32 * 1024 * 1024
    });
    raw = stdout;
  } catch (err) {
    const timedOut = err.killed && err.signal === 'SIGTERM';
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'gcloud',
      expected: expected || `successful response from: ${probeStr}`,
      recovery: recovery || `Run 'gcloud auth login' or 'gcloud config set project descix', then re-run \`descix briefer --env=${env}\`. If the auth is fine but the resource doesn't exist for env=${env}, that is a real platform-state issue — investigate before regenerating the briefer.`,
      detail: `probe: ${probeStr}\n  env: ${env}\n  ${timedOut ? 'timed out after ' + GCLOUD_TIMEOUT_MS + 'ms' : 'failed: ' + (err.stderr || err.message || String(err)).split('\n')[0].slice(0, 240)}`
    });
  }

  if (!raw || raw.trim() === '') {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'gcloud',
      expected: expected || `non-empty JSON from: ${probeStr}`,
      recovery: recovery || `The probe returned empty output. Verify the resource exists for env=${env} (e.g., 'gcloud projects describe descix').`,
      detail: `probe: ${probeStr}\n  env: ${env}\n  empty stdout`
    });
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (parseErr) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'gcloud',
      expected: expected || `parseable JSON from: ${probeStr}`,
      recovery: recovery || `The probe returned non-JSON output. Ensure '--format=json' is in the command argv.`,
      detail: `probe: ${probeStr}\n  env: ${env}\n  parse error: ${parseErr.message}\n  first 240 chars: ${raw.slice(0, 240)}`
    });
  }

  const sha = sha12(raw);
  return {
    json,
    raw,
    citation: {
      source: 'gcloud',
      probe: probeStr,
      env,
      anchor,
      sha,
      // For the citation comment line: 'lines' field convention is reused so
      // the existing extractCitationTrail regex captures these uniformly.
      lines: `out:${raw.length}b`
    }
  };
}

/**
 * Probe a Firestore REST endpoint using gcloud-derived auth token, with the
 * same env-aware HARD-FAIL semantics as probeGcloudJson().
 *
 * Per AC-7 anti-regression: this does NOT import @google-cloud/firestore. It
 * uses the gcloud-CLI-derived access token + a raw HTTPS GET. This is a
 * separate API surface from the Node SDK and is permitted.
 *
 * @param {object} args
 * @param {string} args.dbPath      e.g., 'descix-demo/documents/Products'
 *                                  (the part after 'projects/descix/databases/').
 * @param {object} [args.query]     query params (e.g., { pageSize: 50, 'mask.fieldPaths': 'app_id' }).
 * @param {string} args.env
 * @param {string} args.section
 * @param {string} args.anchor
 * @param {string} [args.expected]
 * @param {string} [args.recovery]
 *
 * @returns {Promise<null | {json:any, raw:string, citation:object}>}
 */
export async function probeFirestoreRest({ dbPath, query, env, section, anchor, expected, recovery }) {
  if (!dbPath) throw new Error('probeFirestoreRest: dbPath is required');
  if (!env) throw new Error('probeFirestoreRest: env is required');
  if (!section || !anchor) throw new Error('probeFirestoreRest: section and anchor are required');

  if (env === 'dev') return null;

  // Resolve gcloud access token. This is itself a gcloud probe — re-use the
  // env-aware HARD-FAIL surface so the same operator-recovery path applies.
  let token;
  try {
    const { stdout } = await execFileP('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf-8',
      timeout: GCLOUD_TIMEOUT_MS
    });
    token = stdout.trim();
  } catch (err) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'gcloud auth print-access-token',
      expected: 'access token for Firestore REST',
      recovery: recovery || "Run 'gcloud auth login' and retry.",
      detail: `probe: gcloud auth print-access-token\n  env: ${env}\n  error: ${(err.stderr || err.message || String(err)).split('\n')[0].slice(0, 240)}`
    });
  }
  if (!token) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'gcloud auth print-access-token',
      expected: 'non-empty access token',
      recovery: recovery || "Run 'gcloud auth login' and retry.",
      detail: `probe: gcloud auth print-access-token returned empty\n  env: ${env}`
    });
  }

  const qs = query
    ? '?' + Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  const url = `https://firestore.googleapis.com/v1/projects/descix/databases/${dbPath}${qs}`;
  const probeStr = `GET ${url}`;

  const raw = await new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      timeout: GCLOUD_TIMEOUT_MS
    }, res => {
      let chunks = '';
      res.on('data', c => { chunks += c.toString('utf-8'); });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(chunks);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${chunks.slice(0, 240)}`));
        }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('timeout after ' + GCLOUD_TIMEOUT_MS + 'ms')); });
    req.on('error', reject);
    req.end();
  }).catch(err => {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'firestore-rest',
      expected: expected || `200 OK from: ${probeStr}`,
      recovery: recovery || `Verify the gcloud token has Firestore read scope and the database exists for env=${env}.`,
      detail: `probe: ${probeStr}\n  env: ${env}\n  error: ${err.message.split('\n')[0].slice(0, 240)}`
    });
  });

  let json;
  try { json = JSON.parse(raw); }
  catch (parseErr) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.GCLOUD_FAIL,
      section,
      source: 'firestore-rest',
      expected: expected || `parseable JSON from: ${probeStr}`,
      recovery: recovery || 'Inspect the raw response.',
      detail: `probe: ${probeStr}\n  env: ${env}\n  parse error: ${parseErr.message}`
    });
  }

  const sha = sha12(raw);
  return {
    json,
    raw,
    citation: {
      source: 'firestore-rest',
      probe: probeStr,
      env,
      anchor,
      sha,
      lines: `out:${raw.length}b`
    }
  };
}

/**
 * Render a gcloud / firestore-rest citation as a hidden HTML comment line for
 * embedding into the stitched briefer markdown. Mirrors makeCitation()'s shape
 * but uses 'source=...' + 'probe=...' instead of 'file=...'.
 *
 * @param {object} c   Citation object from probeGcloudJson / probeFirestoreRest.
 */
export function renderProbeCitationComment(c) {
  if (!c) return '';
  // Probe string can contain spaces and special chars — wrap in single quotes
  // and escape any embedded single quote with a printable sentinel.
  const probeEsc = (c.probe || '').replace(/'/g, "\\'");
  return `<!-- briefer-cite: source=${c.source} env=${c.env} probe='${probeEsc}' sha=${c.sha} anchor=${c.anchor} lines=${c.lines} -->`;
}
