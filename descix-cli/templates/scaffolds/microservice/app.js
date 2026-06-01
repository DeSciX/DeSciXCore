/**
 * Service Entry Point
 * 
 * Sets up Express server and mounts the API router.
 */

import express from 'express';
import cors from 'cors';
import { initializeServiceConfig, utils } from './services/utils.js';
import { killExistingProcess } from '@descix/cloud-core';
import apiRouter from './services/apiFront.js';

const app = express();

// Initialize Config (Async)
// In a real app, we might want to block startup until config is loaded
initializeServiceConfig().then(() => {
    
    // Resolve this service's own port up front so process cleanup is scoped to it.
    const port = utils.PORT;

    // Kill ONLY a prior instance of THIS service (scoped to its own port) in debug mode.
    // Port-scoping guarantees we never kill an unrelated app.js (e.g. the Core :4000 backend).
    killExistingProcess(import.meta.url, utils.DEBUG_LOCAL, port);
    
    // Middleware
    app.use(cors({ origin: true })); // Allow all origins (controlled by Core proxy)
    app.use(express.json());

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    // Mount API Router
    app.use('/api', apiRouter);

    // Start Server
    if (!port || port === 'auto') {
        console.error('[Service] CRITICAL ERROR: Port is missing or "auto". Gateway registration failed.');
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`[Service] Listening on port ${port}`);
        console.log(`[Service] Environment: ${utils.DEPLOY_ENV || 'unknown'}`);
    });

}).catch(err => {
    console.error('[Service] Failed to initialize config:', err);
    process.exit(1);
});
