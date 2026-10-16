/**
 * The environments the briefer regenerates against, and each one's apex host.
 *
 * Origins have ONE owner, @descix/app-sdk/dev ENV_ORIGINS; this module only names which of
 * those environments are deployed platforms the briefer probes, and fails loud if one of them
 * has no origin there.
 */
import { ENV_ORIGINS } from '@descix/app-sdk/dev';

/** Deployed platform environments; each is probed live (gcloud + Firestore) on every regen. */
export const BRIEFER_ENVS = Object.freeze(['dev', 'prod']);

for (const env of BRIEFER_ENVS) {
  if (!ENV_ORIGINS[env]) {
    throw new Error(`[briefer] env '${env}' has no origin in @descix/app-sdk/dev ENV_ORIGINS`);
  }
}

/** The apex host of a briefer env (e.g. dev → dev.descix.net), read from ENV_ORIGINS. */
export function apexHost(env) {
  if (!BRIEFER_ENVS.includes(env)) {
    throw new Error(`[briefer] unknown env '${env}'; valid: ${BRIEFER_ENVS.join(', ')}`);
  }
  return new URL(ENV_ORIGINS[env]).host;
}
