/**
 * @descix/platform-api - Firestore Models
 *
 * Platform-wide Firestore model classes shared between Cloud and Powch microservices.
 *
 * NOTE: KnowledgeBase, IPDocMetadata, and ChunkMetadata are intentionally NOT extracted here
 * because they contain dynamic imports to Cloud-specific services (pineconeService,
 * googleStorageService, geminiAPI). Those classes remain in Cloud's ipStorageUtils.js.
 *
 * All config values are loaded lazily via getCloudConfig() from @descix/cloud-core.
 * The bootstrap must complete before any model methods are called.
 */

import crypto from 'crypto';
import path from 'path';
import {
    CacheFirestore,
    FirestoreCollections,
    FirestoreDocumentPath,
    Purchase,
    AuthProvider,
    FieldValue,
    Timestamp,
    ProductTypes,
    getCloudConfig,
    Firestore,
} from '@descix/cloud-core';
import { normalizeEmail } from '../email/index.js';
import {
    AccountAdminRefusal,
    AccountAdminError,
    ACCOUNT_READ_LIMIT,
    accountAdminBlocker,
    receiptData,
    encodeStoreValue,
    canonicalJson,
    moveKey,
    secretPath,
    entryDataHash,
    assertDeletePlanCurrent,
    assertDocumentAsPlanned,
} from '../account-admin/contract.js';

/**
 * Why an email could not be attached to an account (one email, one account). Every refusal is
 * an EmailIdentityError carrying one of these as `code`; a consumer branches on the code, never
 * on the message.
 */
export const EmailIdentityRefusal = Object.freeze({
    /** No verified EMAIL_VERIFICATIONS record for this email. */
    NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    /** The verification record was requested by a different account. */
    VERIFICATION_NOT_YOURS: 'EMAIL_VERIFICATION_NOT_YOURS',
    /** The verification record is past its expires_at. */
    VERIFICATION_EXPIRED: 'EMAIL_VERIFICATION_EXPIRED',
    /** The verification record pre-dates the account binding (no uid field): request a new code. */
    VERIFICATION_UNBOUND: 'EMAIL_VERIFICATION_UNBOUND',
    /** Another (passkey) account already holds this email. */
    ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
    /** The only other holder is a legacy email-keyed account (USERS doc id = the email; no passkey). */
    ALREADY_REGISTERED_LEGACY: 'EMAIL_ALREADY_REGISTERED_LEGACY',
});

/** A refused email-to-account attachment. `statusCode` is the HTTP status a handler answers with. */
export class EmailIdentityError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'EmailIdentityError';
        this.code = code;
        this.statusCode = 403;
    }
}

// --- Helper Functions ---

export function clean_name_for_id(name) {
    if (!name) return '';
    const disallowed_chars = " #%&*+/=?^`{|}~";
    const transRegex = new RegExp(`[${disallowed_chars.split('').join('')}]`, 'g');
    return name.replace(/\s+/g, "_").toLowerCase().replace(transRegex, "");
}

export function count_tokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

export function matrix_to_bigquery(rows, projectId, datasetId, tableId, append) {
    console.log("matrix_to_bigquery stub called. Data not sent to BigQuery.");
    console.log("First row headers:", rows[0]);
    return `Stub run: ${new Date()}`;
}

/**
 * Sanitize WebAuthn credentialId for Firestore document ID (replace / and +)
 * @param {string} credentialId - Raw credential ID from WebAuthn
 * @returns {string} Sanitized string safe for Firestore doc IDs
 */
export function sanitizeCredentialId(credentialId) {
    if (!credentialId || typeof credentialId !== 'string') return '';
    return credentialId.replace(/\//g, '_').replace(/\+/g, '-');
}

/**
 * The passkey a Powch account was registered with: the `passkey` field of the USERS doc keyed by
 * sanitizeCredentialId(credential_id). Written once, by User.createForPasskey from a VERIFIED
 * registration; read at every sign-in by User.passkeyOf, whose public key is the only thing an
 * assertion signature is checked against. Public material only: no private key, no PRF output.
 */
export const PASSKEY_FIELDS = Object.freeze({
    credential_id: 'the credential id, base64url (sanitizeCredentialId of it is the account id)',
    public_key: 'the credential public key (COSE), base64url, from the verified registration',
    counter: 'the signature counter last verified (a passkey that does not count stays 0)',
    transports: 'the transports the browser reported at registration (array of strings, may be empty)',
    rp_id: 'the WebAuthn rpID the passkey was created for',
    registered_at: 'when the registration was verified (ISO string)',
    source: 'which owner write stored the record (a PasskeySource value); written by the owner, never by a caller',
});

/** Which owner write stored a passkey record: the `source` of every stored PASSKEY_FIELDS bag. */
export const PasskeySource = Object.freeze({
    /** User.createForPasskey, from a verified registration. */
    REGISTERED: 'registered',
    /** User.attachRecoveredPasskey, the operator upgrade of a key-less account; the only kind removeRecoveredPasskey deletes. */
    RECOVERED: 'recovered',
});

/** Where a credential id stands with respect to its account (User.passkeyOf). */
export const PasskeyState = Object.freeze({
    /** No USERS doc for this credential: no account was ever registered with it. */
    NOT_REGISTERED: 'NOT_REGISTERED',
    /** The account exists but holds no passkey public key: registered before keys were stored. */
    NO_PUBLIC_KEY: 'NO_PUBLIC_KEY',
    /** The account holds the passkey's public key. */
    REGISTERED: 'REGISTERED',
});

/** Why the owner refused a passkey record: the `code` of every PasskeyRecordError. */
export const PasskeyRecordRefusal = Object.freeze({
    INVALID: 'PASSKEY_RECORD_INVALID',
    ALREADY_REGISTERED: 'PASSKEY_ALREADY_REGISTERED',
    /** attach/remove: no USERS doc exists for the credential. */
    ACCOUNT_NOT_FOUND: 'PASSKEY_ACCOUNT_NOT_FOUND',
    /** attach: the account already holds a passkey public key; only a key-less account is upgraded. */
    KEY_ALREADY_ON_FILE: 'PASSKEY_KEY_ALREADY_ON_FILE',
    /** remove: the account does not hold exactly the key the operator wrote; nothing is removed. */
    ROLLBACK_MISMATCH: 'PASSKEY_ROLLBACK_MISMATCH',
    /** attach: the account is not a Powch passkey account of this credential (user_info.credentialId and the powch auth provider, as User._newDocData wrote them). */
    NOT_LEGACY_POWCH_ACCOUNT: 'PASSKEY_NOT_LEGACY_POWCH_ACCOUNT',
    /** remove: the stored record was not written by attachRecoveredPasskey (or carries no source); nothing is removed. */
    NOT_RECOVERED: 'PASSKEY_NOT_RECOVERED',
});

/** The fields that identify one written passkey record for a rollback: every PASSKEY_FIELDS key except
 * `counter`, which each verified sign-in advances after the write. */
const PASSKEY_IDENTITY_FIELDS = Object.freeze(Object.keys(PASSKEY_FIELDS).filter((k) => k !== 'counter'));

/** A passkey record refused by its owner. `code` is a PasskeyRecordRefusal value. */
export class PasskeyRecordError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'PasskeyRecordError';
        this.code = code;
    }
}

const BASE64URL = /^[A-Za-z0-9_-]+$/;
/** An operator range-read prefix: a lowercase local part ending in '@' or '+' (operatorEmailRulePrefixes). */
const EMAIL_PREFIX = /^[a-z0-9._%+-]+[@+]$/;

/**
 * The full passkey bag (every PASSKEY_FIELDS key) from a partial one, or a PasskeyRecordError naming the
 * first bad field. Nothing is defaulted except `transports` (absent = none reported); `source` must be a
 * PasskeySource value (a record without one is invalid).
 * @param {Object} partial
 * @returns {{ credential_id: string, public_key: string, counter: number, transports: string[], rp_id: string, registered_at: string, source: string }}
 */
export function normalizePasskey(partial) {
    const p = partial || {};
    const bad = (field, why) => new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `passkey.${field} ${why}`);
    if (typeof p.credential_id !== 'string' || !BASE64URL.test(p.credential_id)) throw bad('credential_id', 'must be a base64url string');
    if (typeof p.public_key !== 'string' || !BASE64URL.test(p.public_key)) throw bad('public_key', 'must be a base64url string');
    if (!Number.isInteger(p.counter) || p.counter < 0) throw bad('counter', 'must be a non-negative integer');
    const transports = p.transports ?? [];
    if (!Array.isArray(transports) || transports.some((t) => typeof t !== 'string')) throw bad('transports', 'must be an array of strings');
    if (typeof p.rp_id !== 'string' || p.rp_id.length === 0) throw bad('rp_id', 'must be a non-empty string');
    if (typeof p.registered_at !== 'string' || Number.isNaN(Date.parse(p.registered_at))) throw bad('registered_at', 'must be an ISO time string');
    if (!Object.values(PasskeySource).includes(p.source)) throw bad('source', `must be one of ${Object.values(PasskeySource).join(', ')}`);
    const out = {};
    for (const key of Object.keys(PASSKEY_FIELDS)) out[key] = key === 'transports' ? [...transports] : p[key];
    return out;
}

/**
 * A caller's passkey bag normalized as the record the owner write `source` stores. The owner writes
 * `source`: a caller bag naming another source is refused (PASSKEY_RECORD_INVALID).
 * @param {Object} partial
 * @param {string} source - a PasskeySource value
 */
function passkeyWrittenAs(partial, source) {
    const p = partial || {};
    if (p.source !== undefined && p.source !== source) {
        throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `passkey.source is written by the owner (${source} here); the bag names ${JSON.stringify(p.source)}`);
    }
    return normalizePasskey({ ...p, source });
}

/**
 * The USERS account id of a credential id, or PASSKEY_RECORD_INVALID when the id is not base64url.
 * @param {string} credential_id
 * @param {string} caller - the owner method, named in the refusal
 */
function passkeyAccountId(credential_id, caller) {
    const user_id = sanitizeCredentialId(credential_id);
    if (!user_id || !BASE64URL.test(credential_id)) {
        throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `${caller}: the credential id must be a base64url string`);
    }
    return user_id;
}

/**
 * The fields in which a stored passkey record differs from the record an operator receipt names: every
 * PASSKEY_FIELDS key except `counter` (sign-ins move it). [] means the account holds exactly the record
 * that attachRecoveredPasskey wrote from this receipt. The one comparison: removeRecoveredPasskey removes
 * only on [], and the operator re-key owner decides "this run's key" with it. Pure; reads nothing.
 * @param {Object|null} stored - the USERS doc's `passkey` field as read (null/undefined: none on file)
 * @param {Object} receiptPasskey - the bag the operator re-key recovered (its receipt's `passkey`)
 * @returns {string[]} the differing field names
 */
export function recoveredPasskeyDifferences(stored, receiptPasskey) {
    const bag = passkeyWrittenAs(receiptPasskey, PasskeySource.RECOVERED);
    if (stored == null) return [...PASSKEY_IDENTITY_FIELDS];
    if (stored.source !== PasskeySource.RECOVERED) return ['source'];
    const held = normalizePasskey(stored);
    return PASSKEY_IDENTITY_FIELDS.filter((k) => JSON.stringify(held[k]) !== JSON.stringify(bag[k]));
}

export async function get_default_community() {
    const utils = getCloudConfig();
    const community_id = utils.DEFAULT_COMMUNITY_ID;
    return await Community.from_firestore(community_id);
}

/**
 * Get user's entitlements for tell_me_how scope filtering.
 * Returns communities the user is a member of and apps they've purchased.
 *
 * @param {User|Object} user - User object or { id: user_id }
 * @returns {Promise<{communities: string[], apps: string[]}>}
 */
export async function getUserEntitlements(user) {
    if (!user || !user.id) {
        return { communities: [], apps: [] };
    }

    try {
        const db = new CacheFirestore();
        const purchaseDocs = await db.get_docs(FirestoreCollections.USER_PURCHASES(user.id));

        const communityIds = new Set();
        const appIds = new Set();

        if (purchaseDocs) {
            for (const purchaseData of purchaseDocs) {
                if (!purchaseData) continue;

                const productPath = purchaseData.ProductPath || '';
                const productType = purchaseData.ProductType || '';
                const parts = productPath.split('/');

                if (productType === ProductTypes.COMMUNITY) {
                    if (parts.length >= 2 && parts[0].toLowerCase() === 'community') {
                        communityIds.add(parts[1]);
                    }
                } else if (productType === ProductTypes.APP) {
                    if (parts.length >= 4 && parts[0].toLowerCase() === 'community' && parts[2].toLowerCase() === 'apps') {
                        communityIds.add(parts[1]);
                        appIds.add(parts[3]);
                    }
                }
            }
        }

        // Add public/free apps that everyone has access to
        try {
            const publicApps = await db.get_docs(
                'Community/daita/Apps',
                null,
                [['is_public', '==', true]]
            );
            if (publicApps) {
                for (const app of publicApps) {
                    if (app?.app_id) {
                        appIds.add(app.app_id);
                    }
                }
            }
        } catch (err) {
            console.warn('[getUserEntitlements] Failed to get public apps:', err.message);
        }

        // Always include 'daita' community (platform core)
        communityIds.add('daita');

        return {
            communities: Array.from(communityIds),
            apps: Array.from(appIds)
        };
    } catch (error) {
        console.error('[getUserEntitlements] Error:', error);
        return { communities: ['daita'], apps: [] };
    }
}

// --- Role Class ---

export class Role {
    constructor(
        role_id, role_name, role_description = '', scope, scope_id, permissions = [],
        price_usdsci = 0, purchase_type = 'ONE_TIME', discord_role_id = null,
        owner_id = null, created_date = null, updated_date = null,
        display_metadata = null,
        billing_period = null
    ) {
        this.role_id = role_id;
        this.role_name = role_name;
        this.role_description = role_description;
        this.scope = scope;
        this.scope_id = scope_id;
        this.permissions = permissions || [];
        this.price_usdsci = Number(price_usdsci) || 0;
        this.purchase_type = purchase_type || 'ONE_TIME';
        this.billing_period = billing_period || null;
        this.discord_role_id = discord_role_id;
        this.owner_id = owner_id;
        this.created_date = created_date instanceof Timestamp ? created_date : (created_date ? Timestamp.fromDate(new Date(created_date)) : Timestamp.now());
        this.updated_date = updated_date instanceof Timestamp ? updated_date : (updated_date ? Timestamp.fromDate(new Date(updated_date)) : Timestamp.now());

        this.display_metadata = display_metadata || {
            icon_url: null,
            category: null,
            short_description: null
        };

        this.db = new CacheFirestore();
    }

    get collection_path() {
        if (!this.scope || !this.scope_id) throw new Error("Role scope and scope_id are required to determine collection path.");
        return FirestoreCollections.ROLES(this.scope, this.scope_id);
    }

    get doc_id() {
        if (!this.role_id) throw new Error("Role ID is required for document ID.");
        return this.role_id;
    }

    get product_path() {
        return FirestoreDocumentPath.ROLE(this.scope, this.scope_id, this.role_id);
    }

    to_dict() {
        const result = {
            role_id: this.role_id,
            role_name: this.role_name,
            role_description: this.role_description,
            scope: this.scope,
            scope_id: this.scope_id,
            permissions: this.permissions,
            price_usdsci: this.price_usdsci,
            purchase_type: this.purchase_type,
            discord_role_id: this.discord_role_id,
            owner_id: this.owner_id,
            created_date: this.created_date,
            updated_date: this.updated_date,
            display_metadata: this.display_metadata
        };
        if (this.billing_period) {
            result.billing_period = this.billing_period;
        }
        return result;
    }

    static from_dict(data) {
        if (!data) return null;
        const created_date_obj = data.created_date instanceof Timestamp ? data.created_date : Timestamp.fromDate(new Date(data.created_date || Date.now()));
        const updated_date_obj = data.updated_date instanceof Timestamp ? data.updated_date : Timestamp.fromDate(new Date(data.updated_date || Date.now()));

        return new Role(
            data.role_id,
            data.role_name,
            data.role_description,
            data.scope,
            data.scope_id,
            data.permissions,
            data.price_usdsci,
            data.purchase_type,
            data.discord_role_id,
            data.owner_id,
            created_date_obj,
            updated_date_obj,
            data.display_metadata,
            data.billing_period || null
        );
    }

    async to_firestore() {
        if (!this.role_id || !this.scope || !this.scope_id) {
            console.error("Cannot save Role without role_id, scope, and scope_id.");
            return false;
        }
        this.updated_date = Timestamp.now();
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(scope, scope_id, role_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.ROLES(scope, scope_id), role_id);
        if (!doc) return null;
        return Role.from_dict(doc);
    }

    async delete_role() {
        if (!this.role_id || !this.scope || !this.scope_id) {
            console.error("Cannot delete Role without role_id, scope, and scope_id.");
            return false;
        }
        return await this.db.delete_doc(this.collection_path, this.doc_id);
    }

    static async create_role(user, role_id, role_name, role_description, scope, scope_id,
        permissions, price_usdsci, purchase_type, discord_role_id,
        display_metadata) {

        if (!role_id || !role_name || !scope || !scope_id) {
            throw new Error("Missing required parameters: role_id, role_name, scope, scope_id.");
        }

        if (!['PLATFORM', 'COMMUNITY', 'APP'].includes(scope.toUpperCase())) {
            throw new Error("Invalid scope. Must be PLATFORM, COMMUNITY, or APP.");
        }

        const existingRole = await Role.from_firestore(scope.toUpperCase(), scope_id, role_id);
        if (existingRole) {
            throw new Error(`Role with ID '${role_id}' already exists in scope '${scope}/${scope_id}'.`);
        }

        const newRole = new Role(
            role_id, role_name, role_description, scope.toUpperCase(), scope_id, permissions,
            price_usdsci, purchase_type, discord_role_id,
            user.id,
            null,
            null,
            display_metadata
        );

        const success = await newRole.to_firestore();
        if (!success) {
            throw new Error("Failed to save the new role to Firestore.");
        }

        return { role: newRole.to_dict() };
    }

