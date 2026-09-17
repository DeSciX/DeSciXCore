/**
 * dev-certs — report and (on trust) apply this machine's TLS trust status for
 * the cert `descix serve` uses for its localhost HTTPS origin.
 *
 * Cert resolution is the ONE owner shared with `descix doctor` and the
 * `descix serve` banner: lib/dev-cert-resolver.js -> @descix/app-sdk/dev's
 * resolveDevCertOptions + resolveCertPaths. This file never re-derives which
 * cert is "the" dev cert, and never mints or replaces one — the shipped
 * SDK-tracked pair (descix-app-sdk/src/dev/certs/) is the only cert this
 * command ever points at, same as every other consumer.
 */
import { execSync } from 'child_process';
import chalk from 'chalk';
import { checkDevCert, trustCertCommand } from '@descix/app-sdk/dev';
import { resolveGatewayCertContext } from '../dev-cert-resolver.js';

/**
 * `descix dev-certs check [--json]` — exits 0 only when the cert is trusted.
 */
export async function runDevCertsCheck(options = {}) {
  const { certPath, port } = resolveGatewayCertContext(process.cwd());
  const result = checkDevCert({ certPath });

  if (options.json) {
    console.log(JSON.stringify({ certPath, port, ...result }, null, 2));
  } else {
    console.log(chalk.cyan('\nDev certificate\n'));
    console.log(`  Cert:   ${certPath}`);
    console.log(`  Status: ${result.status === 'trusted' ? chalk.green(result.status) : chalk.red(result.status)}`);
    console.log(`  Detail: ${result.detail}`);
    if (result.next) {
      console.log(`\n  Next:\n    ${String(result.next).replace(/\n/g, '\n    ')}`);
    }
    console.log('');
  }

  process.exitCode = result.status === 'trusted' ? 0 : 1;
  return result;
}

/**
 * `descix dev-certs trust` — the ONE final human command. Runs the exact
 * trustCertCommand() string (macOS prompts for the keychain password), then
 * re-checks and tells the human to reload Chrome. Refuses to run against a
 * cert that is structurally broken (missing / no SAN / expired) or on a
 * platform this cannot verify — those are not this command's job to paper
 * over, and running `security add-trusted-cert` on a bad cert would silently
 * "succeed" while passkeys still fail.
 */
export async function runDevCertsTrust() {
  const { certPath, port } = resolveGatewayCertContext(process.cwd());
  const before = checkDevCert({ certPath });

  if (before.status === 'trusted') {
    console.log(chalk.green(`\n${certPath} is already trusted.\n`));
    return before;
  }

  if (before.status === 'unverifiable') {
    // `security add-trusted-cert` is macOS-only — there is no automated trust
    // step on this platform. Refuse loud rather than silently no-op, and hand
    // the human the exact file so they can import it into their own OS/browser
    // trust store by hand.
    console.error(chalk.red(`\nCannot trust automatically on ${process.platform}: ${before.detail}`));
    console.error(`\nImport this certificate into your OS/browser trust store manually:\n  ${certPath}\n`);
    process.exitCode = 1;
    return before;
  }

  if (before.status !== 'untrusted') {
    console.error(chalk.red(`\nCannot trust this cert — status: ${before.status}`));
    console.error(`  ${before.detail}`);
    if (before.next) {
      console.error(`\n  Next:\n    ${String(before.next).replace(/\n/g, '\n    ')}\n`);
    }
    process.exitCode = 1;
    return before;
  }

  console.log(chalk.cyan('\nTrusting the dev certificate — macOS will prompt for your password.\n'));
  execSync(trustCertCommand(certPath), { stdio: 'inherit' });

  const after = checkDevCert({ certPath });
  if (after.status === 'trusted') {
    console.log(chalk.green('\nTrusted.'));
    console.log(`Quit and reopen Chrome, then reload https://localhost:${port}/\n`);
  } else {
    console.error(chalk.red(`\nStill not trusted after running the trust command (${after.status}).`));
    console.error(`  ${after.detail}\n`);
    process.exitCode = 1;
  }
  return after;
}
