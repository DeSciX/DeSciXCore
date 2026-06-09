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
    computeManifestHash
} from './manifest/index.js';

// Canonical id derivation (token <-> community <-> app)
export {
    communityIdFromTokenSymbol,
    assertValidAppShortName,
    composeAppId,
    TOKEN_SYMBOL_RE,
    APP_SHORT_NAME_RE
} from './naming/index.js';