    static async get_roles_for_scope(params) {
        const { scope, scope_id } = params;

        if (!scope || !scope_id) {
            throw new Error("Missing required parameters: scope, scope_id.");
        }
        if (!['PLATFORM', 'COMMUNITY', 'APP'].includes(scope.toUpperCase())) {
            throw new Error("Invalid scope. Must be PLATFORM, COMMUNITY, or APP.");
        }

        const db = new CacheFirestore();
        const rolesPath = FirestoreCollections.ROLES(scope.toUpperCase(), scope_id);
        const roleDocs = await db.get_docs(rolesPath);

        if (!roleDocs) {
            return { roles: [] };
        }

        const roles = roleDocs.map(doc => Role.from_dict(doc)).filter(role => role !== null);
        return { roles: roles.map(r => r.to_dict()) };
    }
}

// --- App Class ---

export class App {
    constructor(
        community_id, app_name, app_id = null, app_description = "",
        knowledgebase_name = null, icon_url = "",
        create_date = new Date(), ip_site_gcs_path_url = "", owner_id = "",
        price = 0, token_symbol = null, drive_folder_id = "",
        initial_daita_value = 0, api_base_url = null,
        // default_app_model: per CEO 2026-05-26 inheritance chain — when null/absent the
        // platform per-level model (levelConfig.model) wins. Only set when an app team
        // wants to pin a specific model regardless of intelligence level.
        default_app_model = null
    ) {
        const utils = getCloudConfig();
        this.community_id = String(community_id);
        this.app_name = String(app_name);
        this.app_id = app_id === null ? clean_name_for_id(app_name) : String(app_id);
        this.app_description = app_description;
        this.knowledgebase_name = String(knowledgebase_name || utils.DEFAULT_KNOWLEDGEBASE_NAME);
        this.icon_url = icon_url;
        this.ip_site_gcs_path_url = String(ip_site_gcs_path_url);
        this.create_date = create_date instanceof Date ? create_date : new Date(create_date);
        this.owner_id = String(owner_id);
        // default_app_model: keep as null/absent unless the caller passed an explicit value.
        // This avoids re-populating the doc with a model on every hydration,
        // which would shadow the per-level platform default at request time.
        this.default_app_model = default_app_model || null;
        this.default_prompt = utils.DEFAULT_COMMUNITY_PROMPT;
        this.price = price;
        this.token_symbol = token_symbol;
        this.drive_folder_id = drive_folder_id || "";
        this.initial_daita_value = initial_daita_value || 0;
        this.api_base_url = api_base_url;

        // Repo sharing fields (set post-construction via set_app_repo command)
        this.repo_url = null;
        this.repo_branch = null;
        this.repo_subfolder = null;
        this.repo_deploy_key = null;
        this.repo_key_fingerprint = null;

        this.db = new CacheFirestore();
    }

    get product_path() {
        return FirestoreDocumentPath.APP(this.community_id, this.app_id);
    }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.create_date instanceof Date && !isNaN(copy.create_date.getTime())) {
            copy.create_date = Timestamp.fromDate(copy.create_date);
        } else if (!copy.create_date || !(copy.create_date instanceof Timestamp)) {
            copy.create_date = Timestamp.now();
        }
        if (copy.initial_daita_value === undefined) copy.initial_daita_value = 0;
        return copy;
    }

    async to_firestore() {
        const apps_path = FirestoreCollections.APPS(this.community_id);
        return await this.db.put_doc(apps_path, this.app_id, this.to_dict());
    }

    static async from_firestore(community_id, app_id) {
        const db = new CacheFirestore();
        const apps_path = FirestoreCollections.APPS(community_id);
        const doc = await db.get_doc(apps_path, app_id);
        if (!doc) return null;
        const create_date_obj = doc.create_date instanceof Timestamp ? doc.create_date.toDate() : new Date(doc.create_date);
        const app = new App(
            doc.community_id || community_id,
            doc.app_name,
            doc.app_id || app_id,
            doc.app_description || "",
            doc.knowledgebase_name, doc.icon_url, create_date_obj, doc.ip_site_gcs_path_url,
            doc.owner_id || "", doc.price || 0, doc.token_symbol || null, doc.drive_folder_id || "",
            doc.initial_daita_value || 0,
            doc.api_base_url || null,
            doc.default_app_model || null   // hydrate from Firestore (null = use platform per-level)
        );
        app.repo_url = doc.repo_url || null;
        app.repo_branch = doc.repo_branch || null;
        app.repo_subfolder = doc.repo_subfolder || null;
        app.repo_deploy_key = doc.repo_deploy_key || null;
        app.repo_key_fingerprint = doc.repo_key_fingerprint || null;
        return app;
    }

    static quick_create_app(community_id, app_name, icon_url, app_description = "", owner_id = "", price = 0, token_symbol = null) {
        const utils = getCloudConfig();
        const knowledgebase_name = utils.DEFAULT_KNOWLEDGEBASE_NAME;
        const ip_site_gcs_path_url = "";
        const create_date = new Date();
        let app_id = clean_name_for_id(app_name);
        const app_doc = new App(community_id, app_name, app_id, app_description, knowledgebase_name, icon_url, create_date, ip_site_gcs_path_url, owner_id, price, token_symbol);
        app_doc.to_firestore();
        return app_doc;
    }

    static from_dict(data) {
        if (!data) return null;
        const utils = getCloudConfig();
        const create_date_obj = data.create_date instanceof Timestamp ? data.create_date.toDate() : new Date(data.create_date || Date.now());
        const app = new App(
            data.community_id,
            data.app_name,
            data.app_id,
            data.app_description || "",
            data.knowledgebase_name || utils.DEFAULT_KNOWLEDGEBASE_NAME,
            data.icon_url || "",
            create_date_obj,
            data.ip_site_gcs_path_url || "",
            data.owner_id || "",
            data.price || 0,
            data.token_symbol || null,
            data.drive_folder_id || "",
            data.initial_daita_value || 0,
            data.api_base_url || null,
            data.default_app_model || null   // hydrate from data dict
        );
        app.repo_url = data.repo_url || null;
        app.repo_branch = data.repo_branch || null;
        app.repo_subfolder = data.repo_subfolder || null;
        app.repo_deploy_key = data.repo_deploy_key || null;
        app.repo_key_fingerprint = data.repo_key_fingerprint || null;
        return app;
    }
}

// --- User Class ---

export class User {
    /**
     * The USERS fields only the operator stamps write, each transactionally: the merge stamp (markMigrated /
     * unmarkMigrated) and the delete stamp `admin_delete` (userAccountOwner.stampDelete / clearDeleteStamp).
     * to_dict never carries them, so no whole-document writer undoes or forges one.
     */
    static OPERATOR_STAMP_FIELDS = Object.freeze(['migrated_to', 'migrated_at', 'admin_delete']);

    constructor(
        id, email = null, user_info = null,
        wallet_address = null, signature = null,
        roles = new Map(),
        total_rep = 0, total_ref_generic = 0, total_dip = 0, claimed_promotions = [],
        accumulated_ref_commission = 0, accumulated_rep_commission = 0, accumulated_dip_commission = 0,
        provider_links = null,
        base_folder_id = null,
        nfts = new Map(),
        ad_campaigns = new Map(),
        pending_referral_code = null,
        api_signatures = [],
        point_multiplier = 1.0,
        lifetime_spend_usd = 0,
        pending_ref_count = 0
    ) {
        if (!id || typeof id !== 'string' || id.length === 0) {
            throw new Error('User ID is required (non-empty string)');
        }
        this.id = id;
        this.email = email ? normalizeEmail(email) : null;
        this.user_info = user_info;
        this.wallet_address = wallet_address;
        this.signature = signature;
        this.roles = roles instanceof Map ? roles : new Map(Object.entries(roles || {}));
        this.total_rep = total_rep;
        this.total_ref_generic = total_ref_generic;
        this.total_dip = total_dip;
        this.claimed_promotions = claimed_promotions || [];
        this.accumulated_ref_commission = accumulated_ref_commission;
        this.accumulated_rep_commission = accumulated_rep_commission;
        this.accumulated_dip_commission = accumulated_dip_commission;
        this.base_folder_id = base_folder_id || null;

        if (provider_links instanceof Map) {
            this.provider_links = provider_links;
        } else if (provider_links && typeof provider_links === 'object') {
            this.provider_links = new Map(Object.entries(provider_links));
        } else {
            this.provider_links = new Map();
        }

        this.nfts = nfts instanceof Map ? nfts : new Map(Object.entries(nfts || {}));
        this.ad_campaigns = ad_campaigns instanceof Map ? ad_campaigns : new Map(Object.entries(ad_campaigns || {}));
        this.pending_referral_code = pending_referral_code || null;
        this.api_signatures = Array.isArray(api_signatures) ? api_signatures : [];
        this.point_multiplier = point_multiplier || 1.0;
        this.lifetime_spend_usd = lifetime_spend_usd || 0;
        this.pending_ref_count = pending_ref_count || 0;

        this.db = new CacheFirestore();
    }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        // The operator stamps are written ONLY by their transactional writers: a whole-document write of an
        // instance hydrated before a merge, a delete's start or their undoing must never undo or forge one.
        for (const k of User.OPERATOR_STAMP_FIELDS) delete copy[k];
        copy.roles = copy.roles instanceof Map ? Object.fromEntries(copy.roles) : (copy.roles || {});
        copy.provider_links = copy.provider_links instanceof Map ? Object.fromEntries(copy.provider_links) : (copy.provider_links || {});
        copy.nfts = copy.nfts instanceof Map ? Object.fromEntries(copy.nfts) : (copy.nfts || {});
        copy.ad_campaigns = copy.ad_campaigns instanceof Map ? Object.fromEntries(copy.ad_campaigns) : (copy.ad_campaigns || {});

        if (!copy.claimed_promotions) copy.claimed_promotions = [];
        if (copy.total_rep === undefined) copy.total_rep = 0;
        if (copy.total_ref_generic === undefined) copy.total_ref_generic = 0;
        if (copy.total_dip === undefined) copy.total_dip = 0;
        if (copy.accumulated_ref_commission === undefined) copy.accumulated_ref_commission = 0;
        if (copy.accumulated_rep_commission === undefined) copy.accumulated_rep_commission = 0;
        if (copy.accumulated_dip_commission === undefined) copy.accumulated_dip_commission = 0;
        if (copy.base_folder_id === undefined) copy.base_folder_id = null;
        if (!Array.isArray(copy.api_signatures)) copy.api_signatures = [];
        if (copy.point_multiplier === undefined) copy.point_multiplier = 1.0;
        if (copy.lifetime_spend_usd === undefined) copy.lifetime_spend_usd = 0;
        if (copy.pending_ref_count === undefined) copy.pending_ref_count = 0;

