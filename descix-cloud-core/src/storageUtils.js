/**
 * Universal Firestore access for DeSciX platform services.
 * Single source of Firestore, Timestamp, FieldValue - avoids "Timestamp doesn't match" errors
 * when multiple packages each have their own @google-cloud/firestore.
 */

import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { getFirestoreInstance } from './firestore.js';
import { publishMessage } from './pubsub.js';
import { getCloudConfig } from './config.js';

// AuthProvider enum - supports all authentication methods (OAuth and native)
class AuthProvider {
    static DISCORD = 'discord';
    static GOOGLE = 'google';
    static GITHUB = 'github';
    static DESCIX = 'descix';      // Native email-based authentication
    static WALLET = 'wallet';       // Wallet signature authentication
    static POWCH = 'powch';        // Passkey (WebAuthn) authentication
}

// Backward compatibility: OAuth2Provider is alias for AuthProvider
const OAuth2Provider = AuthProvider;

class BaseStoragePath {
    constructor(collection_path = null, document_type = "dict") {
        this.collection_path = collection_path;
        this.document_type = document_type;
        this._formatted_path = null;
        this._document_id_vars = null;
    }

    _stringifyVars(vars) {
        const stringified = {};
        for (const key in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] !== null && vars[key] !== undefined) {
                stringified[key] = String(vars[key]);
            } else if (Object.prototype.hasOwnProperty.call(vars, key)) {
                 console.warn(`Path variable ${key} is null or undefined for path ${this.collection_path}`);
                 stringified[key] = '';
            }
        }
        return stringified;
    }

    getPath(document_id_vars = null) {
        if (document_id_vars === null) {
            if (this.collection_path && (this.collection_path.includes('{') || this.collection_path.includes('}'))) {
                 console.error(`Path template requires variables but none were provided: ${this.collection_path}`);
                 throw new Error(`Path template requires variables but none were provided`);
            }
            return this.collection_path;
        }
        const stringVars = this._stringifyVars(document_id_vars);
        this._document_id_vars = stringVars;
        try {
            let missingVar = null;
            this._formatted_path = this.collection_path.replace(/{(\w+)}/g, (_, key) => {
                 if (Object.prototype.hasOwnProperty.call(stringVars, key)) {
                     if (stringVars[key] === '') {
                         console.error(`Resolved variable '${key}' resulted in an empty string for path template: ${this.collection_path}`);
                         throw new Error(`Resolved variable '${key}' is empty, resulting in an invalid path segment`);
                     }
                     return stringVars[key];
                 }
                 if (missingVar === null) missingVar = key;
                 return `{${key}}`;
            });

             if (missingVar !== null || this._formatted_path.includes('{')) {
                 console.error(`Missing variable(s) like '${missingVar || 'unknown'}' for path template: ${this.collection_path}. Provided vars: ${JSON.stringify(document_id_vars)}`);
                 throw new Error(`Missing variable(s) for path template: ${this.collection_path}`);
             }

             if (this._formatted_path.includes('//')) {
                 console.error(`Generated path contains invalid empty segments ('//'): ${this._formatted_path}`);
                 throw new Error(`Generated path contains invalid empty segments ('//')`);
             }

        } catch (e) {
             console.error(`Error formatting path ${this.collection_path} with vars ${JSON.stringify(document_id_vars)}: ${e}`);
             throw e;
        }
        return this._formatted_path;
    }
}

