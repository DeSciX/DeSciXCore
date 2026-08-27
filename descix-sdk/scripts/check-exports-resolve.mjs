/**
 * The exports-map resolve gate — ONE OWNER for "does every subpath this package DECLARES
 * actually resolve in the artifact a developer receives".
 *
 * WHY THIS EXISTS (measured 2026-08-27): @descix/sdk@1.0.0 declares "./browser" and "./mcp"
 * and ships neither. A declared subpath whose file is not in the tarball is a lie the registry
 * serves: `npm install` succeeds, and the failure surfaces later as ERR_PACKAGE_PATH_NOT_EXPORTED
 * or ERR_MODULE_NOT_FOUND inside the consumer. Install exit code does not detect it — npm never
 * checks that an exports target exists.
 *
 * The check DERIVES its subpath list from the exports map itself. It is never a hand-kept list:
 * a hand list cannot fail on an entry someone adds tomorrow, and that is the whole failure mode.
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

/** Every subpath an exports map declares, flattened. Handles string and conditional forms. */
export function declaredSubpaths(exportsField) {
    if (!exportsField) return [];
    if (typeof exportsField === 'string') return ['.'];
    return Object.keys(exportsField).filter((k) => k.startsWith('.'));
}

/**
 * Resolve every declared subpath of `packageName` from `fromDir`.
 * Returns { checked, broken: [{ subpath, code, message }] }.
 * Resolution is what counts — not install exit code.
 */
export function checkExportsResolve({ packageName, fromDir }) {
    const require = createRequire(path.join(fromDir, 'noop.js'));

    // Read package.json OFF DISK, never through require.resolve of the "./package.json"
    // subpath. MEASURED 2026-08-27: @descix/sdk@1.0.0 does not declare "./package.json" in its
    // exports map, so resolving it throws ERR_PACKAGE_PATH_NOT_EXPORTED and the gate reports a
    // failure about package.json instead of the two subpaths it exists to catch. A gate that
    // fails for the wrong reason is as useless as one that cannot fail.
    const pkgDir = path.join(fromDir, 'node_modules', ...packageName.split('/'));
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
        throw new Error(
            `check-exports-resolve: ${packageName} is not installed under ${fromDir}. ` +
            `This gate measures the INSTALLED artifact, never a working tree.`
        );
    }
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    const subpaths = declaredSubpaths(pkg.exports);
    if (subpaths.length === 0) {
        throw new Error(
            `check-exports-resolve: ${packageName} declares no exports map. ` +
            `There is nothing to gate, which is itself a finding — say so explicitly rather ` +
            `than reporting a pass.`
        );
    }

    const broken = [];
    for (const sub of subpaths) {
        if (sub === './package.json') continue; // always present by definition
        const specifier = sub === '.' ? packageName : `${packageName}/${sub.slice(2)}`;
        try {
            require.resolve(specifier);
        } catch (err) {
            broken.push({ subpath: sub, code: err.code || 'UNKNOWN', message: err.message.split('\n')[0] });
        }
    }
    return { checked: subpaths.length, subpaths, broken, version: pkg.version };
}

/** Throws naming every broken subpath. The names are the point: a gate that says only "failed" is not actionable. */
export function assertExportsResolve({ packageName, fromDir }) {
    const r = checkExportsResolve({ packageName, fromDir });
    if (r.broken.length > 0) {
        const named = r.broken.map((b) => `  ${b.subpath}  [${b.code}]`).join('\n');
        throw new Error(
            `${packageName}@${r.version} DECLARES ${r.broken.length} subpath(s) it does not ship — ` +
            `a declared subpath whose file is absent is a lie the registry serves:\n${named}\n` +
            `Delete the declaration, or ship the file. Checked ${r.checked} declared subpath(s).`
        );
    }
    return r;
}