        return copy;
    }

    static async from_firestore(user_id) {
        const db = new CacheFirestore();
        const user_doc = await db.get_doc(FirestoreCollections.USERS(), user_id);
        if (!user_doc) return null;

        let rolesMap = new Map();
        if (user_doc.roles && typeof user_doc.roles === 'object') {
            for (const [roleId, roleData] of Object.entries(user_doc.roles)) {
                rolesMap.set(roleId, roleData);
            }
        }

        let providerLinksMap = null;
        if (user_doc.provider_links && typeof user_doc.provider_links === 'object') {
            providerLinksMap = new Map(Object.entries(user_doc.provider_links));
        }

        const docId = user_id || user_doc.id || user_doc.email;
        if (!docId) {
            console.error('User document missing ID and email fields');
            return null;
        }

        let nftsMap = new Map(Object.entries(user_doc.nfts || {}));
        let adCampaignsMap = new Map(Object.entries(user_doc.ad_campaigns || {}));

        const user = new User(
            docId,
            user_doc.email || null,
            user_doc.user_info || null,
            user_doc.wallet_address || null,
            user_doc.signature || null,
            rolesMap,
            user_doc.total_rep || 0,
            user_doc.total_ref_generic || 0,
            user_doc.total_dip || 0,
            user_doc.claimed_promotions || [],
            user_doc.accumulated_ref_commission || 0,
            user_doc.accumulated_rep_commission || 0,
            user_doc.accumulated_dip_commission || 0,
            providerLinksMap,
            user_doc.base_folder_id || null,
            nftsMap,
            adCampaignsMap,
            user_doc.pending_referral_code || null,
            user_doc.api_signatures || []
        );

        // hydrate owner-method-backed fields that are NOT
        // constructor params. commitTosAndConnect/stampBaseEntitlements/markMigrated/
        // setPendingReferral write these via db.update_doc_fields (targeted field
        // writes onto FirestoreCollections.USERS()), so they exist on the Firestore
        // doc but were previously dropped on every from_firestore() load. Mirrors
        // Cloud ipStorageUtils.js User.from_firestore.
        user.tos_accepted_at = user_doc.tos_accepted_at || null;
        user.tos_version = user_doc.tos_version || null;
        user.gate_passed_at = user_doc.gate_passed_at || null;
        user.gate_source = user_doc.gate_source || null;
        user.verified_email = user_doc.verified_email || null;
        user.base_entitlements_stamp = user_doc.base_entitlements_stamp || null;
        user.migrated_to = user_doc.migrated_to || null;
        user.migrated_at = user_doc.migrated_at || null;
        user.pending_referral_guild_id = user_doc.pending_referral_guild_id || null;
        user.recovery_confirmed_at = user_doc.recovery_confirmed_at || null;

        return user;
    }

    /** The USERS doc a new account starts with (to_firestore and createForPasskey). */
    static _newDocData(user_id, user_info, auth_provider, discord_user_id, google_user_id) {
        return {
            id: user_id,
            email: user_info?.email || null,
            discord_user_id: discord_user_id,
            google_user_id: google_user_id,
            auth_providers: [auth_provider],
            user_info: user_info,
            wallet_address: null,
            signature: null,
            roles: {},
            nfts: {},
            ad_campaigns: {},
            total_rep: 0,
            total_ref_generic: 0,
            total_dip: 0,
            claimed_promotions: [],
            accumulated_ref_commission: 0,
            accumulated_rep_commission: 0,
            accumulated_dip_commission: 0
        };
    }

    /**
     * The one check that an account may receive a recovered passkey (attachRecoveredPasskey and
     * _passkeyRecoveryStatusOf both run it): the USERS doc exists (PASSKEY_ACCOUNT_NOT_FOUND), is the Powch
     * passkey account of `credential_id` as _newDocData writes one (`user_info.credentialId` equal to it and
     * AuthProvider.POWCH in `auth_providers`; a missing field refuses, PASSKEY_NOT_LEGACY_POWCH_ACCOUNT),
     * and holds no passkey key (PASSKEY_KEY_ALREADY_ON_FILE).
     * @param {{ exists: boolean, data: () => Object }} snap - the USERS doc snapshot
     * @param {string} credential_id
     * @param {string} user_id
     */
    static _refuseUnlessPasskeyRecoverable(snap, credential_id, user_id) {
        if (!snap.exists) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.ACCOUNT_NOT_FOUND, `no account ${user_id}; no recovered passkey can be attached`);
        }
        const doc = snap.data();
        const powch = doc?.user_info?.credentialId === credential_id
            && Array.isArray(doc?.auth_providers) && doc.auth_providers.includes(AuthProvider.POWCH);
        if (!powch) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.NOT_LEGACY_POWCH_ACCOUNT, `account ${user_id} is not a Powch passkey account of credential ${credential_id} (user_info.credentialId and the ${AuthProvider.POWCH} auth provider); no recovered passkey can be attached`);
        }
        if (doc.passkey != null) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.KEY_ALREADY_ON_FILE, `account ${user_id} already holds a passkey public key; no recovered passkey can be attached`);
        }
    }

    /**
     * Create the account for a newly registered passkey, holding its public key (PASSKEY_FIELDS), in ONE
     * create: the write fails when a USERS doc already exists for the credential, so a registration can
     * never overwrite another account's passkey, wallet or anything else (PASSKEY_ALREADY_REGISTERED).
     * Any other write failure throws. Returns the account id.
     * @param {Object} passkey - a PASSKEY_FIELDS bag (normalizePasskey)
     * @returns {Promise<string>}
     */
    static async createForPasskey(passkey) {
        const bag = passkeyWrittenAs(passkey, PasskeySource.REGISTERED);
        const user_id = sanitizeCredentialId(bag.credential_id);
        const data = {
            ...User._newDocData(user_id, { credentialId: bag.credential_id }, AuthProvider.POWCH, null, null),
            passkey: bag,
        };
        const ref = new CacheFirestore().db.collection(FirestoreCollections.USERS()).doc(user_id);
        try {
            await ref.create(data);
        } catch (e) {
            // gRPC ALREADY_EXISTS: Firestore's create() refuses an existing document.
            if (e?.code === 6) {
                throw new PasskeyRecordError(PasskeyRecordRefusal.ALREADY_REGISTERED, `An account is already registered for credential ${bag.credential_id}; nothing was written`);
            }
            throw new Error(`User.createForPasskey: the USERS create for ${user_id} failed (${e?.message || e}); no account was created`);
        }
        return user_id;
    }

    /**
     * Where a credential stands (PasskeyState) and, when REGISTERED, its normalized passkey bag. A failed
     * read throws: an unanswerable question is never read as "not registered".
     * @param {string} credential_id
     * @returns {Promise<{ state: string, user_id: string, passkey: Object|null }>}
     */
    static async passkeyOf(credential_id) {
        const user_id = passkeyAccountId(credential_id, 'User.passkeyOf');
        const snap = await new CacheFirestore().db.collection(FirestoreCollections.USERS()).doc(user_id).get();
        if (!snap.exists) return { state: PasskeyState.NOT_REGISTERED, user_id, passkey: null };
        const stored = snap.data()?.passkey;
        if (stored == null) return { state: PasskeyState.NO_PUBLIC_KEY, user_id, passkey: null };
        const passkey = normalizePasskey(stored);
        if (passkey.credential_id !== credential_id) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `User.passkeyOf: the account ${user_id} holds the passkey of another credential`);
        }
        return { state: PasskeyState.REGISTERED, user_id, passkey };
    }

    /**
     * Store the signature counter a verified sign-in reported, in one transaction that never lowers it:
     * two concurrent sign-ins (counters n+1 and n+2) leave n+2 whichever commits last. Throws when the
     * account holds no passkey or the write fails; refuses (PASSKEY_RECORD_INVALID) a stored record that is
     * not a valid PASSKEY_FIELDS bag (e.g. a non-integer counter) or belongs to another credential.
     * @param {string} credential_id
     * @param {number} counter
     */
    static async recordPasskeyCounter(credential_id, counter) {
        if (!Number.isInteger(counter) || counter < 0) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, 'passkey.counter must be a non-negative integer');
        }
        const user_id = sanitizeCredentialId(credential_id);
        const db = new CacheFirestore().db;
        const ref = db.collection(FirestoreCollections.USERS()).doc(user_id);
        try {
            await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                const stored = snap.exists ? snap.data()?.passkey : null;
                if (stored == null) throw new Error(`account ${user_id} holds no passkey`);
                const held = normalizePasskey(stored);
                if (held.credential_id !== credential_id) {
                    throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `User.recordPasskeyCounter: the account ${user_id} holds the passkey of another credential; the counter was not stored`);
                }
                if (held.counter >= counter) return;
                tx.update(ref, { 'passkey.counter': counter });
            });
        } catch (e) {
            if (e instanceof PasskeyRecordError) throw e;
            throw new Error(`User.recordPasskeyCounter: the USERS write for ${user_id} failed (${e?.message || e}); the counter was not stored`);
        }
    }

    /**
     * The one-time operator upgrade of an account registered before passkey public keys were stored
     * (PasskeyState.NO_PUBLIC_KEY): writes `passkey` (a PASSKEY_FIELDS bag the operator re-key recovered
     * and verified) in ONE transaction that refuses when the account does not exist
     * (PASSKEY_ACCOUNT_NOT_FOUND), is not the Powch passkey account of this credential
     * (PASSKEY_NOT_LEGACY_POWCH_ACCOUNT) or already holds a key (PASSKEY_KEY_ALREADY_ON_FILE), the check
     * passkeyRecoveryStatus reads ahead (_refuseUnlessPasskeyRecoverable). No other field is
     * touched. Reached only by the operator re-key owner (the Powch operator passkey re-key module);
     * no command, route or tool calls it.
     * @param {Object} passkey - a PASSKEY_FIELDS bag (normalizePasskey)
     * @returns {Promise<string>} the account id
     */
    static async attachRecoveredPasskey(passkey) {
        const bag = passkeyWrittenAs(passkey, PasskeySource.RECOVERED);
        const user_id = sanitizeCredentialId(bag.credential_id);
        const db = new CacheFirestore().db;
        const ref = db.collection(FirestoreCollections.USERS()).doc(user_id);
        await db.runTransaction(async (tx) => {
            User._refuseUnlessPasskeyRecoverable(await tx.get(ref), bag.credential_id, user_id);
            tx.update(ref, { passkey: bag });
        });
        return user_id;
    }

    /**
     * One USERS doc as the operator upgrade sees it (passkeyRecoveryStatus and passkeyRecoveryCandidates):
     * its account id, the credential id it is the Powch account of (user_info.credentialId when that is a
     * base64url id whose account id is this doc's, else null), its normalized `verified_email` (the one address
     * the upgrade judges an account by; the unverified `email` is not part of it),
     * when the doc was created (the snapshot's createTime as an ISO string; null when the read carries none),
     * and `refusal`: null when attachRecoveredPasskey would accept a key for it now, else the
     * PasskeyRecordRefusal code its check (_refuseUnlessPasskeyRecoverable) answers.
     * @param {{ exists: boolean, data: () => Object, createTime?: { toDate: () => Date } }} snap
     * @param {string} user_id
     */
    static _passkeyRecoveryStatusOf(snap, user_id) {
        const doc = snap.exists ? (snap.data() || {}) : null;
        const cid = doc?.user_info?.credentialId;
        const credential_id = typeof cid === 'string' && BASE64URL.test(cid) && sanitizeCredentialId(cid) === user_id ? cid : null;
        let refusal = null;
        if (!snap.exists) {
            refusal = PasskeyRecordRefusal.ACCOUNT_NOT_FOUND;
        } else if (credential_id === null) {
            refusal = PasskeyRecordRefusal.NOT_LEGACY_POWCH_ACCOUNT;
        } else {
            try {
                User._refuseUnlessPasskeyRecoverable(snap, credential_id, user_id);
            } catch (e) {
                if (!(e instanceof PasskeyRecordError)) throw e;
                refusal = e.code;
            }
        }
        return {
            user_id,
            credential_id,
            verified_email: typeof doc?.verified_email === 'string' ? normalizeEmail(doc.verified_email) : null,
            created_at: snap.createTime ? snap.createTime.toDate().toISOString() : null,
            refusal,
        };
    }

    /**
     * Read-only: where the account of `credential_id` stands for the operator upgrade, by the check
     * attachRecoveredPasskey runs in its transaction (see _passkeyRecoveryStatusOf for the shape; `refusal`
     * is null, PASSKEY_ACCOUNT_NOT_FOUND, PASSKEY_NOT_LEGACY_POWCH_ACCOUNT or PASSKEY_KEY_ALREADY_ON_FILE).
     * Throws PASSKEY_RECORD_INVALID for a credential id that is not base64url, and when the read fails.
     * Writes nothing. Reached only by the operator re-key owner (the Powch operator passkey re-key module).
     * @param {string} credential_id
     * @returns {Promise<{ user_id: string, credential_id: string|null, verified_email: string|null, created_at: string|null, refusal: string|null }>}
     */
    static async passkeyRecoveryStatus(credential_id) {
        const user_id = passkeyAccountId(credential_id, 'User.passkeyRecoveryStatus');
        const snap = await new CacheFirestore().db.collection(FirestoreCollections.USERS()).doc(user_id).get();
        return User._passkeyRecoveryStatusOf(snap, user_id);
    }

    /**
     * Read-only: every USERS doc whose `verified_email` starts with one of `emailPrefixes`, each as
     * _passkeyRecoveryStatusOf describes it (eligible or not), sorted by account id. A prefix is a lowercase
     * local part ending in '@' or '+' (e.g. 'operator@', 'operator+'): there is no unfiltered listing, and an empty or
     * malformed prefix list is refused (PASSKEY_RECORD_INVALID). The range reads compare the stored value as
     * written, case-sensitively: a verified_email stored with uppercase letters or surrounding spaces is not reached.
     * A failed read throws. Writes nothing. Reached only by the operator re-key owner.
     * @param {{ emailPrefixes: string[] }} args
     * @returns {Promise<Array<ReturnType<typeof User._passkeyRecoveryStatusOf>>>}
     */
    static async passkeyRecoveryCandidates({ emailPrefixes } = {}) {
        if (!Array.isArray(emailPrefixes) || emailPrefixes.length === 0 || emailPrefixes.some((p) => typeof p !== 'string' || !EMAIL_PREFIX.test(p))) {
            throw new PasskeyRecordError(PasskeyRecordRefusal.INVALID, `User.passkeyRecoveryCandidates: emailPrefixes must be a non-empty array of lowercase local parts ending in '@' or '+' (got ${JSON.stringify(emailPrefixes)}); there is no unfiltered listing`);
        }
        const users = new CacheFirestore().db.collection(FirestoreCollections.USERS());
        const byId = new Map();
        for (const prefix of new Set(emailPrefixes)) {
            let snap;
            try {
                snap = await users.where('verified_email', '>=', prefix).where('verified_email', '<', `${prefix}`).get();
            } catch (e) {
                throw new Error(`User.passkeyRecoveryCandidates: the USERS read on verified_email for '${prefix}' failed (${e?.message || e}); no listing`);
            }
            for (const doc of snap.docs) byId.set(doc.id, doc);
        }
        return [...byId.keys()].sort().map((id) => User._passkeyRecoveryStatusOf(byId.get(id), id));
    }

    /**
     * The rollback of attachRecoveredPasskey: deletes `passkey` ONLY when the stored record's source is
     * PasskeySource.RECOVERED and it is exactly the record the operator wrote (every PASSKEY_FIELDS key
     * except `counter`), returning the account to PasskeyState.NO_PUBLIC_KEY. Anything else is refused
     * (PASSKEY_ACCOUNT_NOT_FOUND, PASSKEY_NOT_RECOVERED, PASSKEY_ROLLBACK_MISMATCH) and nothing is written.
     * Reached only by the operator re-key owner (the Powch operator passkey re-key module).
     * @param {Object} passkey - the bag attachRecoveredPasskey wrote (the script's receipt)
     * @returns {Promise<string>} the account id
     */
    static async removeRecoveredPasskey(passkey) {
        const bag = passkeyWrittenAs(passkey, PasskeySource.RECOVERED);
        const user_id = sanitizeCredentialId(bag.credential_id);
        const db = new CacheFirestore().db;
        const ref = db.collection(FirestoreCollections.USERS()).doc(user_id);
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) {
                throw new PasskeyRecordError(PasskeyRecordRefusal.ACCOUNT_NOT_FOUND, `User.removeRecoveredPasskey: no account ${user_id}; nothing was written`);
            }
            const stored = snap.data()?.passkey;
            if (stored == null) {
                throw new PasskeyRecordError(PasskeyRecordRefusal.ROLLBACK_MISMATCH, `User.removeRecoveredPasskey: account ${user_id} holds no passkey key; nothing was written`);
            }
            if (stored.source !== PasskeySource.RECOVERED) {
                throw new PasskeyRecordError(PasskeyRecordRefusal.NOT_RECOVERED, `User.removeRecoveredPasskey: account ${user_id} holds a passkey record whose source is ${JSON.stringify(stored.source)}, not ${PasskeySource.RECOVERED}; only a record attachRecoveredPasskey wrote is removed; nothing was written`);
            }
            const differing = recoveredPasskeyDifferences(stored, bag);
            if (differing.length > 0) {
                throw new PasskeyRecordError(PasskeyRecordRefusal.ROLLBACK_MISMATCH, `User.removeRecoveredPasskey: account ${user_id} holds another passkey record (differs in ${differing.join(', ')}); nothing was written`);
            }
            tx.update(ref, { passkey: FieldValue.delete() });
        });
        return user_id;
    }

    static async to_firestore(user_id, user_info, auth_provider = 'discord') {
        const db = new CacheFirestore();
        const user = await db.get_doc(FirestoreCollections.USERS(), user_id);
        const email = user_info?.email || null;

        let discord_user_id = null;
        let google_user_id = null;

        if (auth_provider === 'discord') {
            discord_user_id = user_id;
        } else if (auth_provider === 'google') {
            if (user_id.startsWith('google_')) {
                google_user_id = user_id.substring(7);
            } else {
                google_user_id = user_id;
                user_id = `google_${user_id}`;
            }
        }

        const dataToStore = User._newDocData(user_id, user_info, auth_provider, discord_user_id, google_user_id);

        if (!user) {
            return await db.put_doc(FirestoreCollections.USERS(), user_id, dataToStore);
        } else {
            const updates = { user_info: user_info };
            if (user.email !== email && email) updates.email = email;

            if (auth_provider === 'discord' && !user.discord_user_id) {
                updates.discord_user_id = discord_user_id;
            }
            if (auth_provider === 'google' && !user.google_user_id) {
                updates.google_user_id = google_user_id;
            }

            const existingProviders = user.auth_providers || (user.discord_user_id ? ['discord'] : ['google']);
            if (!existingProviders.includes(auth_provider)) {
                updates.auth_providers = [...existingProviders, auth_provider];
            }

            if (user.roles === undefined) updates.roles = {};
            if (user.nfts === undefined) updates.nfts = {};
            if (user.ad_campaigns === undefined) updates.ad_campaigns = {};
            if (user.total_rep === undefined) updates.total_rep = 0;
            if (user.total_ref_generic === undefined) updates.total_ref_generic = 0;
            if (user.total_dip === undefined) updates.total_dip = 0;
            if (user.claimed_promotions === undefined) updates.claimed_promotions = [];
            if (user.accumulated_ref_commission === undefined) updates.accumulated_ref_commission = 0;
            if (user.accumulated_rep_commission === undefined) updates.accumulated_rep_commission = 0;
            if (user.accumulated_dip_commission === undefined) updates.accumulated_dip_commission = 0;

            return await db.update_doc_fields(FirestoreCollections.USERS(), user_id, updates);
        }
    }

    /** The PROVIDER_INDEX doc id for an email: `email_<sanitizeProviderId(normalized)>`. */
    static emailIndexKey(email) {
        const normalized = normalizeEmail(email);
        if (!normalized) throw new Error('User.emailIndexKey: an email is required');
        return `email_${User.sanitizeProviderId(normalized)}`;
    }

    /**
     * The one-email-one-account rule. Resolves when no
     * account other than `uid` holds `email`. "Holds" = the email ProviderIndex row points at
     * another account, another USERS doc carries the email as `email` or `verified_email`
     * (accounts that pre-date the index row), or a USERS doc is keyed by the email itself (the
     * legacy email-keyed form, which has no passkey). A USERS doc migrated into `uid` (migrated_to, the
     * operator merge) is not another holder. Throws EmailIdentityError
     * ALREADY_REGISTERED_LEGACY when every other holder is that legacy form, else
     * ALREADY_REGISTERED. A failed read throws: an unanswerable question is never read as "free".
     */
    static async assertEmailFreeFor(uid, email) {
        if (!uid || typeof uid !== 'string') throw new Error('User.assertEmailFreeFor: uid is required');
        const normalized = normalizeEmail(email);
        if (!normalized) throw new Error('User.assertEmailFreeFor: email is required');
        const db = new CacheFirestore();
        const index = await db.get_doc(FirestoreCollections.PROVIDER_INDEX(), User.emailIndexKey(normalized));
        const holders = new Set();
        // A record migrated INTO uid (markMigrated) is uid's own past, not another holder.
        const migratedIntoUid = (doc) => doc?.migrated_to === uid;
        if (index?.descix_user_id) holders.add(index.descix_user_id);
        const keyed = await db.get_doc(FirestoreCollections.USERS(), normalized);
        if (keyed && !migratedIntoUid(keyed)) holders.add(normalized);
        for (const field of ['email', 'verified_email']) {
            const docs = await db.get_docs_with_ids(FirestoreCollections.USERS(), null, [[field, '==', normalized]]);
            if (!Array.isArray(docs)) {
                throw new Error(`User.assertEmailFreeFor: the USERS query on ${field} failed; cannot tell whether the email is free`);
            }
            for (const d of docs) if (!migratedIntoUid(d)) holders.add(d._id);
        }
        holders.delete(uid);
        if (holders.size === 0) return;
        if ([...holders].every((id) => id === normalized)) {
            throw new EmailIdentityError(
                EmailIdentityRefusal.ALREADY_REGISTERED_LEGACY,
                'This email belongs to a DeSciX account created before passkeys. Use a different email; linking that account to a passkey is not available yet.'
            );
        }
        throw new EmailIdentityError(
            EmailIdentityRefusal.ALREADY_REGISTERED,
            'This email belongs to another account. Sign in with that account\'s passkey instead.'
        );
    }

    static async findByEmail(email) {
        if (!email) return null;
        const normalized = normalizeEmail(email);
        if (!normalized) return null;
        const db = new CacheFirestore();
        const index = await db.get_doc(FirestoreCollections.PROVIDER_INDEX(), User.emailIndexKey(normalized));
        if (index && index.descix_user_id) {
            return await User.from_firestore(index.descix_user_id);
        }
        return User.from_firestore(normalized);
    }

    static async findByWallet(walletAddress) {
        if (!walletAddress) return null;
        const normalizedAddress = walletAddress.toLowerCase();
        const db = new CacheFirestore();
        const index = await db.get_doc(FirestoreCollections.WALLET_INDEX(), normalizedAddress);
        if (!index || !index.descix_user_id) return null;
        return await User.from_firestore(index.descix_user_id);
    }

    static async findByProvider(providerType, providerId) {
        if (!providerType || !providerId) return null;
        const db = new CacheFirestore();
        const sanitizedId = User.sanitizeProviderId(providerId);
        const indexKey = `${providerType}_${sanitizedId}`;
        const index = await db.get_doc(FirestoreCollections.PROVIDER_INDEX(), indexKey);
        if (!index || !index.descix_user_id) return null;
        return await User.from_firestore(index.descix_user_id);
    }

    async linkProvider(providerType, providerId, providerData = {}) {
        if (!providerType || !providerId) {
            console.error('linkProvider: providerType and providerId are required');
            return false;
        }

        this.provider_links.set(providerType, {
            provider_id: providerId,
            linked_at: Timestamp.now(),
            provider_data: providerData
        });

        const db = new CacheFirestore();
        const sanitizedId = User.sanitizeProviderId(providerId);
        const indexKey = `${providerType}_${sanitizedId}`;
        await db.put_doc(FirestoreCollections.PROVIDER_INDEX(), indexKey, {
            descix_user_id: this.id,
            provider_type: providerType,
            provider_id: providerId,
            linked_at: Timestamp.now()
        });

        return await this.to_firestore();
    }

    static sanitizeProviderId(providerId) {
        if (!providerId) return '';
        if (providerId.includes('@') || providerId.includes('+') || providerId.includes('/')) {
            return crypto.createHash('sha256').update(providerId.toLowerCase()).digest('hex').substring(0, 32);
        }
        return providerId.replace(/[/.+@#[\]]/g, '_');
    }

    async unlinkProvider(providerType) {
        if (!providerType) {
            console.error('unlinkProvider: providerType is required');
            return false;
        }

        const providerLink = this.provider_links.get(providerType);
        if (!providerLink) {
            console.warn(`unlinkProvider: Provider ${providerType} not linked to user ${this.id}`);
            return false;
        }

        this.provider_links.delete(providerType);

        const db = new CacheFirestore();
        const sanitizedId = User.sanitizeProviderId(providerLink.provider_id);
        const indexKey = `${providerType}_${sanitizedId}`;
        await db.delete_doc(FirestoreCollections.PROVIDER_INDEX(), indexKey);

        const updatePath = `provider_links.${providerType}`;
        await db.update_doc_fields(FirestoreCollections.USERS(), this.id, {
            [updatePath]: FieldValue.delete()
        });

        return true;
    }

    async to_firestore() {
        if (!this.id) {
            console.error('User.to_firestore: User ID is required');
            return false;
        }
        const db = new CacheFirestore();
        return await db.put_doc(FirestoreCollections.USERS(), this.id, this.to_dict());
    }

    static async findByGoogleId(google_sub) {
        if (!google_sub) return null;
        const db = new CacheFirestore();
        const users = await db.get_docs(FirestoreCollections.USERS(), null, [['google_user_id', '==', google_sub]]);
        if (users && users.length > 0) {
            const userDoc = users[0];
            return User.from_firestore(userDoc.id);
        }
        const userId = `google_${google_sub}`;
        return await User.from_firestore(userId);
    }

    async addApiSignature(name, walletAddress, signature, options = {}) {
        const signatureId = crypto.randomUUID();
        const signatureRecord = {
            id: signatureId,
            name: name || 'Unnamed Client',
            wallet_address: walletAddress,
            signature: signature,
            created_at: new Date().toISOString(),
            last_used: null,
            permissions: options.permissions || { read: true, write: false, admin: false },
            communities: options.communities || []
        };

        this.api_signatures.push(signatureRecord);

        const db = new CacheFirestore();
        const signatureKey = crypto.createHash('sha256').update(signature).digest('hex').substring(0, 32);
        await db.put_doc(FirestoreCollections.SIGNATURE_INDEX(), signatureKey, {
            user_id: this.id,
            signature_id: signatureId,
            wallet_address: walletAddress,
            created_at: Timestamp.now()
        });

        await this.to_firestore();
        return signatureRecord;
    }

    async revokeApiSignature(signatureId) {
        const sigIndex = this.api_signatures.findIndex(s => s.id === signatureId);
        if (sigIndex === -1) {
            console.warn(`revokeApiSignature: Signature ${signatureId} not found`);
            return false;
        }

        const sig = this.api_signatures[sigIndex];

        const db = new CacheFirestore();
        const signatureKey = crypto.createHash('sha256').update(sig.signature).digest('hex').substring(0, 32);
        await db.delete_doc(FirestoreCollections.SIGNATURE_INDEX(), signatureKey);

        this.api_signatures.splice(sigIndex, 1);
        await this.to_firestore();

        return true;
    }

    static async findBySignature(signature) {
        if (!signature) return null;

        const db = new CacheFirestore();
        const signatureKey = crypto.createHash('sha256').update(signature).digest('hex').substring(0, 32);
        const indexEntry = await db.get_doc(FirestoreCollections.SIGNATURE_INDEX(), signatureKey);

        if (!indexEntry || !indexEntry.user_id) return null;

        const user = await User.from_firestore(indexEntry.user_id);
        if (!user) return null;

        const signatureRecord = user.api_signatures.find(s => s.id === indexEntry.signature_id);
        if (!signatureRecord) return null;

        signatureRecord.last_used = new Date().toISOString();
        await user.to_firestore();

        return { user, signatureRecord };
    }

    listApiSignatures() {
        return this.api_signatures.map(sig => ({
            ...sig,
            signature: sig.signature ? `${sig.signature.substring(0, 10)}...${sig.signature.substring(sig.signature.length - 6)}` : null
        }));
    }

    hasRole(role_id) {
        if (!this.roles.has(role_id)) {
            return false;
        }
        const roleData = this.roles.get(role_id);
        if (roleData && roleData.expires_date) {
            const expiryDate = roleData.expires_date instanceof Timestamp
                ? roleData.expires_date.toDate()
                : (roleData.expires_date instanceof Date ? roleData.expires_date : new Date(roleData.expires_date));
            return expiryDate > new Date();
        }
        return true;
    }

    getRoleAcquisitionDate(role_id) {
        return this.roles.get(role_id)?.acquired_date;
    }

    async addRole(role_id, acquisitionDetails = { acquired_date: Timestamp.now() }) {
        const updatePath = `roles.${role_id}`;
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, { [updatePath]: acquisitionDetails });
    }

    async removeRole(role_id) {
        const updatePath = `roles.${role_id}`;
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, { [updatePath]: FieldValue.delete() });
    }

    async checkSubscription(context = {}) {
        const { communityId, appId, target = 'chat' } = context;
        if (!communityId) return { verified: false, message: 'Community ID required' };

        const subscriptionRoleIds = [];
        subscriptionRoleIds.push(`community_${communityId}_${target}`);
        subscriptionRoleIds.push(`community_${communityId}_chat`);
        if (appId) {
            subscriptionRoleIds.push(`app_${communityId}_${appId}_${target}`);
            subscriptionRoleIds.push(`app_${communityId}_${appId}_chat`);
        }

        let activeRoleId = null;
        let expiresAt = null;

        for (const roleId of subscriptionRoleIds) {
            if (this.hasRole(roleId)) {
                activeRoleId = roleId;
                const roleData = this.roles.get(roleId);
                if (roleData && roleData.expires_date) {
                    expiresAt = roleData.expires_date instanceof Timestamp
                        ? roleData.expires_date.toDate()
                        : (roleData.expires_date instanceof Date ? roleData.expires_date : new Date(roleData.expires_date));
                }
                return {
                    verified: true,
                    hasSubscription: true,
                    activeRoleId: activeRoleId,
                    expiresAt: expiresAt ? expiresAt.toISOString() : null,
                    communityId: communityId,
                    appId: appId,
                    target: target,
                    message: `Access verified${expiresAt ? ` (expires: ${expiresAt.toISOString()})` : ''}`
                };
            }
        }

        // Check Purchases (fallback)
        const purchases = await this.get_purchases();
        for (const purchase of purchases) {
            if (purchase.ExpiresAt) {
                const expiryDate = purchase.ExpiresAt instanceof Timestamp
                    ? purchase.ExpiresAt.toDate()
                    : (purchase.ExpiresAt instanceof Date ? purchase.ExpiresAt : new Date(purchase.ExpiresAt));

                if (expiryDate > new Date()) {
                    const productPath = purchase.ProductPath || '';
                    if (productPath.includes(`/Community/${communityId}`) ||
                        (appId && productPath.includes(`/App/${appId}`))) {
                        return {
                            verified: true,
                            hasSubscription: true,
                            expiresAt: expiryDate.toISOString(),
                            communityId: communityId,
                            appId: appId,
                            target: target,
                            message: `Access verified via purchase (expires: ${expiryDate.toISOString()})`
                        };
                    }
                }
            }
        }

        return {
            verified: false,
            hasSubscription: false,
            communityId: communityId,
            appId: appId,
            target: target,
            message: `No active subscription found for ${target} access.`
        };
    }

    async set_wallet_address_and_signature(wallet_address, signature) {
        const normalizedAddress = wallet_address?.toLowerCase() || wallet_address;

        if (normalizedAddress) {
            const existingUser = await User.findByWallet(normalizedAddress);
            if (existingUser && existingUser.id !== this.id) {
                throw new Error(`Wallet address ${wallet_address} is already associated with another account`);
            }

            if (this.wallet_address && this.wallet_address !== normalizedAddress) {
                await this.db.delete_doc(FirestoreCollections.WALLET_INDEX(), this.wallet_address);
            }

            await this.db.put_doc(FirestoreCollections.WALLET_INDEX(), normalizedAddress, {
                descix_user_id: this.id,
                wallet_address: normalizedAddress,
                linked_at: Timestamp.now()
            });
        }

        this.wallet_address = normalizedAddress;
        this.signature = signature;
        const updates = { wallet_address: normalizedAddress, signature: signature };
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
    }

    // --- User-Domain Owner Methods ---
    async commitTosAndConnect({ tos_version, gate_source, verified_email } = {}) {
        const updates = {
            tos_accepted_at: Timestamp.now(),
            tos_version: tos_version || '1.0.0',
            gate_passed_at: Timestamp.now(),
            gate_source: gate_source
        };
        const normalized = verified_email ? normalizeEmail(verified_email) : null;
        if (normalized) {
            // One email, one account: refuse before any write, then write the
            // email ProviderIndex row findByEmail reads, and release this account's previous row.
            await User.assertEmailFreeFor(this.id, normalized);
            const key = User.emailIndexKey(normalized);
            const wrote = await this.db.put_doc(FirestoreCollections.PROVIDER_INDEX(), key, {
                descix_user_id: this.id,
                provider_type: 'email',
                provider_id: normalized,
                linked_at: Timestamp.now()
            });
            if (wrote !== true) {
                throw new Error(`commitTosAndConnect: the email ProviderIndex write (${key}) failed; the email was not committed`);
            }
            const previous = normalizeEmail(this.email);
            if (previous && previous !== normalized) {
                const prevKey = User.emailIndexKey(previous);
                const prevRow = await this.db.get_doc(FirestoreCollections.PROVIDER_INDEX(), prevKey);
                if (prevRow?.descix_user_id === this.id) {
                    await this.db.delete_doc(FirestoreCollections.PROVIDER_INDEX(), prevKey);
                }
            }
            updates.verified_email = normalized;
            updates.email = normalized;
        }
        const result = await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
        this.tos_accepted_at = updates.tos_accepted_at;
        this.tos_version = updates.tos_version;
        this.gate_passed_at = updates.gate_passed_at;
        this.gate_source = updates.gate_source;
        if (normalized) {
            this.verified_email = normalized;
            this.email = normalized;
        }
        return result;
    }

    isConnected() {
        return !!this.tos_accepted_at;
    }

    /**
     * Wallet cold-storage backup (design 2026-10-23): the user confirmed "I have printed or written it
     * down" for the recovery sheet. Stores only when (ISO string); the sheet never reaches the server.
     */
    async confirmRecovery() {
        const recovery_confirmed_at = new Date().toISOString();
        const result = await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, { recovery_confirmed_at });
        if (result !== true) {
            throw new Error(`User.confirmRecovery: the USERS write for ${this.id} failed; recovery_confirmed_at was not stored`);
        }
        this.recovery_confirmed_at = recovery_confirmed_at;
        return recovery_confirmed_at;
    }

    hasConfirmedRecovery() {
        return typeof this.recovery_confirmed_at === 'string' && this.recovery_confirmed_at.length > 0;
    }

    async stampBaseEntitlements(stamp) {
        const updates = { base_entitlements_stamp: stamp };
        this.base_entitlements_stamp = stamp;
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
    }

    hasBaseEntitlementStamp(stamp) {
        return this.base_entitlements_stamp === stamp;
    }

    async setPendingReferral(code, guild_id = null) {
        const updates = { pending_referral_code: code };
        this.pending_referral_code = code;
        if (guild_id !== null) {
            updates.pending_referral_guild_id = guild_id;
            this.pending_referral_guild_id = guild_id;
        }
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
    }

    async clearPendingReferral() {
        // Symmetric with setPendingReferral(code, guild_id): clears BOTH fields it can set.
        // Mirrors Cloud ipStorageUtils.js User.clearPendingReferral.
        const updates = { pending_referral_code: null, pending_referral_guild_id: null };
        this.pending_referral_code = null;
        this.pending_referral_guild_id = null;
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
    }

    async setBaseFolderId(id) {
        const updates = { base_folder_id: id };
        this.base_folder_id = id;
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, updates);
    }

    /**
     * Mark this record as migrated into account `to` (the merge of a legacy record into its passkey
     * account): writes `migrated_to` and `migrated_at`, in ONE transaction that refuses when this USERS doc
     * does not exist (ACCOUNT_NOT_FOUND) or is already migrated (ACCOUNT_MERGE_ALREADY_MIGRATED). Any other
     * failure throws ACCOUNT_STORE_WRITE_FAILED. Reached by the operator account admin (userAccountOwner).
     * @param {string} to - the surviving account id
     * @returns {Promise<true>}
     */
    async markMigrated(to) {
        if (typeof to !== 'string' || !to || to === this.id) {
            throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_MERGE_SAME_RECORD, `User.markMigrated: ${this.id} can only be migrated into another account id (got ${JSON.stringify(to)}); nothing was written`);
        }
        const USERS = FirestoreCollections.USERS();
        const db = new CacheFirestore().db;
        const ref = db.collection(USERS).doc(this.id);
        const migrated_at = Timestamp.now();
        await userStoreWrite(USERS, `${this.id} migrated_to`, () => db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `User.markMigrated: no USERS doc ${this.id}; nothing was written`);
            const current = snap.data()?.migrated_to ?? null;
            if (current !== null) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_MERGE_ALREADY_MIGRATED, `User.markMigrated: ${this.id} is already migrated to ${current}; nothing was written`);
            tx.update(ref, { migrated_to: to, migrated_at });
        }));
        this.migrated_to = to;
        this.migrated_at = migrated_at;
        return true;
    }

    /**
     * The rollback of markMigrated: deletes `migrated_to` and `migrated_at` ONLY when this record is migrated
     * into exactly `to`, in one transaction; anything else refuses (ACCOUNT_NOT_FOUND, ACCOUNT_PLAN_STALE)
     * and writes nothing. Reached by the operator account admin (userAccountOwner).
     * @param {string} to - the account id the merge receipt says this record was migrated into
     * @returns {Promise<true>}
     */
    async unmarkMigrated(to) {
        const USERS = FirestoreCollections.USERS();
        const db = new CacheFirestore().db;
        const ref = db.collection(USERS).doc(this.id);
        await userStoreWrite(USERS, `${this.id} migrated_to`, () => db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `User.unmarkMigrated: no USERS doc ${this.id}; nothing was written`);
            const current = snap.data()?.migrated_to ?? null;
            if (current !== to) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `User.unmarkMigrated: ${this.id} is migrated to ${JSON.stringify(current)}, not ${to}; nothing was written`);
            tx.update(ref, { migrated_to: FieldValue.delete(), migrated_at: FieldValue.delete() });
        }));
        this.migrated_to = null;
        this.migrated_at = null;
        return true;
    }
    // --- End User-Domain Owner Methods ---

    async incrementRep(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'total_rep', FieldValue.increment(amount));
    }
    async incrementDip(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'total_dip', FieldValue.increment(amount));
    }
    async incrementRefGeneric(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'total_ref_generic', FieldValue.increment(amount));
    }
    async incrementRefCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_ref_commission', FieldValue.increment(amount));
    }
    async incrementRepCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_rep_commission', FieldValue.increment(amount));
    }
    async incrementDipCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_dip_commission', FieldValue.increment(amount));
    }
    async incrementPendingRef(amount) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'pending_ref_count', FieldValue.increment(amount));
    }
    async addClaimedPromotion(promotion_custom_id) {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'claimed_promotions', FieldValue.arrayUnion(promotion_custom_id));
    }
    async resetGenericRef() {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'total_ref_generic', 0);
    }
    async resetClaimedPromotions() {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'claimed_promotions', []);
    }
    async resetRefCommission() {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_ref_commission', 0);
    }
    async resetRepCommission() {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_rep_commission', 0);
    }
    async resetDipCommission() {
        return await this.db.update_doc_field(FirestoreCollections.USERS(), this.id, 'accumulated_dip_commission', 0);
    }

    async getCommunityStats(community_id) {
        let stats = await UserCommunityStats.from_firestore(this.id, community_id);
        if (!stats) {
            stats = new UserCommunityStats(this.id, community_id);
        }
        return stats;
    }

    async incrementCommunityRep(community_id, amount) {
        const statsPath = FirestoreCollections.USER_COMMUNITY_STATS(this.id);
        const statsExists = await this.db.doc_exists(statsPath, community_id);
        if (!statsExists) {
            const initialStats = new UserCommunityStats(this.id, community_id, amount, 0, 0);
            return await initialStats.to_firestore();
        } else {
            return await this.db.update_doc_field(statsPath, community_id, 'community_rep', FieldValue.increment(amount));
        }
    }

    async incrementCommunityRef(community_id, amount) {
        const statsPath = FirestoreCollections.USER_COMMUNITY_STATS(this.id);
        const statsExists = await this.db.doc_exists(statsPath, community_id);
        if (!statsExists) {
            const initialStats = new UserCommunityStats(this.id, community_id, 0, amount, 0);
            return await initialStats.to_firestore();
        } else {
            return await this.db.update_doc_field(statsPath, community_id, 'community_ref', FieldValue.increment(amount));
        }
    }

    async incrementCommunityDip(community_id, amount) {
        const statsPath = FirestoreCollections.USER_COMMUNITY_STATS(this.id);
        const statsExists = await this.db.doc_exists(statsPath, community_id);
        if (!statsExists) {
            const initialStats = new UserCommunityStats(this.id, community_id, 0, 0, amount);
            return await initialStats.to_firestore();
        } else {
            return await this.db.update_doc_field(statsPath, community_id, 'community_dip', FieldValue.increment(amount));
        }
    }

    async resetCommunityRef(community_id) {
        const statsPath = FirestoreCollections.USER_COMMUNITY_STATS(this.id);
        const statsExists = await this.db.doc_exists(statsPath, community_id);
        if (statsExists) {
            return await this.db.update_doc_field(statsPath, community_id, 'community_ref', 0);
        }
        return true;
    }

    async get_purchases() {
        const purchaseDocs = await this.db.get_docs(FirestoreCollections.USER_PURCHASES(this.id));
        if (!purchaseDocs) return [];
        return purchaseDocs.map(doc => doc ? Purchase.from_dict(doc, this.id) : null)
            .filter(p => p !== null);
    }

    static async get_user_purchased_community_and_app_objects(user_id) {
        const db = new CacheFirestore();
        const purchaseDocs = await db.get_docs(FirestoreCollections.USER_PURCHASES(user_id));
        const communityIds = new Set();
        const appPairs = [];

        if (purchaseDocs) {
            const communityPurchases = [];
            const appPurchases = [];
            for (const purchaseData of purchaseDocs) {
                const purchase = Purchase.from_dict(purchaseData, user_id);
                if (!purchase) continue;
                if (purchase.ProductType === ProductTypes.COMMUNITY) communityPurchases.push(purchase);
                else if (purchase.ProductType === ProductTypes.APP) appPurchases.push(purchase);
            }

            for (const purchase of communityPurchases) {
                const parts = purchase.ProductPath.split('/');
                if (parts.length >= 2 && parts[0].toLowerCase() === 'community') {
                    communityIds.add(parts[1]);
                }
            }

            const productLookups = await Promise.all(
                appPurchases.map(p => db.get_doc('Products', p.PurchaseId))
            );
            for (let i = 0; i < appPurchases.length; i++) {
                const productDoc = productLookups[i];
                const purchase = appPurchases[i];
                if (productDoc?.community_id) {
                    appPairs.push({ community: productDoc.community_id, app: purchase.PurchaseId });
                } else {
                    const parts = purchase.ProductPath.split('/');
                    if (parts.length >= 4 && parts[0].toLowerCase() === 'community' && parts[2].toLowerCase() === 'apps') {
                        appPairs.push({ community: parts[1], app: parts[3] });
                    }
                }
            }
        }

        const communities = communityIds.size > 0
            ? (await Promise.all(Array.from(communityIds).map(id => Community.from_firestore(id)))).filter(c => c !== null)
            : [];
        const apps = appPairs.length > 0
            ? (await Promise.all(appPairs.map(p => App.from_firestore(p.community, p.app)))).filter(a => a !== null)
            : [];

        return { communities, apps };
    }

    async get_user_info() {
        const user = await User.from_firestore(this.id);
        return user ? user.user_info : null;
    }

    async set_user_info(user_info) {
        return await this.db.update_doc_fields(FirestoreCollections.USERS(), this.id, { user_info: user_info });
    }

    async is_registered() {
        return await this.db.doc_exists(FirestoreCollections.USERS(), this.id);
    }

    async get_user_purchases(product_type = null) {
        let whereClause = null;
        if (product_type) {
            whereClause = [['ProductType', '==', product_type]];
        }
        const purchaseDocs = await this.db.get_docs(FirestoreCollections.USER_PURCHASES(this.id), null, whereClause);
        if (!purchaseDocs) return [];
        return purchaseDocs.map(doc => doc ? Purchase.from_dict(doc, this.id) : null)
            .filter(p => p !== null);
    }

    async get_user_communities() {
        const community_purchases = await this.get_user_purchases(ProductTypes.COMMUNITY);
        const doc_ids = community_purchases.map(purchase => {
            const parts = purchase.ProductPath.split('/');
            return (parts.length >= 2 && parts[0].toLowerCase() === 'community') ? parts[1] : null;
        }).filter(id => id !== null);

        if (doc_ids.length === 0) return [];

        const communityPromises = doc_ids.map(id => Community.from_firestore(id));
        const communities = await Promise.all(communityPromises);
        return communities.filter(c => c !== null);
    }

    async purchase_product_firestore(product_path, product_type, project_token = null, purchase_price = 0.0, purchase_id = null) {
        const utils = getCloudConfig();
        const token = project_token || utils.DEFAULT_COMMUNITY_ID;
        const db = new CacheFirestore();
        let userPurchasesCollectionPath = FirestoreCollections.USER_PURCHASES(this.id);

        if (purchase_id && product_type === ProductTypes.APP) {
            const existing = await db.get_doc(userPurchasesCollectionPath, purchase_id);
            if (existing) {
                console.log(`User ${this.id} already has entitlement for ${purchase_id}. Skipping.`);
                return { success: true, isNewPurchase: false };
            }
        } else if (product_type !== ProductTypes.ROLE) {
            const existing = await db.get_docs(userPurchasesCollectionPath, null, [['ProductPath', '==', product_path]]);
            if (existing && existing.length > 0) {
                console.log(`User ${this.id} already purchased ${product_path}. Skipping.`);
                return { success: true, isNewPurchase: false };
            }
        }

        if (!purchase_id) purchase_id = crypto.randomUUID();
        const purchase = new Purchase(product_path, token, purchase_price, new Date(), this.id, product_type, purchase_id);
        const purchase_success = await purchase.to_firestore();

        if (purchase_success && product_type === ProductTypes.COMMUNITY) {
            const parts = product_path.split('/');
            if (parts.length >= 2 && parts[0].toLowerCase() === 'community') {
                const community_id = parts[1];
                const community = await Community.from_firestore(community_id);
                if (community) {
                    const defaultAppId = community.default_app_id || utils.DEFAULT_APP_ID;
                    const defaultAppProductPath = FirestoreDocumentPath.APP(community_id, defaultAppId);
                    const existing_app_purchase = await db.get_doc(userPurchasesCollectionPath, defaultAppId);
                    if (!existing_app_purchase) {
                        console.log(`Adding default app purchase for user ${this.id}, community ${community_id}, app ${defaultAppId}`);
                        const defaultApp = await App.from_firestore(community_id, defaultAppId);
                        if (defaultApp) {
                            const default_app_purchase = new Purchase(
                                defaultAppProductPath,
                                community.token_symbol,
                                defaultApp.price || 0.0,
                                new Date(), this.id, ProductTypes.APP, defaultAppId
                            );
                            await default_app_purchase.to_firestore();
                        } else {
                            console.error(`Default app ${defaultAppId} not found in community ${community_id} when trying to grant purchase to user ${this.id}`);
                        }
                    }
                } else {
                    console.error(`Could not find community ${community_id} when trying to add default app purchase for user ${this.id}`);
                }
            }
        }
        return { success: purchase_success, isNewPurchase: true };
    }
}

