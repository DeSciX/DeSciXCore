/**
 * `descix briefer` — main entry point.
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2 (Architecture / Option A):
 *
 *   descix briefer [--env=dev|demo|prod] [--out=PATH] [--check]
 *
 * Reads the per-section data sources defined in scope doc §2.2, dispatches to
 * the per-section extractors in ./sources/*.js, and emits a structured
 * BrieferDoc object. The stitcher composes the markdown; --check mode diffs
 * the regen against the canonical briefer file.
 *
 * HARD-FAIL philosophy (scope doc §2.3 + feedback_no-hardcoded-fallbacks):
 * every extractor that can't find its source data throws BrieferExtractorError
 * with a stable error code. No fallback strings. No try-catch-and-default.
 *
 * M1 SCOPE (this implementation):
 *   - CLI subcommand registration in bin/descix.js (separate edit).
 *   - This entry orchestrates 7 stub extractors.
 *   - Stitcher composes a real (non-empty) markdown with TODO placeholder bodies.
 *   - --check runs the full extraction, diffs against canonical, prints a
 *     unified-style diff, exits non-zero on drift (which is EXPECTED for M1 —
 *     stubs WILL differ from the manually-authored canonical briefer).
 *
 * M2+ SCOPE (NOT IMPLEMENTED HERE):
 *   - Real AST/regex parsing of source files.
 *   - Live gcloud probes.
 *   - Firestore Products counts via apifront.
 *   - MustKnow KB partition + auto-sync.
 *   - Bootstrap protocol edits (/cos skill, @bootstrap agent).
 *   - CI --check gate.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

import { BrieferExtractorError, BRIEFER_ERROR_CODES } from './errors.js';
import { stitchBriefer, extractCitationTrail } from './stitcher.js';

import * as identifiers from './sources/identifiers.js';
import * as environments from './sources/environments.js';
import * as routing from './sources/routing.js';
import * as microserviceDeploy from './sources/microservice-deploy.js';
import * as entitlements from './sources/entitlements.js';
import * as whatIsNot from './sources/what-is-not.js';
import * as canonicalSources from './sources/canonical-sources.js';

import { WorkspaceConfig } from '../../workspace-config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Extractor dispatch table (scope doc §2.2 ordering)
// ─────────────────────────────────────────────────────────────────────────────
export const EXTRACTORS = Object.freeze([
  identifiers,
  environments,
  routing,
  microserviceDeploy,
  entitlements,
  whatIsNot,
  canonicalSources
]);

export const VALID_ENVS = Object.freeze(['dev', 'demo', 'prod']);

// Default output path (scope doc §2.1). Resolved relative to workspace root
// via WorkspaceConfig.getWorkspaceRoot() — never a hardcoded absolute path.
export const DEFAULT_OUT_RELATIVE = 'DeSciX/V2_docs/architecture/platform-must-know-briefer.md';

const MECHANISM_TAG = 'descix briefer v1.0 (M2 — code-grounded extractors)';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function resolveCliPaths() {
  // Resolve the descix-cli root from this file's location, then walk up to
  // DeSciX_Core and the parent repo. M2/M3 extractors that read source files
  // will need these to anchor file reads.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const descixCliRoot = path.resolve(here, '../../..');                // .../descix-cli
  const descixCoreRoot = path.resolve(descixCliRoot, '..');             // .../DeSciX_Core
  const desciXRoot = path.resolve(descixCoreRoot, '..');                // .../DeSciX
  const repoRoot = path.resolve(desciXRoot, '..');                      // .../Unkamon
  return { descixCliRoot, descixCoreRoot, desciXRoot, repoRoot };
}

export function resolveOutPath(cliOut, workspaceConfig, cliPaths, cwd) {
  // Explicit override always wins.
  if (cliOut) return path.resolve(cliOut);

  // Default: workspace-root-relative path.
  if (workspaceConfig) {
    const wsRoot = workspaceConfig.getWorkspaceRoot();
    return path.join(wsRoot, DEFAULT_OUT_RELATIVE);
  }

  // HARD-FAIL per feedback_no-hardcoded-fallbacks. The previous implementation
  // derived a default from cliPaths.repoRoot (computed from the CLI file
  // location), which silently produced a wrong path like
  // "Unkamon/DeSciX/DeSciX/V2_docs/..." (double DeSciX/) when invoked from
  // inside descix-cli/ with no workspace.json in cwd. No silent path-guessing.
  throw new BrieferExtractorError({
    code: BRIEFER_ERROR_CODES.WORKSPACE_NOT_FOUND,
    section: 'briefer entry',
    source: cwd || '(unknown cwd)',
    expected: 'either .descix/workspace.json reachable by upward search, OR --out=<path>',
    recovery: 'Run from your workspace root (where .descix/workspace.json lives), or pass --out=<path> explicitly.',
    detail: `cliPaths.repoRoot was previously used as a silent fallback (resolved to ${cliPaths.repoRoot}); that fallback is removed.`
  });
}

async function resolveRegenBy() {
  // Best signal we have without forcing an auth round-trip in M1. M2 will
  // require auth (for apifront/Firestore calls) and can use the wallet email
  // from apiClient.loadCredentials() — at that point this changes to a hard
  // requirement. For M1 scaffolding we just tag the system user.
  return process.env.USER || process.env.USERNAME || 'unknown';
}

// Minimal unified-style diff (line-based). Avoids adding a new npm dependency
// for the M1 scaffold; M2 may swap in the `diff` package if richer output is
// needed (currently an unanswered question §9.1 in scope doc — Babel dep).
function simpleLineDiff(a, b, { aLabel = 'canonical', bLabel = 'regen' } = {}) {
  const aLines = (a || '').split(/\r?\n/);
  const bLines = (b || '').split(/\r?\n/);
  const out = [`--- ${aLabel}`, `+++ ${bLabel}`];
  const max = Math.max(aLines.length, bLines.length);
  let inHunk = false;
  for (let i = 0; i < max; i++) {
    const av = aLines[i];
    const bv = bLines[i];
    if (av === bv) {
      if (inHunk) { out.push(' ' + (av ?? '')); inHunk = false; }
      continue;
    }
    if (!inHunk) {
      out.push(`@@ line ${i + 1} @@`);
      inHunk = true;
    }
    if (av !== undefined) out.push(`-${av}`);
    if (bv !== undefined) out.push(`+${bv}`);
  }
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// BrieferDoc — the structured object returned by buildBrieferDoc()
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {object} BrieferSectionResult
 * @property {{number: number, heading: string, sourceFiles: string[]}} section
 * @property {{markdown: string, citations: object[]}} extract
 */

