/**
 * §2 — Environments extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §2, this extractor reads:
 *   - Per-env CF name from live `gcloud functions list --gen2 ... apiFront-http`
 *   - Per-env Firestore DB names from update-mesh-routing.js:32-47 ENV_CONFIG
 *     cross-checked against live `gcloud firestore databases list`
 *   - Secret Manager name per env from services/config.js (DEPLOY_ENV mapping)
 *   - DEPLOY_ENV-bound-once invariant from services/config.js:367-369
 *
 * M1: scaffold + contract only. Real extraction is M2 (config.js parsing) +
 * M3 (live gcloud cross-check).
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 2,
  heading: '2. Environments',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Cloud/microservice/services/config.js'
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
    `_TODO: M2 implementation_ — parse \`update-mesh-routing.js\` ENV_CONFIG +`,
    `\`services/config.js\` DEPLOY_ENV → CONFIG_SECRET_NAME mapping.`,
    `M3 adds live \`gcloud functions list\` + \`gcloud firestore databases list\` cross-check.`,
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
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/services/config.js',
        lines: '367-369',
        anchor: 'DEPLOY_ENV-bound-once',
        sha: null
      }
    ]
  };
}