// --- The User account owner (operator account admin: delete and merge) ---
//
// The User-owned store of the operator account admin (src/account-admin): the USERS doc, its Sessions
// subcollection, the ProviderIndex / WalletIndex / SignatureIndex rows that point at the account, and the
// merge of a legacy record into its passkey account. Every read and write of those collections the
// account admin makes is here; the orchestrator holds no Firestore client. Reached only by the operator
// account admin (no command, route or tool).

/** A read that failed, as ACCOUNT_STORE_READ_FAILED naming the collection. Coded errors pass through. */
async function userStoreRead(collection, what, fn) {
    try {
        return await fn();
    } catch (e) {
        if (e instanceof AccountAdminError) throw e;
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_STORE_READ_FAILED, `the ${collection} read (${what}) failed (${e?.message || e}); nothing was decided from it`, { cause: e });
    }
}

/** A write that failed, as ACCOUNT_STORE_WRITE_FAILED naming the collection. Coded errors pass through. */
async function userStoreWrite(collection, what, fn) {
    try {
        return await fn();
    } catch (e) {
        if (e instanceof AccountAdminError) throw e;
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_STORE_WRITE_FAILED, `the ${collection} write (${what}) failed (${e?.message || e})`, { cause: e });
    }
}

const USER_SESSIONS_COLLECTION_ID = 'Sessions';