/**
 * @typedef {object} BrieferDoc
 * @property {string} env
 * @property {string} mechanism
 * @property {string} regenBy
 * @property {BrieferSectionResult[]} sections
 * @property {string} markdown        Final stitched markdown.
 * @property {string[]} citationTrail Hidden HTML-comment trail (one per line).
 */

/**
 * Run all extractors and return the BrieferDoc.
 *
 * @param {object} opts
 * @param {string} opts.env
 * @param {object} opts.cliPaths
 * @param {object|null} [opts.apiClient]  Optional in M1 (stubs don't need it).
 * @param {object|null} [opts.gcloud]     Optional in M1 (stubs don't need it).
 * @param {string}  opts.regenBy
 * @param {string} [opts.mechanism]
 * @returns {Promise<BrieferDoc>}
 */
export async function buildBrieferDoc({ env, cliPaths, apiClient = null, gcloud = null, regenBy, mechanism = MECHANISM_TAG }) {
  const sections = [];
  for (const extractor of EXTRACTORS) {
    const result = await extractor.extract({ env, cliPaths, gcloud, apiClient });
    sections.push({ section: extractor.SECTION, extract: result });
  }
  const markdown = stitchBriefer({ env, mechanism, regenBy, sections });
  const citationTrail = extractCitationTrail(markdown);
  return { env, mechanism, regenBy, sections, markdown, citationTrail };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public CLI entry — invoked by bin/descix.js `briefer` subcommand
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} options Commander options object.
 * @param {string} [options.env]      dev|demo|prod (default: 'dev' for M1; M2 will hard-fail dev per scope doc §2.1).
 * @param {string} [options.out]      Output path override.
 * @param {boolean} [options.check]   Drift-detection mode: regen to memory, diff against canonical, exit non-zero on drift.
 * @param {boolean} [options.verbose] Print per-source timing + extractor names.
 */