// --- FirestoreCollections ---
class FirestoreCollections {
    static COMMUNITY() { return new BaseStoragePath("Community", "dict").getPath(); }
    static COMMUNITY_TOPICS(topic_id, community_id) { return new BaseStoragePath("Community/{community_id}/Topics", "dict").getPath({ community_id, topic_id }); }
    static COMMUNITY_TUNING_INTERACTIONS(topic_id, community_id) { return new BaseStoragePath("Community/{community_id}/Topics/{topic_id}/TuningInteractions", "dict").getPath({ community_id, topic_id }); }
    static APPS(community_id) { return new BaseStoragePath("Community/{community_id}/Apps", "dict").getPath({ community_id }); }
    static APP_KNOWLEDGEBASES(community_id, app_id) { return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/KnowledgeBases", "dict").getPath({ community_id, app_id }); }
    static APP_CODESITES(community_id, app_id) { return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/CodeSites", "dict").getPath({ community_id, app_id }); }
    static USER_INTERACTIONS(user_id, community_id) { return new BaseStoragePath("UserCache/{user_id}/RoomConversation/{community_id}/Interactions", "dict").getPath({ user_id, community_id }); }
    static USER_CONVERSATION_STATE(user_id) { return new BaseStoragePath("UserCache/{user_id}/RoomConversation", "dict").getPath({ user_id }); }
    static USERS() { return new BaseStoragePath("UserCache", "dict").getPath(); }
    static USER_SESSIONS(user_id) { return new BaseStoragePath("UserCache/{user_id}/Sessions", "dict").getPath({ user_id }); }
    static USER_OAUTH_SESSIONS(user_id) { return FirestoreCollections.USER_SESSIONS(user_id); }
    static USER_PURCHASES(user_id) { return new BaseStoragePath("UserCache/{user_id}/Purchases", "dict").getPath({ user_id }); }
    static USER_COMMUNITY_STATS(user_id) { return new BaseStoragePath("UserCache/{user_id}/CommunityStats", "dict").getPath({ user_id }); }
    static PINECONE_CHUNKS(file_id = '{file_id}') {
        return new BaseStoragePath("IPDocs/{file_id}/PineconeChunks", "dict").getPath({ file_id });
    }
    static IP_DOCS() { return new BaseStoragePath("IPDocs", "dict").getPath(); }
    static SYSTEM_CONFIG() { return new BaseStoragePath("SystemConfig", "dict").getPath(); }
    static DISCORD_USERS() { return new BaseStoragePath("DiscordUsers", "dict").getPath(); }
    static GUILD_SETTINGS() { return new BaseStoragePath("GuildSettings", "dict").getPath(); }
    static PROMOTIONS() { return new BaseStoragePath("Promotions", "dict").getPath(); }
    static SHARED_ASSETS(community_id, app_id) { return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/SharedAssets", "dict").getPath({ community_id, app_id }); }
    static PENDING_PAYMENTS() { return new BaseStoragePath("PendingPayments", "dict").getPath(); }
    static EMAIL_VERIFICATIONS() { return new BaseStoragePath("EmailVerifications", "dict").getPath(); }
    static POWCH_CREDENTIALS() { return new BaseStoragePath("PowchCredentials", "dict").getPath(); }
    static POWCH_CHALLENGES() { return new BaseStoragePath("PowchChallenges", "dict").getPath(); }
    static POWCH_WALLETS() { return new BaseStoragePath("PowchWallets", "dict").getPath(); }
    static POWCH_LEDGER() { return new BaseStoragePath("PowchLedger", "dict").getPath(); }
    static POWCH_VERIFICATION_CODES() { return new BaseStoragePath("PowchVerificationCodes", "dict").getPath(); }
    static SERVICE_MANIFESTS() { return new BaseStoragePath("ServiceManifests", "dict").getPath(); }
    static PROVIDER_INDEX() { return new BaseStoragePath("ProviderIndex", "dict").getPath(); }
    static WALLET_INDEX() { return new BaseStoragePath("WalletIndex", "dict").getPath(); }
    static DEVICE_LOGIN_REQUESTS() { return new BaseStoragePath("DeviceLoginRequests", "dict").getPath(); }
    static PWA_HANDOFF_REQUESTS() { return new BaseStoragePath("PWAHandoffRequests", "dict").getPath(); }
    static SIGNATURE_INDEX() { return new BaseStoragePath("SignatureIndex", "dict").getPath(); }
    static ROLES(scope, scope_id) {
        if (scope === 'PLATFORM') {
            return new BaseStoragePath("Community/daita/Roles", "dict").getPath();
        } else if (scope === 'COMMUNITY') {
            return new BaseStoragePath("Community/{community_id}/Roles", "dict").getPath({ community_id: scope_id });
        } else if (scope === 'APP') {
            const parts = String(scope_id).split('/');
            if (parts.length !== 2) throw new Error("Invalid scope_id format for APP scope. Expected 'community_id/app_id'.");
            const [community_id, app_id] = parts;
            return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/Roles", "dict").getPath({ community_id, app_id });
        } else {
            throw new Error(`Invalid scope type for Roles collection: ${scope}`);
        }
    }
    static CONTENT_EVENT_DEDUP() { return new BaseStoragePath("ContentEventDedup", "dict").getPath(); }
    static CONTENT_STATS(entity_type, entity_id, day_bucket, shard) {
        const entityKey = `${entity_type}:${entity_id}`;
        return new BaseStoragePath("ContentStats/{entity_key}/Daily/{day_bucket}/Shards", "dict").getPath({
            entity_key: entityKey,
            day_bucket: day_bucket
        });
    }
    static KB_TUNING_DATA(community_id, app_id, knowledgebase_name) { return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/KnowledgeBases/{knowledgebase_name}/TuningData", "dict").getPath({ community_id, app_id, knowledgebase_name }); }
    static KB_TUNING_JOBS(community_id, app_id, knowledgebase_name) { return new BaseStoragePath("Community/{community_id}/Apps/{app_id}/KnowledgeBases/{knowledgebase_name}/TuningJobs", "dict").getPath({ community_id, app_id, knowledgebase_name }); }
    static TOKEN_USAGE() { return new BaseStoragePath("TokenUsage", "dict").getPath(); }
    static IP_DOCS_VIEWS() { return new BaseStoragePath("IPDocsViews", "dict").getPath(); }
    static REP_VOTES() { return new BaseStoragePath("RepVotes", "dict").getPath(); }
    static MICRO_REP_VIEWS_CAP() { return new BaseStoragePath("MicroRepViewsCap", "dict").getPath(); }

    // WS-ADMIN-B1 §5 Firestore schema additions (env-local DB, not descix-chain).
    // AirdropVerifications: EIP-191 challenge records (extended in B1 to carry email +
    // tokens_snapshot + batched/enqueued status — see stub-plan §5.2).
    static AIRDROP_VERIFICATIONS() { return new BaseStoragePath("AirdropVerifications", "dict").getPath(); }
    // pending_migrations: the batch-runner queue — NEW in B1 (stub-plan §5.1).
    static PENDING_MIGRATIONS() { return new BaseStoragePath("pending_migrations", "dict").getPath(); }
    // on_chain_log: mandatory audit row per CEO-D-ONCHAIN-POLICY for every on-chain write
    // emitted by the platform (stub-plan §5.3).
    static ON_CHAIN_LOG() { return new BaseStoragePath("on_chain_log", "dict").getPath(); }

    // WS-HEADLESS-MVP-A2 (CEO-D-2026-07-01 D2/D4): platform-wide USD AI-credits ledger.
    // Credits/balance is the ONE balance doc per user (integer micro-USD fields);
    // CreditLedger holds append-only rows — debit rows are the D4 pro-rata attribution
    // signal, consumed by the buyback worker via collectionGroup('CreditLedger').
    // See V2_docs/services/ai-credits.md.
    static USER_CREDITS(user_id) { return new BaseStoragePath("UserCache/{user_id}/Credits", "dict").getPath({ user_id }); }
    static USER_CREDIT_LEDGER(user_id) { return new BaseStoragePath("UserCache/{user_id}/CreditLedger", "dict").getPath({ user_id }); }
    // WS-FREEMIUM-ONRAMP (CEO-D-2026-07-06-FREEMIUM-ONRAMP): per-UTC-day sponsored-grant
    // burn counters {granted_micro_total, grants_count, updated_at}, doc id 'YYYY-MM-DD'.
    // In practice only the sponsor-pool principal (creditsService.SPONSOR_POOL_USER_ID)
    // carries this subcollection — it enforces the POOL daily cap independently of pool
    // balance. See V2_docs/services/ai-credits.md §5a.
    static USER_SPONSORED_DAYS(user_id) { return new BaseStoragePath("UserCache/{user_id}/SponsoredDays", "dict").getPath({ user_id }); }
}

// --- FirestoreDocumentPath ---
class FirestoreDocumentPath {
    static COMMUNITY(community_id) { return `${FirestoreCollections.COMMUNITY()}/${community_id}`; }
    static APP(community_id, app_id) { return `${FirestoreCollections.APPS(community_id)}/${app_id}`; }
    static KNOWLEDGEBASE(community_id, app_id, knowledgebase_id) { return `${FirestoreCollections.APP_KNOWLEDGEBASES(community_id, app_id)}/${knowledgebase_id}`; }
    static CODESITE(community_id, app_id, codesite_id) { return `${FirestoreCollections.APP_CODESITES(community_id, app_id)}/${codesite_id}`; }
    static USER(user_id) { return `${FirestoreCollections.USERS()}/${user_id}`; }
    static USER_SESSION(user_id, access_token) { return `${FirestoreCollections.USER_SESSIONS(user_id)}/${access_token}`; }
    static USER_OAUTH_SESSION(user_id, access_token) { return FirestoreDocumentPath.USER_SESSION(user_id, access_token); }
    static USER_PURCHASE(user_id, purchase_id) { return `${FirestoreCollections.USER_PURCHASES(user_id)}/${purchase_id}`; }
    // WS-HEADLESS-MVP-A2: the one credits balance doc per user (doc id is fixed: 'balance').
    static USER_CREDIT_BALANCE(user_id) { return `${FirestoreCollections.USER_CREDITS(user_id)}/balance`; }
    static USER_CREDIT_LEDGER_ENTRY(user_id, entry_id) { return `${FirestoreCollections.USER_CREDIT_LEDGER(user_id)}/${entry_id}`; }
    static USER_COMMUNITY_STAT(user_id, community_id) { return `${FirestoreCollections.USER_COMMUNITY_STATS(user_id)}/${community_id}`; }
    static IPDOC(file_id) { return `${FirestoreCollections.IP_DOCS()}/${file_id}`; }
    static GUILD_SETTING(guild_id) { return `${FirestoreCollections.GUILD_SETTINGS()}/${guild_id}`; }
    static PROMOTION(custom_id) { return `${FirestoreCollections.PROMOTIONS()}/${custom_id}`; }
    static SHARED_ASSET(community_id, app_id, asset_doc_id) { return `${FirestoreCollections.SHARED_ASSETS(community_id, app_id)}/${asset_doc_id}`; }
    static PROVIDER_INDEX_ENTRY(provider_type, provider_id) { return `${FirestoreCollections.PROVIDER_INDEX()}/${provider_type}/${provider_id}`; }
    static DEVICE_LOGIN_REQUEST(device_code) { return `${FirestoreCollections.DEVICE_LOGIN_REQUESTS()}/${device_code}`; }
    static PWA_HANDOFF_REQUEST(handoff_code) { return `${FirestoreCollections.PWA_HANDOFF_REQUESTS()}/${handoff_code}`; }
    static POWCH_CREDENTIAL(credential_id) { return `${FirestoreCollections.POWCH_CREDENTIALS()}/${credential_id}`; }
    static POWCH_CHALLENGE(challenge_id) { return `${FirestoreCollections.POWCH_CHALLENGES()}/${challenge_id}`; }
    static POWCH_WALLET(user_id) { return `${FirestoreCollections.POWCH_WALLETS()}/${user_id}`; }
    static POWCH_TX(tx_id) { return `${FirestoreCollections.POWCH_LEDGER()}/${tx_id}`; }
    static SERVICE_MANIFEST(service_name) { return `${FirestoreCollections.SERVICE_MANIFESTS()}/${service_name}`; }
    static ROLE(scope, scope_id, role_id) {
        const collectionPath = FirestoreCollections.ROLES(scope, scope_id);
        return `${collectionPath}/${role_id}`;
    }
}

class CacheFirestore {
    constructor(user_id = null) {
        this._db = null;
        this.user_id = user_id;
    }

    get db() {
        if (!this._db) {
            this._db = getFirestoreInstance();
        }
        return this._db;
    }

    _getDocRef(collectionPath, docId) {
        if (!collectionPath || !docId) {
            throw new Error("Collection path and document ID are required.");
        }
        return this.db.collection(collectionPath).doc(String(docId));
    }

    _getCollectionRef(collectionPath) {
        if (!collectionPath) {
            throw new Error("Collection path is required.");
        }
        return this.db.collection(collectionPath);
    }

    async put_doc(collectionPath, docId, docData) {
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            await docRef.set(docData, { merge: true });
            return true;
        } catch (e) {
            console.error(`Error putting document ${collectionPath}/${docId}: ${e}`);
            return false;
        }
    }

    async get_doc(collectionPath, docId) {
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            const doc = await docRef.get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error(`Error getting document ${collectionPath}/${docId}: ${e}`);
            return null;
        }
    }

    async doc_exists(collectionPath, docId) {
         try {
            const docRef = this._getDocRef(collectionPath, docId);
            const doc = await docRef.get();
            return doc.exists;
        } catch (e) {
            console.error(`Error checking document existence ${collectionPath}/${docId}: ${e}`);
            return false;
        }
    }

    async get_docs(collectionPath, documentIds = null, whereClause = null, orderBy = null, limit = null, sortDesc = true) {
        let query = this._getCollectionRef(collectionPath);

        if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
            if (documentIds.length <= 30) {
                 query = query.where(Firestore.FieldPath.documentId(), 'in', documentIds);
            } else {
                console.warn(`Fetching ${documentIds.length} documents individually from ${collectionPath}. Consider limiting ID count or alternative strategies.`);
                 try {
                    const promises = documentIds.map(id => this.get_doc(collectionPath, id));
                    const docs = await Promise.all(promises);
                    return docs.filter(doc => doc !== null);
                } catch (e) {
                    console.error(`Error getting documents by multiple IDs from ${collectionPath}: ${e}`);
                    return null;
                }
            }
        } else {
            if (whereClause && Array.isArray(whereClause)) {
                whereClause.forEach(([field, operator, value]) => {
                    query = query.where(field, operator, value);
                });
            }
            if (orderBy) {
                query = query.orderBy(orderBy, sortDesc ? "desc" : "asc");
            }
            if (limit) {
                query = query.limit(limit);
            }
        }

        try {
            const snapshot = await query.get();
            if (snapshot.empty) {
                return [];
            }
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error(`Error getting documents from ${collectionPath}: ${e}`);
            return null;
        }
    }

    /**
     * Variant of get_docs that preserves the Firestore document ID by attaching it as `_id` on each returned object.
     * Use when the caller needs the doc ID as a recovery fallback (e.g., a missing or corrupt name field).
     * Same signature as get_docs; returned objects are { ...doc.data(), _id: doc.id }.
     */
    async get_docs_with_ids(collectionPath, documentIds = null, whereClause = null, orderBy = null, limit = null, sortDesc = true) {
        let query = this._getCollectionRef(collectionPath);

        if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
            if (documentIds.length <= 30) {
                 query = query.where(Firestore.FieldPath.documentId(), 'in', documentIds);
            } else {
                try {
                    const promises = documentIds.map(async (id) => {
                        const data = await this.get_doc(collectionPath, id);
                        return data ? { ...data, _id: id } : null;
                    });
                    const docs = await Promise.all(promises);
                    return docs.filter(doc => doc !== null);
                } catch (e) {
                    console.error(`Error getting documents by multiple IDs from ${collectionPath}: ${e}`);
                    return null;
                }
            }
        } else {
            if (whereClause && Array.isArray(whereClause)) {
                whereClause.forEach(([field, operator, value]) => {
                    query = query.where(field, operator, value);
                });
            }
            if (orderBy) {
                query = query.orderBy(orderBy, sortDesc ? "desc" : "asc");
            }
            if (limit) {
                query = query.limit(limit);
            }
        }

        try {
            const snapshot = await query.get();
            if (snapshot.empty) {
                return [];
            }
            return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
        } catch (e) {
            console.error(`Error getting documents (with ids) from ${collectionPath}: ${e}`);
            return null;
        }
    }