/**
 * A session's footprint path. Its document id IS the live access token, so the path a plan, receipt or
 * hand-back shows names it by the contract's digest (secretPath): `UserCache/<id>/Sessions/redacted-<16 hex>`.
 */
function sessionEntryPath(user_id, token) {
    return secretPath(FirestoreCollections.USER_SESSIONS(user_id), String(token));
}

/** The USERS doc's operator delete stamp: written and cleared only by stampDelete / clearDeleteStamp. */
const ADMIN_DELETE_FIELD = 'admin_delete';

/**
 * The USERS doc as a delete plan records it: its data without the delete stamp this tool writes itself (so the
 * stamp never makes its own plan stale, and a re-plan of a stamped account plans the same data).
 */
function usersEntryData(doc) {
    const { [ADMIN_DELETE_FIELD]: _stamp, ...rest } = doc || {};
    return receiptData(rest);
}

const PLAN_HASH = /^[0-9a-f]{64}$/;

/**
 * THE parser of the delete stamp on a USERS doc, the one place its shape is judged (the operator's view, clear and
 * restore, and accountLifecycleOf all read it here): null when the field is absent or null; { planHash, startedAt }
 * when it is a stamp this tool writes (an object with a string planHash); anything else present (true, {}, 'x',
 * false, 0) is ACCOUNT_STAMP_MALFORMED, loudly: never read as "no stamp" and never as a stamp.
 * @throws {AccountAdminError} ACCOUNT_STAMP_MALFORMED
 */
function adminDeleteOf(doc, accountId = doc?.id) {
    const s = doc?.[ADMIN_DELETE_FIELD];
    if (s === undefined || s === null) return null;
    if (typeof s === 'object' && !Array.isArray(s) && typeof s.planHash === 'string') {
        return Object.freeze({ planHash: s.planHash, startedAt: typeof s.startedAt === 'string' ? s.startedAt : null });
    }
    throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_STAMP_MALFORMED,
        `account ${accountId ?? '(unknown id)'}: its USERS doc carries a malformed ${ADMIN_DELETE_FIELD} (${JSON.stringify(s)?.slice(0, 80)}): only stampDelete writes it, as { planHash, startedAt }; an operator must inspect and remove it by hand`);
}

/** An account's lifecycle as its USERS doc tells it. */
export const ACCOUNT_LIFECYCLE = Object.freeze({ LIVE: 'live', CLOSING: 'closing', GONE: 'gone' });

/**
 * THE answer to "is this account open": a pure function over a USERS doc snapshot's data, owned here (the owner of
 * the `admin_delete` stamp) and consulted by every store that must not credit or bind a closing account. It judges
 * the stamp with adminDeleteOf, the one parser the operator's view and restore use too:
 *   'gone'    the USERS doc is absent (`userDoc` null or undefined);
 *   'closing' the doc carries a well-formed delete stamp ({ planHash: string, startedAt }): a delete is under way and
 *             can still be undone, so nothing irreversible may happen;
 *   'live'    no stamp (the field absent or null).
 * @param {object|null|undefined} userDoc - the USERS doc's data
 * @returns {'live'|'closing'|'gone'}
 * @throws {AccountAdminError} ACCOUNT_STAMP_MALFORMED for any other admin_delete value (true, {}, 'x', false, 0)
 * @throws {TypeError} on a value that is not a document (a string, a number, an array)
 */
export function accountLifecycleOf(userDoc) {
    if (userDoc === null || userDoc === undefined) return ACCOUNT_LIFECYCLE.GONE;
    if (typeof userDoc !== 'object' || Array.isArray(userDoc)) {
        throw new TypeError(`accountLifecycleOf: a USERS doc's data (an object) or null is required (got ${Array.isArray(userDoc) ? 'an array' : typeof userDoc})`);
    }
    return adminDeleteOf(userDoc) ? ACCOUNT_LIFECYCLE.CLOSING : ACCOUNT_LIFECYCLE.LIVE;
}

function requireUserId(user, what) {
    const id = user?.user_id;
    if (typeof id !== 'string' || !id || id.includes('/')) {
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `${what}: a user { user_id } naming one USERS doc is required (got ${JSON.stringify(id)})`);
    }
    return id;
}

/**
 * One USERS doc as the account admin lists and judges it. A malformed delete stamp throws ACCOUNT_STAMP_MALFORMED
 * (planning, committing and restoring on that account refuse), except with `{ listing: true }`: the operator's
 * listing then shows the account flagged `stampMalformed: true`, so one malformed doc never hides the others.
 */
function accountViewOf(id, snap, { listing = false } = {}) {
    const doc = snap.exists ? (snap.data() || {}) : null;
    if (!doc) return Object.freeze({ accountId: id, exists: false });
    const providers = Array.isArray(doc.auth_providers) ? [...doc.auth_providers] : [];
    const cid = doc.user_info?.credentialId;
    const verifiedEmail = typeof doc.verified_email === 'string' && doc.verified_email ? normalizeEmail(doc.verified_email) : null;
    const emailKeyed = id.includes('@');
    return Object.freeze({
        accountId: id,
        exists: true,
        email: verifiedEmail ?? (emailKeyed ? normalizeEmail(id) : null),
        verifiedEmail,
        emailKeyed,
        createdAt: snap.createTime ? snap.createTime.toDate().toISOString() : null,
        providers,
        hasPasskeyCredential: typeof cid === 'string' && BASE64URL.test(cid) && sanitizeCredentialId(cid) === id && providers.includes(AuthProvider.POWCH),
        hasPasskeyKey: doc.passkey != null,
        walletAddress: typeof doc.wallet_address === 'string' && doc.wallet_address ? doc.wallet_address.toLowerCase() : null,
        roles: Object.keys(doc.roles && typeof doc.roles === 'object' ? doc.roles : {}).sort(),
        migratedTo: doc.migrated_to || null,
        ...stampOf(doc, id, listing),
    });
}

/** The view's stamp fields: { adminDelete } (or, listing only, { adminDelete: null, stampMalformed: true } for a malformed one). */
function stampOf(doc, id, listing) {
    try {
        return { adminDelete: adminDeleteOf(doc, id) };
    } catch (e) {
        if (listing && e?.code === AccountAdminRefusal.ACCOUNT_STAMP_MALFORMED) return { adminDelete: null, stampMalformed: true };
        throw e;
    }
}

/** Unique, sorted. */
const sortedUnique = (xs) => [...new Set(xs)].sort();

/** Refuse (ACCOUNT_PLAN_STALE, before any write) unless the owner's current paths are exactly the plan's. */
function assertExpectedPaths(current, expectPaths, what) {
    if (!Array.isArray(expectPaths) || expectPaths.some((p) => typeof p !== 'string')) {
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `${what}: expectPaths (the plan's paths) is required; nothing was written`);
    }
    const want = sortedUnique(expectPaths);
    const have = sortedUnique(current);
    const added = have.filter((p) => !want.includes(p));
    const gone = want.filter((p) => !have.includes(p));
    if (added.length || gone.length) {
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `${what}: the store changed since the plan (${added.length} new path(s), ${gone.length} gone: ${[...added, ...gone].slice(0, 5).join(', ')}); nothing was written`);
    }
}

/**
 * Every document under the USERS doc outside its Sessions subcollection (Purchases, CommunityStats,
 * RoomConversation/..., any other), at any depth: the user owner never deletes them, and the USERS doc is
 * not deleted while one remains (a deleted doc does not delete its subcollections). Bounded: past
 * ACCOUNT_READ_LIMIT documents the walk stops with an ACCOUNT_FOOTPRINT_UNBOUNDED blocker.
 */
async function nestedDocumentPaths(userRef, blockers) {
    const out = [];
    let visited = 0;
    async function walk(ref, top) {
        const collections = await userStoreRead(ref.path, 'listCollections', () => ref.listCollections());
        for (const c of collections) {
            if (top && c.id === USER_SESSIONS_COLLECTION_ID) continue;
            const refs = await userStoreRead(c.path, 'listDocuments', () => c.listDocuments());
            for (const d of refs) {
                visited += 1;
                if (visited > ACCOUNT_READ_LIMIT) {
                    blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_FOOTPRINT_UNBOUNDED, `more than ${ACCOUNT_READ_LIMIT} documents under ${userRef.path}`));
                    return false;
                }
                const snap = await userStoreRead(c.path, d.id, () => d.get());
                if (snap.exists) out.push(d.path);
                if ((await walk(d, false)) === false) return false;
            }
        }
        return true;
    }
    await walk(userRef, true);
    return out.sort();
}

/** One bounded query's documents; reaching the limit adds an ACCOUNT_FOOTPRINT_UNBOUNDED blocker. */
async function boundedDocs(query, collection, what, blockers) {
    const snap = await userStoreRead(collection, what, () => query.limit(ACCOUNT_READ_LIMIT).get());
    if (snap.docs.length >= ACCOUNT_READ_LIMIT) {
        blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_FOOTPRINT_UNBOUNDED, `${collection} (${what}) reached ${ACCOUNT_READ_LIMIT} documents`));
    }
    return snap.docs;
}

/**
 * The index rows the User owner deletes, with the field that names their account. A row is deleted only in a
 * transaction that re-reads it and finds that field still naming the account (S3).
 */
const USER_INDEX_ROWS = Object.freeze([
    { kind: 'provider-index', collection: () => FirestoreCollections.PROVIDER_INDEX(), field: 'descix_user_id' },
    { kind: 'wallet-index', collection: () => FirestoreCollections.WALLET_INDEX(), field: 'descix_user_id', walletMaterial: true },
    { kind: 'signature-index', collection: () => FirestoreCollections.SIGNATURE_INDEX(), field: 'user_id' },
]);

/**
 * Top-level collections that hold rows about an account by something other than its USERS doc, that the
 * User owner never deletes and ACCOUNT_STORE_UNOWNED (which sees only documents UNDER the USERS doc) cannot
 * see. Every delete plan lists them as leftovers.
 */
const USER_STATIC_LEFTOVERS = Object.freeze([
    { what: 'EmailVerifications/<the account\'s email>', why: 'keyed by the email address, not the account (another account may hold the same verified email); owned by the email-verification module; never removed' },
]);

/** The user owner's sessions, read bounded: [{ path (by digest), ref, data }]. */
async function userSessions(db, id, blockers) {
    const sessionsPath = FirestoreCollections.USER_SESSIONS(id);
    return (await boundedDocs(db.collection(sessionsPath), sessionsPath, 'sessions', blockers))
        .map((d) => ({ path: sessionEntryPath(id, d.id), ref: d.ref, data: d.data() || {} }));
}

const isSessionPath = (id, p) => p.startsWith(`${FirestoreCollections.USER_SESSIONS(id)}/`);

