/**
 * §4 — Microservice deploy extractor (M2 implementation).
 *
 * Per-app microservice deploy (broker-first model):
 *   1. `gcloud run deploy {app}-{env}` — deploy-service-env.sh
 *   2. `descix microservice register` — Firestore manifest (or self-register on boot)
 *
 * No per-app LB/NEG step for non-core apps. Core platform app NEGs at env standup via provision-platform-lb.js.
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
  number: 4,
  heading: '4. Microservice deploy — current state',
  sourceFiles: [
    'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/lib/cloud-run-deploy.js',
    'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js',
    'DeSciX/DeSciX_Core/descix-cli/bin/descix.js'
  ]
};

const POWCH_DEPLOY = 'DeSciX/DeSciX_Powch/microservice/scripts/deploy.sh';
const CLOUD_DEPLOY = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/deploy-service-env.sh';
const CLOUD_RUN_LIB = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/lib/cloud-run-deploy.js';
const LB_FILE = 'DeSciX/DeSciX_Cloud/microservice/admin/scripts/deploy/provision-platform-lb.js';
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

  // Cloud-side deploy: bash script shells out to shared lib (deployToCloudRun)
  const cloud = await readSourceFile({
    cliPaths,
    relPath: CLOUD_DEPLOY,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  findInLines({
    lines: cloud.lines,
    regex: /deployToCloudRun/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CLOUD_DEPLOY} (deployToCloudRun import)`,
    expected: 'deploy-service-env.sh invokes deployToCloudRun from lib/cloud-run-deploy.js',
    recovery: `Re-locate deployToCloudRun in ${CLOUD_DEPLOY}.`
  });

  const cloudRunLib = await readSourceFile({
    cliPaths,
    relPath: CLOUD_RUN_LIB,
    section: `§${SECTION.number} ${SECTION.heading}`
  });
  const cloudRun = findInLines({
    lines: cloudRunLib.lines,
    regex: /gcloud run deploy \$\{serviceName\}/,
    section: `§${SECTION.number} ${SECTION.heading}`,
    source: `${CLOUD_RUN_LIB} (gcloud run deploy invocation)`,
    expected: 'gcloud run deploy ${serviceName} ... in cloud-run-deploy.js',
    recovery: `Re-locate the gcloud run deploy in ${CLOUD_RUN_LIB}.`
  });
  const cloudDeployEnd = findContinuationEnd(cloudRunLib.lines, cloudRun.lineNumber);
  const cloudDeployBlock = sliceRange(cloudRunLib.lines, cloudRun.lineNumber, cloudDeployEnd);

  // Platform LB (env standup only — not per-app)
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
    recovery: `Re-locate ensureCoreNeg in ${LB_FILE}.`
  });

  // ── Step 2: descix microservice register CLI command ──
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

  // ── M3: live Cloud Run probe (HARD-FAIL on demo/prod, skipped on dev) ──
  const probeCitations = [];
  let runProbeNote = '';
  if (env === 'dev') {
    runProbeNote = '\n_DEV: gcloud probes skipped (local dev — no Cloud Run services to probe)._\n';
  } else {
    const runProbe = await probeGcloudJson({
      command: ['run', 'services', 'list', '--region=us-central1', `--filter=metadata.name~^.*-${env}$`, '--format=json'],
      env,
      section: `§${SECTION.number} ${SECTION.heading}`,
      anchor: 'cloud-run-services-list',
      expected: `JSON array of Cloud Run services matching \`-${env}$\` in us-central1`,
      recovery: `Run 'gcloud auth login' and 'gcloud config set project descix'. The Cloud Run services cross-check is required for env=${env}.`
    });
    const services = (runProbe.json || [])
      .map(svc => ({
        name: (svc.metadata && svc.metadata.name) || '(unknown)',
        region: (svc.metadata && svc.metadata.labels && svc.metadata.labels['cloud.googleapis.com/location']) || 'us-central1'
      }));
    const names = services.map(s => '\`' + s.name + '\`').join(', ');
    runProbeNote = `\n**Live Cloud Run state** (probed \`${runProbe.citation.probe}\`, env=\`${env}\`):\n- Services found: \`${services.length}\`\n- Names: ${names || '_(none)_'}\n`;
    probeCitations.push(runProbe.citation);
  }

  // ── Render the markdown ──
  const lines = [
    `Today (regen target: \`${env}\`), per-app microservice deploy is **2 steps** (broker-first — no NEG for non-core apps):`,
    ``,
    `**Step 1.** \`gcloud run deploy {app}-{env} ...\` — deploys the Cloud Run service (via \`deploy-service-env.sh\` → \`lib/cloud-run-deploy.js\`; CLI: \`descix microservice deploy\`).`,
    `- Reference (Powch): \`${POWCH_DEPLOY}:${powchRun.lineNumber}\``,
    `- Reference (Cloud canonical): \`${CLOUD_RUN_LIB}:${cloudRun.lineNumber}\``,
    ``,
    'Verbatim from `' + CLOUD_RUN_LIB + '` (shared deploy lib):',
    ``,
    '```bash',
    cloudDeployBlock,
    '```',
    ``,
    `**Step 2.** \`descix microservice register\` — writes manifest to Firestore \`ServiceManifests\` so Core dispatches via \`proxyToExternalService\`. Self-registration on boot is equivalent. — \`${CLI_FILE}:${registerMatch.lineNumber}\``,
    ``,
    `**Platform LB (core platform apps at standup):** \`deploy-backend-env.sh\` → \`provision-platform-lb.js\` — daita broker NEG + powch NEG + apex/peer URL map. \`deploy-service-env.sh powch\` re-runs provision for powch NEG. — \`${LB_FILE}:${ensureCoreNegMatch.lineNumber}\``,
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
  if (runProbeNote) lines.push(runProbeNote);

  const markdown = lines.join('\n');

  const citations = [
    makeCitation({ file: POWCH_DEPLOY, lines: `${powchRun.lineNumber}-${powchDeployEnd}`, anchor: 'gcloud run deploy (Powch)', fileLines: powch.lines }),
    makeCitation({ file: CLOUD_RUN_LIB, lines: `${cloudRun.lineNumber}-${cloudDeployEnd}`, anchor: 'gcloud run deploy (Cloud canonical lib)', fileLines: cloudRunLib.lines }),
    makeCitation({ file: CLOUD_DEPLOY, lines: 'deployToCloudRun', anchor: 'deploy-service-env.sh → lib', fileLines: cloud.lines }),
    makeCitation({ file: LB_FILE, lines: String(ensureCoreNegMatch.lineNumber), anchor: 'provision-platform-lb.js ensureCoreNeg', fileLines: lb.lines }),
    makeCitation({ file: CLI_FILE, lines: String(registerMatch.lineNumber), anchor: 'descix microservice register', fileLines: cli.lines }),
    ...probeCitations
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
