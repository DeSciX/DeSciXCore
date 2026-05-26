/**
 * §1 — Identifiers & invariants extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §1, this extractor reads:
 *   - Domain pattern from update-mesh-routing.js:120 (host construction)
 *   - GCS path pattern from update-mesh-routing.js:123 (pathPrefix)
 *   - product_id === app_id invariant from hydrateUtils.js
 *   - Agentic-app / communities-as-apps invariant from the BEAST CEO record
 *     `apps/unk-beast/kb/Org/agentic-app-invariant-2026-05-26.jsonl`
 *   - AI model inheritance order from geminiInteractions.js::resolveModelName()
 *
 * Extraction method: regex+checksum-of-surrounding-lines (NOT AST).
 * Per scope §9.1 third-order question, decision documented 2026-05-26: regex
 * keeps the CLI dep-light; AST may be added per-extractor later if needed.
 *
 * HARD-FAIL behavior:
 *   - Missing source file → BRIEFER-SRC-NOT-FOUND
 *   - Regex pattern doesn't match → BRIEFER-SRC-NOT-FOUND
 *   - Pattern matches outside expected line range → BRIEFER-PARSE-FAIL
 *   - BEAST agentic-app record missing → BRIEFER-SRC-NOT-FOUND (a hard
 *     invariant — this is the CEO-broadcast canonical record)
 */
import {
  readSourceFile,
  findInLines,
  makeCitation,
  sliceRange
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 1,
  heading: '1. Identifiers & invariants',
  sourceFiles: [
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js',
    'DeSciX/DeSciX_Cloud/microservice/services/geminiInteractions.js',
    'apps/unk-beast/kb/Org/agentic-app-invariant-2026-05-26.jsonl'
  ]
};