export async function runBriefer(options = {}) {
  const env = (options.env || 'dev').toLowerCase();
  if (!VALID_ENVS.includes(env)) {
    console.error(chalk.red(`\n❌ Invalid --env=${options.env}. Must be one of: ${VALID_ENVS.join(', ')}\n`));
    process.exit(1);
  }

  // Per scope §2.1: --env=dev is rejected by the routing extractor specifically
  // (DEV has no LB URL map). Other extractors accept dev because they read
  // only source files (no gcloud probe required). The rejection lives in
  // sources/routing.js; this entry point passes env through unchanged.
  if (options.verbose) {
    console.log(chalk.gray(`[briefer] env=${env}`));
  }

  const cliPaths = resolveCliPaths();
  const cwd = process.cwd();
  let workspaceConfig = null;
  try {
    workspaceConfig = await WorkspaceConfig.tryLoad(cwd);
  } catch {
    // tryLoad returns null on missing workspace; an exception here means the
    // workspace.json file exists but is invalid. Hard-fail per philosophy —
    // do NOT proceed with a guessed default workspace.
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.PARSE_FAIL,
      section: 'briefer entry',
      source: '.descix/workspace.json',
      expected: 'valid v2.1 workspace JSON',
      recovery: 'Fix the workspace.json or run `descix init` to regenerate.'
    });
  }

  const outPath = resolveOutPath(options.out, workspaceConfig, cliPaths, cwd);
  const regenBy = await resolveRegenBy();

  if (options.verbose) {
    console.log(chalk.gray(`[briefer] outPath=${outPath}`));
    console.log(chalk.gray(`[briefer] regenBy=${regenBy}`));
    console.log(chalk.gray(`[briefer] extractors=${EXTRACTORS.length}`));
  }

  // Build the briefer doc. Each extractor is run sequentially; M2 can
  // parallelize if hot-path latency matters (it likely won't for 7 sources).
  let doc;
  try {
    doc = await buildBrieferDoc({ env, cliPaths, regenBy });
  } catch (err) {
    if (err instanceof BrieferExtractorError) {
      console.error(chalk.red(`\n❌ Briefer extraction failed:\n`));
      console.error(chalk.red(err.message));
      console.error('');
      process.exit(1);
    }
    throw err;
  }

  if (options.check) {
    return runCheckMode({ doc, outPath, verbose: options.verbose });
  }

  // Write mode — overwrite the canonical briefer file.
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, doc.markdown, 'utf-8');

  console.log(chalk.green(`\n✅ Briefer regenerated\n`));
  console.log(chalk.cyan(`  Env:       ${env}`));
  console.log(chalk.gray (`  Mechanism: ${doc.mechanism}`));
  console.log(chalk.gray (`  By:        ${regenBy}`));
  console.log(chalk.gray (`  Out:       ${outPath}`));
  console.log(chalk.gray (`  Sections:  ${doc.sections.length}`));
  console.log(chalk.gray (`  Citations: ${doc.citationTrail.length}\n`));
  return doc;
}

export async function runCheckMode({ doc, outPath, verbose }) {
  let canonical = null;
  try {
    canonical = await fs.readFile(outPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(chalk.red(`\n❌ --check failed: canonical briefer not found at ${outPath}\n`));
      console.error(chalk.gray('   Run `descix briefer` (without --check) to create it.\n'));
      process.exit(2);
    }
    throw err;
  }

  if (canonical === doc.markdown) {
    console.log(chalk.green(`\n✅ Briefer is in sync — no drift detected.\n`));
    return { drift: false, doc };
  }

  // Drift detected. Print a unified-style diff and exit non-zero.
  // Per scope doc §2.2 §3, --check also compares the citation trail. For M1
  // we report both prose-drift and citation-drift counts.
  const canonicalTrail = extractCitationTrail(canonical);
  const regenTrail = doc.citationTrail;
  const trailChanged = (canonicalTrail.length !== regenTrail.length) ||
    canonicalTrail.some((c, i) => c !== regenTrail[i]);

  console.error(chalk.yellow(`\n⚠ [${BRIEFER_ERROR_CODES.DRIFT_DETECTED}] Briefer drift detected.\n`));
  console.error(chalk.gray(`  Canonical:    ${outPath}`));
  console.error(chalk.gray(`  Regen length: ${doc.markdown.length} bytes`));
  console.error(chalk.gray(`  Canon length: ${canonical.length} bytes`));
  console.error(chalk.gray(`  Citation trail drift: ${trailChanged ? 'YES' : 'no'}\n`));

  if (verbose) {
    console.error(simpleLineDiff(canonical, doc.markdown, { aLabel: outPath, bLabel: 'regen (in-memory)' }));
    console.error('');
  } else {
    console.error(chalk.gray('  (Run with --verbose for the full diff.)\n'));
  }

  // M2: drift means a source-of-truth file changed shape since last regen.
  // Caller should regenerate (run `descix briefer` without --check) and commit
  // the updated canonical briefer.
  process.exit(1);
}
