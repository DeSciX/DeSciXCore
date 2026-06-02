/**
 * Service Entry Point
 * 
 * Sets up Express server and mounts the API router.
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import { initializeServiceConfig, utils } from './services/utils.js';
import { killExistingProcess } from '@descix/cloud-core';
import apiRouter from './services/apiFront.js';

const app = express();

/**
 * Bind the http.Server with a bounded retry on EADDRINUSE.
 *
 * DEV RESTART RACE (CEO-D-2026-06-01-SCAFFOLD-RESIDUALS, fix #2):
 *   killExistingProcess() SIGKILLs the prior instance on THIS port and returns
 *   synchronously, then we bind immediately. The kernel may not have fully released
 *   the old listening socket yet (it can linger briefly after a kill -9), so the first
 *   bind can throw EADDRINUSE on a fast kill-then-restart. We retry the bind a few times
 *   with a short backoff so dev restarts don't flake. Any non-EADDRINUSE listen error
 *   fails loud (no swallowing); after the retries are exhausted we exit 1.
 *
 * NOTE: we bind an explicit http.Server (not app.listen) so the 'error'/'listening'
 * handlers attach to the SAME object we retry on. A server that failed to bind is left
 * unbound and can be re-listened safely.
 */
function listenWithRetry(server, port, { retries = 10, delayMs = 150 } = {}) {
    let attempt = 0;

    const onError = (err) => {
        if (err && err.code === 'EADDRINUSE' && attempt < retries) {
            attempt += 1;
            console.warn(`[Service] Port ${port} busy (EADDRINUSE), retry ${attempt}/${retries} in ${delayMs}ms...`);
            setTimeout(() => server.listen(port), delayMs);
            return;
        }
        // Not a transient bind race (or retries exhausted) — fail loud.
        console.error(`[Service] Failed to bind port ${port}:`, err?.message || err);
        process.exit(1);
    };

    server.on('error', onError);
    server.on('listening', () => {
        console.log(`[Service] Listening on port ${port}`);
        console.log(`[Service] Environment: ${utils.DEPLOY_ENV || 'unknown'}`);
    });

    server.listen(port);
}

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

    // Bind with a bounded retry so a fast dev kill-then-restart doesn't flake on EADDRINUSE.
    const server = http.createServer(app);
    listenWithRetry(server, port);

}).catch(err => {
    console.error('[Service] Failed to initialize config:', err);
    process.exit(1);
});
