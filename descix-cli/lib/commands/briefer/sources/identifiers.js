/**
 * §1 — Identifiers & invariants extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §1, this extractor reads:
 *   - Domain pattern from update-mesh-routing.js:120
 *   - ENV_CONFIG table from update-mesh-routing.js:32-47
 *   - GCS path pattern from update-mesh-routing.js:123
 *   - Wildcard TLS cert from live `gcloud compute ssl-certificates list`
 *
 * M1: scaffold + contract only. Real extraction is M2 (file parsing) + M3 (gcloud).
 *
 * @param {object} args
 * @param {string} args.env            Target environment: dev|demo|prod.
 * @param {object} args.cliPaths       { repoRoot, descixCoreRoot, descixCloudRoot, ... }
 * @param {object} args.gcloud         gcloud query helper (M3); placeholder in M1.
 * @param {object} args.apiClient      apifront client for Firestore reads via platform API.
 * @returns {Promise<{markdown: string, citations: object[]}>}
 *   markdown: section markdown body (without the section heading).
 *   citations: list of {file, lines, sha, anchor} objects for the hidden-comment trail.
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 1,
  heading: '1. Identifiers & invariants',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js'
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

  // M1 stub: return a placeholder markdown body so the stitcher/CLI surface
  // can be exercised end-to-end. Real implementation lands in M2 (AST/regex
  // parse of update-mesh-routing.js) + M3 (gcloud SSL cert query).
  const markdown = [
    `_TODO: M2 implementation_ — parse \`update-mesh-routing.js\` for ENV_CONFIG,`,
    `host pattern (L120), GCS path (L123). M3 adds live \`gcloud compute ssl-certificates list\`.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: '32-47',
        anchor: 'ENV_CONFIG',
        sha: null   // populated in M2 when real extraction runs
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: '120',
        anchor: 'host pattern',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: '123',
        anchor: 'gcsPath pattern',
        sha: null
      }
    ]
  };
}
