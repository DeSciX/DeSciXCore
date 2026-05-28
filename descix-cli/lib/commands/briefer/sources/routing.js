/**
 * §3 — Request routing extractor (M2 implementation).
 *
 * This is THE highest-scrutiny section per the 2026-05-25 audit. The earlier
 * cruft about "Gateway extracts productId + Firestore lookup" lives in V2_docs
 * prose; this extractor pulls the CANONICAL routing model from code:
 *   - provision-platform-lb.js — platform LB (core NEG + apex/peer hosts)
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
  probeGcloudJson
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 3,
  heading: '3. Request routing — the single canonical model',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js',
    'DeSciX/DeSciX_Cloud/microservice/services/serviceManifestManager.js',
    'DeSciX/DeSciX_Cloud/microservice/services/apiFront.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/gateway.js',
    'DeSciX/DeSciX_Core/descix-app-sdk/src/dev/createViteProxyConfig.js'
  ]
};

const LB_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js';
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

  // ── Source 1: provision-platform-lb.js — platform LB standup ──
  const lb = await readSourceFile({
    cliPaths,
    relPath: LB_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  const ensureCoreNegMatch = findInLines({
    lines: lb.lines,
    regex: /function\s+ensureCoreNeg\s*\(/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${LB_FILE} (ensureCoreNeg)`,
    expected: 'function ensureCoreNeg(envCfg, dryRun)',
    recovery: `Re-locate ensureCoreNeg in ${LB_FILE}.`,
    expectedRange: [80, 140]
  });

  const singletonMatcherMatch = findInLines({
    lines: lb.lines,
    regex: /function\s+buildSingletonMatcher\s*\(/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${LB_FILE} (buildSingletonMatcher)`,
    expected: 'function buildSingletonMatcher(...)',
    recovery: `Re-locate buildSingletonMatcher in ${LB_FILE}.`
  });

  const apiFrontRuleMatch = findInLines({
    lines: lb.lines,
    regex: /['"`]\/apifront['"`]/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${LB_FILE} (command-broker /apifront rule)`,
    expected: `'/apifront' in buildCommandBrokerRules`,
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

  // ── M3: live gcloud probe (HARD-FAIL on demo/prod, skipped on dev) ──
  // routing.js already hard-rejects --env=dev above (no LB URL map in DEV),
  // so this probe ALWAYS runs for demo/prod and MUST succeed. probeGcloudJson
  // throws BRIEFER-GCLOUD-FAIL with an actionable recovery message otherwise.
  let gcloudBlock = '';
  let gcloudCitation = null;
  const lbProbe = await probeGcloudJson({
    command: ['compute', 'url-maps', 'describe', 'descix-discord-app-lb', '--format=json'],
    env,
    section: `§${SECTION.number} ${SECTION.heading}`,
    anchor: 'lb-url-map',
    expected: 'JSON describing the descix-discord-app-lb URL map',
    recovery: `Run 'gcloud auth login' and 'gcloud config set project descix'. If the URL map does not exist for env=${env}, that is a real platform-state issue — investigate before regenerating the briefer.`
  });
  // lbProbe is non-null for demo/prod (dev is rejected upstream).
  const hostRuleCount = (lbProbe.json.hostRules || []).length;
  const pathMatcherCount = (lbProbe.json.pathMatchers || []).length;
  const fingerprint = lbProbe.json.fingerprint || 'unknown';
  gcloudBlock = [
    '',
    '**Live LB state** (live `gcloud compute url-maps describe descix-discord-app-lb` at regen time):',
    `- Host rules: \`${hostRuleCount}\``,
    `- Path matchers: \`${pathMatcherCount}\``,
    `- URL map fingerprint: \`${fingerprint}\``,
    `- Probed: \`${lbProbe.citation.probe}\` (env=\`${env}\`)`,
    ''
  ].join('\n');
  gcloudCitation = lbProbe.citation;

  const singletonBlockEnd = findFunctionEnd(lb.lines, singletonMatcherMatch.lineNumber);
  const singletonBlock = sliceRange(lb.lines, singletonMatcherMatch.lineNumber, singletonBlockEnd);

  // ── Render the section markdown ──
  const markdown = [
    `Broker-first mesh (WS-MESH-BROKER-ONLY): sites call \`/apifront\`; Core validates entitlements and dispatches via Firestore \`ServiceManifests\`. **No NEG on routine deploy for non-core apps.** No runtime LB lookup for new apps.`,
    ``,
    `Platform LB (\`descix-discord-app-lb\`) is provisioned at platform standup by \`deploy-backend-env.sh\` → \`provision-platform-lb.js\` (re-run after \`deploy-service-env.sh powch\` for powch NEG):`,
    ``,
    `- **daita** broker NEG: \`apifront-http-{env}-neg\` → \`{env}-api-backend\` → Cloud Function \`apiFront-http-{env}\` — \`${LB_FILE}:${ensureCoreNegMatch.lineNumber}\``,
    `- Apex singleton (\`daita\`): \`demo.descix.net\` / \`descix.net\` → GCS \`/{env}/daita/site/\` + \`/apifront\`, \`/mcp\`, \`/api\` → daita broker — \`${LB_FILE}:${singletonMatcherMatch.lineNumber}\``,
    `- **powch** core platform NEG: \`powch-{env}-neg\` → \`powch-{env}-backend\` → Cloud Run \`powch-{env}\` — \`${LB_FILE} (ensureCloudRunAppNeg)\``,
    `- Platform peer host (\`powch.{env}.descix.net\`): GCS site + \`/apifront\`, \`/mcp\` → daita broker; \`/api/*\` → powch NEG`,
    ``,
    `Singleton matcher construction (verbatim from \`${LB_FILE}\` L${singletonMatcherMatch.lineNumber}-${singletonBlockEnd}):`,
    ``,
    '```js',
    singletonBlock,
    '```',
    ``,
    `Runtime dispatch: central CF reads \`externalCommandRegistry\` and calls \`proxyToExternalService()\`. — \`${SMM_FILE}:${proxyMatch.lineNumber}\`, \`${APIFRONT_FILE}:${invokeMatch.lineNumber} (invoke), ${externalDispatchMatch.lineNumber} (_invokeExternalCommand)\``,
    gcloudBlock,
    `**Local \`descix serve\` mirror:** \`${GATEWAY_FILE}\` + \`${PROXY_CONFIG_FILE}\` proxy \`/apifront\`, \`/api\`, \`/mcp\` to Core. Product sites at \`/p/{appId}/\` or static plugin routes.`
  ].join('\n');

  const citations = [
    makeCitation({ file: LB_FILE, lines: `${ensureCoreNegMatch.lineNumber}-${singletonBlockEnd}`, anchor: 'ensureCoreNeg + buildSingletonMatcher', fileLines: lb.lines }),
    makeCitation({ file: LB_FILE, lines: String(apiFrontRuleMatch.lineNumber), anchor: 'command-broker /apifront', fileLines: lb.lines }),
    makeCitation({ file: SMM_FILE, lines: String(proxyMatch.lineNumber), anchor: 'proxyToExternalService', fileLines: smm.lines }),
    makeCitation({ file: APIFRONT_FILE, lines: String(invokeMatch.lineNumber), anchor: 'CommandHandler.invoke', fileLines: apiFront.lines }),
    makeCitation({ file: APIFRONT_FILE, lines: String(externalDispatchMatch.lineNumber), anchor: '_invokeExternalCommand', fileLines: apiFront.lines }),
    makeCitation({ file: GATEWAY_FILE, lines: `1-${gateway.lines.length}`, anchor: 'local serve gateway', fileLines: gateway.lines }),
    makeCitation({ file: PROXY_CONFIG_FILE, lines: `1-${proxyConfig.lines.length}`, anchor: 'vite proxy rules', fileLines: proxyConfig.lines }),
    gcloudCitation
  ].filter(Boolean);

  return { markdown, citations };
}

/**
 * Walk forward from `const pathRules = [` until the matching `];`.
 * Bounded to 100 lines so a pathological refactor doesn't drag huge swaths.
 */
function findFunctionEnd(lines, startLine) {
  const MAX = Math.min(lines.length, startLine + 80);
  let depth = 0;
  let started = false;
  for (let i = startLine - 1; i < MAX; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') {
        depth--;
        if (started && depth === 0) return i + 1;
      }
    }
  }
  return Math.min(lines.length, startLine + 40);
}

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
