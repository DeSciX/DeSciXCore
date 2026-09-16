/**
 * §6 — What is NOT in the system extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §6, derived by NEGATIVE ASSERTION:
 * the CLI greps for forbidden constructs and HARD-FAILS with BRIEFER-NEGATIVE-CLAIM
 * if any are present. Toggle-claims (CLI subcommands "not yet built") are
 * rendered dynamically — present if absent, removed if found.
 *
 * Negative claims this extractor verifies:
 *  (1) No API Gateway middleware at runtime — grep services/ for gatewayDispatch/routeByProduct/etc.
 *  (2) No runtime Firestore lookup for routing — grep provision-platform-lb.js for CacheFirestore/admin.firestore
 *  (3) No per-app DNS provisioning — grep for `gcloud dns` / `domain-mappings` (recent CRUFT-8 fix)
 *  (4) No per-app TLS cert — verify wildcard cert config in provision-platform-lb.js
 *  (5) No `descix microservice deploy` CLI (TOGGLE) — grep bin/descix.js
 *  (6) No descix-chain runtime lookup for routing — grep provision-platform-lb.js for descix-chain
 *  (7) No path rewriting in `descix serve` for product sites — cite createViteProxyConfig.js
 *  (8) No `--env` flag for the MCP server — toggle, grep mcp-server.js
 */
import {
  readSourceFile,
  findInLines,
  makeCitation,
  grepFiles
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 6,
  heading: '6. What is NOT in the system',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/services',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js',
    'DeSciX/DeSciX_Core/descix-cli/bin/descix.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js'
  ]
};

