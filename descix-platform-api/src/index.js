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
    EmailIdentityRefusal,
    EmailIdentityError,
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
    PASSKEY_FIELDS,
    PasskeyState,
    PasskeySource,
    PasskeyRecordError,
    PasskeyRecordRefusal,
    normalizePasskey,
    recoveredPasskeyDifferences,
    userAccountOwner,
    ACCOUNT_LIFECYCLE,
    accountLifecycleOf,
    get_default_community,
    getUserEntitlements
} from './models/index.js';

// Operator guards: THE operator email rule, the operator envs and the Firestore target check
// (also at @descix/platform-api/operator).
export {
    OPERATOR_ENVS,
    OperatorGuardRefusal,
    OperatorGuardError,
    normalizeOperatorEmailRule,
    operatorEmailAllowed,
    operatorEmailRuleForAddress,
    operatorEmailRulePrefixes,
    assertOperatorTarget
} from './operator/index.js';
// The database an operator run on an env must target, measured from the booted cloud-core config.
export { bootedEnvDatabaseId } from './operator/booted-database.js';

// Operator account admin: delete and merge, in-process only (also at @descix/platform-api/account-admin).
export {
    createAccountAdmin,
    ACCOUNT_PLAN_TTL_SECONDS,
    AccountAdminRefusal,
    AccountAdminError,
    accountAdminBlocker,
    DELETE_OUTCOME,
    MERGE_OUTCOME,
    MERGE_ROLLBACK_OUTCOME,
    RESTORE_OUTCOME,
    ACCOUNT_READ_LIMIT,
    STORE_OWNER_METHODS,
    STORE_OWNER_MERGE_METHODS,
    STORE_OWNER_RESTORE_METHOD,
    USER_OWNER_METHODS,
    deletePlanHash,
    mergePlanHash,
    REDACTED,
    redactCredentials,
    encodeStoreValue,
    decodeStoreTimestamp,
    receiptData,
    canonicalJson,
    accountAdminHash,
    nonJsonValuePath,
    unredactedCredentialPaths,
    footprintViolation,
    moveKey,
    credentialValues,
    secretPath,
    isSecretPath,
    entryDataHash,
    deleteExpectations,
    assertDeletePlanCurrent,
    assertDocumentAsPlanned,
    assertAccountStoreOwnerConforms,
    AccountStoreOwnerNonConformance
} from './account-admin/index.js';

// Auth
export {
    createUserSession,
    sendEmailVerification,
    verifyEmailCode,
    assertEmailVerifiedFor,
    EmailVerificationRefusal,
    migrateUserIfNeeded
} from './auth/index.js';

// Email
export {
    sendEmail,
    EMAIL_EXTRA_HEADERS,
    sendVerificationEmail,
    renderMigrationQueuedEmail,
    sendMigrationQueued,
    normalizeEmail,
    isValidEmail,
    maskEmail,
    base64UrlEncode
} from './email/index.js';

// Permissions
export {
    checkRoleBasedPermission,
    hasAnyAdminAccess,
    getUserAdminScope
} from './permissions/index.js';

// Entitlements
// resolveAppCommunityId is the AUTHORITATIVE derivation (app_id -> owning community, no request
// value consulted) and is what a security boundary must consume. hydrateCommunityIdFromProducts is
// the fill-if-absent convenience beside it. Exporting only the latter pointed every reader of this
// barrel at the one that is explicitly NOT an authorization primitive.
export {
    resolveAppCommunityId,
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
    APP_SHORT_NAME_RE,
    // Service domain — the platform derives it; a service never declares one.
    SERVICE_DOMAIN_IS_DERIVED,
    composeServiceDomain,
    isAppBoundService,
    resolveServiceDomain,
    // Reading a STORED manifest: the routable origin, or a loud refusal.
    SERVICE_NOT_ROUTABLE,
    requireServiceOrigin
} from './naming/index.js';