/** The user owner's delete footprint, with the refs it deletes through (never handed out). */
async function userDeleteFootprint(user) {
    const id = requireUserId(user, 'userAccountOwner.footprintForUser');
    const db = new CacheFirestore().db;
    const USERS = FirestoreCollections.USERS();
    const WALLET_INDEX = FirestoreCollections.WALLET_INDEX();
    const entries = [];
    const leftovers = USER_STATIC_LEFTOVERS.map((l) => ({ ...l }));
    const blockers = [];
    const refs = new Map();
    const rows = new Map(); // index-row path -> the USER_INDEX_ROWS spec it was found by
    const add = (path, ref, kind, summary, raw, flags = {}, data = receiptData(raw)) => {
        entries.push({ path, kind, summary, data, ...flags });
        refs.set(path, ref);
    };

    const userRef = db.collection(USERS).doc(id);
    const snap = await userStoreRead(USERS, id, () => userRef.get());
    const doc = snap.exists ? (snap.data() || {}) : null;
    const walletAddress = typeof doc?.wallet_address === 'string' && doc.wallet_address ? doc.wallet_address.toLowerCase() : null;
    if (!doc) {
        blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `no USERS doc ${id}`));
    } else {
        const providers = Array.isArray(doc.auth_providers) ? doc.auth_providers.join(', ') : 'no providers';
        add(`${USERS}/${id}`, userRef, 'user', `the USERS doc (${providers})`, doc, {}, usersEntryData(doc));
        if (id.includes('@')) {
            blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_EMAIL_KEYED_LEGACY, `${id} is a legacy email-keyed record; merge it into its passkey account instead of deleting it`));
        }
        const roles = Object.keys(doc.roles && typeof doc.roles === 'object' ? doc.roles : {}).sort();
        if (roles.length) blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_HOLDS_ROLES, `holds role(s) ${roles.join(', ')}`));
        if (walletAddress) {
            const row = await userStoreRead(WALLET_INDEX, walletAddress, () => db.collection(WALLET_INDEX).doc(walletAddress).get());
            const holder = row.exists ? row.data()?.descix_user_id : null;
            if (holder && holder !== id) {
                leftovers.push({ what: `${WALLET_INDEX}/${walletAddress}`, why: `points at account ${holder}, not this one; never removed` });
            }
        }
    }

    for (const s of await userSessions(db, id, blockers)) {
        add(s.path, s.ref, 'session', `a ${s.data.provider || 'unknown-provider'} session (deleted by query at delete time)`, s.data, { volatile: true, pathIsSecret: true });
    }
    for (const spec of USER_INDEX_ROWS) {
        const collection = spec.collection();
        for (const d of await boundedDocs(db.collection(collection).where(spec.field, '==', id), collection, `${spec.field} == ${id}`, blockers)) {
            const data = d.data() || {};
            const path = `${collection}/${d.id}`;
            add(path, d.ref, spec.kind, `${spec.kind} row${data.provider_type ? ` (${data.provider_type})` : ''}`, data, spec.walletMaterial ? { walletMaterial: true } : {});
            rows.set(path, spec);
            // A wallet indexed to this account that is not its wallet_address: nobody measures its value.
            if (collection === WALLET_INDEX && d.id.toLowerCase() !== walletAddress) {
                blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_WALLET_VALUE_UNMEASURED, `wallet ${d.id} is indexed to this account but is not its wallet_address; its value is not measured`));
            }
        }
    }
    const nested = await nestedDocumentPaths(userRef, blockers);
    return { entries, leftovers, blockers, nested, refs, rows, userRef };
}

/** Refuse (the first blocker's code, all in details) before any write while the footprint has a blocker. */
function refuseUserBlockers(blockers, what) {
    if (!blockers.length) return;
    throw new AccountAdminError(blockers[0].code, `${what}: ${blockers.map((b) => `${b.code} (${b.detail})`).join('; ')}; nothing was written`, { details: blockers });
}

/**
 * The User owner's own re-check of a delete plan, writing nothing: its blockers, its non-volatile paths and
 * their data exactly the plan's (`expectPaths`, `expectData`; sessions are volatile: deleted by query), and no
 * document under the USERS doc outside `coveredNested` (the dependents' planned paths).
 */
function assertUserDeletePlan(fp, { expectPaths, expectData, coveredNested }, what) {
    refuseUserBlockers(fp.blockers, what);
    assertDeletePlanCurrent(what, fp.entries, { expectPaths, expectData });
    const covered = new Set(coveredNested ?? []);
    const orphaned = fp.nested.filter((p) => !covered.has(p));
    if (orphaned.length) {
        throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_STORE_UNOWNED, `${what}: ${orphaned.length} document(s) under ${fp.userRef.path} that no planned delete covers (${orphaned.slice(0, 5).join(', ')}); the USERS doc is not deleted while they would be orphaned; nothing was written`);
    }
}

/** Why the from-record keeps its sign-in rows on a merge (merge v1 revokes nothing). */
const MERGE_SIGN_IN_STAYS = 'the legacy wallet remains a sign-in identity until its services are re-keyed';

/** The user owner's merge footprint: the moves, and what stays on the from-record. */
async function userMergeFootprint({ from, into } = {}) {
    const fromId = requireUserId(from, 'userAccountOwner.footprintForMerge (from)');
    const intoId = requireUserId(into, 'userAccountOwner.footprintForMerge (into)');
    const db = new CacheFirestore().db;
    const USERS = FirestoreCollections.USERS();
    const PROVIDER_INDEX = FirestoreCollections.PROVIDER_INDEX();
    const entries = [];
    const leftovers = [];
    const blockers = [];
    const raw = new Map();

    const fromSnap = await userStoreRead(USERS, fromId, () => db.collection(USERS).doc(fromId).get());
    const intoSnap = await userStoreRead(USERS, intoId, () => db.collection(USERS).doc(intoId).get());
    const fromDoc = fromSnap.exists ? (fromSnap.data() || {}) : null;
    const intoDoc = intoSnap.exists ? (intoSnap.data() || {}) : null;
    if (!fromDoc) blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `no USERS doc ${fromId} (the record to merge)`));
    if (!intoDoc) blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `no USERS doc ${intoId} (the surviving account)`));
    if (fromId === intoId) blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_MERGE_SAME_RECORD, `${fromId} cannot be merged into itself`));

    if (fromDoc) {
        const fromView = accountViewOf(fromId, fromSnap);
        if (fromView.hasPasskeyCredential || fromView.providers.includes(AuthProvider.POWCH)) {
            blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_MERGE_SOURCE_NOT_LEGACY, `${fromId} is not a legacy record (${fromView.hasPasskeyCredential ? 'it has a passkey credential' : 'it has the powch provider'}); only a legacy record is merged into a passkey account`));
        }
    }

    if (fromDoc && intoDoc && fromId !== intoId) {
        const fromRoles = fromDoc.roles && typeof fromDoc.roles === 'object' ? fromDoc.roles : {};
        const intoRoles = intoDoc.roles && typeof intoDoc.roles === 'object' ? intoDoc.roles : {};
        for (const key of Object.keys(fromRoles).sort()) {
            if (Object.prototype.hasOwnProperty.call(intoRoles, key)) {
                leftovers.push({ what: `role ${key}`, why: 'the surviving account already holds it; its own grant is kept and the record\'s stays on the record' });
                continue;
            }
            const entry = { path: `${USERS}/${intoId}`, field: 'roles', key, from: null, to: encodeStoreValue(fromRoles[key]), summary: `role ${key} added to the surviving account` };
            raw.set(entry, fromRoles[key]);
            entries.push(entry);
        }

        const email = typeof intoDoc.verified_email === 'string' && intoDoc.verified_email ? normalizeEmail(intoDoc.verified_email) : null;
        if (email) {
            const key = User.emailIndexKey(email);
            const row = await userStoreRead(PROVIDER_INDEX, key, () => db.collection(PROVIDER_INDEX).doc(key).get());
            const holder = row.exists ? (row.data()?.descix_user_id ?? null) : null;
            if (holder === null || holder === fromId) {
                const entry = { path: `${PROVIDER_INDEX}/${key}`, field: 'descix_user_id', from: holder, to: intoId, summary: `the email row for ${email} ${holder ? `moves from ${fromId}` : 'is created'} to the surviving account` };
                raw.set(entry, { email });
                entries.push(entry);
            } else if (holder !== intoId) {
                blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_MERGE_EMAIL_MISMATCH, `the email row ${key} points at a third account ${holder}`));
            }
        }

        // A migrated record is a done merge: a blocker, never a pending migrated_to move.
        if (fromDoc.migrated_to) {
            blockers.push(accountAdminBlocker(AccountAdminRefusal.ACCOUNT_MERGE_ALREADY_MIGRATED, `${fromId} is already migrated to ${fromDoc.migrated_to}`));
        } else {
            entries.push({ path: `${USERS}/${fromId}`, field: 'migrated_to', from: null, to: intoId, summary: `${fromId} is marked migrated to ${intoId} (with migrated_at)` });
        }

        // What stays: the record's sign-in identity (sessions, wallet, its wallet and signature rows) and its other provider rows.
        if (typeof fromDoc.wallet_address === 'string' && fromDoc.wallet_address) {
            leftovers.push({ what: `wallet_address ${fromDoc.wallet_address.toLowerCase()}`, why: MERGE_SIGN_IN_STAYS });
        }
        const sessionsPath = FirestoreCollections.USER_SESSIONS(fromId);
        for (const d of await boundedDocs(db.collection(sessionsPath), sessionsPath, 'sessions', blockers)) {
            leftovers.push({ what: sessionEntryPath(fromId, d.id), why: MERGE_SIGN_IN_STAYS });
        }
        for (const [collection, field, why] of [
            [FirestoreCollections.WALLET_INDEX(), 'descix_user_id', MERGE_SIGN_IN_STAYS],
            [FirestoreCollections.SIGNATURE_INDEX(), 'user_id', MERGE_SIGN_IN_STAYS],
            [PROVIDER_INDEX, 'descix_user_id', 'stays on the migrated record'],
        ]) {
            for (const d of await boundedDocs(db.collection(collection).where(field, '==', fromId), collection, `${field} == ${fromId}`, blockers)) {
                if (entries.some((e) => e.path === `${collection}/${d.id}`)) continue;
                leftovers.push({ what: `${collection}/${d.id}`, why });
            }
        }
    }
    return { entries, leftovers, blockers, raw };
}

/** The value stored at a move's path/field(/key), encoded; null when the document or field is absent. */
async function readMoveValue(db, move) {
    const i = move.path.lastIndexOf('/');
    const collection = move.path.slice(0, i);
    const snap = await userStoreRead(collection, `re-read ${move.path}`, () => db.collection(collection).doc(move.path.slice(i + 1)).get());
    if (!snap.exists) return null;
    const doc = snap.data() || {};
    const value = move.key === undefined ? doc[move.field] : doc[move.field]?.[move.key];
    return encodeStoreValue(value ?? null);
}

const sameValue = (a, b) => canonicalJson(a ?? null) === canonicalJson(b ?? null);
const moveRef = (m) => (m.key === undefined ? { path: m.path, field: m.field } : { path: m.path, field: m.field, key: m.key });
const publicMove = (m) => ({ ...moveRef(m), from: m.from, to: m.to });

/**
 * THE User owner of the operator account admin (`name: 'user'`): the store-owner contract
 * (src/account-admin/contract.js) for the User-owned collections, plus the account reads the orchestrator
 * judges by. Every method fails loud with an AccountAdminError code.
 */
