/**
 * Service Registration Script
 * 
 * Registers the service manifest with DeSciX Cloud.
 * Usage: npm run register
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Firestore } from '@google-cloud/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Manifest
const manifestPath = path.resolve(__dirname, '../manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function register() {
    console.log(`[Register] Registering service: ${manifest.service.name}`);
    
    // Connect to Firestore (uses ADC)
    // Assumes we are running in a context with access to the Core project
    // OR we might need to hit an admin API endpoint on Core if we don't have direct DB access.
    // For this template, we'll assume direct DB access (common for internal services)
    // or provide instructions to copy output to Core.

    // OPTION: We could check if we have CREDENTIALS, if not, output the JSON 
    // for the user to paste into the Core admin console.

    try {
        const firestore = new Firestore();
        const docRef = firestore.collection('ServiceManifests').doc(manifest.service.name);
        
        await docRef.set({
            ...manifest,
            registeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        });

        console.log(`[Register] SUCCESS: Registered ${manifest.service.name}`);
        console.log(`[Register] Commands: ${Object.keys(manifest.commands).join(', ')}`);

    } catch (error) {
        console.error('[Register] FAILED:', error.message);
        console.log('\n[Tip] If you don\'t have direct Firestore access, create a document in the "ServiceManifests" collection with this ID and content:');
        console.log(`ID: ${manifest.service.name}`);
        console.log(JSON.stringify(manifest, null, 2));
    }
}

register();
