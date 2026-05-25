/**
 * §3 — Request routing extractor (M1 scaffold).
 *
 * This is THE section that drifted most badly per the 2026-05-25 audit. Per
 * WS-DESCIX-BRIEFER-CLI scope doc §2.2 §3, it reads:
 *   - Live `gcloud compute url-maps describe descix-discord-app-lb` for the
 *     verbatim path-matcher rule set (TTL 30min cache, strictest tolerance).
 *   - update-mesh-routing.js:82-202 for the URL-map → backend wiring functions
 *     (ensureServerlessBackend + path-matcher insertion).
 *   - serviceManifestManager.js:685-765 for the proxyToExternalService URL shape.
 *   - services/apiFront.js:83-186 for middleware order
 *     (especially hydrateCommunityIdFromProducts placement).
 *   - DeSciX_Core/descix-app-sdk/src/dev/gateway.js:170-183 + createViteProxyConfig.js
 *     for the local `descix serve` mapping table.
 *
 * Critical safeguard per scope doc §2.2 §3: every citation in the regenerated
 * briefer includes a hidden HTML comment `<!-- briefer-cite: ... -->` and
 * `--check` compares the citations (not just rendered prose) so a moved line
 * range triggers DRIFT-DETECTED even when prose is unchanged.
 *
 * M1: scaffold + contract only. Real extraction is M2/M3.
 */
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 3,
  heading: '3. Request routing — the single canonical model',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js',
    'DeSciX/DeSciX_Cloud/microservice/services/apiFront.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js'
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
    `_TODO: M2 implementation_ — parse the 5 routing-truth source files +`,
    `live \`gcloud compute url-maps describe descix-discord-app-lb\` (M3).`,
    `Highest scrutiny section per audit Phase 5 — every citation needs the`,
    `\`<!-- briefer-cite: ... -->\` HTML comment trail for \`--check\` to compare.`,
    ``,
    `Target env: \`${env}\``
  ].join('\n');

  return {
    markdown,
    citations: [
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
        lines: '82-202',
        anchor: 'ensureServerlessBackend + path-matcher insertion',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js',
        lines: '685-765',
        anchor: 'proxyToExternalService',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Cloud/microservice/services/apiFront.js',
        lines: '83-186',
        anchor: 'middleware order',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js',
        lines: '170-183',
        anchor: 'local serve mapping',
        sha: null
      },
      {
        file: 'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js',
        lines: '23-178',
        anchor: 'vite proxy rules',
        sha: null
      }
    ]
  };
}
