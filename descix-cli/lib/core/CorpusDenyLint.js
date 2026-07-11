/**
 * CorpusDenyLint — the single canonical deny-class lint for Tier-P KB publishing.
 *
 * Ratified: CEO-D-2026-07-11-KB-CURATION-RATIFIED.
 * Spec: docs/audit/kb-curation-2026-07-11/redteam-AUDIT.md §"PROPOSED DENY-LINT
 *       PATTERN SET" (15 path patterns + 4 content patterns + lint_exempt) and
 *       docs/design/kb-publishing-model-2026-07-11.md §4 (doc_class taxonomy).
 *
 * This module is the ONE definition of:
 *   - the publishable/deny doc_class sets (imported by ManifestLoader — do NOT re-list),
 *   - the deny path/content pattern set,
 *   - the lint that a Tier-P (`publish_tier:"P"`) manifest MUST pass before any
 *     walk/push (corpus.js runCorpusSync) and, via the git hook, before commit.
 *
 * The lint itself never throws — it returns a report. The CALLER decides to throw
 * (assertNoViolations) so exemptions + warnings can be printed as the review
 * artifact first (model §5.3). No hardcoded fallbacks; the manifest is the
 * curation instrument.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { minimatch } from 'minimatch';

/**
 * Doc-class taxonomy (model §4). ONE canonical definition — ManifestLoader
 * imports these; nothing re-enumerates the field list by hand.
 */
export const PUBLISHABLE_DOC_CLASSES = new Set([
  'guide', 'primary-source', 'paper', 'proof', 'code', 'debate-record', 'patent'
]);
export const DENY_DOC_CLASSES = new Set([
  'manuscript-draft', 'archive', 'internal-note'
]);

/**
 * PATH patterns (hard deny — sync fails loud). redteam-AUDIT §"Path patterns".
 * Each entry: { id, class, patterns:[glob...], caseFold?, excludeGlobs?, zeroByte?, reason }.
 * `class` is the stable string a manifest source's `lint_exempt` names to exempt a match.
 */
export const DENY_PATH_PATTERNS = [
  { id: 1,  class: 'archive',            patterns: ['**/archive/**', '**/Archive/**'], reason: 'archive/graveyard directory — never a public surface' },
  { id: 2,  class: 'lean-dev',           patterns: ['**/Complexity/Dev/**'], reason: 'Lean non-load-bearing dev tree (explicitly non-load-bearing)' },
  { id: 3,  class: 'draft-filename',     patterns: ['*DRAFT*', '*Draft*'], caseFold: true, reason: 'draft in path/filename' },
  { id: 4,  class: 'nature-draft',       patterns: ['**/Nature_PeqNP/**'], reason: 'Nature_PeqNP draft lineage (v1/v2/v3/root) — deny the whole tree' },
  { id: 5,  class: 'jsonl-working-log',  patterns: ['*.jsonl'], reason: 'working log format (.jsonl) — exempt with lint_exempt:["jsonl-working-log"] when public-record-by-intent' },
  { id: 6,  class: 'dot-claude',         patterns: ['**/.claude/**'], reason: 'agent/internal .claude tree' },
  { id: 7,  class: 'private',            patterns: ['**/PRIVATE/**'], reason: 'PRIVATE directory' },
  { id: 8,  class: 'handoff',            patterns: ['**/HANDOFF*', '**/handoff*'], caseFold: true, reason: 'internal handoff document' },
  { id: 9,  class: 'test-dump',          patterns: ['**/*_TEST_RESULTS*', '**/test/**', '**/tests/**', '**/TheoremTests/**', '**/benchmarks/**'], excludeGlobs: ['*_README.md'], reason: 'raw test/benchmark suite dump or bloat (named *_README.md summaries excluded)' },
  { id: 10, class: 'internal-pm',        patterns: ['**/session_transcript/**', '**/debug-*/**', '**/tasks/**'], reason: 'internal PM/debug/session material' },
  { id: 11, class: 'status-file',        patterns: ['STATUS.md'], reason: 'internal workstream-status file (STATUS.md) — never a public surface' },
  { id: 12, class: 'investor-material',  patterns: ['*Business_Plan*', '*Executive_Summary*', '*Market_Research*', '**/Faster Abadir Transform BP/**'], reason: 'investor/fundraising material — not public KB content' },
  { id: 13, class: 'patent-application', patterns: ['*Patent*Application*', '*Patent_Application*'], reason: 'patent application (unpublished filing)' },
  { id: 14, class: 'wip',                patterns: ['**/PM/wip/**', '**/wip/**'], reason: 'work-in-progress notes carryover' },
  { id: 15, class: 'zero-byte',          patterns: [], zeroByte: true, reason: 'zero-byte file (produces no content)' },
];

