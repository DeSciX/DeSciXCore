/**
 * §6 — What is NOT in the system extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §6, this section is DERIVED BY
 * NEGATIVE ASSERTION — the CLI greps for code paths the briefer claims do NOT
 * exist. If any are found, the regen HARD-FAILS with a BRIEFER-NEGATIVE-CLAIM
 * error: "Briefer claims X does not exist but I found it at Y:Z."
 *
 * Negative claims (each is a grep + condition):
 *   - "No API Gateway middleware at runtime" — grep services/ for
 *     gatewayDispatch|routeByProduct|productPath|extractProductId|getProductId
 *   - "No runtime Firestore lookup for routing" — grep update-mesh-routing.js
 *     and any lb*.js|router*.js|gateway*.js for CacheFirestore|admin.firestore
 *   - "No per-app DNS provisioning" — grep DeSciX_Cloud/microservice/ for
 *     `gcloud dns | managedZone` (WARN, not HARD-FAIL — wildcard cert may touch)
 *   - "No `descix microservice deploy` CLI" — grep bin/descix.js (toggle, not fail)
 *   - "No --env flag for the MCP server" — grep bin/descix.js (toggle, not fail)
 *
 * M1: scaffold + contract only. Real grep wiring is M2.
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 6,
  heading: '6. What is NOT in the system',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/services/',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Core/descix-cli/bin/descix.js'
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
    `_TODO: M2 implementation_ — derive this section by NEGATIVE ASSERTION grep.`,
    `Hard-fail with \`BRIEFER-NEGATIVE-CLAIM\` if any forbidden construct (e.g.,`,
    `\`gatewayDispatch\`, \`routeByProduct\`, runtime Firestore lookup in routing files)`,
    `is found in source. Auto-toggle the "missing CLI" claims by grepping`,
    `\`bin/descix.js\` for the relevant subcommand declarations.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/services/',
        lines: 'negative-grep: gatewayDispatch|routeByProduct|productPath|extractProductId|getProductId',
        anchor: 'no-runtime-gateway',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: 'negative-grep: CacheFirestore|admin.firestore',
        anchor: 'no-routing-firestore-lookup',
        sha: null
      }
    ]
  };
}
