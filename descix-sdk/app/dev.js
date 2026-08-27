/**
 * @descix/sdk/app/dev — the local dev gateway of the app half.
 *
 * RE-EXPORT, NEVER BUNDLE — forwards to @descix/app-sdk/dev, the one owner of the gateway that
 * enforces the platform's one-origin invariant locally (App Shell at /, your app at
 * /p/<app>, /apifront to the API), mirroring the production load balancer.
 *
 * Unlike ./app this entry EVALUATES under Node with only builtins at import time: vite is
 * resolved lazily, so `descix-app serve` starts without a bundler present.
 */
export * from '@descix/app-sdk/dev';