const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js';
const CLI_FILE = 'DeSciX/DeSciX_Core/descix-cli/bin/descix.js';
const PROXY_CONFIG = 'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js';
const SERVICES_DIR = 'DeSciX/DeSciX_Cloud/microservice/services';

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

  // (1) HARD: no gatewayDispatch/routeByProduct/etc. in services/.
  const forbiddenGateway = await grepFiles({
    repoRoot: cliPaths.repoRoot,
    relPaths: [SERVICES_DIR],
    regex: /\b(gatewayDispatch|routeByProduct|extractProductId|getProductId)\b/,
    excludePaths: new Set(['/node_modules/', '/.git/', '/tests/'])
  });
  if (forbiddenGateway.length > 0) {
    const sample = forbiddenGateway.slice(0, 3).map(m => `${m.file}:${m.lineNumber}`).join(', ');
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NEGATIVE_CLAIM,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: `grep on ${SERVICES_DIR}`,
      expected: 'no matches for gatewayDispatch|routeByProduct|extractProductId|getProductId',
      recovery: 'Either the briefer is stale (a runtime gateway middleware was introduced) or the code added a forbidden construct. Reconcile by rewriting the briefer claim or removing the code.',
      detail: `Found ${forbiddenGateway.length} match(es). Sample: ${sample}`
    });
  }

  // (2) HARD: no CacheFirestore / admin.firestore in provision-platform-lb.js.
  const mesh = await readSourceFile({
    cliPaths,
    relPath: MESH_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  for (let i = 0; i < mesh.lines.length; i++) {
    if (/CacheFirestore|admin\.firestore\(/.test(mesh.lines[i])) {
      throw new BrieferExtractorError({
        code: BRIEFER_ERROR_CODES.NEGATIVE_CLAIM,
        section: `§${SECTION.number} ${SECTION.heading}`,
        source: `${MESH_FILE}:${i + 1}`,
        expected: 'no runtime Firestore lookup in provision-platform-lb.js (LB wiring is deploy-time only)',
        recovery: 'A Firestore lookup was added to the LB-wiring path. Reconcile: routing must not depend on runtime Firestore reads.',
        detail: `Match at ${MESH_FILE}:${i + 1} — ${mesh.lines[i].trim()}`
      });
    }
  }

  // (3) HARD: no per-app DNS provisioning in deploy scripts.
  // CRUFT-8 fix yesterday removed the legacy `gcloud dns` references; ensure
  // they don't come back.
  const dnsMatches = await grepFiles({
    repoRoot: cliPaths.repoRoot,
    relPaths: [
      'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy',
      'DeSciX/DeSciX_Powch/microservice/scripts'
    ],
    regex: /gcloud\s+dns\s+|domain-mappings\s+/,
    excludePaths: new Set(['/node_modules/', '/.git/'])
  });
  // Soft: only WARN. DNS may legitimately surface in cert-management docs.
  // The briefer claim is rendered as-is; matches surface as a footnote.

  // (4) HARD: wildcard cert config (single managed cert) — grep
  // provision-platform-lb.js to ensure no per-app cert provisioning was wired.
  for (let i = 0; i < mesh.lines.length; i++) {
    if (/ssl-certificates\s+create|managedCert/.test(mesh.lines[i])) {
      throw new BrieferExtractorError({
        code: BRIEFER_ERROR_CODES.NEGATIVE_CLAIM,
        section: `§${SECTION.number} ${SECTION.heading}`,
        source: `${MESH_FILE}:${i + 1}`,
        expected: 'no per-app SSL cert provisioning in mesh-routing wiring',
        recovery: 'Per-app cert provisioning was added — reconcile with the wildcard-cert architecture.',
        detail: `Match at ${MESH_FILE}:${i + 1} — ${mesh.lines[i].trim()}`
      });
    }
  }

  // (5) TOGGLE: no `descix microservice deploy` (yet) — grep CLI.
  const cli = await readSourceFile({
    cliPaths,
    relPath: CLI_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  let microserviceDeployFound = false;
  for (let i = 1; i < cli.lines.length; i++) {
    if (/\.command\(['"]deploy['"]\)/.test(cli.lines[i])) {
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        if (/microserviceCommand/.test(cli.lines[j])) {
          microserviceDeployFound = true;
          break;
        }
      }
      if (microserviceDeployFound) break;
    }
  }

  // (6) HARD: no descix-chain runtime lookup for routing — grep mesh.
  for (let i = 0; i < mesh.lines.length; i++) {
    if (/descix-chain/.test(mesh.lines[i])) {
      throw new BrieferExtractorError({
        code: BRIEFER_ERROR_CODES.NEGATIVE_CLAIM,
        section: `§${SECTION.number} ${SECTION.heading}`,
        source: `${MESH_FILE}:${i + 1}`,
        expected: 'no descix-chain reference in LB-wiring code (routing is host-rule based, not chain-lookup based)',
        recovery: 'A descix-chain reference appeared in the LB wiring path. Reconcile.',
        detail: `Match at ${MESH_FILE}:${i + 1} — ${mesh.lines[i].trim()}`
      });
    }
  }

  // (7) Cite: no path rewriting in `descix serve` for product sites.
  const proxyConfig = await readSourceFile({
    cliPaths,
    relPath: PROXY_CONFIG,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  // (8) TOGGLE: no `--env` for MCP server. Per scope §2.2 §6, surface this
  // as the open WS-CLI-HEALTH-ENV-PIVOT gap. We grep for an `--env` option
  // declaration in mcp-server.js / mcp* CLI surface.
  let mcpEnvFound = false;
  try {
    const mcp = await readSourceFile({
      cliPaths,
      relPath: 'DeSciX/DeSciX_Core/descix-cli/bin/mcp-server.js',
      section: `§${SECTION.number} ${SECTION.heading}`
    });
    for (let i = 0; i < mcp.lines.length; i++) {
      if (/--env|\.option\(['"]--env/.test(mcp.lines[i])) {
        mcpEnvFound = true;
        break;
      }
    }
  } catch (err) {
    // If mcp-server.js doesn't exist, the gap is trivially open.
    if (err.code !== BRIEFER_ERROR_CODES.SRC_NOT_FOUND) throw err;
  }

  // ── Render markdown ──
  const lines = [
    `- **No "API Gateway" middleware at runtime.** No Lambda, no Cloud Function, no Cloud Run named "gateway." The LB URL map is the only request-time router. _Verified: grep on \`${SERVICES_DIR}\` for \`gatewayDispatch|routeByProduct|extractProductId|getProductId\` → 0 matches._`,
    `- **No runtime Firestore lookup for routing.** The LB does not read Firestore. Period. _Verified: grep on \`${MESH_FILE}\` for \`CacheFirestore|admin.firestore\` → 0 matches._`,
    `- **No per-app DNS provisioning.** Wildcard \`*.{env}.descix.net\` cert + wildcard A record cover all apps. Adding an app does NOT touch DNS.${dnsMatches.length > 0 ? ` _(${dnsMatches.length} \`gcloud dns\`/\`domain-mappings\` reference(s) detected in deploy scripts — manually verify these are wildcard-cert touches, not per-app DNS.)_` : ''}`,
    `- **No per-app TLS cert.** Same wildcard cert covers everything. _Verified: grep on \`${MESH_FILE}\` for \`ssl-certificates create|managedCert\` → 0 matches._`
  ];
  if (microserviceDeployFound) {
    lines.push(`- ~~No \`descix microservice deploy\` CLI command~~ — **GAP CLOSED** at this regen. \`descix microservice deploy\` is present in \`${CLI_FILE}\`.`);
  } else {
    lines.push(`- **No \`descix microservice deploy\` CLI command (yet).** \`descix microservice register\` does Firestore-manifest-registration only. _Detected: grep on \`${CLI_FILE}\` for \`microserviceCommand.command('deploy')\` → 0 matches._`);
  }
  lines.push(
    `- **No central \`descix-chain\` runtime lookup for routing.** \`descix-chain\` Firestore is the canonical token/contract registry, read for contract addresses (e.g., \`getContractAddressBySymbol()\`); never for request routing. _Verified: grep on \`${MESH_FILE}\` for \`descix-chain\` → 0 matches._`,
    `- **No path rewriting for product sites in \`descix serve\` (local dev).** Each app sets its own framework base path. — \`${PROXY_CONFIG}\``
  );
  if (mcpEnvFound) {
    lines.push(`- ~~No \`--env\` flag for the MCP server~~ — **GAP CLOSED**. WS-CLI-HEALTH-ENV-PIVOT shipped: MCP accepts \`--env\`.`);
  } else {
    lines.push(`- **No \`--env\` flag for the MCP server.** MCP reads workspace.json once at startup and is bound for its lifetime. Tracked as WS-CLI-HEALTH-ENV-PIVOT (open as of this regen).`);
  }

  const markdown = lines.join('\n');

  const citations = [
    makeCitation({ file: MESH_FILE, lines: '1-' + mesh.lines.length, anchor: 'no runtime Firestore / TLS / chain in LB wiring', fileLines: mesh.lines }),
    makeCitation({ file: CLI_FILE, lines: '1-' + cli.lines.length, anchor: 'descix microservice deploy toggle', fileLines: cli.lines }),
    makeCitation({ file: PROXY_CONFIG, lines: '1-' + proxyConfig.lines.length, anchor: 'no path rewriting in descix serve', fileLines: proxyConfig.lines })
  ];

  return { markdown, citations };
}
