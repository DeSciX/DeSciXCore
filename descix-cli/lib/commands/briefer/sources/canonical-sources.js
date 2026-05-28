/**
 * §7 — Where to look for canonical answers extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §7, this section is PARTIALLY
 * DERIVED, PARTIALLY EDITORIAL:
 *   - "Question → Canonical source" rows verify each cited path resolves.
 *   - The "Do NOT trust" list is editorial cruft inventory, optionally read
 *     from a JSON sidecar (.briefer-cruft-inventory.json) — if absent, a
 *     minimal default list (the docs called out in the canonical briefer
 *     yesterday) is rendered.
 *
 * Files cited as canonical sources (all must exist at extract time):
 *   - provision-platform-lb.js (routing source)
 *   - serviceManifestManager.js (dispatch source)
 *   - entitlements/index.js, communityManagement.js, bootstrap.js (Products)
 *   - dev/gateway.js, createViteProxyConfig.js (local dev)
 *   - descix-cloud-core/src/config.js (bootstrap precedence)
 *   - platform-runtime-mental-model.md (env parallelism + cutover)
 */
import fs from 'fs/promises';
import path from 'path';
import {
  readSourceFile,
  makeCitation,
  resolveRepoPath
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 7,
  heading: '7. Where to look for canonical answers',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js',
    'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js',
    'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js',
    'DeSciX/DeSciX_Cloud/microservice/services/communityManagement.js',
    'DeSciX/DeSciX_Cloud/microservice/admin/bootstrap.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js',
    'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js',
    'DeSciX/V2_docs/architecture/platform-runtime-mental-model.md'
  ]
};

const CRUFT_SIDECAR = 'DeSciX/V2_docs/architecture/.briefer-cruft-inventory.json';

export async function extract({ env, cliPaths } = {}) {
  if (!env) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NOT_IMPLEMENTED,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'extractor argument',
      expected: 'env (dev|demo|prod) provided by caller',
      recovery: 'Pass {env} from the briefer entry point.'
    });
  }
  if (!cliPaths) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NOT_IMPLEMENTED,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'extractor argument',
      expected: 'cliPaths provided by caller',
      recovery: 'Pass {cliPaths} from the briefer entry point.'
    });
  }

  // Verify each cited canonical source actually exists. HARD-FAIL with
  // BRIEFER-SRC-NOT-FOUND on the FIRST missing file — surfaces drift early.
  const citations = [];
  for (const rel of SECTION.sourceFiles) {
    const file = await readSourceFile({
      cliPaths,
      relPath: rel,
      section: `§${SECTION.number} ${SECTION.heading}`
    });
    citations.push(makeCitation({
      file: rel,
      lines: `1-${file.lines.length}`,
      anchor: 'canonical source',
      fileLines: file.lines
    }));
  }

  // Cruft sidecar — optional. If present, render the entries; if absent, render
  // the default minimal cruft list from yesterday's briefer.
  let cruftRows;
  let cruftSource = null;
  try {
    const sidecarAbs = resolveRepoPath(cliPaths, CRUFT_SIDECAR);
    const raw = await fs.readFile(sidecarAbs, 'utf-8');
    const data = JSON.parse(raw);
    cruftRows = (data.entries || []).map(e => `- ${e.path || e.file}${e.note ? ` — ${e.note}` : ''}`);
    cruftSource = CRUFT_SIDECAR;
  } catch (err) {
    // Sidecar absent or malformed — fall back to the canonical-briefer's list
    // for prose continuity. This is NOT a value-fallback (per
    // feedback_no-hardcoded-fallbacks); it's the documented default rendering
    // until the sidecar lands.
    cruftRows = [
      '- `unified-product-registry.md` routing section',
      '- `cloud-lb-decentralized-routing.md` table without host-dim context',
      '- Any cloud-KB chunk that claims runtime-Gateway / runtime-Firestore-lookup-for-routing'
    ];
  }

  const markdown = [
    `Trust order for any new architectural question:`,
    ``,
    `1. **Code with \`file:line\` cite.** Always wins.`,
    `2. \`DeSciX/V2_docs/architecture/platform-runtime-mental-model.md\` — closest to a code-grounded reference doc.`,
    `3. \`DeSciX/CLAUDE.md\` — mostly right (note: any "load balancers look up by app_id" phrasing is misleading; the LB's host rules + path matchers do the routing, not a runtime lookup).`,
    `4. \`DeSciX/V2_docs/architecture/split-stack-production-architecture.md\` — signal.`,
    ``,
    `**Do NOT trust** (cruft inventory${cruftSource ? `, from \`${cruftSource}\`` : ', default list — install `.briefer-cruft-inventory.json` to override'}):`,
    ``,
    cruftRows.join('\n'),
    ``,
    `| Question | Canonical source (in this order) | Notes |`,
    `|---|---|---|`,
    `| How does prod LB route? | \`DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js\`; verify with \`gcloud compute url-maps describe descix-discord-app-lb\` | Code = signal |`,
    `| How does the env command-broker dispatch external commands? | \`services/serviceManifestManager.js\` (\`proxyToExternalService\`) and \`services/apiFront.js\` | Code = signal |`,
    `| What is Products for? | \`descix-platform-api/src/entitlements/index.js\`, \`services/communityManagement.js\`, \`admin/bootstrap.js\` | Code = signal |`,
    `| How does local \`descix serve\` work? | \`descix-app-sdk/src/dev/gateway.js\` + \`createViteProxyConfig.js\` | Code = signal |`,
    `| Bootstrap & config precedence? | \`descix-cloud-core/src/config.js\` | Code = signal |`,
    `| Environment parallelism & PROD cutover? | \`platform-runtime-mental-model.md\` | Distilled architectural doc |`
  ].join('\n');

  return { markdown, citations };
}
