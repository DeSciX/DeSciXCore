/**
 * envOrigins — the ONE owner of "which URL is which DeSciX environment".
 *
 * The shipped SDK defaults to PROD: someone who installs @descix/app-sdk and runs
 * `descix serve` with no configuration talks to the public platform, not to an
 * internal environment and never to localhost. Reaching any other environment is
 * one command (`descix config set-env dev`), and localhost is reached by naming a
 * URL explicitly (`descix config set-env dev --url https://localhost:4000`, or
 * env.apiUrl) — there is no named localhost rung, because a URL is configuration,
 * not an environment.
 *
 * The CLI's WorkspaceConfig.ENV_MAP consumes this table and adds its own
 * ops-side concern (Secret Manager label). Nothing re-lists these URLs by hand.
 */

/** environment name → origin. */
export const ENV_ORIGINS = Object.freeze({
  dev: 'https://dev.descix.net',
  demo: 'https://demo.descix.net',
  prod: 'https://descix.net',
});

/** The environment an unconfigured workspace talks to. */
export const DEFAULT_ENV = 'prod';

/** Origin of DEFAULT_ENV — the unconfigured-workspace target. */
export const DEFAULT_API_URL = ENV_ORIGINS[DEFAULT_ENV];

/** Named origins, for callers that mean a specific environment. */
export const PROD_URL = ENV_ORIGINS.prod;
export const CLOUD_DEV_URL = ENV_ORIGINS.dev;