    async put_docs(collectionPath, docIds, docsData) {
        if (!docIds || !docsData || docIds.length !== docsData.length) {
             console.error("Mismatched docIds and docsData arrays for batch put.");
             return false;
        }
        const batch = this.db.batch();
        let operationCount = 0;
        try {
            docIds.forEach((docId, index) => {
                const docRef = this._getDocRef(collectionPath, docId);
                let data = docsData[index];
                if (typeof data !== "object" || data === null) {
                    console.warn(`Invalid data type for doc ${docId} in batch put, wrapping:`, data);
                    data = { value: data };
                }
                batch.set(docRef, data, { merge: true });
                operationCount++;
                if (operationCount >= 499) {
                    console.warn("Batch size approaching limit, consider chunking for very large puts.");
                }
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.error(`Error putting documents to ${collectionPath}: ${e}`);
            return false;
        }
    }

    async update_doc_field(collectionPath, docId, fieldName, newValue) {
        return this.update_doc_fields(collectionPath, docId, { [fieldName]: newValue });
    }

    async update_doc_fields(collectionPath, docId, updates) {
        if (typeof updates !== 'object' || updates === null || Object.keys(updates).length === 0) {
            console.error(`Invalid or empty updates object provided for ${collectionPath}/${docId}.`);
            return false;
        }
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            await docRef.update(updates);
            return true;
        } catch (e) {
             if (e.code === 5) {
                 console.warn(`Document ${collectionPath}/${docId} not found for update. Cannot perform update.`);
                 return false;
             }
            console.error(`Error updating document fields for ${collectionPath}/${docId}: ${e}`);
            return false;
        }
    }

    async get_doc_field(collectionPath, docId, fieldName) {
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            const doc = await docRef.get();
            return doc.exists ? doc.get(fieldName) : undefined;
        } catch (e) {
            console.error(`Error getting document field ${fieldName} from ${collectionPath}/${docId}: ${e}`);
            return undefined;
        }
    }

