/**
 * getViteHttpsConfig - Returns HTTPS config for Vite dev server.
 *
 * Uses shared dev certs from the app-sdk package. All apps using app-sdk
 * share the same cert for consistent localhost HTTPS (WebAuthn, etc.).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, 'certs');

export function getViteHttpsConfig() {
  return {
    https: {
      key: fs.readFileSync(path.join(certsDir, 'key.pem')),
      cert: fs.readFileSync(path.join(certsDir, 'cert.pem')),
    },
  };
}
