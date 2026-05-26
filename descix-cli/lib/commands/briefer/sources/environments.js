/**
 * §2 — Environments extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §2, this extractor reads:
 *   - DEV/DEMO/PROD parallelism — architectural fact distilled from
 *     V2_docs/architecture/platform-runtime-mental-model.md (cite the doc).
 *   - ENV_CONFIG block from update-mesh-routing.js:32-47.
 *   - DEPLOY_ENV-bound-once hard-fail from descix-cloud-core/src/config.js
 *     (locate dynamically; canonical briefer line range is allowed to drift).
 *   - Secret Manager config name pattern from DeSciX_Cloud/CLAUDE.md (cite the
 *     doc since the values are env-keyed and live in env-vars/secrets, not
 *     code) — locate the "Secret Manager — Per-Environment Isolation" table.
 *
 * Optional gcloud verification: list Cloud Function names matching `apiFront-http`
 * and Firestore database names matching `descix-{env}` / `descix`.
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
  number: 2,
  heading: '2. Environments',
  sourceFiles: [
    'DeSciX/V2_docs/architecture/platform-runtime-mental-model.md',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js',
    'DeSciX/DeSciX_Cloud/CLAUDE.md'
  ]
};

const RUNTIME_MM = 'DeSciX/V2_docs/architecture/platform-runtime-mental-model.md';
const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js';
const CONFIG_FILE = 'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js';
const CLOUD_CLAUDE = 'DeSciX/DeSciX_Cloud/CLAUDE.md';

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

  // ── Source 1: ENV_CONFIG in update-mesh-routing.js ──
  const mesh = await readSourceFile({
    cliPaths,
    relPath: MESH_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const envConfigMatch = findInLines({
    lines: mesh.lines,
    regex: /const\s+ENV_CONFIG\s*=\s*\{/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE} (ENV_CONFIG)`,
    expected: 'const ENV_CONFIG = { prod: {...}, demo: {...}, dev: {...} }',
    recovery: `Re-locate the ENV_CONFIG construct in ${MESH_FILE}.`,
    expectedRange: [20, 60]
  });
  const envConfigEnd = findObjectEnd(mesh.lines, envConfigMatch.lineNumber);
  const envConfigBlock = sliceRange(mesh.lines, envConfigMatch.lineNumber, envConfigEnd);

  // ── Source 2: config.js — DEPLOY_ENV-bound-once hard-fail ──
  const config = await readSourceFile({
    cliPaths,
    relPath: CONFIG_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const deployEnvBoundMatch = findInLines({
    lines: config.lines,
    regex: /FATAL:\s*DEPLOY_ENV\s+not\s+set/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CONFIG_FILE} (DEPLOY_ENV bound-once hard-fail)`,
    expected: 'throw with message starting "[CloudConfig] FATAL: DEPLOY_ENV not set"',
    recovery: `Re-locate the DEPLOY_ENV hard-fail in ${CONFIG_FILE}.`
  });

  // ── Source 3: runtime-mental-model.md doc cite (distilled architectural fact) ──
  // We just verify the doc exists + record SHA of the canonical range. The doc
  // is the source for "DEV/DEMO/PROD are fully parallel" because that's an
  // assertion spread across many code paths — too noisy to grep.
  const rmm = await readSourceFile({
    cliPaths,
    relPath: RUNTIME_MM,
    section: `§${SECTION.number} ${SECTION.heading}`
  });

  // ── Source 4: Cloud CLAUDE.md Secret Manager table ──
  const claude = await readSourceFile({
    cliPaths,
    relPath: CLOUD_CLAUDE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const secretTableMatch = findInLines({
    lines: claude.lines,
    regex: /descix_config_demo/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CLOUD_CLAUDE} (Secret Manager Per-Environment Isolation table)`,
    expected: 'descix_config_demo row in the per-env secret table',
    recovery: `Re-locate the Secret Manager isolation table in ${CLOUD_CLAUDE}.`
  });

  // ── Optional gcloud cross-checks ──
  let gcloudCfNote = '';
  const cfResult = tryGcloudJson([
    'functions', 'list', '--gen2', '--format=json'
  ]);
  if (cfResult.ok) {
    const apiFrontCfs = (cfResult.json || [])
      .filter(f => /apiFront-http/.test(f.name || ''))
      .map(f => (f.name || '').split('/').pop());
    if (apiFrontCfs.length > 0) {
      gcloudCfNote = `\n_Live Cloud Functions matching \`apiFront-http\`:_ ${apiFrontCfs.map(n => '`' + n + '`').join(', ')}\n`;
    }
  }
  let gcloudFsNote = '';
  const fsResult = tryGcloudJson([
    'firestore', 'databases', 'list', '--format=json'
  ]);
  if (fsResult.ok) {
    const dbs = (fsResult.json || [])
      .map(d => (d.name || '').split('/').pop())
      .filter(n => /^descix/.test(n));
    if (dbs.length > 0) {
      gcloudFsNote = `\n_Live Firestore databases matching \`descix*\`:_ ${dbs.map(n => '`' + n + '`').join(', ')}\n`;
    }
  }

  // ── Render markdown ──
  const markdown = [
    `DEV / DEMO / PROD are **fully parallel cloud deployments.** They co-exist; PROD does not replace DEMO. — \`${RUNTIME_MM}\``,
    ``,
    `Per env, isolated:`,
    `- Cloud Function: \`apiFront-http-{env}\` (and \`apiFront-http\` for PROD)`,
    `- Firestore DB: \`descix-{env}\` (and \`descix\` for PROD)`,
    `- Secret Manager config: \`descix_config_{env}\` (DEV/DEMO) or \`descix_config\` with version aliases (PROD/PREVIEW) — \`${CLOUD_CLAUDE}:${secretTableMatch.lineNumber}\``,
    `- GCS bucket prefix: \`{env}/\``,
    `- LB host suffix: \`.{env}.descix.net\` for DEV/DEMO, \`.descix.net\` for PROD`,
    ``,
    `ENV_CONFIG (the deploy-time env table — \`${MESH_FILE}:${envConfigMatch.lineNumber}-${envConfigEnd}\`):`,
    ``,
    '```js',
    envConfigBlock,
    '```',
    ``,
    `One process serves exactly one env, determined by \`DEPLOY_ENV\`. The cloud-core bootstrap **hard-fails** at construct time if \`DEPLOY_ENV\` is unset — there is no default. — \`${CONFIG_FILE}:${deployEnvBoundMatch.lineNumber}\``,
    gcloudCfNote,
    gcloudFsNote
  ].join('\n');

  const citations = [
    makeCitation({ file: MESH_FILE, lines: `${envConfigMatch.lineNumber}-${envConfigEnd}`, anchor: 'ENV_CONFIG', fileLines: mesh.lines }),
    makeCitation({ file: CONFIG_FILE, lines: String(deployEnvBoundMatch.lineNumber), anchor: 'DEPLOY_ENV bound-once', fileLines: config.lines }),
    makeCitation({ file: RUNTIME_MM, lines: `1-${rmm.lines.length}`, anchor: 'DEV/DEMO/PROD parallelism', fileLines: rmm.lines }),
    makeCitation({ file: CLOUD_CLAUDE, lines: String(secretTableMatch.lineNumber), anchor: 'Secret Manager per-env isolation', fileLines: claude.lines })
  ];

  return { markdown, citations };
}

function findObjectEnd(lines, startLine) {
  const MAX = Math.min(lines.length, startLine + 50);
  let depth = 0;
  for (let i = startLine - 1; i < MAX; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
  }
  return Math.min(lines.length, startLine + 30);
}
