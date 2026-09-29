/**
 * @descix/cloud-core - Shared platform services for DeSciX microservices.
 *
 * Usage:
 *   import { createCloudConfig, initializeCloudConfig, getCloudConfig } from '@descix/cloud-core';
 *   createCloudConfig({ rootPath: path.resolve(import.meta.url, '../../') });
 *   await initializeCloudConfig();
 *   const utils = getCloudConfig();
 */

export {
    createCloudConfig,
    getCloudConfig,
    initializeCloudConfig,
    CloudConfigFatalError,
    _resetCloudConfigForTests,
    ProductTypes,
    LoginStatus,
    NetworkStatus,
    PERMISSIONS,
    GUEST_ALLOWED_COMMANDS,
    networkResponse,
    stripInvalidAndLower,
    isSecretConfigKey,
    loggableConfigValue,
} from './config.js';

export {
    MESH_CTX_FIELDS,
    MESH_CTX_HEADERS,
    DEFAULT_MAX_SKEW_MS,
    MeshContextError,
    normalizeMeshContext,
    serializeMeshContext,
    signMeshContext,
    buildOutboundMeshHeaders,
    verifyMeshContext,
    MESH_TRUST_ANCHORS,
    MESH_VERIFY_MODES,
    resolveMeshTrustAnchor,
} from './meshContext.js';

// The mesh /api surface: one mount, gated by the posture CloudConfig resolved at boot.
export { mountMeshApi, MESH_API_PATH } from './meshApi.js';

/**
 * createMeshContextVerifier is no longer a service-facing API. Services built their own verifier
 * from their own copy of the platform key and decided for themselves whether to mount it — and
 * one that never set MESH_CTX_VERIFY_MODE served its /api to anyone. The posture is now decided
 * at boot by CloudConfig and the mount is mountMeshApi. This refusal names the replacement; there
 * is no compatibility path.
 */
export function createMeshContextVerifier() {
    throw new Error(
        'createMeshContextVerifier is no longer exported by @descix/cloud-core. A service does not build its ' +
        'own verifier or carry the platform key: set "MESH_CTX_VERIFY_MODE": "enforce" in defaults-config.json, ' +
        'delete MESH_CTX_PUBLIC_KEY / MESH_CTX_KEY_ID from every config file, and mount with ' +
        'mountMeshApi(app, apiRouter) after initializeCloudConfig(). This call site must change.'
    );
}

export { getFirestoreInstance } from './firestore.js';
export { publishMessage } from './pubsub.js';
/**
 * registerServiceManifest is DELETED. It wrote the ServiceManifests collection DIRECTLY,
 * bypassing the platform's registration door. The platform DERIVES a service's domain at that
 * door, so a direct write stored `service.domain === undefined` and the router composed
 * `https://undefined/api` — a valid URL naming a host called "undefined", so nothing threw,
 * nothing warned, and the service simply never answered. It also skipped manifest vectorization,
 * which is what makes a service's commands discoverable by tell_me_how.
 *
 * It is kept ONLY as a loud refusal that names its replacement. It does not register anything.
 */
export function registerServiceManifest() {
    throw new Error(
        'registerServiceManifest has been DELETED from @descix/cloud-core. It wrote the ' +
        'ServiceManifests collection directly, which bypassed the registration door where the ' +
        'platform derives service.domain — producing manifests that routed to ' +
        '"https://undefined/api" and were never vectorized for tell_me_how discovery. ' +
        'Use createServiceBootstrap({ manifest, selfRegister, coreApiUrl }).register() instead: ' +
        'it consumes the register_service door. There is no compatibility path — this call site ' +
        'must change.'
    );
}
export { killExistingProcess } from './processUtils.js';

export {
    Firestore,
    FieldValue,
    Timestamp,
    UserSession,
    UserOauthSession,
    AuthProvider,
    OAuth2Provider,
    CacheFirestore,
    FirestoreCollections,
    FirestoreDocumentPath,
    Document,
    get_results_from_bigquery,
    Purchase,
} from './storageUtils.js';
