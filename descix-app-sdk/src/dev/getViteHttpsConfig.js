/**
 * getViteHttpsConfig - Returns HTTPS config for Vite dev server.
 *
 * Uses shared dev certs from the app-sdk package. All apps using app-sdk
 * share the same cert for consistent localhost HTTPS.
 *
 * The cert MUST carry a subjectAltName block: Chrome (and every WebAuthn
 * implementation behind it) ignores the legacy CN and refuses a SAN-less cert
 * outright, which makes passkey login impossible on localhost. That is enforced
 * here — a SAN-less cert fails loud with the command that mints a correct one.
 *
 * Bring your own cert (no SDK edit required) by passing `certDir` (or explicit
 * `certFile`/`keyFile`); the gateway maps workspace.json `env.devCerts` onto
 * these options.
 */

import fs from 'fs';
import path from 'path';
import { X509Certificate } from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Directory of the certs shipped with the SDK. */
export const DEFAULT_CERT_DIR = path.resolve(__dirname, 'certs');

/** The exact command that mints a browser-acceptable dev cert. */
export const MINT_CERT_COMMAND =
  'openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 ' +
  '-keyout key.pem -out cert.pem -days 800 -nodes -subj "/O=DeSciX Dev/CN=localhost" ' +
  '-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" ' +
  '-addext "keyUsage=digitalSignature,keyEncipherment" ' +
  '-addext "extendedKeyUsage=serverAuth"';

/**
 * subjectAltName entries parsed off an already-constructed X509Certificate,
 * normalized to ['DNS:localhost', 'IP:127.0.0.1', ...]. The ONE place SAN text
 * is parsed — certificateSanNames and checkDevCert both funnel through this so
 * the normalization (stripping node's `IP Address:` prefix) cannot drift
 * between them.
 * @param {X509Certificate} cert
 * @returns {string[]}
 */
function sanNamesFromCert(cert) {
  const san = cert.subjectAltName;
  if (!san) return [];
  return san
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^IP Address:/, 'IP:'));
}

/** True when a normalized SAN list covers localhost. */
function hasLocalhostSan(names) {
  return names.some((n) => n === 'DNS:localhost' || n === 'IP:127.0.0.1');
}

/**
 * subjectAltName entries of a PEM certificate, normalized to
 * ['DNS:localhost', 'IP:127.0.0.1', ...]. Empty array when the cert has no SAN.
 *
 * @param {string|Buffer} pem
 * @returns {string[]}
 */
export function certificateSanNames(pem) {
  return sanNamesFromCert(new X509Certificate(pem));
}

/**
 * Throw unless the certificate carries a subjectAltName covering localhost.
 * @param {string|Buffer} pem
 * @param {string} certPath - for the error message
 */
export function assertCertHasLocalhostSan(pem, certPath) {
  const names = certificateSanNames(pem);
  if (!hasLocalhostSan(names)) {
    throw new Error(
      `[DeSciX dev certs] ${certPath} has no subjectAltName for localhost ` +
      `(found: ${names.length ? names.join(', ') : 'none'}).\n` +
      'Chrome rejects SAN-less certs and WebAuthn/passkey login cannot run on this origin.\n' +
      `Mint a correct one:\n  ${MINT_CERT_COMMAND}\n` +
      `Then trust it:\n  ${TRUST_VERB}`
    );
  }
}

/**
 * The cert/key files a given set of options resolves to.
 * @param {Object} [options]
 * @param {string} [options.certDir] - directory holding cert.pem + key.pem
 * @param {string} [options.certFile] - explicit certificate path
 * @param {string} [options.keyFile] - explicit private key path
 * @returns {{certPath: string, keyPath: string}}
 */
export function resolveCertPaths(options = {}) {
  const dir = options.certDir ? path.resolve(options.certDir) : DEFAULT_CERT_DIR;
  return {
    certPath: options.certFile ? path.resolve(options.certFile) : path.join(dir, 'cert.pem'),
    keyPath: options.keyFile ? path.resolve(options.keyFile) : path.join(dir, 'key.pem'),
  };
}

/** The one command a human runs to trust the resolved dev cert (it wraps trustCertCommand). */
export const TRUST_VERB = 'descix dev-certs trust';

/**
 * The one-time command that makes this machine's browser trust a dev cert.
 * `-r trustRoot` is explicit: without it `add-trusted-cert` picks a trust
 * setting from the cert's own extensions, and the shipped cert is unusual
 * (CA:TRUE leaf) enough that leaving it implicit is the wrong place to save
 * four words.
 * @param {string} certPath
 * @returns {string}
 */
