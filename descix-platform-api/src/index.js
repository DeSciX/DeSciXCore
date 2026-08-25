/**
 * @descix/platform-api
 *
 * Shared platform infrastructure for DeSciX microservices.
 * Sits between @descix/cloud-core (GCP infra) and consuming services (Cloud + Powch).
 *
 * Sub-module exports are also available via named paths:
 *   import { ... } from '@descix/platform-api/models'
 *   import { ... } from '@descix/platform-api/auth'
 *   import { ... } from '@descix/platform-api/email'
 *   import { ... } from '@descix/platform-api/permissions'
 *   import { ... } from '@descix/platform-api/entitlements'
 *   import { ... } from '@descix/platform-api/manifest'
 */

// Models
export {
    Role,
    App,
    User,
    Community,
    UserCommunityStats,
    GuildSettings,
    Promotion,
    NFT,
    AdCampaign,
    SharedAsset,
    clean_name_for_id,
    count_tokens,
    matrix_to_bigquery,
    sanitizeCredentialId,
    get_default_community,
    getUserEntitlements
} from './models/index.js';

// Auth
export {
    createUserSession,
    sendEmailVerification,
    verifyEmailCode,
    migrateUserIfNeeded
} from './auth/index.js';

// Email
export {
    sendEmail,
    sendVerificationEmail,
    sendPaymentPending,
    sendPaymentConfirmation,
    normalizeEmail,
    base64UrlEncode
} from './email/index.js';

// Permissions
export {
    checkRoleBasedPermission,
    hasAnyAdminAccess,
    getUserAdminScope
} from './permissions/index.js';

// Entitlements
export {
    hydrateCommunityIdFromProducts
} from './entitlements/index.js';

// Manifest (service discovery)
export {
    buildManifestFromHandlers,
    buildManifestFromStatic,
    validateManifest,
    manifestMiddleware,
    computeManifestHash,
    computeManifestObjectHash
} from './manifest/index.js';

// Coordination-fabric vocabulary (a pure, dependency-free leaf; also at
// @descix/platform-api/fabric). Re-exported here so a consumer that already imports the package
// root does not reach for `src/fabric/vocab.js` by path and pin itself to a file location.
export {
    BEAT_CLOCK_FIELDS,
    BEAT_CLOCK_FIELD_NAMES,
    beatClockFieldFor,
    normalizeBeatClocks,
    judgeModelLiveness,
    beatClockAgeSeconds,
    beatClockAgeField,
    BEAT_CLOCK_AGE_FIELDS,
} from './fabric/index.js';

// Canonical id derivation (token <-> community <-> app)
export {
    communityIdFromTokenSymbol,
    assertValidAppShortName,
    composeAppId,
    composeUserAppId,
    composeUserDocServeUrl,
    TOKEN_SYMBOL_RE,
    APP_SHORT_NAME_RE
} from './naming/index.js';
