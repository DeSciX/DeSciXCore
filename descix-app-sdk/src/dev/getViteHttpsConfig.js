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
 * subjectAltName entries of a PEM certificate, normalized to
 * ['DNS:localhost', 'IP:127.0.0.1', ...]. Empty array when the cert has no SAN.
 *
 * @param {string|Buffer} pem
 * @returns {string[]}
 */
export function certificateSanNames(pem) {
  const san = new X509Certificate(pem).subjectAltName;
  if (!san) return [];
  return san
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^IP Address:/, 'IP:'));
}

/**
 * Throw unless the certificate carries a subjectAltName covering localhost.
 * @param {string|Buffer} pem
 * @param {string} certPath - for the error message
 */
export function assertCertHasLocalhostSan(pem, certPath) {
  const names = certificateSanNames(pem);
  const hasLocalhost = names.some((n) => n === 'DNS:localhost' || n === 'IP:127.0.0.1');
  if (!hasLocalhost) {
    throw new Error(
      `[DeSciX dev certs] ${certPath} has no subjectAltName for localhost ` +
      `(found: ${names.length ? names.join(', ') : 'none'}).\n` +
      'Chrome rejects SAN-less certs and WebAuthn/passkey login cannot run on this origin.\n' +
      `Mint a correct one:\n  ${MINT_CERT_COMMAND}\n` +
      'Then trust it: security add-trusted-cert -k ~/Library/Keychains/login.keychain-db cert.pem'
    );
  }
}

/**
 * @param {Object} [options]
 * @param {string} [options.certDir] - directory holding cert.pem + key.pem
 * @param {string} [options.certFile] - explicit certificate path
 * @param {string} [options.keyFile] - explicit private key path
 * @returns {{https: {key: Buffer, cert: Buffer}}}
 */
export function getViteHttpsConfig(options = {}) {
  const dir = options.certDir ? path.resolve(options.certDir) : DEFAULT_CERT_DIR;
  const certPath = options.certFile ? path.resolve(options.certFile) : path.join(dir, 'cert.pem');
  const keyPath = options.keyFile ? path.resolve(options.keyFile) : path.join(dir, 'key.pem');

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
