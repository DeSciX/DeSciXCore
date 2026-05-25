/**
 * §5 — Entitlements & Products Firestore extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §5, this extractor reads:
 *   - Products schema fields via apifront's `get_product_context` command for
 *     a sample doc (e.g., Products/powch). NOT via direct @google-cloud/firestore
 *     import (forbidden by feedback_never_bypass_platform_api).
 *   - Runtime readers list by grepping DeSciX_Cloud/microservice/services/ for
 *     Products collection access patterns.
 *   - Writers list by grepping DeSciX_Cloud/microservice/admin/ +
 *     services/commandHandlers/ for Products write patterns.
 *   - Products count per env via apifront `find_apps_in_community` (sanity check).
 *
 * M1: scaffold + contract only. Real extraction is M2 (grep) + M3 (apifront).
 *
 * CRITICAL INVARIANT (DeSciX/CLAUDE.md): No direct @google-cloud/firestore
 * or @pinecone-database/pinecone imports. All Firestore touches MUST go through
 * apiClient.invoke(...). AC-7 grep gate enforces this on the briefer/ tree.
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 5,
  heading: '5. Entitlements & Products Firestore',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/services/',
    'DeSciX/DeSciX_Cloud/microservice/admin/'
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
    `_TODO: M2 implementation_ — grep \`services/\` + \`admin/\` for Products`,
    `readers/writers. M3 calls apifront \`get_product_context\` (sample = \`powch\`)`,
    `and \`find_apps_in_community\` per known community for count sanity check.`,
    `Per feedback_never_bypass_platform_api: NO direct \`@google-cloud/firestore\` imports.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/services/',
        lines: 'grep: Products/{ | Products.doc(',
        anchor: 'Products readers',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/',
        lines: 'grep: Products write patterns',
        anchor: 'Products writers',
        sha: null
      }
    ]
  };
}
