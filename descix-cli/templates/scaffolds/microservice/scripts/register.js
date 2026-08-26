/**
 * Service Registration Script
 *
 * Registers this service's manifest with the DeSciX platform.
 * Usage: npm run register
 *
 * THIS SCRIPT CONSUMES THE DOOR. It calls Cloud's `register_service` command over apifront,
 * through `@descix/platform-api/service-bootstrap` — the ONE owner of "a microservice registers
 * its manifest". It does NOT write the ServiceManifests collection directly.
 *
 * WHY THAT MATTERS (this is not a style preference — it was measured):
 *   The previous version of this script opened a Firestore client and `set()` the manifest
 *   verbatim into `ServiceManifests`. That bypassed every check the platform performs at
 *   registration, and the platform DERIVES a service's domain at that door. A verbatim write
 *   therefore stored a manifest with `service.domain === undefined`, and the router then composed
 *   its endpoint as `https://${service.domain}/api` — the literal string `https://undefined/api`.
 *   That is a valid URL naming a host called "undefined", so nothing threw, nothing warned, and
 *   the service simply never answered. Every service scaffolded from this template shipped that
 *   bypass. Going through the door also gets the manifest VECTORIZED, which is what makes the
 *   service's commands discoverable by `tell_me_how` — a direct write never did.
 *
 * AUTHORIZATION is a platform-runtime service-account OIDC identity token minted from ADC
 * (audience = CORE_API_URL). On Cloud Run that works with no setup. Under local developer ADC,
 * ID-token minting is unsupported without impersonation and this reports a named failure — it
 * does not fall back to anything.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServiceBootstrap } from '@descix/platform-api/service-bootstrap';
import { initializeServiceConfig, utils } from '../services/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function register() {
    await initializeServiceConfig();

    const manifestPath = path.resolve(__dirname, '../manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const bootstrap = createServiceBootstrap({
        manifest,
        // Running this script IS the explicit opt-in; there is no config key to consult. The
        // key name is still supplied so any refusal names the boot-time knob a service would use.
        selfRegister: true,
        selfRegisterConfigKey: 'npm run register',
        // No hardcoded default: CORE_API_URL is the env-correct apifront endpoint from
        // defaults-config-{env}.json, and it is also the OIDC audience.
        coreApiUrl: utils.CORE_API_URL,
        // Used ONLY to name the derived domain in a message. The platform, not this script,
        // owns the derivation.
        siteDomain: utils.SITE_DOMAIN,
    });

    const result = await bootstrap.register();

    if (result.status !== 'ok') {
        console.error(`[Register] ${manifest.service.name}: registration ${result.status} — ${result.error || result.reason}`);
        process.exit(1);
    }
    console.log(`[Register] SUCCESS: ${manifest.service.name} registered via register_service`);
    console.log(`[Register] Commands: ${Object.keys(manifest.commands).join(', ')}`);
}

register().catch((error) => {
    // Never silent: a registration this script could not even attempt is reported and exits non-zero.
    console.error(`[Register] FAILED: ${error.message}`);
    process.exit(1);
});
