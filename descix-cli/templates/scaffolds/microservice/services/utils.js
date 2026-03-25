/**
 * Service Configuration — Thin wrapper over @descix/cloud-core
 *
 * Uses @descix/cloud-core for shared bootstrap logic:
 * - Layered config: Env -> .env -> workspace.json
 * - Secret Manager integration
 * - Auto-port detection in dev
 *
 * This is the ONLY path to config values. Never use process.env directly.
 * Never add fallback values to utils.CONFIG_VALUE — nulls surface misconfigurations.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import {
    createCloudConfig,
    getCloudConfig,
    initializeCloudConfig,
} from '@descix/cloud-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '..');

// Initialize CloudConfig with service root
createCloudConfig({ rootPath });

const utils = getCloudConfig();

export { initializeCloudConfig as initializeServiceConfig, utils };