/**
 * CONTENT patterns (soft-block / warn). redteam-AUDIT §"Content patterns".
 * Each entry: { id, class, kind, ... , reason }.
 *   kind 'header'  — first-10-lines regex; requires synced_from_edit (raw_path).
 *   kind 'body'    — body regex(es); hard deny unless exempted.
 *   kind 'warn'    — body regex; WARN only (collect, do not fail).
 *   kind 'license' — primary-source doc_class with empty/missing license_basis; hard deny.
 */
export const DENY_CONTENT_PATTERNS = [
  {
    id: 16, class: 'debate-context-header', kind: 'header',
    headerRegex: /@\[debate_context\]|@\[debate_system\]/,
    reason: '@[debate_context]/@[debate_system] header requires a reviewer-edited synced copy (set raw_path / synced_from_edit)'
  },
  {
    id: 17, class: 'active-draft-marker', kind: 'body',
    bodyRegexes: [/status:\s*"?draft/i, /ACTIVE DRAFTING/, /Project Status:\s*ACTIVE/],
    reason: 'active-draft marker in body (status: draft / ACTIVE DRAFTING / Project Status: ACTIVE)'
  },
  {
    id: 18, class: 'mailto-in-doc', kind: 'warn',
    bodyRegex: /mailto:[\w.+-]+@[\w.-]+/,
    reason: 'mailto: link embedded in a non-PDF paper/guide doc — reviewer accepts or strips'
  },
  {
    id: 19, class: 'missing-license-basis', kind: 'license',
    reason: 'primary-source doc_class with empty/missing license_basis'
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Matching helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True if `relPath` matches `glob` as a full path, as its basename, or as any
 * single path segment (so segment-anywhere globs like `*DRAFT*` catch a middle
 * directory such as `ReimannHypothesis Rota Draft/`).
 */
function pathMatchesGlob(relPath, glob, opts) {
  if (minimatch(relPath, glob, opts)) return true;
  const base = path.basename(relPath);
  if (minimatch(base, glob, opts)) return true;
  for (const seg of relPath.split('/')) {
    if (seg && minimatch(seg, glob, opts)) return true;
  }
  return false;
}

/**
 * Test a resolved source path against a single DENY_PATH_PATTERN.
 * Returns the matched glob string, or `false` (no match), or `null` (explicitly
 * excluded, e.g. a `*_README.md` summary inside a tests/ tree).
 */
export function matchPathPattern(relPath, pattern) {
  if (pattern.zeroByte) return false; // stat-based, handled by the lint, not a glob
  if (pattern.excludeGlobs) {
    const base = path.basename(relPath);
    for (const ex of pattern.excludeGlobs) {
      if (minimatch(base, ex, { dot: true, nocase: true })) return null;
    }
  }
  const opts = { dot: true, nocase: !!pattern.caseFold };
  for (const g of pattern.patterns) {
    if (pathMatchesGlob(relPath, g, opts)) return g;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report record builders (each carries a pre-rendered `line` for printing)
// ─────────────────────────────────────────────────────────────────────────────

function mkViolation(p, id, matched, reason) {
  const pat = typeof id === 'number' ? `#${id}` : id;
  const matchStr = matched ? ` [${matched}]` : '';
  return {
    path: p,
    pattern: pat,
    reason,
    line: `VIOLATION: ${p} — pattern ${pat}: ${reason}${matchStr}`
  };
}

function mkExemption(p, patternId, cls, matched, exemptReason) {
  const pat = `#${patternId}`;
  const why = exemptReason || '(no exempt_reason given)';
  return {
    path: p,
    pattern: pat,
    class: cls,
    reason: why,
    line: `EXEMPTED: ${p} matched pattern ${pat} ${matched} — exempted for "${cls}": ${why}`
  };
}

function mkWarning(p, id, matched, reason) {
  const pat = `#${id}`;
  return {
    path: p,
    pattern: pat,
    reason,
    line: `WARNING: ${p} — pattern ${pat}: ${reason} ${matched}`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// The lint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lint a resolved manifest for deny-class violations. Never throws — returns a
 * report. The caller prints exemptions/warnings then calls assertNoViolations.
 *
 * A source may point at a file or a directory. Tier-P manifests are file-level
 * allowlists (the common case): for a file source every check runs. For a dir
 * source, only the source-entry-level checks run (path pattern on `source.path`,
 * doc_class deny re-check, license #19, and the raw_path byte-hash) — content
 * reads are skipped since a directory cannot be read as a document.
 *
 * @param {Object} manifest - Validated manifest with `_resolvedSources`.
 * @param {string} workspaceRoot - Absolute workspace root (resolves raw_path).
 * @returns {Promise<{violations:Array, exemptions:Array, warnings:Array}>}
 */
export async function lintManifestForDenyClasses(manifest, workspaceRoot) {
  const report = { violations: [], exemptions: [], warnings: [] };
  const sources = manifest?._resolvedSources || [];

  for (const source of sources) {
    const relPath = source.path;
    const absPath = source.absolutePath || path.resolve(workspaceRoot, relPath);
    const exemptSet = new Set(source.lint_exempt || []);
    const exemptReason = source.exempt_reason || null;

    let stat = null;
    try { stat = await fs.stat(absPath); } catch { stat = null; }
    const isFileSource = !!(stat && stat.isFile());

    // (a) PATH patterns — evaluated on source.path (works for file, dir, missing).
    for (const pattern of DENY_PATH_PATTERNS) {
      const matched = matchPathPattern(relPath, pattern);
      if (matched) {
        if (exemptSet.has(pattern.class)) {
          report.exemptions.push(mkExemption(relPath, pattern.id, pattern.class, matched, exemptReason));
        } else {
          report.violations.push(mkViolation(relPath, pattern.id, matched, pattern.reason));
        }
      }
    }

    // (#15) zero-byte — stat-based, only meaningful for a real file.
    if (isFileSource && stat.size === 0) {
      const zb = DENY_PATH_PATTERNS.find(p => p.class === 'zero-byte');
      if (exemptSet.has('zero-byte')) {
        report.exemptions.push(mkExemption(relPath, zb.id, zb.class, '(zero-byte file)', exemptReason));
      } else {
        report.violations.push(mkViolation(relPath, zb.id, '(zero-byte file)', zb.reason));
      }
    }

    // (f) doc_class deny-class re-check (defense-in-depth; ManifestLoader also blocks).
    if (source.doc_class && DENY_DOC_CLASSES.has(source.doc_class)) {
      report.violations.push(mkViolation(
        relPath, 'doc_class', source.doc_class,
        `doc_class "${source.doc_class}" is a deny-class — structurally invalid in a Tier-P manifest`
      ));
    }

    // (g) content #19 — primary-source must carry a license_basis (source-level).
    if (source.doc_class === 'primary-source' && !source.license_basis) {
      report.violations.push(mkViolation(
        relPath, 19, 'primary-source',
        DENY_CONTENT_PATTERNS.find(p => p.id === 19).reason
      ));
    }

    // (c) synced_from_edit byte-hash — whenever raw_path is set (file OR dir source).
    if (source.raw_path) {
      const rawAbs = path.resolve(workspaceRoot, source.raw_path);
      let rawBytes = null;
      try { rawBytes = await fs.readFile(rawAbs); } catch { rawBytes = null; }
      if (rawBytes === null) {
        report.violations.push(mkViolation(
          relPath, 'synced_from_edit', source.raw_path,
          `raw_path "${source.raw_path}" is missing on disk`
        ));
      } else if (isFileSource) {
        let editBytes = null;
        try { editBytes = await fs.readFile(absPath); } catch { editBytes = null; }
        if (editBytes !== null) {
          const rawHash = createHash('sha256').update(rawBytes).digest('hex');
          const editHash = createHash('sha256').update(editBytes).digest('hex');
          if (rawHash === editHash) {
            report.violations.push(mkViolation(
              relPath, 16, source.raw_path,
              'edited copy byte-identical to raw source — the edit was not applied'
            ));
          }
        }
      }
    }

    // Content-body checks require reading the file (file sources only).
    if (isFileSource) {
      let content = null;
      try { content = await fs.readFile(absPath, 'utf-8'); } catch { content = null; }
      if (content !== null) {
        // (b) content #16 — debate-context header in first 10 lines requires raw_path.
        const p16 = DENY_CONTENT_PATTERNS.find(p => p.id === 16);
        const first10 = content.split('\n').slice(0, 10).join('\n');
        if (p16.headerRegex.test(first10) && !source.raw_path) {
          report.violations.push(mkViolation(
            relPath, 16, '@[debate_context]/@[debate_system]', p16.reason
          ));
        }

        // (d) content #17 — active-draft marker in body → hard deny unless exempted.
        const p17 = DENY_CONTENT_PATTERNS.find(p => p.id === 17);
        if (p17.bodyRegexes.some(re => re.test(content))) {
          if (exemptSet.has(p17.class)) {
            report.exemptions.push(mkExemption(relPath, p17.id, p17.class, '(active-draft marker)', exemptReason));
          } else {
            report.violations.push(mkViolation(relPath, p17.id, '(active-draft marker)', p17.reason));
          }
        }

        // (e) content #18 — mailto: in a non-PDF paper/guide doc → WARN only.
        const p18 = DENY_CONTENT_PATTERNS.find(p => p.id === 18);
        const dc = source.doc_class;
        const isPaperOrGuide = dc === 'paper' || dc === 'guide';
        const isPdf = relPath.toLowerCase().endsWith('.pdf');
        if (isPaperOrGuide && !isPdf && p18.bodyRegex.test(content)) {
          report.warnings.push(mkWarning(relPath, p18.id, '(mailto)', p18.reason));
        }
      }
    }
  }

  return report;
}

/**
 * Throw a single aggregated error listing every violation, or return quietly if
 * the report is clean. The caller (corpus.js / git hook) uses this to fail loud
 * AFTER printing exemptions + warnings.
 *
 * @param {{violations:Array}} report
 */
export function assertNoViolations(report) {
  const violations = report?.violations || [];
  if (violations.length === 0) return;
  const lines = violations.map(v => `  - ${v.line || `${v.path}: ${v.reason}`}`);
  throw new Error(
    `Tier-P deny-class lint FAILED: ${violations.length} violation(s) — refusing to sync/commit.\n` +
    lines.join('\n')
  );
}

export default {
  PUBLISHABLE_DOC_CLASSES,
  DENY_DOC_CLASSES,
  DENY_PATH_PATTERNS,
  DENY_CONTENT_PATTERNS,
  matchPathPattern,
  lintManifestForDenyClasses,
  assertNoViolations,
};
