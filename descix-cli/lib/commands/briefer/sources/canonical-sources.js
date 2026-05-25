/**
 * §7 — Where to look for canonical answers extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §7, this section is PARTIALLY
 * DERIVED, PARTIALLY EDITORIAL:
 *   - "Question → Canonical source" rows are regenerated mechanically — each
 *     row maps to a specific file:line cite that the CLI verifies still resolves.
 *   - The "Do NOT trust" list is editorial cruft inventory maintained as a
 *     separate JSON sidecar at
 *     DeSciX/V2_docs/architecture/.briefer-cruft-inventory.json — humans
 *     (COS / EVP-DeSciX) edit it when new cruft is discovered, CLI just renders.
 *   - When cruft is FIXED, the entry moves to .briefer-cruft-resolved.json
 *     with a date.
 *
 * M1: scaffold + contract only. Real extraction is M2 (cite verification) +
 * M2 (sidecar JSON read).
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 7,
  heading: '7. Where to look for canonical answers',
  sourceFiles: [
    'DeSciX/V2_docs/architecture/.briefer-cruft-inventory.json',
    'DeSciX/V2_docs/architecture/.briefer-cruft-resolved.json'
  ]
};

export async function extract({ env, cliPaths, gcloud, apiClient } = {}) {
  if (!env) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NOT_IMPLEMENTED,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'extractor argument',
      expected: 'env (dev|demo|prod) provided by caller',
      recovery: 'Pass {env} from the briefer entry point.'
    });
  }

  const markdown = [
    `_TODO: M2 implementation_ — verify each "Canonical source" cite still`,
    `resolves to the cited file:line construct. Render the "Do NOT trust"`,
    `list from \`.briefer-cruft-inventory.json\` sidecar. The sidecar format`,
    `(JSON vs markdown) is unanswered question §9.3 in the scope doc.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/V2_docs/architecture/.briefer-cruft-inventory.json',
        lines: 'sidecar (whole-file)',
        anchor: 'cruft inventory',
        sha: null
      }
    ]
  };
}