    async get_multiple_docs(collectionName, docIds) {
        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return [];
        }
        const docs = await this.get_docs(collectionName, docIds);
        return docs || [];
    }

    async delete_doc(collectionPath, docId) {
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            await docRef.delete();
            return true;
        } catch (e) {
            console.error(`Error deleting document ${collectionPath}/${docId}: ${e}`);
            return false;
        }
    }

    async delete_docs(collectionPath, docIds) {
         if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return true;
        }
        try {
            const batchSize = 499;
            for (let i = 0; i < docIds.length; i += batchSize) {
                const batch = this.db.batch();
                const chunk = docIds.slice(i, i + batchSize);
                chunk.forEach(docId => {
                    const docRef = this._getDocRef(collectionPath, docId);
                    batch.delete(docRef);
                });
                await batch.commit();
                console.log(`Deleted batch of ${chunk.length} documents from ${collectionPath}.`);
            }
            return true;
        } catch (e) {
            console.error(`Error deleting documents from ${collectionPath}: ${e}`);
            return false;
        }
    }

    async list_document_ids(collectionPath) {
        try {
            const collectionRef = this._getCollectionRef(collectionPath);
            const docRefs = await collectionRef.listDocuments();
            return docRefs.map(ref => ref.id);
        } catch (e) {
            console.error(`Error listing documents from ${collectionPath}: ${e}`);
            return [];
        }
    }

    async recursive_delete_doc(collectionPath, docId) {
        try {
            const docRef = this._getDocRef(collectionPath, docId);
            await this.db.recursiveDelete(docRef);
            console.log(`Recursively deleted ${collectionPath}/${docId}`);
            return true;
        } catch (e) {
            console.error(`Error recursively deleting ${collectionPath}/${docId}: ${e}`);
            return false;
        }
    }

    async delete_collection(collectionPath) {
        try {
            const collectionRef = this._getCollectionRef(collectionPath);
            await this.db.recursiveDelete(collectionRef);
            console.log(`Deleted collection ${collectionPath}`);
            return true;
        } catch (e) {
            console.error(`Error deleting collection ${collectionPath}: ${e}`);
            return false;
        }
    }

    async put_sub_doc(collectionNames, documentIds, finalCollectionName, finalDocId, docData) {
         try {
            let currentRef = this.db;
            for(let i = 0; i < collectionNames.length; i++){
                currentRef = currentRef.collection(collectionNames[i]).doc(String(documentIds[i]));
            }
            const finalDocRef = currentRef.collection(finalCollectionName).doc(String(finalDocId));
            await finalDocRef.set(docData, { merge: true });
            return true;
        } catch (e) {
            console.error(`Error putting sub-document: ${e}`);
            return false;
        }
    }

    async update_sub_doc_field(collectionNames, documentIds, finalCollectionName, finalDocId, fieldName, newValue) {
         try {
            let currentRef = this.db;
            for(let i = 0; i < collectionNames.length; i++){
                currentRef = currentRef.collection(collectionNames[i]).doc(String(documentIds[i]));
            }
            const finalDocRef = currentRef.collection(finalCollectionName).doc(String(finalDocId));
            await finalDocRef.update({ [fieldName]: newValue });
            return true;
        } catch (e) {
            console.error(`Error updating sub-document field: ${e}`);
            return false;
        }
    }

    async get_sub_doc_field(collectionNames, documentIds, finalCollectionName, finalDocId, fieldName) {
         try {
            let currentRef = this.db;
            for(let i = 0; i < collectionNames.length; i++){
                currentRef = currentRef.collection(collectionNames[i]).doc(String(documentIds[i]));
            }
            const finalDocRef = currentRef.collection(finalCollectionName).doc(String(finalDocId));
            const doc = await finalDocRef.get();
            return doc.exists ? doc.get(fieldName) : undefined;
        } catch (e) {
            console.error(`Error getting sub-document field: ${e}`);
            return undefined;
        }
    }

    async _modifyDocField(collectionPath, docId, fieldName, modificationValue) {
         try {
            const docRef = this._getDocRef(collectionPath, docId);
            await docRef.update({ [fieldName]: modificationValue });
            return true;
        } catch (e) {
            if (e.code === 5) {
                 console.warn(`Document ${collectionPath}/${docId} not found for field modification.`);
            } else {
                console.error(`Error modifying field ${fieldName} in ${collectionPath}/${docId}: ${e}`);
            }
            return false;
        }
    }
    async append_to_array(collectionPath, docId, fieldName, newValue) {
        return this._modifyDocField(collectionPath, docId, fieldName, FieldValue.arrayUnion(newValue));
    }
    async remove_from_array(collectionPath, docId, fieldName, valueToRemove) {
         return this._modifyDocField(collectionPath, docId, fieldName, FieldValue.arrayRemove(valueToRemove));
    }
}