export function trustCertCommand(certPath) {
  return `security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db "${certPath}"`;
}

/**
 * Human-readable dev-cert trust status for `certPath`, with the exact next
 * command for whichever state it is in. The ONE owner of "is this dev cert
 * usable for passkey sign-in" — `descix dev-certs check`, `descix doctor` and
 * the `descix serve` banner all call this rather than re-deriving the answer.
 *
 * Statuses:
 *   missing          - no readable certificate at certPath
 *   no_localhost_san - cert exists but carries no SAN for localhost
 *   expired          - cert's validity window has passed
 *   untrusted        - darwin only: `security verify-cert` rejected it
 *   trusted          - darwin only: `security verify-cert` accepted it
 *   unverifiable     - non-darwin: trust cannot be checked from here
 *
 * @param {Object} options
 * @param {string} options.certPath
 * @returns {{status: string, detail: string, next: string|null}}
 */
export function checkDevCert({ certPath } = {}) {
  if (!certPath || !fs.existsSync(certPath)) {
    return {
      status: 'missing',
      detail: certPath ? `No certificate at ${certPath}.` : 'No certificate path given.',
      next: `Mint a cert pair:\n  ${MINT_CERT_COMMAND}`,
    };
  }

  let cert;
  try {
    cert = new X509Certificate(fs.readFileSync(certPath));
  } catch (err) {
    return {
      status: 'missing',
      detail: `${certPath} is not a readable certificate (${err.message}).`,
      next: `Mint a cert pair:\n  ${MINT_CERT_COMMAND}`,
    };
  }

  const names = sanNamesFromCert(cert);
  if (!hasLocalhostSan(names)) {
    return {
      status: 'no_localhost_san',
      detail: `${certPath} has no subjectAltName for localhost (found: ${names.length ? names.join(', ') : 'none'}).`,
      next: `Mint a correct one:\n  ${MINT_CERT_COMMAND}\nThen trust it:\n  ${TRUST_VERB}`,
    };
  }

  const validToMs = Date.parse(cert.validTo);
  if (Number.isFinite(validToMs) && Date.now() > validToMs) {
    return {
      status: 'expired',
      detail: `${certPath} expired on ${cert.validTo}.`,
      next: `Mint a fresh one:\n  ${MINT_CERT_COMMAND}\nThen trust it:\n  ${TRUST_VERB}`,
    };
  }

  if (process.platform !== 'darwin') {
    return {
      status: 'unverifiable',
      detail: `Trust cannot be checked on ${process.platform} — only darwin (\`security verify-cert\`) is implemented.`,
      next: null,
    };
  }

  try {
    execFileSync('security', ['verify-cert', '-c', certPath, '-p', 'ssl', '-s', 'localhost'], { stdio: 'pipe' });
    return {
      status: 'trusted',
      detail: `${certPath} is trusted by the macOS keychain for https://localhost.`,
      next: null,
    };
  } catch (err) {
    // `security` prints CT/EV diagnostics with terminal colour codes around its verdict; the verdict
    // code (e.g. CSSMERR_TP_NOT_TRUSTED) is the only part a human or an agent can act on.
    const output = [err.stdout, err.stderr].filter(Boolean).map((b) => b.toString()).join('\n');
    const verdict = output.match(/\b(CSSMERR_[A-Z_]+|errSec[A-Za-z]+)\b/)?.[1] ?? `exit ${err.status ?? 'unknown'}`;
    return {
      status: 'untrusted',
      detail: `not trusted by the macOS keychain for https://localhost (security verify-cert: ${verdict})`,
      next: TRUST_VERB,
    };
  }
}

/**
 * @param {Object} [options] - see resolveCertPaths
 * @returns {{https: {key: Buffer, cert: Buffer}}}
 */
export function getViteHttpsConfig(options = {}) {
  const { certPath, keyPath } = resolveCertPaths(options);

  for (const p of [certPath, keyPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(
        `[DeSciX dev certs] missing ${p}.\nMint a cert pair:\n  ${MINT_CERT_COMMAND}`
      );
    }
  }

  const cert = fs.readFileSync(certPath);
  assertCertHasLocalhostSan(cert, certPath);

  return {
    https: {
      key: fs.readFileSync(keyPath),
      cert,
    },
  };
}
