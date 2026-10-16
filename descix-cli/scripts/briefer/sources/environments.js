/**
 * §2 — Environments extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §2, this extractor reads:
 *   - DEV/PROD parallelism — architectural fact distilled from
 *     V2_docs/architecture/platform-runtime-mental-model.md (cite the doc).
 *   - ENV_CONFIG block from provision-platform-lb.js:32-47.
 *   - DEPLOY_ENV-bound-once hard-fail from descix-cloud-core/src/config.js
 *     (locate dynamically; canonical briefer line range is allowed to drift).
 *   - Secret Manager config name pattern from DeSciX_Cloud/CLAUDE.md (cite the
 *     doc since the values are env-keyed and live in env-vars/secrets, not
 *     code) — locate the "Secret Manager — Per-Environment Isolation" table.
 *
 * Live gcloud verification (required on every env): Cloud Function names matching
 * `apiFront-http` and Firestore database names matching `descix*`.
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
  number: 2,
  heading: '2. Environments',
  sourceFiles: [
    'DeSciX/V2_docs/architecture/platform-runtime-mental-model.md',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js',
    'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js',
    'DeSciX/DeSciX_Cloud/CLAUDE.md'
  ]
};

const RUNTIME_MM = 'DeSciX/V2_docs/architecture/platform-runtime-mental-model.md';
const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js';
const CONFIG_FILE = 'DeSciX/DeSciX_Core/descix-cloud-core/src/config.js';
const CLOUD_CLAUDE = 'DeSciX/DeSciX_Cloud/CLAUDE.md';

export async function extract({ env, cliPaths } = {}) {
  if (!env) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.NOT_IMPLEMENTED,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: 'extractor argument',
      expected: 'env (dev|prod) provided by caller',
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

  // ── Source 1: ENV_CONFIG in provision-platform-lb.js ──
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
    expected: 'const ENV_CONFIG = { prod: {...}, dev: {...} }',
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
  // is the source for "DEV and PROD are fully parallel" because that's an
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
    regex: /descix_config_dev/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CLOUD_CLAUDE} (Secret Manager per-env isolation)`,
    expected: 'the per-env secret statement naming descix_config_dev',
    recovery: `Re-locate the Secret Manager isolation table in ${CLOUD_CLAUDE}.`
  });

  // ── M3: live gcloud probes — required on every env; probeGcloudJson HARD-FAILS otherwise ──
  const cfProbe = await probeGcloudJson({
    command: ['functions', 'list', '--v2', '--format=json'],
    env,
    section: `§${SECTION.number} ${SECTION.heading}`,
    anchor: 'cloud-functions-list',
    expected: 'JSON array of gen2 Cloud Functions for project descix',
    project: (json) => (json || [])
      .map(f => (f.name || '').split('/').pop())
      .filter(n => /apiFront-http/.test(n))
      .sort()
  });
  const apiFrontCfs = cfProbe.facts;
  const gcloudCfNote = `\n_Live Cloud Functions matching \`apiFront-http\` (probed \`${cfProbe.citation.probe}\`, env=\`${env}\`):_ ${apiFrontCfs.length > 0 ? apiFrontCfs.map(n => '\`' + n + '\`').join(', ') : '_(none found)_'}\n`;

  const fsProbe = await probeGcloudJson({
    command: ['firestore', 'databases', 'list', '--format=json'],
    env,
    section: `§${SECTION.number} ${SECTION.heading}`,
    anchor: 'firestore-databases-list',
    expected: 'JSON array of Firestore databases for project descix',
    project: (json) => (json || [])
      .map(d => (d.name || '').split('/').pop())
      .filter(n => /^descix/.test(n))
      .sort()
  });
  const dbs = fsProbe.facts;
  const gcloudFsNote = `\n_Live Firestore databases matching \`descix*\` (probed \`${fsProbe.citation.probe}\`, env=\`${env}\`):_ ${dbs.length > 0 ? dbs.map(n => '\`' + n + '\`').join(', ') : '_(none found)_'}\n`;
  const probeCitations = [cfProbe.citation, fsProbe.citation];

  // ── Render markdown ──
  const markdown = [
    `DEV and PROD are **fully parallel cloud deployments.** They co-exist; each is isolated. — \`${RUNTIME_MM}\``,
    ``,
    `Per env, isolated:`,
    `- Cloud Function: \`apiFront-http-{env}\` (and \`apiFront-http\` for PROD)`,
    `- Firestore DB: \`descix-{env}\` (and \`descix\` for PROD)`,
    `- Secret Manager config: \`descix_config_{env}\` @ \`latest\` per env; PREVIEW uses the shared \`descix_config\` with the version alias \`PREVIEW\` — \`${CLOUD_CLAUDE}:${secretTableMatch.lineNumber}\``,
    `- GCS bucket prefix: \`{env}/\``,
    `- LB host suffix: \`.{env}.descix.net\` for DEV, \`.descix.net\` for PROD`,
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
    makeCitation({ file: RUNTIME_MM, lines: `1-${rmm.lines.length}`, anchor: 'DEV/PROD parallelism', fileLines: rmm.lines }),
    makeCitation({ file: CLOUD_CLAUDE, lines: String(secretTableMatch.lineNumber), anchor: 'Secret Manager per-env isolation', fileLines: claude.lines }),
    ...probeCitations
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
