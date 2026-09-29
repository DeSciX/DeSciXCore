/**
 * @descix/cloud-core — the ONE mount of a mesh service's /api surface.
 *
 * The platform proxies every mesh command to `https://<service>/api/<command>` (Cloud
 * serviceManifestManager.js::proxyToExternalService), and that surface is publicly reachable.
 * Each app used to decide for itself whether to put the verifier in front of it — "mount if
 * MESH_CTX_VERIFY_MODE is set" — and an app that never set the key served its commands to anyone
 * (measured on PROD, 2026-09-29). The decision now lives in CloudConfig._assertMeshPosture and
 * the mount lives here; app code has no branch to get wrong:
 *
 *     await initializeCloudConfig();
 *     app.use(express.json());
 *     mountMeshApi(app, apiRouter);
 */

import { getCloudConfig } from './config.js';
import { createMeshApiGate } from './meshContext.js';

/** The mesh-proxied surface. The gate and the application router are mounted here, together. */
export const MESH_API_PATH = '/api';

/**
 * Mount `router` on /api behind the mesh gate resolved from this process's posture.
 *
 * Call AFTER initializeCloudConfig() has resolved and AFTER the JSON body parser (the gate reads
 * `req.body._descix`). On a managed runtime the posture is always verify/enforce — CloudConfig
 * refuses to boot otherwise — so an unsigned request is answered 401 and never reaches `router`.
 *
 * @param {{use: Function}} app     an Express app (or anything with Express's `use(path, ...handlers)`)
 * @param {Function} router         the service's command router (an express.Router or handler)
 * @param {{config?: object, logger?: object}} [opts]
 * @returns the app, for chaining
 */
export function mountMeshApi(app, router, { config = getCloudConfig(), logger = console } = {}) {
    if (!app || typeof app.use !== 'function') {
        throw new Error('[meshApi] mountMeshApi(app, router): `app` must be an Express app.');
    }
    if (typeof router !== 'function') {
        throw new Error('[meshApi] mountMeshApi(app, router): `router` must be the service\'s /api router or handler.');
    }
    const posture = config.meshPosture;
    if (!posture) {
        throw new Error(
            '[meshApi] mountMeshApi was called before the mesh posture was resolved. Await ' +
            'initializeCloudConfig() first: it decides whether this service verifies, and refuses to boot ' +
            'a managed-runtime service that does not enforce.'
        );
    }
    if (posture.role !== 'service') {
        throw new Error(
            `[meshApi] mountMeshApi on a process with meshRole '${posture.role}'. Only a mesh service serves the ` +
            'mesh-proxied /api surface.'
        );
    }
    app.use(MESH_API_PATH, createMeshApiGate(posture, { logger }), router);
    return app;
}
