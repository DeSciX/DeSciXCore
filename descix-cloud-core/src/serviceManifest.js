/**
 * Service manifest registration - self-registering mesh pattern.
 * Writes manifest to Firestore ServiceManifests collection.
 */

import { Timestamp } from '@google-cloud/firestore';
import { getFirestoreInstance } from './firestore.js';

const SERVICE_MANIFESTS_COLLECTION = 'ServiceManifests';

/**
 * Register service manifest to Firestore.
 * Must be called after initializeCloudConfig() so FIRESTORE_DATABASE_ID is available.
 * @param {Object} manifest - Service manifest (e.g. from manifest.json)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function registerServiceManifest(manifest) {
    if (!manifest?.service?.name) {
        return { success: false, message: 'Invalid manifest: missing service.name' };
    }
    const db = getFirestoreInstance();
    const manifestsCollection = db.collection(SERVICE_MANIFESTS_COLLECTION);
    try {
        const manifestDoc = {
            ...manifest,
            registeredAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: 'active',
        };
        await manifestsCollection.doc(manifest.service.name).set(manifestDoc);
        const commandCount = Object.keys(manifest.commands || {}).length;
        console.log(`[Core] Registered manifest: ${manifest.service.name} (${commandCount} commands)`);
        return {
            success: true,
            message: `Service '${manifest.service.name}' registered with ${commandCount} commands`
        };
    } catch (error) {
        console.error('[Core] Failed to register manifest:', error.message);
        return { success: false, message: error.message };
    }
}
