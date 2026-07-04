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
export { registerServiceManifest } from './serviceManifest.js';
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
