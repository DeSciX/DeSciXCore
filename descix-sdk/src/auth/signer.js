import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Signer class for Intelligent Mesh Microservices
 * 
 * Signs requests using the injected Session Key to prove authorization
 * to act on behalf of the Runner NFT.
 */
export class Signer {
    /**
     * @param {string} [privateKey] - PEM encoded private key (defaults to env.DESCIX_SESSION_KEY or service-key.json)
     * @param {string} [nftId] - ID of the authorized NFT (defaults to env.DESCIX_NFT_ID or service-key.json)
     */
    constructor(privateKey, nftId) {
        this.privateKey = privateKey || process.env.DESCIX_SESSION_KEY;
        this.nftId = nftId || process.env.DESCIX_NFT_ID;

        // Try to load from service-key.json if not provided
        if (!this.privateKey || !this.nftId) {
            try {
                const keyPath = path.resolve(process.cwd(), 'service-key.json');
                if (fs.existsSync(keyPath)) {
                    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
                    if (!this.privateKey) this.privateKey = keyData.privateKey;
                    if (!this.nftId) this.nftId = keyData.slotId || keyData.nftId;
                }
            } catch (err) {
                // Ignore error if file doesn't exist or is invalid
            }
        }
    }

    /**
     * Sign a payload string
     * @param {string} payload 
     * @returns {string} Base64 signature
     */
    sign(payload) {
        if (!this.privateKey) {
            // In development/mock mode, we might not have a key yet
            // Return null so the caller knows not to attach headers
            return null;
        }
        
        try {
            const sign = crypto.createSign('SHA256');
            sign.update(payload);
            sign.end();
            return sign.sign(this.privateKey, 'base64');
        } catch (error) {
            console.warn('Signer: Failed to sign payload (using mock signature for dev):', error.message);
            // Fallback for dev/mock environment if key is invalid/missing
            return `mock_sig_${this.nftId}_${Date.now()}`;
        }
    }

    /**
     * Get headers for an API request
     * @param {string} [payload] - Request body/payload to sign
     * @returns {Object} Headers object
     */
    getHeaders(payload = '') {
        const signature = this.sign(payload);
        if (!signature) return {};

        return {
            'X-NFT-ID': this.nftId,
            'X-Signature': signature,
            'X-Timestamp': Date.now().toString()
        };
    }
}
