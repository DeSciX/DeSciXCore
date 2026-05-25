/**
 * §4 — Microservice deploy extractor (M1 scaffold).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §4, this extractor reads:
 *   - gcloud run deploy invocation example from DeSciX_Powch deploy.sh:37-58
 *     (canonical) and admin/scripts/deploy/deploy-service-env.sh if it exists.
 *   - update-mesh-routing.js:82-202 main() arg parsing for the LB-wiring contract.
 *   - bin/descix.js:3080-3236 for the `descix microservice register` description.
 *   - Computed: grep bin/descix.js for `microserviceCommand.command('deploy'` —
 *     if found, the KNOWN GAP section about the missing chained command must be
 *     REMOVED (the gap was closed); if absent, the gap section MUST be present.
 *
 * M1: scaffold + contract only. Real extraction is M2/M3.
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 4,
  heading: '4. Microservice deploy — current state',
  sourceFiles: [
    'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh',
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
    `_TODO: M2 implementation_ — parse the 3-step deploy chain from`,
    `\`scripts/deploy.sh\`, \`update-mesh-routing.js\` \`main()\`, and the`,
    `\`descix microservice register\` block at \`bin/descix.js:3080-3236\`.`,
    `Compute the KNOWN GAP toggle by grepping \`bin/descix.js\` for`,
    `\`microserviceCommand.command('deploy'\` — if found, drop the gap text.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh',
        lines: '37-58',
        anchor: 'gcloud run deploy example',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: '82-202',
        anchor: 'LB-wire-up main()',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Core/descix-cli/bin/descix.js',
        lines: '3080-3236',
        anchor: 'microservice register subcommand',
        sha: null
      }
    ]
  };
}
