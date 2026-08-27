/**
 * The exports map is a PROMISE to every consumer. This test is the gate that the promise is kept
 * in the artifact a developer actually receives.
 *
 * It derives the subpath list from the exports map itself — never a hand-kept list, because a
 * hand list cannot fail on the entry someone adds tomorrow, which is the whole failure mode.
 *
 * NEGATIVE CONTROL, measured 2026-08-27 and reproducible: run the same checker against the
 * published @descix/sdk@1.0.0 and it FAILS naming ./browser and ./mcp — two subpaths that
 * version declares and does not ship. `npm install` of that version exits 0, which is exactly
 * why install exit code is not a gate.
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { declaredSubpaths } from '../scripts/check-exports-resolve.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

test('every declared subpath has a file present in the tree', () => {
    const missing = [];
    for (const sub of declaredSubpaths(pkg.exports)) {
        if (sub === './package.json') continue;
        const target = pkg.exports[sub];
        if (typeof target !== 'string') continue;
        if (!fs.existsSync(path.join(pkgRoot, target))) missing.push(`${sub} -> ${target}`);
    }
    assert.deepStrictEqual(missing, [],
        `exports declares subpath(s) whose target file does not exist:\n  ${missing.join('\n  ')}\n` +
        `A declared subpath whose file is absent is a lie the registry serves.`);
});

test('the checker itself can fail — it reports a missing target', () => {
    const fake = { '.': './src/index.js', './ghost': './does/not/exist.js' };
    const subs = declaredSubpaths(fake);
    assert.ok(subs.includes('./ghost'), 'declaredSubpaths must surface every declared key');
    assert.strictEqual(fs.existsSync(path.join(pkgRoot, fake['./ghost'])), false);
});

test('every files[] entry needed by an exports target is shipped', () => {
    const roots = new Set(pkg.files || []);
    const uncovered = [];
    for (const sub of declaredSubpaths(pkg.exports)) {
        const target = pkg.exports[sub];
        if (typeof target !== 'string') continue;
        const top = target.replace(/^\.\//, '').split('/')[0];
        if (!roots.has(top)) uncovered.push(`${sub} -> ${target} (top-level "${top}" not in files[])`);
    }
    assert.deepStrictEqual(uncovered, [],
        `exports targets outside files[] resolve in the tree but NOT in the tarball:\n  ${uncovered.join('\n  ')}`);
});
