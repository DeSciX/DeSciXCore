/**
 * Firestore factory - lazy singleton with named database support.
 * Uses config.FIRESTORE_DATABASE_ID from Secret Manager.
 */

import { Firestore } from '@google-cloud/firestore';
import { getCloudConfig } from './config.js';

let _firestore = null;

/**
 * Get Firestore instance. Must be called after initializeCloudConfig().
 * Supports dev/prod separation via FIRESTORE_DATABASE_ID config.
 * @param {Object} [config] - Optional config override; defaults to getCloudConfig()
 * @returns {Firestore}
 */
export function getFirestoreInstance(config = null) {
    if (_firestore) return _firestore;
    const cfg = config || getCloudConfig();
    const options = {};
    if (cfg.FIRESTORE_DATABASE_ID && cfg.FIRESTORE_DATABASE_ID !== '(default)') {
        options.databaseId = cfg.FIRESTORE_DATABASE_ID;
        console.log(`Firestore: Using named database '${cfg.FIRESTORE_DATABASE_ID}'`);
    } else {
        console.log('Firestore: Using default database');
    }
    _firestore = new Firestore(options);
    return _firestore;
}
