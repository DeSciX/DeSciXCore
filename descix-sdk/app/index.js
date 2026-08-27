/**
 * @descix/sdk/app — the app shell of the one package.
 *
 * RE-EXPORT, NEVER BUNDLE. This file forwards to the PUBLISHED @descix/app-sdk, for the same
 * reason ./microservice forwards to @descix/cloud-core: a vendored copy would be two
 * derivations of one fact, and the copies would disagree the moment app-sdk ships a fix and
 * this package does not. The one-package story is about ONE INSTALL, not one codebase.
 *
 * WHY @descix/app-sdk IS AN OPTIONAL PEER, NOT A DEPENDENCY (contract-ws-c5-0-phase2-app-
 * subpath-and-install-size-gate, I-P2): the app half pulls React, MUI, wagmi/viem, reown and
 * vite. A community microservice consumes ./microservice and needs none of it. Declaring the
 * app half as a hard dependency would bill every headless service for a UI toolkit it never
 * loads, so it is declared `peerDependencies` + `peerDependenciesMeta { optional: true }` and
 * an install-size gate holds that line (scripts/check-install-size-cli.mjs).
 *
 * WHAT THAT MEANS FOR YOU: an APP developer runs
 *     npm i @descix/sdk @descix/app-sdk react react-dom
 * and imports from here. A MICROSERVICE developer runs `npm i @descix/sdk` and never touches
 * this subpath. Importing it without the peer installed fails loud at resolution with
 * ERR_MODULE_NOT_FOUND naming @descix/app-sdk — which is the correct outcome and the reason
 * there is no try/catch here inventing a friendlier half-working shim.
 *
 * THIS IS A BROWSER/BUNDLER ENTRY. It re-exports .jsx modules, so it RESOLVES under Node but
 * is not meant to EVALUATE there — your bundler compiles it. The Node-evaluable half of the
 * app story is ./app/dev, which is what the `descix-app` bin runs.
 */
export * from '@descix/app-sdk';
