#!/usr/bin/env node
/**
 * `descix-app` — the app half's bin. TWO VERBS AND NO MORE: `init` and `serve`.
 *
 * WHY IT IS THIS SMALL (contract-ws-c5-platform-godsworld-on-the-sdk rev 5, I-P1): every
 * platform-side verb — create an app, sync a KB, register a service, publish — stays a SERVED
 * MCP verb, so that the platform's contract is discovered from the mesh rather than frozen
 * into whatever version of a CLI a developer happens to have installed. The only things that
 * cannot be served are the two that act on the developer's own filesystem and localhost: put
 * the scaffold on disk, and run the local gateway. Those are here; nothing else belongs.
 *
 * NO ARGUMENT-PARSER DEPENDENCY. commander would be a runtime dependency of @descix/sdk, and
 * therefore billed to every microservice-only consumer for a bin they never run — the exact
 * cost the install-size gate exists to hold down. Two verbs do not need a parser.
 *
 * The app half is an OPTIONAL PEER, so this bin can be present while @descix/app-sdk is not.
 * It says so by name instead of failing with a bare ERR_MODULE_NOT_FOUND stack, because the
 * fix ("install the peer") is not inferable from the stack.
 */

const USAGE = `
descix-app — the DeSciX app shell's local verbs

  descix-app init [dir] [--force]   Copy the site scaffold into <dir> (default: ./site)
  descix-app serve [options]        Start the local one-origin gateway

serve options:
  -p, --port <port>       Gateway port (default: .descix/workspace.json env.gateway.port, else 5173)
  -w, --workspace <path>  Workspace root override (default: cwd)
  -a, --app <id>          App to serve standalone (default: detected from the cwd)
  --site-url <url>        App Shell target override

Everything else the platform does — apps, KBs, services, publishing — is a SERVED MCP verb,
discovered with tell_me_how. It is deliberately not in this bin.
`;

/** Load an optional-peer module, or fail loud NAMING the peer and the install command. */
async function peer(specifier) {
  try {
    return await import(specifier);
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND' && err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw err;
    console.error(
      `descix-app: the app half is not installed.\n` +
      `  ${specifier} could not be resolved (${err.code}).\n\n` +
      `  @descix/app-sdk is an OPTIONAL peer of @descix/sdk on purpose: a microservice-only\n` +
      `  consumer must not pay for React, MUI, wagmi and vite. Install it to use the app half:\n\n` +
      `    npm i @descix/app-sdk react react-dom\n`
    );
    process.exit(1);
  }
}

/** Read a flag's value, supporting both `--flag v` and `--flag=v`. Returns undefined if absent. */
function flag(argv, ...names) {
  for (const name of names) {
    const eq = argv.find((a) => a.startsWith(`${name}=`));
    if (eq) return eq.slice(name.length + 1);
    const i = argv.indexOf(name);
    if (i !== -1) return argv[i + 1];
  }
  return undefined;
}

async function cmdInit(argv) {
  const path = await import('node:path');
  const { copySiteScaffold } = await peer('@descix/app-sdk/scaffold');

  const force = argv.includes('--force') || argv.includes('-f');
  const positional = argv.filter((a) => !a.startsWith('-'));
  const target = path.resolve(process.cwd(), positional[0] || 'site');

  const written = await copySiteScaffold(target, { force });
  console.log(`descix-app init: ${written.length} file(s) written to ${target}`);
  for (const f of written) console.log(`  ${f}`);
  console.log(
    `\nDeSciXAppSDK.js is GENERATED from @descix/app-sdk — edit index.html, app.js and styles.css,\n` +
    `then run \`descix-app serve\` to see it on the one local origin.`
  );
}

async function cmdServe(argv) {
  const { runGateway } = await peer('@descix/sdk/app/dev');

  const rawPort = flag(argv, '--port', '-p');
  const workspace = flag(argv, '--workspace', '-w');
  const app = flag(argv, '--app', '-a');
  const siteUrl = flag(argv, '--site-url');
  const apiUrl = process.env.DESCIX_API_URL || undefined;

  if (rawPort !== undefined && !/^\d+$/.test(rawPort)) {
    console.error(`descix-app serve: --port must be a number, got "${rawPort}".`);
    process.exit(1);
  }

  await runGateway({
    // An unset flag stays UNSET. A default here would shadow the workspace's own
    // env.gateway.port, and the gateway and the product map it bakes would then name
    // different ports — resolveGatewayPort owns that chain, not this wrapper.
    port: rawPort !== undefined ? parseInt(rawPort, 10) : undefined,
    portSource: rawPort !== undefined ? '--port' : undefined,
    workspaceRoot: workspace || process.cwd(),
    apiUrl,
    apiSource: apiUrl ? 'DESCIX_API_URL' : undefined,
    siteUrl,
    siteSource: siteUrl ? '--site-url' : undefined,
    app,
    // Passed SEPARATELY from workspaceRoot: workspaceRoot is walked UP from to find
    // .descix/workspace.json, so by the time the gateway holds it the directory the developer
    // was standing in is gone — and that directory is exactly what picks the app to serve.
    cwd: process.cwd(),
  });
}

/**
 * An EXPECTED refusal is a message, not a stack. Measured 2026-08-27: `descix-app init` into a
 * non-empty directory printed a full Node stack trace with three tmp paths in it — the refusal
 * was correct and the exit code was right, but the developer had to read a traceback to learn
 * they wanted --force. A stack trace is for a bug in this bin; a message is for a decision the
 * developer has to make. Unexpected errors still get their stack, because hiding those is how
 * a tool goes quiet about its own defects.
 */
async function run(fn, argv) {
  try {
    await fn(argv);
  } catch (err) {
    if (err instanceof Error && err.message && !process.env.DESCIX_APP_TRACE) {
      console.error(`descix-app: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

const [verb, ...rest] = process.argv.slice(2);

if (verb === 'init') {
  await run(cmdInit, rest);
} else if (verb === 'serve') {
  await run(cmdServe, rest);
} else if (verb === undefined || verb === '--help' || verb === '-h' || verb === 'help') {
  console.log(USAGE);
} else {
  // FAIL LOUD and name the boundary: an unknown verb here is usually a PLATFORM verb someone
  // expected a CLI to carry. Say where it actually lives rather than printing generic usage.
  console.error(
    `descix-app: unknown verb "${verb}".\n` +
    `  This bin has exactly two: init and serve.\n` +
    `  Platform verbs (apps, KBs, services, publishing) are SERVED over MCP — ask tell_me_how.\n`
  );
  process.exit(1);
}