export const userAccountOwner = Object.freeze({
    name: 'user',
    /** A session's document id is its access token: every Sessions entry is a secretPath (pathIsSecret). */
    credentialIdCollections: Object.freeze([USER_SESSIONS_COLLECTION_ID]),

    /**
     * Read-only: one account as the admin judges it ({ accountId, exists:false } when there is no USERS doc).
     * @param {string} accountId
     */
    async account(accountId) {
        if (typeof accountId !== 'string' || !accountId || accountId.includes('/')) {
            throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `an account id is required (got ${JSON.stringify(accountId)})`);
        }
        const USERS = FirestoreCollections.USERS();
        const snap = await userStoreRead(USERS, accountId, () => new CacheFirestore().db.collection(USERS).doc(accountId).get());
        return accountViewOf(accountId, snap);
    },

    /**
     * Read-only: every USERS doc whose `verified_email`, or whose document id (the legacy email-keyed form),
     * starts with one of `emailPrefixes` (lowercase local parts ending in '@' or '+'), sorted by id. The caller
     * filters by its rule. No unfiltered listing; a read reaching ACCOUNT_READ_LIMIT refuses (no partial list).
     * @param {string[]} emailPrefixes
     */
    async accountsByEmailPrefixes(emailPrefixes) {
        if (!Array.isArray(emailPrefixes) || emailPrefixes.length === 0 || emailPrefixes.some((p) => typeof p !== 'string' || !EMAIL_PREFIX.test(p))) {
            throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_RULE_INVALID, `emailPrefixes must be a non-empty array of lowercase local parts ending in '@' or '+' (got ${JSON.stringify(emailPrefixes)}); there is no unfiltered listing`);
        }
        const USERS = FirestoreCollections.USERS();
        const users = new CacheFirestore().db.collection(USERS);
        const byId = new Map();
        for (const prefix of new Set(emailPrefixes)) {
            for (const [field, label] of [['verified_email', 'verified_email'], [Firestore.FieldPath.documentId(), 'document id']]) {
                const snap = await userStoreRead(USERS, `${label} range '${prefix}'`, () => users.where(field, '>=', prefix).where(field, '<', `${prefix}`).limit(ACCOUNT_READ_LIMIT).get());
                if (snap.docs.length >= ACCOUNT_READ_LIMIT) {
                    throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_FOOTPRINT_UNBOUNDED, `the ${USERS} ${label} range '${prefix}' reached ${ACCOUNT_READ_LIMIT} documents; no partial listing`);
                }
                for (const d of snap.docs) byId.set(d.id, d);
            }
        }
        return [...byId.keys()].sort().map((id) => accountViewOf(id, byId.get(id), { listing: true }));
    },

    /**
     * The database of the Firestore client every User-owner read and write goes through (CacheFirestore's
     * client of the @descix/cloud-core this package resolves), read from the client itself.
     * @returns {{ databaseId: string, projectId?: string }}
     */
    storeTarget() {
        const db = new CacheFirestore().db;
        let projectId;
        try {
            projectId = db.projectId;
        } catch {
            projectId = undefined; // not known before the client's first request; databaseId is
        }
        return { databaseId: db.databaseId, ...(typeof projectId === 'string' && projectId ? { projectId } : {}) };
    },

    /**
     * Read-only delete footprint: the USERS doc, its Sessions (paths name each by a digest, never the
     * token; `volatile`: deleted by query at delete time), the ProviderIndex / WalletIndex rows whose
     * descix_user_id is this id (WalletIndex rows `walletMaterial`), the SignatureIndex rows whose user_id is
     * this id. A WalletIndex row for an address other than the account's wallet_address is an
     * ACCOUNT_WALLET_VALUE_UNMEASURED blocker. `leftovers` include USER_STATIC_LEFTOVERS. `nested` lists
     * every other document under the USERS doc (another owner's; the orchestrator refuses unless another
     * owner's footprint covers each one).
     * @param {{ user_id: string }} user
     */
    async footprintForUser(user) {
        const { entries, leftovers, blockers, nested } = await userDeleteFootprint(user);
        return { entries, leftovers, blockers, nested };
    },

    /**
     * Read-only: the User owner's own re-check of a delete plan before the orchestrator's FIRST dependent
     * write (and again before an irrecoverable owner). Throws, writing nothing: the first blocker's code
     * (roles, email-keyed, not found, an unmeasured wallet), ACCOUNT_PLAN_STALE when its non-session paths
     * are not exactly `expectPaths`, ACCOUNT_STORE_UNOWNED when a document under the USERS doc is not in
     * `coveredNested` (the paths the dependents will delete).
     * @param {{ user_id: string }} user
     * @param {{ expectPaths: string[], coveredNested: string[] }} opts
     * @returns {Promise<true>}
     */
    async preflightDelete(user, { expectPaths, expectData, coveredNested } = {}) {
        assertUserDeletePlan(await userDeleteFootprint(user), { expectPaths, expectData, coveredNested }, 'userAccountOwner.preflightDelete');
        return true;
    },

    /**
     * Stamp the USERS doc `admin_delete: { planHash, startedAt }` (the operator account admin's commitDelete,
     * before its first dependent write), in ONE transaction that reads the doc and refuses, writing nothing:
     * no doc (ACCOUNT_NOT_FOUND), data other than the plan's (ACCOUNT_PLAN_STALE; the stamp itself is not part
     * of a plan's data, so a re-commit over an earlier stamp proceeds and replaces it). restoreDelete honours a
     * receipt only while the stamp names that receipt's plan. While it stands, accountLifecycleOf reads the account
     * as 'closing': stores that must do nothing irreversible during a delete branch on it (Cloud's DPoW accounting
     * refuses to credit or bind the account); everything else stays usable by its owner.
     * @param {{ user_id: string }} user
     * @param {{ planHash: string, startedAt: string, expectData: Object<string, string> }} opts
     * @returns {Promise<true>}
     */
    async stampDelete(user, { planHash, startedAt, expectData } = {}) {
        const id = requireUserId(user, 'userAccountOwner.stampDelete');
        const what = 'userAccountOwner.stampDelete';
        if (typeof planHash !== 'string' || !PLAN_HASH.test(planHash)) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `${what}: planHash (the plan's sha256) is required; nothing was written`);
        if (typeof startedAt !== 'string' || Number.isNaN(Date.parse(startedAt))) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_PLAN_STALE, `${what}: startedAt (an ISO time) is required; nothing was written`);
        const USERS = FirestoreCollections.USERS();
        const db = new CacheFirestore().db;
        const ref = db.collection(USERS).doc(id);
        await userStoreWrite(USERS, `${id} ${ADMIN_DELETE_FIELD}`, () => db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `${what}: no USERS doc ${id}; nothing was written`);
            assertDocumentAsPlanned(what, `${USERS}/${id}`, usersEntryData(snap.data()), expectData);
            tx.update(ref, { [ADMIN_DELETE_FIELD]: { planHash, startedAt } });
        }));
        return true;
    },

    /**
     * Remove the USERS doc's `admin_delete` stamp (restoreDelete, once every restorable entry is back), in ONE
     * transaction, only while it names `planHash`. Returns true when removed, false when the doc carries no
     * stamp or another plan's (left in place). ACCOUNT_NOT_FOUND when there is no USERS doc.
     * @param {{ user_id: string }} user
     * @param {{ planHash: string }} opts
     * @returns {Promise<boolean>}
     */
    async clearDeleteStamp(user, { planHash } = {}) {
        const id = requireUserId(user, 'userAccountOwner.clearDeleteStamp');
        const USERS = FirestoreCollections.USERS();
        const db = new CacheFirestore().db;
        const ref = db.collection(USERS).doc(id);
        return userStoreWrite(USERS, `${id} ${ADMIN_DELETE_FIELD}`, () => db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `userAccountOwner.clearDeleteStamp: no USERS doc ${id}; nothing was written`);
            if (adminDeleteOf(snap.data())?.planHash !== planHash) return false;
            tx.update(ref, { [ADMIN_DELETE_FIELD]: FieldValue.delete() });
            return true;
        }));
    },

    /**
     * Delete the account's User-owned documents. Refused before any write: a blocker (re-checked at this
     * turn), non-session paths other than `expectPaths` (ACCOUNT_PLAN_STALE), any document left under the
     * USERS doc (ACCOUNT_STORE_UNOWNED). Sessions are deleted BY QUERY (every session of this id, bounded),
     * so a sign-in or an expiry since the plan does not make it stale; `alsoDeleted` names sessions the plan
     * did not know. Each index row is deleted in a transaction that re-reads it and deletes it only while it
     * still names this account; otherwise it is left, reported in `remaining` and `reasons`. The USERS doc
     * goes LAST. Then every expected path is re-read.
     * @param {{ user_id: string }} user
     * @param {{ expectPaths: string[] }} opts
     * @returns {Promise<{ deleted: string[], remaining: string[], alsoDeleted: string[], reasons: Array<{ path: string, reason: string }> }>}
     */
    async deleteForUser(user, { expectPaths, expectData } = {}) {
        const fp = await userDeleteFootprint(user);
        const what = 'userAccountOwner.deleteForUser';
        assertUserDeletePlan(fp, { expectPaths, expectData, coveredNested: [] }, what);
        const id = fp.userRef.id;
        const db = new CacheFirestore().db;
        const reasons = [];
        const planned = new Set(expectPaths);
        const sessions = fp.entries.filter((e) => e.kind === 'session');
        for (const e of sessions) await userStoreWrite(FirestoreCollections.USER_SESSIONS(id), `delete ${e.path}`, () => fp.refs.get(e.path).delete());
        for (const e of fp.entries.filter((x) => fp.rows.has(x.path))) {
            const { field } = fp.rows.get(e.path);
            const ref = fp.refs.get(e.path);
            const left = await userStoreWrite(e.path.split('/')[0], `delete ${e.path}`, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists) return null;
                const holder = snap.data()?.[field] ?? null;
                if (holder !== id) return `its ${field} now names ${JSON.stringify(holder)}, not ${id}; left in place`;
                // Read, compare and delete in one transaction: a row changed since the plan stops the delete here.
                assertDocumentAsPlanned(what, e.path, receiptData(snap.data()), expectData);
                tx.delete(ref);
                return null;
            }));
            if (left) reasons.push({ path: e.path, reason: left });
        }
        const userEntry = fp.entries.find((e) => e.kind === 'user');
        if (userEntry) {
            const ref = fp.refs.get(userEntry.path);
            // The USERS doc goes in one transaction that re-reads it: a save since the plan leaves it (ACCOUNT_PLAN_STALE).
            await userStoreWrite(FirestoreCollections.USERS(), `delete ${userEntry.path}`, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists) return;
                assertDocumentAsPlanned(what, userEntry.path, usersEntryData(snap.data()), expectData);
                tx.delete(ref);
            }));
        }

        const sessionsNow = new Set((await userSessions(db, id, [])).map((s) => s.path));
        const deleted = [];
        const remaining = [];
        for (const p of expectPaths) {
            let present;
            if (isSessionPath(id, p)) present = sessionsNow.has(p);
            else present = (await userStoreRead(p.split('/')[0], `re-read ${p}`, () => fp.refs.get(p).get())).exists;
            (present ? remaining : deleted).push(p);
        }
        const alsoDeleted = sessions.map((e) => e.path).filter((p) => !planned.has(p) && !sessionsNow.has(p));
        return { deleted, remaining, alsoDeleted, reasons };
    },

    /**
     * Read-only merge footprint. `entries` are the moves: { path, field, key?, from, to, summary } (`from`
     * null = absent; `key` names a map entry of `field`, e.g. one role). `leftovers` stay on the from-record:
     * its sessions (by digest), wallet_address, WalletIndex and SignatureIndex rows (the legacy wallet
     * remains a sign-in identity until its services are re-keyed), its other ProviderIndex rows, and roles
     * the surviving account already holds. A record already migrated is a blocker, not a move.
     * @param {{ from: { user_id: string }, into: { user_id: string } }} pair
     */
    async footprintForMerge(pair) {
        const { entries, leftovers, blockers } = await userMergeFootprint(pair);
        return { entries: entries.map((e) => ({ ...publicMove(e), summary: e.summary })), leftovers, blockers };
    },

    /**
     * Merge: roles the surviving account lacks are added to it (one transaction, only keys still absent);
     * the email ProviderIndex row is pointed at it (only while it still names the plan's holder; created
     * when absent); the from-record is marked migrated LAST (User.markMigrated). Nothing else is written:
     * the from-record's sessions, wallet and index rows stay (it remains a sign-in identity). Refuses before
     * any write on a blocker or ACCOUNT_PLAN_STALE. Then re-reads.
     * @param {{ from: { user_id: string }, into: { user_id: string } }} pair
     * @param {{ expectPaths: string[] }} opts - the plan's move paths
     * @returns {Promise<{ moved: Array<{path, field, key?, from, to}>, remaining: Array<{path, field, key?}> }>}
     */
    async mergeForUser(pair, { expectPaths } = {}) {
        const fp = await userMergeFootprint(pair);
        if (fp.blockers.length) {
            throw new AccountAdminError(fp.blockers[0].code, `userAccountOwner.mergeForUser: ${fp.blockers.map((b) => `${b.code} (${b.detail})`).join('; ')}; nothing was written`, { details: fp.blockers });
        }
        assertExpectedPaths(fp.entries.map((e) => e.path), expectPaths, 'userAccountOwner.mergeForUser');
        const fromId = pair.from.user_id;
        const intoId = pair.into.user_id;
        const db = new CacheFirestore().db;
        const USERS = FirestoreCollections.USERS();
        const PROVIDER_INDEX = FirestoreCollections.PROVIDER_INDEX();

        const roleMoves = fp.entries.filter((e) => e.field === 'roles');
        if (roleMoves.length) {
            const ref = db.collection(USERS).doc(intoId);
            await userStoreWrite(USERS, `${intoId} roles`, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_NOT_FOUND, `no USERS doc ${intoId}; nothing was written`);
                const roles = { ...(snap.data()?.roles || {}) };
                let added = 0;
                for (const m of roleMoves) {
                    if (Object.prototype.hasOwnProperty.call(roles, m.key)) continue;
                    roles[m.key] = fp.raw.get(m);
                    added += 1;
                }
                if (added) tx.update(ref, { roles });
            }));
        }
        const reasons = new Map();
        for (const m of fp.entries.filter((e) => e.path.startsWith(`${PROVIDER_INDEX}/`))) {
            const ref = db.collection(PROVIDER_INDEX).doc(m.path.slice(PROVIDER_INDEX.length + 1));
            const { email } = fp.raw.get(m);
            const left = await userStoreWrite(PROVIDER_INDEX, m.path, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                const holder = snap.exists ? (snap.data()?.descix_user_id ?? null) : null;
                // Moved only while it still names the plan's holder (the record, or nobody): never a third account's row.
                if (holder !== m.from) return `the email row now names ${JSON.stringify(holder)}, not ${JSON.stringify(m.from)}; left in place`;
                if (snap.exists) tx.update(ref, { descix_user_id: intoId });
                else tx.set(ref, { descix_user_id: intoId, provider_type: 'email', provider_id: email, linked_at: Timestamp.now() });
                return null;
            }));
            if (left) reasons.set(moveKey(m), left);
        }
        // markMigrated reads the doc in its own transaction (never CacheFirestore.get_doc, which answers a failed read as null).
        await new User(fromId).markMigrated(intoId);

        const moved = [];
        const remaining = [];
        for (const m of fp.entries) {
            (sameValue(await readMoveValue(db, m), m.to) ? moved : remaining).push(m);
        }
        return { moved: moved.map(publicMove), remaining: remaining.map((m) => ({ ...moveRef(m), ...(reasons.has(moveKey(m)) ? { reason: reasons.get(moveKey(m)) } : {}) })) };
    },

    /**
     * Throws ACCOUNT_RECEIPT_INVALID, writing nothing, unless every move is one mergeForUser makes for
     * `pair`: the migration mark on USERS/<from> (from null, to <into>), a role added to USERS/<into> (from
     * null, a key), or the email row of the surviving account's verified email (field descix_user_id, from
     * null or <from>, to <into>).
     * @param {Array<{ path: string, field: string, key?: string, from: unknown, to: unknown }>} moves
     * @param {{ from: { user_id: string }, into: { user_id: string, verified_email?: string|null } }} pair
     */
    validateRollbackMoves(moves, pair) {
        const fromId = requireUserId(pair?.from, 'userAccountOwner.validateRollbackMoves (from)');
        const intoId = requireUserId(pair?.into, 'userAccountOwner.validateRollbackMoves (into)');
        const USERS = FirestoreCollections.USERS();
        const email = typeof pair.into.verified_email === 'string' && pair.into.verified_email ? normalizeEmail(pair.into.verified_email) : null;
        const emailRow = email ? `${FirestoreCollections.PROVIDER_INDEX()}/${User.emailIndexKey(email)}` : null;
        if (!Array.isArray(moves)) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_RECEIPT_INVALID, 'userAccountOwner: the receipt\'s user moves are required; nothing was written');
        for (const m of moves) {
            const why = (() => {
                if (typeof m?.path !== 'string' || typeof m?.field !== 'string') return 'it names no path/field';
                if (m.path === `${USERS}/${fromId}`) {
                    return m.field === 'migrated_to' && m.key === undefined && m.from === null && m.to === intoId ? null : `the only move on ${m.path} is its migrated_to mark to ${intoId}`;
                }
                if (m.path === `${USERS}/${intoId}`) {
                    return m.field === 'roles' && typeof m.key === 'string' && m.key && m.from === null ? null : `the only move on ${m.path} is a role it lacked`;
                }
                if (emailRow && m.path === emailRow) {
                    return m.field === 'descix_user_id' && m.key === undefined && (m.from === null || m.from === fromId) && m.to === intoId ? null : `the email row moves from ${fromId} (or nobody) to ${intoId}`;
                }
                return `${m.path} is not USERS/${fromId}, USERS/${intoId} or the surviving account's email row`;
            })();
            if (why) throw new AccountAdminError(AccountAdminRefusal.ACCOUNT_RECEIPT_INVALID, `userAccountOwner: receipt move ${JSON.stringify(m)?.slice(0, 200)} is not one a merge of ${fromId} into ${intoId} makes (${why}); nothing was written`);
        }
    },

    /**
     * The rollback of mergeForUser from its receipt's user moves. In reverse order: the migration mark (User.unmarkMigrated, only while it names
     * the receipt's account), the email row (only while it names the surviving account: back to the record,
     * or deleted when the merge created it), the roles the merge added (only while each still equals what
     * was added). A move whose current value is not the receipt's `to` is left and reported remaining.
     * Every move is validated (validateRollbackMoves) before the first write.
     * @param {Array<{ path: string, field: string, key?: string, from: unknown, to: unknown }>} moves
     * @param {{ from: { user_id: string }, into: { user_id: string, verified_email?: string|null } }} pair
     * @returns {Promise<{ restored: Array<{path, field, key?}>, remaining: Array<{path, field, key?}> }>}
     */
    async rollbackMergeForUser(moves, pair) {
        userAccountOwner.validateRollbackMoves(moves, pair);
        const db = new CacheFirestore().db;
        const USERS = FirestoreCollections.USERS();
        const PROVIDER_INDEX = FirestoreCollections.PROVIDER_INDEX();
        const errors = [];
        const attempt = async (fn) => { try { await fn(); } catch (e) { errors.push(e); } };

        for (const m of moves.filter((x) => x.field === 'migrated_to')) {
            const id = m.path.slice(USERS.length + 1);
            await attempt(() => new User(id).unmarkMigrated(m.to));
        }
        for (const m of moves.filter((x) => x.path.startsWith(`${PROVIDER_INDEX}/`))) {
            const ref = db.collection(PROVIDER_INDEX).doc(m.path.slice(PROVIDER_INDEX.length + 1));
            await attempt(() => userStoreWrite(PROVIDER_INDEX, m.path, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists || snap.data()?.descix_user_id !== m.to) return;
                if (m.from === null) tx.delete(ref);
                else tx.update(ref, { descix_user_id: m.from });
            })));
        }
        const roleMoves = moves.filter((x) => x.field === 'roles');
        for (const path of sortedUnique(roleMoves.map((m) => m.path))) {
            const ref = db.collection(USERS).doc(path.slice(USERS.length + 1));
            await attempt(() => userStoreWrite(USERS, `${path} roles`, () => db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                if (!snap.exists) return;
                const roles = { ...(snap.data()?.roles || {}) };
                let removed = 0;
                for (const m of roleMoves.filter((x) => x.path === path)) {
                    if (Object.prototype.hasOwnProperty.call(roles, m.key) && sameValue(encodeStoreValue(roles[m.key]), m.to)) {
                        delete roles[m.key];
                        removed += 1;
                    }
                }
                if (removed) tx.update(ref, { roles });
            })));
        }

        const restored = [];
        const remaining = [];
        for (const m of moves) {
            (sameValue(await readMoveValue(db, m), m.from) ? restored : remaining).push(moveRef(m));
        }
        return { restored, remaining, errors: errors.map((e) => ({ code: e.code ?? null, message: e.message })) };
    },

    /**
     * Read-only: the current value at each move's path/field(/key), encoded (null when absent).
     * @param {Array<{ path: string, field: string, key?: string }>} moves
     * @returns {Promise<Array<{ path: string, field: string, key?: string, value: unknown }>>}
     */
    async readMergeFields(moves) {
        const db = new CacheFirestore().db;
        const out = [];
        for (const m of moves) out.push({ ...moveRef(m), value: await readMoveValue(db, m) });
        return out;
    },
});

// --- Community Class ---

export class Community {
    constructor(
        community_id, community_name, community_description, community_email,
        default_app_id, ip_site_gcs_path_url, default_knowledgebase_name,
        is_public = false, member_count = 1, disccusion_count = 0,
        token_symbol = null, token_contract_address = null, icon_url = "", owner_id = "",
        treasury_wallet_address = null, total_community_rep = 0, total_community_ref = 0, total_community_dip = 0,
        price = 0,
        ref_reward_rate = 10, guild_ref_commission_rate = 0.1,
        guild_rep_commission_rate = 0.1, guild_dip_commission_rate = 0.1,
        mcp_rag_min_tokens = 0, auto_purchase_apps = null,
        signup_bonus_ref = null,
        pool_config = null,
        google_group_email = null,
        discord_guild_id = null,
        sponsor_slots = [],
        token_lifecycle = null,
        reserve_wallets = null,
        reserves_by_chain = null,
        drive_folder_id = "",
        promo_video_url = null
    ) {
        const utils = getCloudConfig();
        this.community_id = community_id;
        this.community_name = community_name;
        this.community_description = community_description;
        this.community_email = community_email;
        this.is_public = is_public;
        this.member_count = member_count;
        this.disccusion_count = disccusion_count;
        this.default_knowledgebase_name = default_knowledgebase_name;
        this.default_app_id = default_app_id || utils.DEFAULT_APP_ID;
        this.token_symbol = token_symbol ? String(token_symbol).toUpperCase() : community_id.split("@")[0].toUpperCase().substring(0, 5);
        this.token_contract_address = token_contract_address;
        this.icon_url = icon_url;
        this.owner_id = owner_id;
        this.ip_site_gcs_path_url = ip_site_gcs_path_url;
        this.treasury_wallet_address = treasury_wallet_address;
        this.total_community_rep = total_community_rep;
        this.total_community_ref = total_community_ref;
        this.total_community_dip = total_community_dip;
        this.price = price;
        this.ref_reward_rate = ref_reward_rate;
        this.guild_ref_commission_rate = guild_ref_commission_rate;
        this.guild_rep_commission_rate = guild_rep_commission_rate;
        this.guild_dip_commission_rate = guild_dip_commission_rate;
        this.mcp_rag_min_tokens = mcp_rag_min_tokens || 0;
        this.auto_purchase_apps = auto_purchase_apps || ['daita'];
        this.pool_config = pool_config || null;
        this.google_group_email = google_group_email || null;
        this.discord_guild_id = discord_guild_id || null;
        this.sponsor_slots = sponsor_slots || [];
        this.token_lifecycle = token_lifecycle || null;
        this.reserve_wallets = reserve_wallets || null;
        this.reserves_by_chain = reserves_by_chain || null;
        this.drive_folder_id = drive_folder_id || "";
        this.promo_video_url = promo_video_url || null;

        this.db = new CacheFirestore();
    }

