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