const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js';
const HYDRATE_FILE = 'DeSciX/DeSciX_Core/descix-platform-api/src/entitlements/index.js';
const GEMINI_FILE = 'DeSciX/DeSciX_Cloud/microservice/services/geminiInteractions.js';
const AGENTIC_RECORD = 'apps/unk-beast/kb/Org/agentic-app-invariant-2026-05-26.jsonl';

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

  // ── Source 1: update-mesh-routing.js — domain + gcsPath patterns ──
  const mesh = await readSourceFile({
    cliPaths,
    relPath: MESH_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  // Host pattern: line 120 in the canonical briefer. Use a flexible regex —
  // accept the construct even if it moves a few lines up/down, but record
  // the *actual* line in the citation so --check catches movement via SHA.
  const hostMatch = findInLines({
    lines: mesh.lines,
    regex: /const\s+host\s*=\s*env\s*===\s*['"]prod['"]\s*\?/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE}:120 (host pattern)`,
    expected: `const host = env === 'prod' ? ... : ... construct`,
    recovery: `Re-locate the host construct in ${MESH_FILE} and update sources/identifiers.js.`,
    expectedRange: [100, 140]   // slack around canonical L120
  });

  // gcsPath pattern: line 123 in the canonical briefer.
  const gcsMatch = findInLines({
    lines: mesh.lines,
    regex: /const\s+pathPrefix\s*=\s*`\/\$\{env\}\/\$\{app\}\/site`/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE}:123 (gcsPath pattern)`,
    expected: 'const pathPrefix = `/${env}/${app}/site` (template literal)',
    recovery: `Re-locate the gcsPath construct in ${MESH_FILE}.`,
    expectedRange: [100, 140]
  });

  // ── Source 2: hydrateUtils.js — product_id===app_id invariant ──
  const hydrate = await readSourceFile({
    cliPaths,
    relPath: HYDRATE_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  const hydrateMatch = findInLines({
    lines: hydrate.lines,
    regex: /hydrateCommunityIdFromProducts/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${HYDRATE_FILE} (hydrateCommunityIdFromProducts definition)`,
    expected: 'hydrateCommunityIdFromProducts function declaration',
    recovery: `Verify hydrateCommunityIdFromProducts is still exported from ${HYDRATE_FILE}.`
  });

  // ── Source 3: geminiInteractions.js — resolveModelName + inheritance order ──
  const gemini = await readSourceFile({
    cliPaths,
    relPath: GEMINI_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  const resolverMatch = findInLines({
    lines: gemini.lines,
    regex: /export\s+function\s+resolveModelName\b/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${GEMINI_FILE} (resolveModelName)`,
    expected: 'export function resolveModelName(...)',
    recovery: `resolveModelName has been moved or renamed. Re-locate and update the extractor.`
  });
  // Capture the resolver body — from the export to the next closing brace at
  // column 0. We'll scan forward a bounded window and slice for the briefer.
  const resolverEnd = findResolverEnd(gemini.lines, resolverMatch.lineNumber);
  const resolverBody = sliceRange(gemini.lines, resolverMatch.lineNumber, resolverEnd);

  // ── Source 4: BEAST CEO record — agentic-app invariant ──
  const beast = await readSourceFile({
    cliPaths,
    relPath: AGENTIC_RECORD,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  // The record is JSONL; the canonical claim is one of the question/answer
  // chunks. We don't parse the JSONL — we just verify the record EXISTS and
  // SHA the whole file for citation purposes. The CEO broadcast title is the
  // contract; the briefer prose embeds it verbatim.
  const beastSha = makeCitation({
    file: AGENTIC_RECORD,
    lines: `1-${beast.lines.length}`,
    anchor: 'AGENTIC-APP-INHERITANCE-INVARIANT-2026-05-26',
    fileLines: beast.lines
  }).sha;

  // ── Render the briefer markdown ──
  const hostLine = mesh.lines[hostMatch.lineNumber - 1].trim();
  const gcsLine = mesh.lines[gcsMatch.lineNumber - 1].trim();

  const markdown = [
    `- **Apps are the central unit. Everything is an agentic app.** Communities are themselves agentic apps that share IP with other apps in the same community. The platform is fundamentally an agentic-app store, not a generic SaaS platform with apps bolted on. — \`${AGENTIC_RECORD}\` (CEO broadcast \`AGENTIC-APP-INHERITANCE-INVARIANT-2026-05-26\`, sha=\`${beastSha}\`)`,
    `- \`app_id\` is a globally unique slug (e.g., \`daita\`, \`powch\`, \`egpt\`). Same value across DEV, DEMO, PROD. Never contains the environment.`,
    `- \`community_id\` is operational metadata stored INSIDE \`Products/{app_id}\`. Never parsed from URL. Never trusted from client.`,
    `- \`product_id === app_id\` — the same opaque slug. Server re-derives \`community_id\` from \`Products/{app_id}\` via \`hydrateCommunityIdFromProducts()\`. — \`${HYDRATE_FILE}:${hydrateMatch.lineNumber}\``,
    `- Domain pattern: \`{app_id}.{env}.descix.net\` for DEV/DEMO; \`{app_id}.descix.net\` for PROD. — \`${MESH_FILE}:${hostMatch.lineNumber}\``,
    '  ```js',
    `  ${hostLine}`,
    '  ```',
    `- GCS path: \`{env}/{app_id}/site/\`. Flat — no community in the path. — \`${MESH_FILE}:${gcsMatch.lineNumber}\``,
    '  ```js',
    `  ${gcsLine}`,
    '  ```',
    `- Wildcard TLS cert: \`*.descix.net\` plus per-env wildcards. ONE cert. No per-app cert provisioning.`,
    `- **AI model inheritance order: per-request \`options.model\` → \`kb.kb_model_override\` (opt-in) → \`app.default_app_model\` (opt-in) → \`levelConfig.model\` (platform per-level) → \`utils.DEFAULT_AI_MODEL\` (platform-wide fallback).** Resolver: \`resolveModelName()\` in \`${GEMINI_FILE}:${resolverMatch.lineNumber}\`. KB override and app default are opt-in — null means platform per-level applies.`,
    '  ```js',
    indentBlock(resolverBody, '  '),
    '  ```'
  ].join('\n');

  const citations = [
    makeCitation({ file: MESH_FILE, lines: String(hostMatch.lineNumber), anchor: 'host pattern', fileLines: mesh.lines }),
    makeCitation({ file: MESH_FILE, lines: String(gcsMatch.lineNumber), anchor: 'gcsPath pattern', fileLines: mesh.lines }),
    makeCitation({ file: HYDRATE_FILE, lines: String(hydrateMatch.lineNumber), anchor: 'hydrateCommunityIdFromProducts', fileLines: hydrate.lines }),
    makeCitation({ file: GEMINI_FILE, lines: `${resolverMatch.lineNumber}-${resolverEnd}`, anchor: 'resolveModelName', fileLines: gemini.lines }),
    { file: AGENTIC_RECORD, lines: `1-${beast.lines.length}`, anchor: 'AGENTIC-APP-INHERITANCE-INVARIANT-2026-05-26', sha: beastSha }
  ];

  return { markdown, citations };
}

/**
 * Walk forward from the `export function resolveModelName` line until we hit
 * a closing brace at column 0. Bounded scan window of 80 lines so a runaway
 * regex on a refactored file doesn't drag the whole file into the briefer.
 */
function findResolverEnd(lines, startLine) {
  const MAX = Math.min(lines.length, startLine + 80);
  for (let i = startLine; i < MAX; i++) {
    if (lines[i] === '}') return i + 1;
  }
  // If we don't find a clean close, fall back to startLine+30 — we want some
  // body in the briefer even if the resolver was reformatted; --check will
  // catch the SHA change.
  return Math.min(lines.length, startLine + 30);
}

function indentBlock(block, indent) {
  return block.split('\n').map(l => indent + l).join('\n');
}
