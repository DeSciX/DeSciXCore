/**
 * vitePin — Model V discipline for the dev gateway's proxy engine.
 *
 * The gateway (gateway.js) boots a Vite server as a pure reverse proxy. Vite is
 * therefore a RUNTIME dependency of THIS package — the one that imports it —
 * and it is EXACT-PINNED, not caret-ranged: a minor bump to the proxy engine
 * under a developer's feet is a silent behaviour change in the one process the
 * whole local mesh rides on.
 *
 * The pin has exactly ONE owner: `dependencies.vite` in this package's
 * package.json. Nothing re-declares the version by hand — this module READS the
 * declaration, so the assert can never drift from what npm installs.
 *
 * Two things fail loud here:
 *   1. the DECLARATION is not exact (a caret/tilde/range crept back in),
 *   2. the RESOLVED vite differs from the declared pin (a hoisted or deduped
 *      copy of another major is what `import('vite')` would actually get).
 *
 * Modelled on the executable spec at godsworld/tools/serve-next.mjs:26-32.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

/** Absolute path to @descix/app-sdk's own package.json (the pin's owner). */
export const SDK_PACKAGE_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'package.json',
);

/** An exact semver pin: digits.digits.digits with an optional prerelease/build tail. */
const EXACT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * The version this package DECLARES for vite, asserted to be an exact pin.
 * @param {string} [pkgJsonPath] - override for tests
 * @returns {string}
 */
export function pinnedViteVersion(pkgJsonPath = SDK_PACKAGE_JSON) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const declared = pkg.dependencies?.vite;

  if (!declared) {
    const stray = pkg.devDependencies?.vite ? ' (it is a devDependency — the gateway imports vite at RUNTIME)' : '';
    throw new Error(
      `[Gateway] ${pkg.name} declares no dependencies.vite${stray}. ` +
      'The dev gateway imports vite at runtime; it must be an exact-pinned regular dependency of this package.',
    );
  }
  if (!EXACT_SEMVER.test(declared)) {
    throw new Error(
      `[Gateway] ${pkg.name} declares vite "${declared}" — Model V requires an EXACT pin (e.g. "7.3.1"), ` +
      'not a range. A range lets the proxy engine move under the local mesh without anyone choosing it.',
    );
  }
  return declared;
}

/**
 * The version `import('vite')` would ACTUALLY load from this package.
 * Resolution base is this module, which is the same base the gateway's dynamic
 * import uses — so this measures the real thing, not a guess.
 * @returns {{ version: string, packagePath: string }}
 */
export function resolvedVite() {
  let packagePath;
  try {
    packagePath = require.resolve('vite/package.json');
  } catch {
    // A vite that does not export ./package.json — derive the root from its entry.
    let entry;
    try {
      entry = require.resolve('vite');
    } catch {
      throw new Error(
        '[Gateway] vite is not installed where @descix/app-sdk can resolve it. ' +
        'The dev gateway cannot start. Install this package\'s dependencies (npm install).',
      );
    }
    let dir = path.dirname(entry);
    while (!fs.existsSync(path.join(dir, 'package.json'))) {
      const parent = path.dirname(dir);
      if (parent === dir) throw new Error(`[Gateway] Could not locate the package.json for the resolved vite at ${entry}.`);
      dir = parent;
    }
    packagePath = path.join(dir, 'package.json');
  }
  return { version: JSON.parse(fs.readFileSync(packagePath, 'utf8')).version, packagePath };
}

/**
 * Fail loud when the resolved vite is not the pinned vite, naming BOTH versions
 * and the file that would be loaded. Called on gateway boot, before the import.
 * @param {string} [pkgJsonPath] - override for tests
 * @returns {{ pinned: string, resolved: string, packagePath: string }}
 */
export function assertVitePin(pkgJsonPath = SDK_PACKAGE_JSON) {
  const pinned = pinnedViteVersion(pkgJsonPath);
  const { version: resolved, packagePath } = resolvedVite();

  if (resolved !== pinned) {
    throw new Error(
      `[Gateway] vite version drift — refusing to boot the local mesh on an unverified proxy engine.\n` +
      `    pinned   ${pinned}   (dependencies.vite in ${pkgJsonPath})\n` +
      `    resolved ${resolved}   (${packagePath})\n` +
      `  The gateway is verified on ${pinned}. Reinstall so the pin wins ` +
      `(npm install), or change the pin deliberately and re-verify the gateway.`,
    );
  }
  return { pinned, resolved, packagePath };
}