class Document {
    constructor(page_content = "", id = "", mime_type = "text", metadata = null) {
        this.page_content = page_content;
        this.id = id;
        this.mime_type = mime_type;
        this.metadata = metadata;
    }
}

function _generateGuid() {
    try {
        return getCloudConfig().generateGuid();
    } catch {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
}

class Purchase {
    constructor(product_path = null, project_token = null, amount = null, date = null, user_id = null, product_type = null, purchase_id = null, expires_at = null) {
        if (date === null) {
            date = new Date();
        } else if (!(date instanceof Date) && !(date instanceof Timestamp)) {
            try { date = new Date(date); } catch (e) { date = new Date(); }
        }
        if (expires_at !== null && !(expires_at instanceof Date) && !(expires_at instanceof Timestamp)) {
            try { expires_at = new Date(expires_at); } catch (e) { expires_at = null; }
        }
        if (purchase_id === null) {
            purchase_id = _generateGuid();
        }

        this.ProductPath = product_path;
        this.ProjectToken = project_token;
        this.Amount = amount;
        this.Date = date;
        this.UserId = user_id;
        this.ProductType = product_type;
        this.PurchaseId = purchase_id;
        this.ExpiresAt = expires_at;

        this.db = new CacheFirestore();
    }

    get collection_path() {
        if (!this.UserId) throw new Error("UserId is required to determine purchase collection path.");
        return FirestoreCollections.USER_PURCHASES(this.UserId);
    }
    get doc_id() {
        if (!this.PurchaseId) throw new Error("PurchaseId is required to determine purchase document ID.");
        return this.PurchaseId;
    }

    to_dict() {
        const result = {
            ProductPath: this.ProductPath,
            ProjectToken: this.ProjectToken,
            Amount: this.Amount,
            Date: this.Date instanceof Date ? Timestamp.fromDate(this.Date) : this.Date,
            UserId: this.UserId,
            ProductType: this.ProductType,
            PurchaseId: this.PurchaseId
        };
        if (this.ExpiresAt !== null && this.ExpiresAt !== undefined) {
            result.ExpiresAt = this.ExpiresAt instanceof Date ? Timestamp.fromDate(this.ExpiresAt) : this.ExpiresAt;
        }
        return result;
    }

    static from_dict(data, user_id_context = null) {
        if (!data) return null;
        const purchaseDate = data.Date instanceof Timestamp ? data.Date.toDate() : (data.Date instanceof Date ? data.Date : new Date(data.Date || Date.now()));
        let expiresAt = null;
        if (data.ExpiresAt !== null && data.ExpiresAt !== undefined) {
            expiresAt = data.ExpiresAt instanceof Timestamp ? data.ExpiresAt.toDate() : (data.ExpiresAt instanceof Date ? data.ExpiresAt : new Date(data.ExpiresAt));
        }

        return new Purchase(
            data.ProductPath,
            data.ProjectToken,
            data.Amount,
            purchaseDate,
            data.UserId || user_id_context,
            data.ProductType,
            data.PurchaseId,
            expiresAt
        );
    }


    async to_firestore() {
        if (!this.UserId || !this.PurchaseId) {
             console.error("Cannot save Purchase without UserId and PurchaseId.");
             return false;
        }
        return await this.db.put_doc(this.collection_path, this.doc_id, this.to_dict());
    }

    static async from_firestore(user_id, purchase_id) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.USER_PURCHASES(user_id), purchase_id);
        if (!doc) return null;
        return Purchase.from_dict(doc, user_id);
    }
}

