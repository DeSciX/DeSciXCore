/**
 * @descix/platform-api - Firestore Models
 *
 * Platform-wide Firestore model classes shared between Cloud and Powch microservices.
 *
 * NOTE: KnowledgeBase, IPDocMetadata, and ChunkMetadata are intentionally NOT extracted here
 * because they contain dynamic imports to Cloud-specific services (pineconeService,
 * googleStorageService, geminiAPI). Those classes remain in DeSciX_Cloud/microservice/services/ipStorageUtils.js.
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
} from '@descix/cloud-core';

// Inline normalizeEmail — avoids circular dependency with email module
function normalizeEmail(email) {
    return email ? email.trim().toLowerCase() : null;
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
                'Community/descix/Apps',
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

        // Always include 'descix' community (platform core)
        communityIds.add('descix');

        return {
            communities: Array.from(communityIds),
            apps: Array.from(appIds)
        };
    } catch (error) {
        console.error('[getUserEntitlements] Error:', error);
        return { communities: ['descix'], apps: [] };
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
        // This avoids re-populating the doc with utils.DEFAULT_AI_MODEL on every hydration,
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

        return new User(
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
    }

    static async to_firestore(user_id, user_info, auth_provider = 'discord') {
        const db = new CacheFirestore();
        const user = await db.get_doc(FirestoreCollections.USERS(), user_id);
        const email = user_info?.email || null;

        let discord_user_id = null;
        let google_user_id = null;
        let auth_providers = [auth_provider];

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

        const dataToStore = {
            id: user_id,
            email: email,
            discord_user_id: discord_user_id,
            google_user_id: google_user_id,
            auth_providers: auth_providers,
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

    static async findByEmail(email) {
        if (!email) return null;
        const normalized = normalizeEmail(email);
        if (!normalized) return null;
        const db = new CacheFirestore();
        const sanitizedId = User.sanitizeProviderId(normalized);
        const emailIndexKey = `email_${sanitizedId}`;
        const index = await db.get_doc(FirestoreCollections.PROVIDER_INDEX(), emailIndexKey);
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

// --- Community Class ---

export class Community {
    constructor(
        community_id, community_name, community_description, community_email,
        default_app_id, ip_site_gcs_path_url, default_knowledgebase_name,
        is_public = false, member_count = 1, disccusion_count = 0,
        token_symbol = null, token_contract_address = null, icon_url = "", owner_id = "",
        treasury_wallet_address = null, total_community_rep = 0, total_community_ref = 0, total_community_dip = 0,
        airdrop_config = null, price = 0,
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
        this.airdrop_config = airdrop_config || {
            next_airdrop_timestamp: null, frequency_days: 30, dip_percentage: 25, ref_percentage: 10
        };
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
        if (copy.airdrop_config && copy.airdrop_config.next_airdrop_timestamp instanceof Date) {
            copy.airdrop_config.next_airdrop_timestamp = Timestamp.fromDate(copy.airdrop_config.next_airdrop_timestamp);
        } else if (copy.airdrop_config && copy.airdrop_config.next_airdrop_timestamp && !(copy.airdrop_config.next_airdrop_timestamp instanceof Timestamp)) {
            try {
                const parsedDate = new Date(copy.airdrop_config.next_airdrop_timestamp);
                copy.airdrop_config.next_airdrop_timestamp = !isNaN(parsedDate) ? Timestamp.fromDate(parsedDate) : null;
            } catch (e) { copy.airdrop_config.next_airdrop_timestamp = null; }
        }
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

        let airdrop_config = doc.airdrop_config || null;
        if (airdrop_config?.next_airdrop_timestamp instanceof Timestamp) {
            airdrop_config = { ...airdrop_config, next_airdrop_timestamp: airdrop_config.next_airdrop_timestamp.toDate() };
        }

        return new Community(
            doc.community_id,
            doc.community_name, doc.community_description, doc.community_email,
            doc.default_app_id, doc.ip_site_gcs_path_url, doc.default_knowledgebase_name,
            doc.is_public, doc.member_count, doc.disccusion_count,
            doc.token_symbol, doc.token_contract_address || null,
            doc.icon_url, doc.owner_id || "", doc.treasury_wallet_address || null,
            doc.total_community_rep || 0, doc.total_community_ref || 0, doc.total_community_dip || 0,
            airdrop_config, doc.price || 0,
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

        let airdrop_config = doc.airdrop_config || null;
        if (airdrop_config?.next_airdrop_timestamp instanceof Timestamp) {
            airdrop_config = { ...airdrop_config, next_airdrop_timestamp: airdrop_config.next_airdrop_timestamp.toDate() };
        }

        return new Community(
            doc.community_id || community_id,
            doc.community_name, doc.community_description, doc.community_email,
            doc.default_app_id, doc.ip_site_gcs_path_url, doc.default_knowledgebase_name,
            doc.is_public, doc.member_count, doc.disccusion_count,
            doc.token_symbol, doc.token_contract_address || null,
            doc.icon_url, doc.owner_id || "", doc.treasury_wallet_address || null,
            doc.total_community_rep || 0, doc.total_community_ref || 0, doc.total_community_dip || 0,
            airdrop_config, doc.price || 0,
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
    async updateAirdropConfig(newConfig) {
        if (newConfig.next_airdrop_timestamp instanceof Date) {
            newConfig.next_airdrop_timestamp = Timestamp.fromDate(newConfig.next_airdrop_timestamp);
        } else if (typeof newConfig.next_airdrop_timestamp === 'string') {
            try {
                const parsedDate = new Date(newConfig.next_airdrop_timestamp);
                newConfig.next_airdrop_timestamp = !isNaN(parsedDate) ? Timestamp.fromDate(parsedDate) : null;
            } catch (e) { newConfig.next_airdrop_timestamp = null; }
        } else if (newConfig.next_airdrop_timestamp !== null && !(newConfig.next_airdrop_timestamp instanceof Timestamp)) {
            newConfig.next_airdrop_timestamp = null;
        }
        return await this.db.update_doc_fields(FirestoreCollections.COMMUNITY(), this.community_id, { airdrop_config: newConfig });
    }

    static async get_apps(community_id, where_clause = null) {
        const db = new CacheFirestore();
        const appDocs = await db.get_docs(FirestoreCollections.APPS(community_id), null, where_clause);
        if (!appDocs) return [];
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