    get product_path() {
        return FirestoreDocumentPath.COMMUNITY(this.community_id);
    }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.token_symbol) copy.token_symbol = copy.token_symbol.toUpperCase();
        if (copy.ref_reward_rate === undefined) copy.ref_reward_rate = 10;
        if (copy.guild_ref_commission_rate === undefined) copy.guild_ref_commission_rate = 0.1;
        if (copy.guild_rep_commission_rate === undefined) copy.guild_rep_commission_rate = 0.1;
        if (copy.guild_dip_commission_rate === undefined) copy.guild_dip_commission_rate = 0.1;
        if (copy.mcp_rag_min_tokens === undefined) copy.mcp_rag_min_tokens = 0;
        if (copy.auto_purchase_apps === undefined) copy.auto_purchase_apps = ['daita'];
        if (copy.pool_config === undefined) copy.pool_config = null;
        if (copy.google_group_email === undefined) copy.google_group_email = null;
        if (copy.discord_guild_id === undefined) copy.discord_guild_id = null;
        if (copy.sponsor_slots === undefined) copy.sponsor_slots = [];
        if (copy.token_lifecycle === undefined) copy.token_lifecycle = null;
        if (copy.reserve_wallets === undefined) copy.reserve_wallets = null;
        if (copy.reserves_by_chain === undefined) copy.reserves_by_chain = null;
        if (copy.promo_video_url === undefined) copy.promo_video_url = null;
        return copy;
    }

    static from_dict(doc) {
        if (!doc) return null;


        return new Community(
            doc.community_id,
            doc.community_name, doc.community_description, doc.community_email,
            doc.default_app_id, doc.ip_site_gcs_path_url, doc.default_knowledgebase_name,
            doc.is_public, doc.member_count, doc.disccusion_count,
            doc.token_symbol, doc.token_contract_address || null,
            doc.icon_url, doc.owner_id || "", doc.treasury_wallet_address || null,
            doc.total_community_rep || 0, doc.total_community_ref || 0, doc.total_community_dip || 0,
            doc.price || 0,
            doc.ref_reward_rate !== undefined ? doc.ref_reward_rate : 10,
            doc.guild_ref_commission_rate !== undefined ? doc.guild_ref_commission_rate : 0.1,
            doc.guild_rep_commission_rate !== undefined ? doc.guild_rep_commission_rate : 0.1,
            doc.guild_dip_commission_rate !== undefined ? doc.guild_dip_commission_rate : 0.1,
            doc.mcp_rag_min_tokens !== undefined ? doc.mcp_rag_min_tokens : 0,
            doc.auto_purchase_apps || null,
            doc.signup_bonus_ref !== undefined ? doc.signup_bonus_ref : null,
            doc.pool_config || null,
            doc.google_group_email || null,
            doc.discord_guild_id || null,
            doc.sponsor_slots || [],
            doc.token_lifecycle || null,
            doc.reserve_wallets || null,
            doc.reserves_by_chain || null,
            doc.drive_folder_id || "",
            doc.promo_video_url || null
        );
    }

    async to_firestore() {
        if (this.token_symbol) this.token_symbol = this.token_symbol.toUpperCase();
        return await this.db.put_doc(FirestoreCollections.COMMUNITY(), this.community_id, this.to_dict());
    }

    static async from_firestore(community_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.COMMUNITY(), community_id);
        if (!doc) return null;


        return new Community(
            doc.community_id || community_id,
            doc.community_name, doc.community_description, doc.community_email,
            doc.default_app_id, doc.ip_site_gcs_path_url, doc.default_knowledgebase_name,
            doc.is_public, doc.member_count, doc.disccusion_count,
            doc.token_symbol, doc.token_contract_address || null,
            doc.icon_url, doc.owner_id || "", doc.treasury_wallet_address || null,
            doc.total_community_rep || 0, doc.total_community_ref || 0, doc.total_community_dip || 0,
            doc.price || 0,
            doc.ref_reward_rate !== undefined ? doc.ref_reward_rate : 10,
            doc.guild_ref_commission_rate !== undefined ? doc.guild_ref_commission_rate : 0.1,
            doc.guild_rep_commission_rate !== undefined ? doc.guild_rep_commission_rate : 0.1,
            doc.guild_dip_commission_rate !== undefined ? doc.guild_dip_commission_rate : 0.1,
            doc.mcp_rag_min_tokens !== undefined ? doc.mcp_rag_min_tokens : 0,
            doc.auto_purchase_apps || null,
            doc.signup_bonus_ref !== undefined ? doc.signup_bonus_ref : null,
            doc.pool_config || null,
            doc.google_group_email || null,
            doc.discord_guild_id || null,
            doc.sponsor_slots || [],
            doc.token_lifecycle || null,
            doc.reserve_wallets || null,
            doc.reserves_by_chain || null,
            doc.drive_folder_id || "",
            doc.promo_video_url || null
        );
    }

    async incrementTotalRep(amount) {
        return await this.db.update_doc_field(FirestoreCollections.COMMUNITY(), this.community_id, 'total_community_rep', FieldValue.increment(amount));
    }
    async incrementTotalRef(amount) {
        return await this.db.update_doc_field(FirestoreCollections.COMMUNITY(), this.community_id, 'total_community_ref', FieldValue.increment(amount));
    }
    async incrementTotalDip(amount) {
        return await this.db.update_doc_field(FirestoreCollections.COMMUNITY(), this.community_id, 'total_community_dip', FieldValue.increment(amount));
    }
    async incrementMemberCount(amount = 1) {
        return await this.db.update_doc_field(FirestoreCollections.COMMUNITY(), this.community_id, 'member_count', FieldValue.increment(amount));
    }

    /**
     * The apps of one community.
     *
     * THROWS on an unreadable collection; returns `[]` only for a community that genuinely has no
     * apps. `CacheFirestore.get_docs` signals the two outcomes differently — `[]` for an empty
     * collection, `null` for a read that FAILED (it logs and swallows the Firestore error, see
     * `@descix/cloud-core` storageUtils.js) — and this method used to collapse both to `[]`. That
     * made "the read broke" indistinguishable from "there is nothing here" at every call site: a
     * caller deriving a permission scope, a listing, or a count from the result would report a
     * FABRICATED ZERO as fact, with no error anywhere. Failing loud here is the only place the
     * distinction still exists.
     *
     * @param {string} community_id
     * @param {Array|null} [where_clause]
     * @returns {Promise<App[]>} the community's apps; `[]` means MEASURED-empty
     * @throws {Error} code `COMMUNITY_APPS_UNREADABLE` when the underlying read failed
     */
    static async get_apps(community_id, where_clause = null) {
        const db = new CacheFirestore();
        const appDocs = await db.get_docs(FirestoreCollections.APPS(community_id), null, where_clause);
        if (appDocs === null) {
            const err = new Error(
                `Community.get_apps("${community_id}") could not read ${FirestoreCollections.APPS(community_id)}: ` +
                `the underlying CacheFirestore.get_docs returned null, which means the read FAILED (an empty ` +
                `collection returns []). Refusing to report an empty app list for a community whose apps are ` +
                `unknown — a fabricated zero read as fact is worse than an error.`
            );
            err.code = 'COMMUNITY_APPS_UNREADABLE';
            err.statusCode = 503;
            err.data = { code: 'COMMUNITY_APPS_UNREADABLE', community_id };
            throw err;
        }
        return appDocs.map(doc => App.from_dict(doc)).filter(app => app !== null);
    }
}

// --- UserCommunityStats Class ---

export class UserCommunityStats {
    constructor(user_id, community_id, community_rep = 0, community_ref = 0, community_dip = 0) {
        this.user_id = user_id;
        this.community_id = community_id;
        this.community_rep = community_rep;
        this.community_ref = community_ref;
        this.community_dip = community_dip;
        this.db = new CacheFirestore();
    }

    get doc_id() { return this.community_id; }
    get collection_path() { return FirestoreCollections.USER_COMMUNITY_STATS(this.user_id); }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.community_rep === undefined) copy.community_rep = 0;
        if (copy.community_ref === undefined) copy.community_ref = 0;
        if (copy.community_dip === undefined) copy.community_dip = 0;
        return copy;
    }

    async to_firestore() {
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(user_id, community_id) {
        const db = new CacheFirestore();
        const stats_path = FirestoreCollections.USER_COMMUNITY_STATS(user_id);
        const doc = await db.get_doc(stats_path, community_id);
        if (!doc) return null;
        return new UserCommunityStats(
            doc.user_id || user_id, doc.community_id || community_id,
            doc.community_rep || 0, doc.community_ref || 0, doc.community_dip || 0
        );
    }

    async incrementRep(amount) {
        return await this.db.update_doc_field(this.collection_path, this.doc_id, 'community_rep', FieldValue.increment(amount));
    }
    async incrementRef(amount) {
        return await this.db.update_doc_field(this.collection_path, this.doc_id, 'community_ref', FieldValue.increment(amount));
    }
    async incrementDip(amount) {
        return await this.db.update_doc_field(this.collection_path, this.doc_id, 'community_dip', FieldValue.increment(amount));
    }
    async resetRef() {
        return await this.db.update_doc_field(this.collection_path, this.doc_id, 'community_ref', 0);
    }
    async resetDip() {
        return await this.db.update_doc_field(this.collection_path, this.doc_id, 'community_dip', 0);
    }
}

// --- GuildSettings Class ---

export class GuildSettings {
    constructor(
        guild_id, owner_id, associated_community_id = null,
        accumulated_ref_commission = 0,
        accumulated_rep_commission = 0,
        accumulated_dip_commission = 0
    ) {
        this.guild_id = guild_id;
        this.owner_id = owner_id;
        this.associated_community_id = associated_community_id;
        this.accumulated_ref_commission = accumulated_ref_commission;
        this.accumulated_rep_commission = accumulated_rep_commission;
        this.accumulated_dip_commission = accumulated_dip_commission;
        this.db = new CacheFirestore();
    }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.accumulated_ref_commission === undefined) copy.accumulated_ref_commission = 0;
        if (copy.accumulated_rep_commission === undefined) copy.accumulated_rep_commission = 0;
        if (copy.accumulated_dip_commission === undefined) copy.accumulated_dip_commission = 0;
        return copy;
    }

    async to_firestore() {
        return await this.db.put_doc(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, this.to_dict());
    }

    static async from_firestore(guild_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.GUILD_SETTINGS(), guild_id);
        if (!doc) return null;
        return new GuildSettings(
            doc.guild_id || guild_id,
            doc.owner_id,
            doc.associated_community_id || null,
            doc.accumulated_ref_commission || 0,
            doc.accumulated_rep_commission || 0,
            doc.accumulated_dip_commission || 0
        );
    }

    async incrementRefCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_ref_commission', FieldValue.increment(amount));
    }
    async incrementRepCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_rep_commission', FieldValue.increment(amount));
    }
    async incrementDipCommission(amount) {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_dip_commission', FieldValue.increment(amount));
    }
    async resetRefCommission() {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_ref_commission', 0);
    }
    async resetRepCommission() {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_rep_commission', 0);
    }
    async resetDipCommission() {
        return await this.db.update_doc_field(FirestoreCollections.GUILD_SETTINGS(), this.guild_id, 'accumulated_dip_commission', 0);
    }
}

// --- Promotion Class ---

export class Promotion {
    constructor(
        custom_id, campaign_name, start_date, end_date, is_active,
        reward_type = 'REF', reward_data = {}, target_community_id = null
    ) {
        if (!custom_id || String(custom_id).trim() === "") {
            custom_id = crypto.randomUUID();
        }
        this.custom_id = custom_id;
        this.campaign_name = campaign_name;
        this.start_date = start_date;
        this.end_date = end_date;
        this.is_active = is_active;
        this.reward_type = reward_type;
        this.reward_data = reward_data;
        this.target_community_id = target_community_id;
        this.db = new CacheFirestore();
    }

    to_dict() {
        const copy = { ...this };
        if (copy.start_date instanceof Date) copy.start_date = Timestamp.fromDate(copy.start_date);
        if (copy.end_date instanceof Date) copy.end_date = Timestamp.fromDate(copy.end_date);
        if (copy.reward_data === undefined) copy.reward_data = {};
        if (copy.reward_type === undefined) copy.reward_type = 'REF';
        delete copy.db;
        return copy;
    }

    async to_firestore() {
        return await this.db.put_doc(FirestoreCollections.PROMOTIONS(), this.custom_id, this.to_dict());
    }

    static async from_firestore(custom_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.PROMOTIONS(), custom_id);
        if (!doc) return null;
        const start_date_obj = doc.start_date instanceof Timestamp ? doc.start_date.toDate() : null;
        const end_date_obj = doc.end_date instanceof Timestamp ? doc.end_date.toDate() : null;
        return new Promotion(
            doc.custom_id || custom_id,
            doc.campaign_name, start_date_obj, end_date_obj,
            doc.is_active,
            doc.reward_type || 'REF',
            doc.reward_data || {},
            doc.target_community_id || null
        );
    }

    static async findActivePromotion() {
        const db = new CacheFirestore();
        const now = new Date();
        const promotions = await db.get_docs(FirestoreCollections.PROMOTIONS(), null, [
            ['is_active', '==', true]
        ]);
        if (promotions && promotions.length > 0) {
            const validPromotions = promotions.filter(p_data => {
                const p = Promotion.from_dict(p_data);
                return (!p.start_date || p.start_date <= now) && (!p.end_date || p.end_date >= now);
            });
            if (validPromotions.length > 0) {
                return Promotion.from_dict(validPromotions[0]);
            }
        }
        return null;
    }

    static from_dict(doc) {
        const start_date_obj = doc.start_date instanceof Timestamp ? doc.start_date.toDate() : null;
        const end_date_obj = doc.end_date instanceof Timestamp ? doc.end_date.toDate() : null;
        return new Promotion(
            doc.custom_id, doc.campaign_name, start_date_obj, end_date_obj, doc.is_active,
            doc.reward_type || 'REF', doc.reward_data || {}, doc.target_community_id || null
        );
    }
}

// --- NFT Class ---

export class NFT {
    constructor(
        nft_id, owner_id, community_id, token_symbol, batch_number,
        ad_credits = 0, is_app_creator = false,
        created_at = new Date(), updated_at = new Date()
    ) {
        this.nft_id = nft_id;
        this.owner_id = owner_id;
        this.community_id = community_id;
        this.token_symbol = token_symbol;
        this.batch_number = batch_number;
        this.ad_credits = ad_credits;
        this.is_app_creator = is_app_creator;
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
        this.updated_at = updated_at instanceof Date ? updated_at : new Date(updated_at);
        this.db = new CacheFirestore();
    }

    get collection_path() { return 'NFTs'; }
    get doc_id() { return this.nft_id; }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.created_at instanceof Date) copy.created_at = Timestamp.fromDate(copy.created_at);
        if (copy.updated_at instanceof Date) copy.updated_at = Timestamp.fromDate(copy.updated_at);
        return copy;
    }

    async to_firestore() {
        this.updated_at = new Date();
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(nft_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc('NFTs', nft_id);
        if (!doc) return null;
        return NFT.from_dict(doc);
    }

    static from_dict(data) {
        if (!data) return null;
        const created = data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at);
        const updated = data.updated_at instanceof Timestamp ? data.updated_at.toDate() : new Date(data.updated_at);
        return new NFT(
            data.nft_id, data.owner_id, data.community_id, data.token_symbol,
            data.batch_number, data.ad_credits, data.is_app_creator,
            created, updated
        );
    }
}

// --- AdCampaign Class ---

export class AdCampaign {
    constructor(
        campaign_id, owner_id, nft_id, app_id, community_id,
        content, keywords = [], locations = [],
        status = 'ACTIVE', stats = { impressions: 0, clicks: 0 },
        created_at = new Date(), updated_at = new Date()
    ) {
        this.campaign_id = campaign_id;
        this.owner_id = owner_id;
        this.nft_id = nft_id;
        this.app_id = app_id;
        this.community_id = community_id;
        this.content = content;
        this.keywords = keywords || [];
        this.locations = locations || [];
        this.status = status;
        this.stats = stats || { impressions: 0, clicks: 0 };
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
        this.updated_at = updated_at instanceof Date ? updated_at : new Date(updated_at);
        this.db = new CacheFirestore();
    }

    get collection_path() { return 'AdCampaigns'; }
    get doc_id() { return this.campaign_id; }

    to_dict() {
        const copy = { ...this };
        delete copy.db;
        if (copy.created_at instanceof Date) copy.created_at = Timestamp.fromDate(copy.created_at);
        if (copy.updated_at instanceof Date) copy.updated_at = Timestamp.fromDate(copy.updated_at);
        return copy;
    }

    async to_firestore() {
        this.updated_at = new Date();
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(campaign_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc('AdCampaigns', campaign_id);
        if (!doc) return null;
        return AdCampaign.from_dict(doc);
    }

    static from_dict(data) {
        if (!data) return null;
        const created = data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at);
        const updated = data.updated_at instanceof Timestamp ? data.updated_at.toDate() : new Date(data.updated_at);
        return new AdCampaign(
            data.campaign_id, data.owner_id, data.nft_id, data.app_id, data.community_id,
            data.content, data.keywords, data.locations,
            data.status, data.stats,
            created, updated
        );
    }

    async track_impression() {
        this.stats.impressions = (this.stats.impressions || 0) + 1;
        await this.to_firestore();
    }

    async track_click() {
        this.stats.clicks = (this.stats.clicks || 0) + 1;
        await this.to_firestore();
    }
}

// --- SharedAsset Class ---

export class SharedAsset {
    constructor(asset_id, owner_id, community_id, app_id, asset_type, asset_name, source_drive_folder_id, creation_timestamp = new Date(), kb_token_count = 0, status = 'PENDING') {
        this.asset_id = asset_id;
        this.owner_id = owner_id;
        this.community_id = community_id;
        this.app_id = app_id;
        this.asset_type = asset_type;
        this.asset_name = asset_name;
        this.source_drive_folder_id = source_drive_folder_id;
        this.creation_timestamp = creation_timestamp instanceof Date ? creation_timestamp : new Date(creation_timestamp);
        this.kb_token_count = kb_token_count;
        this.status = status;
        this.db = new CacheFirestore();
    }

    get doc_id() { return clean_name_for_id(this.asset_id); }
    get collection_path() { return FirestoreCollections.SHARED_ASSETS(this.community_id, this.app_id); }

    to_dict() {
        const copy = { ...this };
        if (copy.creation_timestamp instanceof Date) copy.creation_timestamp = Timestamp.fromDate(copy.creation_timestamp);
        delete copy.db;
        return copy;
    }

    async to_firestore() {
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(community_id, app_id, asset_doc_id) {
        const db = new CacheFirestore();
        const asset_path = FirestoreCollections.SHARED_ASSETS(community_id, app_id);
        const doc = await db.get_doc(asset_path, asset_doc_id);
        if (!doc) return null;
        const creation_ts = doc.creation_timestamp instanceof Timestamp ? doc.creation_timestamp.toDate() : new Date(doc.creation_timestamp);
        return new SharedAsset(
            doc.asset_id, doc.owner_id, doc.community_id || community_id, doc.app_id || app_id,
            doc.asset_type, doc.asset_name, doc.source_drive_folder_id,
            creation_ts, doc.kb_token_count || 0, doc.status || 'PENDING'
        );
    }
}