class UserSession {
    constructor(provider, access_token, refresh_token = null, expires_in = null, scope = null, token_type = null, id_token = null, user_id = null, create_datetime = null) {
        if (create_datetime === null) {
            create_datetime = new Date();
        } else if (!(create_datetime instanceof Date) && !(create_datetime instanceof Timestamp)) {
             try { create_datetime = new Date(create_datetime); } catch (e) { create_datetime = new Date(); }
        }
        this.create_datetime = create_datetime;
        this.provider = provider;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_in = expires_in;
        this.scope = scope;
        this.token_type = token_type;
        this.id_token = id_token;
        this.user_id = user_id;
    }

    to_dict() {
        return {
            provider: this.provider,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            expires_in: this.expires_in,
            scope: this.scope,
            token_type: this.token_type,
            id_token: this.id_token,
            user_id: this.user_id,
            create_datetime: this.create_datetime instanceof Date ? Timestamp.fromDate(this.create_datetime) : this.create_datetime
        };
    }

    static from_dict(data) {
        if (!data) return null;
        const provider = data.provider || AuthProvider.DISCORD;
        const create_datetime = data.create_datetime instanceof Timestamp ? data.create_datetime.toDate() : (data.create_datetime instanceof Date ? data.create_datetime : new Date(data.create_datetime || Date.now()));
        return new UserSession(
            provider,
            data.access_token,
            data.refresh_token,
            data.expires_in,
            data.scope,
            data.token_type,
            data.id_token,
            data.user_id,
            create_datetime
        );
    }

