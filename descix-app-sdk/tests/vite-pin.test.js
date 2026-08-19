/**
 * Conformance: vite Model V — the dev gateway's proxy engine is an EXACT-PINNED
 * regular dependency of the package that imports it, and the pin is asserted at boot.
 *
 * The defect this pins shut (measured 2026-08-19, redteam A.7):
 *   - @descix/app-sdk (which does `await import('vite')` in gateway.js) declared vite
 *     only as a devDependency — an UNDECLARED RUNTIME DEP for any SDK consumer;
 *   - @descix/cli declared vite ^6.2.0 as a real dependency without importing it,
 *     so a published CLI install shipped a 6.x proxy engine while the monorepo ran 7.x.
 *
 * Run: `node --test tests/vite-pin.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertVitePin,
  pinnedViteVersion,
  resolvedVite,
  SDK_PACKAGE_JSON,
} from '../src/dev/vitePin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const CLI_PACKAGE_JSON = path.resolve(SDK_ROOT, '..', 'descix-cli', 'package.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** Write a throwaway package.json and hand its path to fn. */
function withPackageJson(pkg, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-pin-'));
  const file = path.join(dir, 'package.json');
  try {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
    return fn(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- declaration

test('vite is a REGULAR dependency of @descix/app-sdk — the package that imports it', () => {
  const pkg = readJson(SDK_PACKAGE_JSON);
  assert.ok(pkg.dependencies?.vite, 'dependencies.vite is missing');
  assert.equal(pkg.devDependencies?.vite, undefined,
    'vite must NOT be a devDependency: gateway.js imports it at runtime');
});

test('the vite declaration is an EXACT pin, not a range', () => {
  const declared = readJson(SDK_PACKAGE_JSON).dependencies.vite;
  assert.match(declared, /^\d+\.\d+\.\d+/, `declared "${declared}"`);
  assert.ok(!/[\^~*x><|| ]/.test(declared), `declared "${declared}" is a range, not an exact pin`);
});

test('the gateway imports vite from the same package that declares it', () => {
  const gateway = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'gateway.js'), 'utf8');
  assert.match(gateway, /await import\('vite'\)/);
});

test('@descix/cli declares NO vite dependency — it does not import vite', () => {
  const cli = readJson(CLI_PACKAGE_JSON);
  assert.equal(cli.dependencies?.vite, undefined,
    'the CLI is a thin wrapper around @descix/app-sdk/dev; a second vite declaration is a version-skew source');
  assert.equal(cli.devDependencies?.vite, undefined);
});

test('nothing in the CLI source imports vite (the deletion above is safe)', () => {
  const CLI_ROOT = path.dirname(CLI_PACKAGE_JSON);
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|mjs|cjs)$/.test(e.name)) {
        const src = fs.readFileSync(p, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (/(?:require|import)\s*\(?\s*['"]vite(?:\/|['"])/.test(src)) offenders.push(p);
      }
    }
  };
  for (const sub of ['bin', 'lib']) walk(path.join(CLI_ROOT, sub));
  assert.deepEqual(offenders, [], `CLI files importing vite: ${offenders.join(' ')}`);
});

// ------------------------------------------------------------------- resolver

test('the resolved vite matches the pin in this checkout', () => {
  const { pinned, resolved, packagePath } = assertVitePin();
  assert.equal(resolved, pinned, `pinned ${pinned}, resolved ${resolved} at ${packagePath}`);
  assert.equal(pinned, readJson(SDK_PACKAGE_JSON).dependencies.vite);
});

test('resolvedVite() measures what import(\'vite\') would actually load', () => {
  const { version, packagePath } = resolvedVite();
  assert.equal(path.basename(packagePath), 'package.json');
  assert.equal(version, readJson(packagePath).version);
});

// ----------------------------------------------------------- the assert bites

test('DRIFT BITES: a resolved version other than the pin fails loud, naming BOTH', () => {
  const wrong = '6.2.0';
  let err;
  try {
    withPackageJson({ name: '@descix/app-sdk', dependencies: { vite: wrong } }, (f) => assertVitePin(f));
  } catch (e) { err = e; }
  assert.ok(err, 'assertVitePin did not throw on a pin the resolved vite does not match');
  assert.match(err.message, /vite version drift/, err.message);
  assert.match(err.message, new RegExp(`pinned\\s+${wrong.replace(/\./g, '\\.')}`), err.message);
  assert.match(err.message, new RegExp(`resolved\\s+${resolvedVite().version.replace(/\./g, '\\.')}`), err.message);
  assert.match(err.message, /refusing to boot/, err.message);
});

test('a CARET declaration fails loud — Model V is exact-pin or nothing', () => {
  assert.throws(
    () => withPackageJson({ name: '@descix/app-sdk', dependencies: { vite: '^7.3.1' } }, (f) => pinnedViteVersion(f)),
    /requires an EXACT pin/,
  );
});

test('a devDependency-only declaration fails loud and says why', () => {
  assert.throws(
    () => withPackageJson({ name: '@descix/app-sdk', devDependencies: { vite: '7.3.1' } }, (f) => pinnedViteVersion(f)),
    /devDependency — the gateway imports vite at RUNTIME/,
  );
});
