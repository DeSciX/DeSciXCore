/**
 * §5 — Entitlements & Products Firestore extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §5 + M2 dispatch §6.7 extension:
 *   - Products schema fields + readers — cite hydrateCommunityIdFromProducts
 *     in @descix/platform-api/src/entitlements/index.js + the apiFront
 *     middleware that invokes it (communityManagement.js re-export site).
 *   - Writers — grep DeSciX_Cloud/microservice/admin/ for Products write
 *     patterns (bootstrap.js hydrate-env + confirm_site_deploy).
 *   - App-level config layer (§6.7 extension) — cite the resolver chain
 *     in geminiInteractions.js::resolveModelThinkingPair: request level → kb_model_override
 *     → default_app_model → levelConfig → DEFAULT_AI_MODEL.
 *
 * NO direct @google-cloud/firestore or @pinecone-database/pinecone imports
 * (AC-7 anti-regression). All Firestore touches in the briefer code go
 * through apifront or @descix/cloud-core wrappers.
 */
import {
  readSourceFile,
  findInLines,
  makeCitation,
  grepFiles,
  probeFirestoreRest
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';
// The (model, thinking) precedence chain in words, from its ONE owner. The briefer
// QUOTES the served contract rather than paraphrasing it — a briefer paraphrase of a
// chain is exactly how the old five-step list outlived the code it described.
import { MODEL_THINKING_CHAIN } from '@descix/platform-api/mcp-tools';

export const SECTION = {
  number: 5,
  heading: '5. Entitlements & Products Firestore',
  sourceFiles: [
    'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js',
    'DeSciX/DeSciX_Cloud/microservice/services/communityManagement.js',
    'DeSciX/DeSciX_Cloud/microservice/admin/bootstrap.js',
    'DeSciX/DeSciX_Cloud/microservice/services/geminiInteractions.js'
  ]
};

const ENTITLEMENTS_FILE = 'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js';
const CM_FILE = 'DeSciX/DeSciX_Cloud/microservice/services/communityManagement.js';
const BOOTSTRAP_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/bootstrap.js';
const GEMINI_FILE = 'DeSciX/DeSciX_Cloud/microservice/services/geminiInteractions.js';

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

  // ── Source 1: entitlements/index.js — hydrateCommunityIdFromProducts ──
  const ent = await readSourceFile({
    cliPaths,
    relPath: ENTITLEMENTS_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const hydrateMatch = findInLines({
    lines: ent.lines,
    regex: /export\s+async\s+function\s+hydrateCommunityIdFromProducts\b/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${ENTITLEMENTS_FILE} (hydrateCommunityIdFromProducts)`,
    expected: 'export async function hydrateCommunityIdFromProducts(params)',
    recovery: `Re-locate hydrateCommunityIdFromProducts in ${ENTITLEMENTS_FILE}.`
  });

  // ── Source 2: communityManagement.js — re-export site ──
  const cm = await readSourceFile({
    cliPaths,
    relPath: CM_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const reExportMatch = findInLines({
    lines: cm.lines,
    regex: /export\s*\{\s*hydrateCommunityIdFromProducts\s*\}/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CM_FILE} (hydrate re-export)`,
    expected: 'export { hydrateCommunityIdFromProducts }',
    recovery: `Verify ${CM_FILE} still re-exports hydrateCommunityIdFromProducts.`
  });

  // ── Source 3: bootstrap.js — hydrate-env writer ──
  const bootstrap = await readSourceFile({
    cliPaths,
    relPath: BOOTSTRAP_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const hydrateEnvMatch = findInLines({
    lines: bootstrap.lines,
    regex: /hydrate-env|hydrateEnv|hydrate_env/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${BOOTSTRAP_FILE} (hydrate-env writer)`,
    expected: 'hydrate-env subcommand or hydrateEnv function declaration',
    recovery: `Re-locate the hydrate-env writer in ${BOOTSTRAP_FILE}.`
  });

  // ── Source 4: geminiInteractions.js — the (model, thinking) pair owner (§6.7 link) ──
  const gemini = await readSourceFile({
    cliPaths,
    relPath: GEMINI_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const resolverMatch = findInLines({
    lines: gemini.lines,
    regex: /export\s+function\s+resolveModelThinkingPair\b/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${GEMINI_FILE} (resolveModelThinkingPair)`,
    expected: 'export function resolveModelThinkingPair(...)',
    recovery: `Re-locate resolveModelThinkingPair in ${GEMINI_FILE}.`
  });

  // ── Optional grep: count Products readers across services/ ──
  let runtimeReadersList = '';
  const readers = await grepFiles({
    repoRoot: cliPaths.repoRoot,
    relPaths: ['DeSciX/DeSciX_Cloud/microservice/services'],
    regex: /Products\.doc\(|collection\(['"]Products['"]\)|getProductContext/,
    excludePaths: new Set(['/node_modules/', '/.git/'])
  });
  if (readers.length > 0) {
    const unique = [...new Set(readers.map(r => r.file))].slice(0, 8);
    runtimeReadersList = unique.map(f => `  - \`${f}\``).join('\n');
  }

  // ── M3: live Firestore Products probe (HARD-FAIL on demo/prod, skipped on dev) ──
  // Uses Firestore REST API via gcloud-derived access token. Per AC-7
  // anti-regression: no @google-cloud/firestore import — this is a different
  // API surface (REST + gcloud-CLI token), explicitly permitted.
  const probeCitations = [];
  let productsLiveNote = '';
  if (env === 'dev') {
    productsLiveNote = '\n_DEV: Firestore probe skipped (local dev — no cloud Firestore for the descix-dev database in this regen scope)._\n';
  } else {
    const productsProbe = await probeFirestoreRest({
      dbPath: `descix-${env}/documents/Products`,
      query: { pageSize: 200, 'mask.fieldPaths': 'app_id' },
      env,
      section: `§${SECTION.number} ${SECTION.heading}`,
      anchor: 'products-collection-list',
      expected: `Firestore Products list for env=${env}`,
      recovery: `Run 'gcloud auth login' and ensure the account has Firestore read scope. The Products collection cross-check is required for env=${env}.`
    });
    const docs = (productsProbe.json && productsProbe.json.documents) || [];
    const names = docs
      .map(d => (d.name || '').split('/').pop())
      .filter(Boolean)
      .sort();
    const sample = names.slice(0, 8);
    productsLiveNote = [
      '',
      `**Live Products collection** (probed \`Firestore REST listDocuments\` against \`descix-${env}/documents/Products\`):`,
      `- Docs returned: \`${names.length}\` (pageSize=200; further pages not enumerated this milestone)`,
      `- Sample app_ids: ${sample.length > 0 ? sample.map(n => '\`' + n + '\`').join(', ') : '_(none)_'}${names.length > sample.length ? ` (+ ${names.length - sample.length} more)` : ''}`,
      ''
    ].join('\n');
    probeCitations.push(productsProbe.citation);
  }

  // ── Render markdown ──
  const markdown = [
    `\`Products/{app_id}\` in \`descix-{env}\` Firestore holds:`,
    `- \`productPath\`: \`Community/{community_id}/Apps/{app_id}\` (operational path)`,
    `- \`gcsPath\`: \`gs://descix-assets-public/{env}/{app_id}/\``,
    `- \`ip_site_gcs_path_url\`: subdomain URL (set by \`confirm_site_deploy\` AFTER site deploy)`,
    `- \`community_id\` (operational metadata)`,
    `- \`type\`, \`price\`, \`metadata\``,
    ``,
    `**Readers at runtime:** \`hydrateCommunityIdFromProducts()\` middleware (canonical at \`${ENTITLEMENTS_FILE}:${hydrateMatch.lineNumber}\`, re-exported at \`${CM_FILE}:${reExportMatch.lineNumber}\`), purchase / entitlement handlers, app-metadata handlers. **ALL AT THE APIFRONT-OR-DOWNSTREAM LAYER.** **NEVER AT THE LB.**`,
    ...(runtimeReadersList ? ['', `_Grep of \`services/\` for Products readers:_`, runtimeReadersList] : []),
    ``,
    `**Writers:** \`${BOOTSTRAP_FILE}\` \`hydrate-env\` (\`:${hydrateEnvMatch.lineNumber}\`), \`confirm_site_deploy\`, migration scripts.`,
    ``,
    `**Consumer at deploy time:** Products drives bootstrap; platform peer hosts are configured in \`provision-platform-lb.js\` (\`PLATFORM_PEER_APPS\`), not read from Products at deploy time.`,
    ``,
    `### App-level config layer (§6.7 — added 2026-05-26)`,
    ``,
    `App-level and KB-level config flows from Firestore (\`Community/{c}/Apps/{a}\` for \`default_app_model\`, \`Community/{c}/Apps/{a}/KnowledgeBases/{k}\` for \`kb_model_override\`) into \`resolveModelThinkingPair()\` at \`${GEMINI_FILE}:${resolverMatch.lineNumber}\` — the ONE owner of the (model, thinking) pair. Both fields are **opt-in** — null means the tier below applies.`,
    ``,
    MODEL_THINKING_CHAIN,
    ``,
    `\`app.default_app_model\` no longer shadows an intelligence_level named on the request: a level names a (model, thinking) PAIR and outranks it. It still outranks the KB's own configured level and the platform default. Apps that want per-level routing leave \`default_app_model = null/absent\`.`,
    productsLiveNote
  ].join('\n');

  const citations = [
    makeCitation({ file: ENTITLEMENTS_FILE, lines: String(hydrateMatch.lineNumber), anchor: 'hydrateCommunityIdFromProducts (canonical)', fileLines: ent.lines }),
    makeCitation({ file: CM_FILE, lines: String(reExportMatch.lineNumber), anchor: 'hydrate re-export', fileLines: cm.lines }),
    makeCitation({ file: BOOTSTRAP_FILE, lines: String(hydrateEnvMatch.lineNumber), anchor: 'hydrate-env writer', fileLines: bootstrap.lines }),
    makeCitation({ file: GEMINI_FILE, lines: String(resolverMatch.lineNumber), anchor: 'resolveModelThinkingPair (app-level config bridge)', fileLines: gemini.lines }),
    ...probeCitations
  ];

  return { markdown, citations };
}
