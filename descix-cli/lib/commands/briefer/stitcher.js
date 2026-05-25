/**
 * Markdown stitcher — composes per-section extract outputs into the final
 * briefer markdown, with the canonical header (provenance, last-regen timestamp,
 * confidence, audience) per the existing briefer at
 * DeSciX/V2_docs/architecture/platform-must-know-briefer.md.
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.5 (Provenance), every successful regen
 * appends a row to the briefer's "Provenance / regeneration history" table with
 * source blob SHAs, gcloud etags, and Products counts.
 *
 * Per scope doc §2.2 §3 critical safeguard, each citation also emits a hidden
 * HTML comment `<!-- briefer-cite: file=... sha=... lines=... anchor=... -->`
 * so `--check` can diff citations (not just rendered prose).
 *
 * M1: produces a real (non-empty) markdown file using the section stubs so the
 * CLI surface can be exercised end-to-end.
 */

const HEADER_TEMPLATE = (env, regenTs, mechanism, sectionsCount) => [
  `# DeSciX Platform Must-Know Briefer`,
  ``,
  `> **THIS DOC WINS.** If anything else in V2_docs, the cloud KB, an agent persona,`,
  `> or a code comment conflicts with what is written here, this briefer is canonical.`,
  `> Conflicting prose is cruft and should be patched, not relied on.`,
  ``,
  `**Last regenerated:** ${regenTs}`,
  `**Regeneration mechanism:** ${mechanism}`,
  `**Target env (for this regen):** \`${env}\``,
  `**Sections rendered:** ${sectionsCount}`,
  `**Audience:** every COS / EVP / sub-agent at bootstrap. Load this BEFORE any other architecture chunk.`,
  ``,
  `---`,
  ``
].join('\n');

const FOOTER_TEMPLATE = (provenanceRow) => [
  `---`,
  ``,
  `## Provenance / regeneration history`,
  ``,
  `| Date | Mechanism | By | Notes |`,
  `|---|---|---|---|`,
  `${provenanceRow}`,
  ``,
  `---`,
  ``,
  `## Engineering principle declarations (this briefer)`,
  ``,
  `- **No fallback prose.** If a claim cannot be cited to code or live infra state, it is not in this briefer.`,
  `- **Single source of truth.** This file is the canonical mental model. Other docs paraphrase; this one binds.`,
  `- **Removal over deprecation.** When this briefer changes, contradictory passages in other files are REWRITTEN or REMOVED — never marked "deprecated" while left in place.`,
  ``
].join('\n');

/**
 * Render a citation set as hidden HTML comments. These are the "machine trail"
 * that --check uses to detect citation drift (see scope doc §2.2 §3 safeguard).
 */
function renderCitationTrail(citations) {
  if (!Array.isArray(citations) || citations.length === 0) return '';
  return citations.map(c => {
    const sha = c.sha || 'PENDING-M2';
    return `<!-- briefer-cite: file=${c.file} lines=${c.lines} sha=${sha} anchor=${c.anchor} -->`;
  }).join('\n');
}

/**
 * Stitch the briefer document.
 *
 * @param {object} args
 * @param {string} args.env                Target env (dev|demo|prod).
 * @param {string} args.mechanism          Mechanism description (e.g., "descix briefer v1.0 (M1 scaffold)").
 * @param {string} args.regenBy            Who triggered the regen (e.g., wallet email).
 * @param {Array<{section, extract}>} args.sections
 *                                          Per-section results: section metadata + extract output.
 * @returns {string}                        Final markdown document.
 */
export function stitchBriefer({ env, mechanism, regenBy, sections }) {
  if (!env) throw new Error('stitchBriefer: env is required');
  if (!mechanism) throw new Error('stitchBriefer: mechanism is required');
  if (!regenBy) throw new Error('stitchBriefer: regenBy is required');
  if (!Array.isArray(sections)) throw new Error('stitchBriefer: sections must be an array');

  const regenTs = new Date().toISOString().replace('T', ' ').replace(/\..*$/, ' UTC');
  const header = HEADER_TEMPLATE(env, regenTs, mechanism, sections.length);

  const body = sections.map(({ section, extract }) => {
    const heading = `## ${section.heading}`;
    const trail = renderCitationTrail(extract.citations || []);
    const blocks = [heading, '', extract.markdown || '_(extractor returned no markdown)_'];
    if (trail) blocks.push('', trail);
    return blocks.join('\n');
  }).join('\n\n');

  const sourcesNote = sections
    .flatMap(s => (s.extract.citations || []).map(c => `${c.file}@${c.sha || 'PENDING-M2'}`))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('; ');
  const provenanceRow = `| ${regenTs} | ${mechanism} | ${regenBy} | sources: ${sourcesNote || '(none)'} |`;

  const footer = FOOTER_TEMPLATE(provenanceRow);

  return [header, body, '', footer].join('\n');
}

/**
 * Extract just the citation trail comments from a rendered briefer document.
 * Used by --check to compare citations (not prose) between canonical + regen.
 *
 * Per scope doc §2.2 §3: --check MUST diff §3 source-by-source against the
 * canonical briefer with stricter tolerance — any line-range citation that no
 * longer points at the documented code construct triggers non-zero exit even
 * if the prose has not changed.
 */
export function extractCitationTrail(markdown) {
  const trail = [];
  const lines = (markdown || '').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^<!-- briefer-cite:\s*(.*?)\s*-->$/);
    if (m) trail.push(m[1]);
  }
  return trail;
}
