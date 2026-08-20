/**
 * devCerts — the ONE owner of "which TLS cert does a local DeSciX dev server use".
 *
 * ── The divergence this closes (redteam G-7) ─────────────────────────────────
 * `env.devCerts` was honoured by the GATEWAY and invisible to everything else.
 * createViteServerConfig — the standardized dev server every app on the SDK
 * builds with — forwarded certDir/certFile/keyFile only from its CALLER's
 * options and never read workspace config at all. So a developer who pointed
 * env.devCerts at their own keychain-trusted pair got it on the gateway origin
 * and the SDK-tracked pair on every app dev server behind it.
 *
 * That split is not cosmetic. WebAuthn/passkey ceremonies are origin-bound and
 * refuse an untrusted certificate, so "Powch login works on :5173 but not on
 * :5174" was a first-run blocker whose cause was invisible from either file.
 *
 * ── Precedence ───────────────────────────────────────────────────────────────
 *   explicit caller options  >  env.devCerts (resolved against workspaceRoot)  >  {}
 * An empty result means "no workspace opinion" and lets getViteHttpsConfig fall
 * back to the SDK-tracked SAN pair, which is a real default rather than a guess:
 * it is version-controlled, SAN-asserted, and fails loud if it is missing.
 */
import fs from 'fs';
import path from 'path';

/**
 * Read `.descix/workspace.json` if it is there. Absence is normal — an app dev
 * server can be started outside a workspace — so this returns null rather than
 * throwing, and the caller simply gets no workspace opinion.
 * @param {string} workspaceRoot
 * @returns {Object|null}
 */
function readWorkspace(workspaceRoot) {
  if (!workspaceRoot) return null;
  const p = path.join(workspaceRoot, '.descix', 'workspace.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    // A malformed workspace is the workspace resolver's problem to report, not
    // this module's; silently ignoring it here would hide the real error.
    return null;
  }
}

/**
 * Resolve dev-cert options for getViteHttpsConfig.
 *
 * @param {string} workspaceRoot - workspace root (contains .descix/workspace.json)
 * @param {Object} [overrides] - explicit caller options; any set key wins
 * @param {string} [overrides.certDir]
 * @param {string} [overrides.certFile]
 * @param {string} [overrides.keyFile]
 * @param {Object} [config] - already-parsed workspace.json, if the caller has it
 * @returns {{certDir?: string, certFile?: string, keyFile?: string}}
 */
export function resolveDevCertOptions(workspaceRoot, overrides = {}, config = undefined) {
  const ws = config !== undefined ? config : readWorkspace(workspaceRoot);
  const dc = ws?.env?.devCerts;

  const abs = (p) => (p ? path.resolve(workspaceRoot || '.', p) : undefined);
  const fromWorkspace = dc
    ? { certDir: abs(dc.dir), certFile: abs(dc.cert), keyFile: abs(dc.key) }
    : {};

  // Caller options win per-key, so `--cert-dir` overrides only the dir and still
  // picks up a workspace-configured key file.
  const merged = {
    certDir: overrides.certDir ?? fromWorkspace.certDir,
    certFile: overrides.certFile ?? fromWorkspace.certFile,
    keyFile: overrides.keyFile ?? fromWorkspace.keyFile,
  };
  // Drop undefined keys so callers can spread this without clobbering defaults.
  return Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined));
}