    static async to_firestore(session) {
        if (!session?.user_id || !session?.access_token) {
             console.error("Cannot save UserSession without user_id and access_token.");
             return false;
        }
        const db = new CacheFirestore();
        return await db.put_doc(FirestoreCollections.USER_SESSIONS(session.user_id), session.access_token, session.to_dict());
    }

    static async from_firestore(user_id, access_token) {
        const db = new CacheFirestore();
        const doc = await db.get_doc(FirestoreCollections.USER_SESSIONS(user_id), access_token);
        if (!doc) return null;
        return UserSession.from_dict(doc);
    }

     static async is_authenticated(req) {
        try {
            const access_token = req.body?.access_token || req.headers?.authorization?.split(' ')[1];
            const user_id = req.body?.user_id;

            if (!user_id || !access_token) {
                return false;
            }

            const session = await UserSession.from_firestore(user_id, access_token);

            if (!session) {
                return false;
            }

    if (session.expires_in && session.create_datetime instanceof Date) {
         const expiryTime = new Date(session.create_datetime.getTime() + session.expires_in * 1000);
         if (new Date() > expiryTime) {
             console.log(`Session ${access_token} for user ${user_id} expired. Deleting.`);
             const db = new CacheFirestore();
             db.delete_doc(FirestoreCollections.USER_SESSIONS(user_id), access_token).catch(e => console.error("Error deleting expired session:", e));

             if (req.body?.command === 'reconnect_by_wallet') {
                 console.log(`Allowing reconnect_by_wallet to proceed for expired session.`);
                 return session;
             }

             return false;
         }
    }

            return session;

        } catch (e) {
            console.error("Error during authentication check:", e);
            return false;
        }
    }
}

async function get_results_from_bigquery(query, project_id) { return []; }

export {
    Firestore,
    FieldValue,
    Timestamp,
    publishMessage,
    UserSession,
    AuthProvider,
    OAuth2Provider,
    CacheFirestore,
    FirestoreCollections,
    FirestoreDocumentPath,
    Document,
    get_results_from_bigquery,
    Purchase
};
export { UserSession as UserOauthSession };
