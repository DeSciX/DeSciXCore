/**
 * @descix/sdk/microservice — the microservice shell of the one package.
 *
 * RE-EXPORT, NEVER BUNDLE. This file forwards to the PUBLISHED @descix/cloud-core. A vendored
 * copy of cloud-core inside this package would be two derivations of one fact, which is the
 * drift the one-package story exists to end: the copies would disagree the moment cloud-core
 * ships a fix and this package does not.
 *
 * What a community microservice needs and gets here (measured against the published
 * @descix/cloud-core@1.0.1 tarball, 2026-08-27):
 *   createCloudConfig / getCloudConfig / initializeCloudConfig  — the config bootstrap
 *   killExistingProcess                                          — dev port reclamation
 *   createMeshContextVerifier                                    — INBOUND mesh caller auth
 *                                                                  (the signed _descix envelope)
 *   createServiceBootstrap                                       — manifest registration THROUGH
 *                                                                  the register_service door
 *   buildManifestFromHandlers / validateManifest /               — the self-describing manifest
 *     computeManifestHash / computeManifestObjectHash              the mesh generates docstrings from
 *   resolveServiceDomain / requireServiceOrigin /                — the platform's naming rules
 *     communityIdFromTokenSymbol / composeAppId
 *
 * NOT here, DEFERRED BY RULING (CCR-1, approved as option (a) 2026-08-27):
 *   createServiceApiClient — the OUTBOUND developer-wallet path. Its authorising ruling
 *     CEO-D-2026-06-02-APP-MICROSERVICE-IS-CLI-CLIENT-WALLET-SIG was knowingly superseded on
 *     2026-08-18 ("D1 accepted, D2 all apps"), which made client_credentials on the platform's
 *     own OAuth AS the canonical pattern for ALL app microservices. That replacement is not
 *     built yet, so the old path cannot be deleted either — but publishing it here would mint a
 *     superseded auth pattern as this package's permanent public API for every external
 *     developer. Blessing DEV-interim internal use is not the same permission as publishing.
 *     A consuming service keeps its DEV-only unpublished CLI dependency until the replacement
 *     lands; that exception is stated on the record rather than quietly satisfied.
 *
 * NOT here, deliberately:
 *   registerServiceManifest — DELETED from the public surface in this same change. It wrote the
 *     ServiceManifests collection directly, bypassing the platform's registration door: the
 *     platform DERIVES a service's domain at that door, so a direct write stored
 *     `service.domain === undefined` and the router composed `https://undefined/api` — a valid
 *     URL naming a host called "undefined", so nothing threw and the service simply never
 *     answered. It also skipped manifest vectorization, which is what makes a service's commands
 *     discoverable by tell_me_how. Use `createServiceBootstrap`, which consumes the door.
 */

export {
    createCloudConfig,
    getCloudConfig,
    initializeCloudConfig,
    CloudConfigFatalError,
    ProductTypes,
    LoginStatus,
    NetworkStatus,
    PERMISSIONS,
    GUEST_ALLOWED_COMMANDS,
    networkResponse,
    stripInvalidAndLower,
    MESH_CTX_FIELDS,
    MESH_CTX_HEADERS,
    DEFAULT_MAX_SKEW_MS,
    MeshContextError,
    normalizeMeshContext,
    serializeMeshContext,
    signMeshContext,
    buildOutboundMeshHeaders,
    verifyMeshContext,
    createMeshContextVerifier,
    getFirestoreInstance,
    publishMessage,
    killExistingProcess,
} from '@descix/cloud-core';

// Registration goes THROUGH the door — see the note above on registerServiceManifest.
export { createServiceBootstrap } from '@descix/cloud-core/service-bootstrap';

// The self-describing manifest: the mesh generates each command's MCP docstring from it.
export {
    buildManifestFromHandlers,
    buildManifestFromStatic,
    validateManifest,
    manifestMiddleware,
    computeManifestHash,
    computeManifestObjectHash,
} from '@descix/cloud-core/manifest';

// The platform's naming rules — a service must never re-derive its own domain or app id.
export {
    communityIdFromTokenSymbol,
    assertValidAppShortName,
    composeAppId,
    composeUserAppId,
    composeServiceDomain,
    isAppBoundService,
    resolveServiceDomain,
    requireServiceOrigin,
    SERVICE_DOMAIN_IS_DERIVED,
    SERVICE_NOT_ROUTABLE,
    TOKEN_SYMBOL_RE,
    APP_SHORT_NAME_RE,
} from '@descix/cloud-core/naming';
