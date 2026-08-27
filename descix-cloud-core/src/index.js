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
    createMeshContextVerifier,
} from './meshContext.js';

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
