/**
 * §4 — Microservice deploy extractor (M2 implementation).
 *
 * Per WS-DESCIX-BRIEFER-CLI scope doc §2.2 §4, this extractor documents the
 * 3-step deploy chain that is NOT chained today:
 *   1. `gcloud run deploy {app}-{env}` — cited at
 *      DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh +
 *      DeSciX_Powch/microservice/scripts/deploy.sh
 *   2. `node admin/scripts/deploy/update-mesh-routing.js --app={app} --env={env}`
 *      — cited at update-mesh-routing.js (main() function)
 *   3. `descix microservice register` — cited at bin/descix.js (the
 *      microserviceCommand.command('register') block)
 *
 * The KNOWN GAP — there's no `descix microservice deploy` chaining the three —
 * is computed dynamically: grep bin/descix.js for the deploy subcommand. If
 * found, the gap is closed; if absent, the gap text is rendered into §4.
 */
import {
  readSourceFile,
  findInLines,
  makeCitation,
  sliceRange
} from '../util/source-reader.js';
import { BrieferExtractorError, BRIEFER_ERROR_CODES } from '../errors.js';

export const SECTION = {
  number: 4,
  heading: '4. Microservice deploy — current state',
  sourceFiles: [
    'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js',
    'DeSciX/DeSciX_Core/descix-cli/bin/descix.js'
  ]
};

