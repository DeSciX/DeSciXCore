/**
 * §3 — Request routing extractor (M2 implementation).
 *
 * This is THE highest-scrutiny section per the 2026-05-25 audit. The earlier
 * cruft about "Gateway extracts productId + Firestore lookup" lives in V2_docs
 * prose; this extractor pulls the CANONICAL routing model from code:
 *   - update-mesh-routing.js — path rule construction (single URL map, two channels)
 *   - serviceManifestManager.js — proxyToExternalService dispatch
 *   - apiFront.js — invoke() dispatch (internal + external command split)
 *   - app-sdk dev/gateway.js + createViteProxyConfig.js — local dev mirror
 *   - Live `gcloud compute url-maps describe descix-discord-app-lb`
 *     when gcloud is available and --env=demo|prod
 *
 * --env=dev is HARD-REJECTED in this extractor (per scope §2.1) — DEV has no
 * LB URL map, so routing facts from gcloud cannot be verified.
 */
import {
  readSourceFile,
  findInLines,
  makeCitation,
  sliceRange,
  tryGcloudJson
} from '../util/source-reader.js';
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

const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js';
const SMM_FILE = 'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js';
const APIFRONT_FILE = 'DeSciX/DeSciX_Cloud/microservice/services/apiFront.js';
const GATEWAY_FILE = 'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js';
const PROXY_CONFIG_FILE = 'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js';

