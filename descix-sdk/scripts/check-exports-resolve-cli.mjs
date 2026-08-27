#!/usr/bin/env node
/**
 * Pack THIS package, install the tarball into a throwaway empty directory, and assert every
 * subpath its exports map declares actually resolves. PUBLISHED == PACKED: the working tree is
 * never the thing measured, because the working tree resolves files the tarball does not ship.
 *
 * Usage:  node scripts/check-exports-resolve-cli.mjs [--package <name>] [--from <installed-dir>]
 * With --from, checks an ALREADY-installed package (that is how the RED control is run against
 * a published version from the registry).
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertExportsResolve } from './check-exports-resolve.mjs';

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgName = arg('--package') || JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).name;

let from = arg('--from');
let tmp = null;
if (!from) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exports-gate-'));
    const out = execFileSync('npm', ['pack', '--pack-destination', tmp, '--silent'], { cwd: pkgRoot, encoding: 'utf8' });
    const tgz = path.join(tmp, out.trim().split('\n').pop().trim());
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"gate","version":"1.0.0","private":true}');
    execFileSync('npm', ['install', tgz, '--no-audit', '--no-fund', '--silent'], { cwd: tmp, stdio: 'ignore' });
    from = tmp;
}

try {
    const r = assertExportsResolve({ packageName: pkgName, fromDir: from });
    console.log(`exports gate GREEN — ${pkgName}@${r.version}: all ${r.checked} declared subpath(s) resolve.`);
} catch (err) {
    console.error(`exports gate RED\n${err.message}`);
    process.exitCode = 1;
} finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
}