const POWCH_DEPLOY = 'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh';
const CLOUD_DEPLOY = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh';
const MESH_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/update-mesh-routing.js';
const CLI_FILE = 'DeSciX/DeSciX_Core/descix-cli/bin/descix.js';

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

  // ── Step 1: gcloud run deploy from Powch + Cloud deploy scripts ──
  const powch = await readSourceFile({
    cliPaths,
    relPath: POWCH_DEPLOY,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const powchRun = findInLines({
    lines: powch.lines,
    regex: /^gcloud\s+run\s+deploy\s+\$SERVICE_NAME/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${POWCH_DEPLOY} (gcloud run deploy invocation)`,
    expected: 'gcloud run deploy $SERVICE_NAME ...',
    recovery: `Re-locate the gcloud run deploy in ${POWCH_DEPLOY}.`
  });
  // Slice the deploy block — from the `gcloud run deploy` to the next blank line.
  const powchDeployEnd = findContinuationEnd(powch.lines, powchRun.lineNumber);
  const powchDeployBlock = sliceRange(powch.lines, powchRun.lineNumber, powchDeployEnd);

  // Cloud-side deploy script is also canonical per scope doc §4 — verify it
  // exists at the documented path. If not, surface as a moved-source error
  // rather than silently dropping the citation.
  const cloud = await readSourceFile({
    cliPaths,
    relPath: CLOUD_DEPLOY,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const cloudRun = findInLines({
    lines: cloud.lines,
    regex: /gcloud\s+run\s+deploy/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CLOUD_DEPLOY} (gcloud run deploy invocation)`,
    expected: 'gcloud run deploy ... in deploy-service-env.sh',
    recovery: `Re-locate the gcloud run deploy in ${CLOUD_DEPLOY}.`
  });

  // ── Step 2: update-mesh-routing.js main() ──
  const mesh = await readSourceFile({
    cliPaths,
    relPath: MESH_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const mainMatch = findInLines({
    lines: mesh.lines,
    regex: /async\s+function\s+main\s*\(\s*\)/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${MESH_FILE}:82-202 (main() function)`,
    expected: 'async function main() { ... }',
    recovery: `Re-locate main() in ${MESH_FILE}.`
  });

  // ── Step 3: descix microservice register CLI command ──
  const cli = await readSourceFile({
    cliPaths,
    relPath: CLI_FILE,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  // Per-line scan: find `.command('register')` whose preceding non-empty line
  // contains `microserviceCommand`. Disambiguates from program.command('register-folder')
  // and program.command('register-delegate') which also exist.
  let registerLine = -1;
  for (let i = 1; i < cli.lines.length; i++) {
    if (/\.command\(['"]register['"]\)/.test(cli.lines[i])) {
      // Look back up to 3 lines for a `microserviceCommand` anchor.
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        if (/microserviceCommand/.test(cli.lines[j])) {
          registerLine = i + 1;
          break;
        }
      }
      if (registerLine !== -1) break;
    }
  }
  if (registerLine === -1) {
    throw new BrieferExtractorError({
      code: BRIEFER_ERROR_CODES.SRC_NOT_FOUND,
      section: `§${SECTION.number} ${SECTION.heading}`,
      source: `${CLI_FILE}:3080-3236 (descix microservice register)`,
      expected: "microserviceCommand followed by .command('register') in bin/descix.js",
      recovery: `Re-locate the microservice register command in ${CLI_FILE}.`,
      detail: "Scanned bin/descix.js — no line matches `.command('register')` within 3 lines of `microserviceCommand`."
    });
  }
  const registerMatch = { lineNumber: registerLine };

  // KNOWN GAP toggle: scan for `.command('deploy')` whose preceding 3 lines
  // contain a `microserviceCommand` anchor (mirror the register-detect pattern).
  // If found, the gap is closed; if absent, gap text is rendered.
  let gapToggleClosed = false;
  for (let i = 1; i < cli.lines.length; i++) {
    if (/\.command\(['"]deploy['"]\)/.test(cli.lines[i])) {
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        if (/microserviceCommand/.test(cli.lines[j])) {
          gapToggleClosed = true;
          break;
        }
      }
      if (gapToggleClosed) break;
    }
  }

  // ── Render the markdown ──
  const lines = [
    `Today (regen target: \`${env}\`), microservice deploy is **3 separate steps NOT chained**:`,
    ``,
    `**Step 1.** \`gcloud run deploy {app}-{env} ...\` — deploys the per-app Cloud Run service.`,
    `- Reference (Powch): \`${POWCH_DEPLOY}:${powchRun.lineNumber}\``,
    `- Reference (Cloud canonical): \`${CLOUD_DEPLOY}:${cloudRun.lineNumber}\``,
    ``,
    'Verbatim from `' + POWCH_DEPLOY + '` (the canonical example):',
    ``,
    '```bash',
    powchDeployBlock,
    '```',
    ``,
    `**Step 2.** \`node admin/scripts/deploy/update-mesh-routing.js --app={app} --env={env}\` — wires LB. Creates serverless NEG, backend service, host rule, path matcher. Idempotent. — \`${MESH_FILE}:${mainMatch.lineNumber}\` (main())`,
    ``,
    `**Step 3.** \`descix microservice register\` — writes manifest to Firestore \`ServiceManifests\` so the central apifront can dispatch commands via \`proxyToExternalService\`. SEPARATE from LB wiring. — \`${CLI_FILE}:${registerMatch.lineNumber}\``,
    ``
  ];

  if (gapToggleClosed) {
    lines.push(
      `**GAP CLOSED:** \`descix microservice deploy\` exists in the CLI as of this regen — it chains the three steps above. (Detected via grep on \`bin/descix.js\`.)`
    );
  } else {
    lines.push(
      `**KNOWN GAP:** there is NO \`descix microservice deploy\` command that chains all three. Step 2 today is a manual admin-script invocation, not a CLI subcommand. Closing this gap is part of WS-DESCIX-BRIEFER-CLI scope (or a sibling workstream). _Detected dynamically: grep on \`bin/descix.js\` returned no \`microserviceCommand.command('deploy')\` declaration._`
    );
  }

  const markdown = lines.join('\n');

  const citations = [
    makeCitation({ file: POWCH_DEPLOY, lines: `${powchRun.lineNumber}-${powchDeployEnd}`, anchor: 'gcloud run deploy (Powch)', fileLines: powch.lines }),
    makeCitation({ file: CLOUD_DEPLOY, lines: String(cloudRun.lineNumber), anchor: 'gcloud run deploy (Cloud canonical)', fileLines: cloud.lines }),
    makeCitation({ file: MESH_FILE, lines: String(mainMatch.lineNumber), anchor: 'update-mesh-routing.js main()', fileLines: mesh.lines }),
    makeCitation({ file: CLI_FILE, lines: String(registerMatch.lineNumber), anchor: 'descix microservice register', fileLines: cli.lines })
  ];

  return { markdown, citations };
}

/**
 * For shell line-continuations (`\\` at line-end), walk forward until the
 * continuation chain ends. Returns the line number of the LAST line in the
 * block (1-indexed).
 */
function findContinuationEnd(lines, startLine) {
  let i = startLine - 1;
  while (i < lines.length - 1 && /\\\s*$/.test(lines[i])) {
    i++;
  }
  return i + 1;
}