export async function extract({ env, cliPaths } = {}) {
  if (!env) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NOT_IMPLEMENTED,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'extractor argument',
      expected: 'env (demo|prod) provided by caller',
      recovery: 'Pass {env} from the briefer entry point.'
    });
  }
  // M2 hard-reject --env=dev for the routing extractor specifically.
  // Per scope §2.1: DEV does not have an LB URL map, querying it would
  // produce a malformed briefer. Other extractors that don't need gcloud
  // may still accept dev; this rejection lives in routing.js.
  if (env === 'dev') {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.PARSE_FAIL,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'env argument',
      expected: 'demo or prod (the envs with a live LB URL map)',
      recovery: 'DEV has no LB URL map; use --env=demo or --env=prod for routing extraction. Other sections may run with --env=dev independently.',
      detail: `Got --env=dev. DEV has no descix-discord-app-lb URL map to verify routing against.`
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

  // ── Source 1: update-mesh-routing.js — path rule construction ──
  const mesh = await readSourceFile({
    cliPaths,
    relPath: MESH_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  // ensureServerlessBackend anchor (canonical L82)
  const ensureMatch = findInLines({
    lines: mesh.lines,
    regex: /function\s+ensureServerlessBackend\s*\(/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE}:82-202 (ensureServerlessBackend + path-matcher insertion)`,
    expected: 'function ensureServerlessBackend(serviceName) { ... }',
    recovery: `Re-locate ensureServerlessBackend in ${MESH_FILE} and update the line range.`,
    expectedRange: [60, 130]
  });

  // Per-app path matcher block: look for the first `pathRules` const inside main()
  const pathRulesMatch = findInLines({
    lines: mesh.lines,
    regex: /const\s+pathRules\s*=\s*\[/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE} (pathRules array)`,
    expected: 'const pathRules = [ ... ] (the per-app path-rule list)',
    recovery: `Re-locate the pathRules construct in ${MESH_FILE}.`,
    expectedRange: [120, 200]
  });

  // Look for the decentralized /api/* rule + command-broker /apifront/* rule
  const decentralizedApiMatch = findInLines({
    lines: mesh.lines,
    regex: /`\/api\/v1\/\$\{app\}`/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE} (decentralized /api/v1/{app}/* rule)`,
    expected: `'/api/v1/${'${app}'}' in pathRules`,
    recovery: `Re-locate the decentralized API path rule.`
  });
  const apiFrontRuleMatch = findInLines({
    lines: mesh.lines,
    regex: /['"`]\/apifront['"`]/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE} (command-broker /apifront/* rule)`,
    expected: `'/apifront' in pathRules`,
    recovery: `Re-locate the /apifront command-broker rule.`
  });

  // ── Source 2: serviceManifestManager.js — proxyToExternalService ──
  const smm = await readSourceFile({
    cliPaths,
    relPath: SMM_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  const proxyMatch = findInLines({
    lines: smm.lines,
    regex: /export\s+async\s+function\s+proxyToExternalService\s*\(/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${SMM_FILE}:685-765 (proxyToExternalService)`,
    expected: 'export async function proxyToExternalService(commandName, params, sessionToken = null, req = null)',
    recovery: `Re-locate proxyToExternalService in ${SMM_FILE}.`,
    expectedRange: [650, 800]
  });

  // ── Source 3: apiFront.js — invoke() dispatch ──
  const apiFront = await readSourceFile({
    cliPaths,
    relPath: APIFRONT_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  const invokeMatch = findInLines({
    lines: apiFront.lines,
    regex: /static\s+async\s+invoke\s*\(\s*commandName/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${APIFRONT_FILE}:83-186 (CommandHandler.invoke + _invokeExternalCommand)`,
    expected: 'static async invoke(commandName, params, req, res)',
    recovery: `Re-locate CommandHandler.invoke in ${APIFRONT_FILE}.`,
    expectedRange: [50, 200]
  });
  const externalDispatchMatch = findInLines({
    lines: apiFront.lines,
    regex: /static\s+async\s+_invokeExternalCommand\s*\(/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${APIFRONT_FILE} (_invokeExternalCommand)`,
    expected: 'static async _invokeExternalCommand(commandName, params, req)',
    recovery: `Re-locate _invokeExternalCommand in ${APIFRONT_FILE}.`
  });

  // ── Source 4: app-sdk gateway.js + createViteProxyConfig.js ──
  const gateway = await readSourceFile({
    cliPaths,
    relPath: GATEWAY_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const proxyConfig = await readSourceFile({
    cliPaths,
    relPath: PROXY_CONFIG_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  // ── Optional: live gcloud probe (best-effort, never hard-fails) ──
  let gcloudBlock = '';
  const gcloudResult = tryGcloudJson([
    'compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'
  ]);
  if (gcloudResult.ok) {
    const hostRuleCount = (gcloudResult.json.hostRules || []).length;
    const pathMatcherCount = (gcloudResult.json.pathMatchers || []).length;
    const fingerprint = gcloudResult.json.fingerprint || 'unknown';
    gcloudBlock = [
      '',
      '**Live LB state** (live `gcloud compute url-maps describe descix-discord-app-lb` at regen time):',
      `- Host rules: \`${hostRuleCount}\``,
      `- Path matchers: \`${pathMatcherCount}\``,
      `- URL map fingerprint: \`${fingerprint}\``,
      ''
    ].join('\n');
  } else {
    gcloudBlock = [
      ``,
      `_Live LB verification block skipped: \`gcloud compute url-maps describe descix-discord-app-lb\` unavailable in this environment (${shortenGcloudErr(gcloudResult.error)})._`,
      ``
    ].join('\n');
  }

  // Slice the pathRules block for embedding
  const pathRulesEnd = findArrayEnd(mesh.lines, pathRulesMatch.lineNumber);
  const pathRulesBlock = sliceRange(mesh.lines, pathRulesMatch.lineNumber, pathRulesEnd);

  // ── Render the section markdown ──
  const markdown = [
    `A single global GCP URL map \`descix-discord-app-lb\` is the runtime router. Per-app host rules + per-app path matchers route within \`{app}.{env}.descix.net\`. **No runtime "Gateway" middleware. No runtime Firestore lookup for routing.**`,
    ``,
    `Per-app path matcher (\`matcher-{app}-{env}\`):`,
    ``,
    `- \`/api/v1/{app}/*\` → \`{app}-{env}-backend\` (Cloud Run NEG, the app's own microservice). Prefix rewritten to \`/api/\`. **Decentralized path.** — \`${MESH_FILE}:${decentralizedApiMatch.lineNumber}\``,
    `- \`/api/*\` → \`{app}-{env}-backend\` (same — the app owns \`/api/*\` on its own host).`,
    `- \`/apifront/*\`, \`/mcp/*\`, \`/api/v1/core/*\` → env-wide \`{env}-api-backend\` (central Cloud Function \`apiFront-http-{env}\`). **Command-broker path.** — \`${MESH_FILE}:${apiFrontRuleMatch.lineNumber}\``,
    `- \`/\` and unmatched \`/*\` → GCS bucket \`{env}-assets-bucket\`, rewritten to \`/{env}/{app}/site/\`.`,
    ``,
    `Path-rule construction (verbatim from \`${MESH_FILE}\` L${pathRulesMatch.lineNumber}-${pathRulesEnd}):`,
    ``,
    '```js',
    pathRulesBlock,
    '```',
    ``,
    `The command-broker path (\`/apifront\`) is the channel where the central Cloud Function reads in-memory \`externalCommandRegistry\` (sourced from Firestore \`ServiceManifests\`) and dispatches commands to other microservices via \`proxyToExternalService()\` — HTTPS POST to \`https://{service.domain}/api/{commandName}\`. — \`${SMM_FILE}:${proxyMatch.lineNumber}\`, \`${APIFRONT_FILE}:${invokeMatch.lineNumber} (invoke), ${externalDispatchMatch.lineNumber} (_invokeExternalCommand)\``,
    gcloudBlock,
    `**Local \`descix serve\` mirror:** the dev gateway in \`${GATEWAY_FILE}\` and proxy rules in \`${PROXY_CONFIG_FILE}\` mirror the production LB path-rule shape. Port-based origin isolation in local dev = domain isolation in production. Each app sets its own framework base path; the gateway does NOT rewrite paths for product sites.`
  ].join('\n');

  const citations = [
    makeCitation({ file: MESH_FILE, lines: `${ensureMatch.lineNumber}-${pathRulesEnd}`, anchor: 'ensureServerlessBackend + pathRules', fileLines: mesh.lines }),
    makeCitation({ file: MESH_FILE, lines: String(decentralizedApiMatch.lineNumber), anchor: 'decentralized /api/v1/{app}', fileLines: mesh.lines }),
    makeCitation({ file: MESH_FILE, lines: String(apiFrontRuleMatch.lineNumber), anchor: 'command-broker /apifront', fileLines: mesh.lines }),
    makeCitation({ file: SMM_FILE, lines: String(proxyMatch.lineNumber), anchor: 'proxyToExternalService', fileLines: smm.lines }),
    makeCitation({ file: APIFRONT_FILE, lines: String(invokeMatch.lineNumber), anchor: 'CommandHandler.invoke', fileLines: apiFront.lines }),
    makeCitation({ file: APIFRONT_FILE, lines: String(externalDispatchMatch.lineNumber), anchor: '_invokeExternalCommand', fileLines: apiFront.lines }),
    makeCitation({ file: GATEWAY_FILE, lines: `1-${gateway.lines.length}`, anchor: 'local serve gateway', fileLines: gateway.lines }),
    makeCitation({ file: PROXY_CONFIG_FILE, lines: `1-${proxyConfig.lines.length}`, anchor: 'vite proxy rules', fileLines: proxyConfig.lines })
  ];

  return { markdown, citations };
}

/**
 * Walk forward from `const pathRules = [` until the matching `];`.
 * Bounded to 100 lines so a pathological refactor doesn't drag huge swaths.
 */
function findArrayEnd(lines, startLine) {
  const MAX = Math.min(lines.length, startLine + 100);
  let depth = 0;
  for (let i = startLine - 1; i < MAX; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
  }
  return Math.min(lines.length, startLine + 50);
}

function shortenGcloudErr(msg) {
  if (!msg) return 'unknown error';
  return msg.split('\n')[0].slice(0, 120);
}
