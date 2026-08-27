/**
 * The ONE OWNER of "install the artifact a developer will actually receive".
 *
 * WHY IT EXISTS (measured 2026-08-27 against Core main e21fce7): the phase-1 exports gate
 * packed @descix/sdk and ran `npm install` on the tarball alone. That install FAILED —
 * `ETARGET: No matching version found for @descix/cloud-core@^1.1.0` — because cloud-core
 * 1.1.0 is not on the registry yet; only 1.0.1 is. The failure surfaced as an UNHANDLED
 * execFileSync throw, outside the gate's own try/catch, so the gate did not even report itself
 * RED: it stack-traced. A gate that cannot RUN is worse than one that cannot fail, because it
 * reads as rigour.
 *
 * The fix is not to relax the dependency range. It is to measure the CO-PUBLISHED SET: these
 * packages ship together on one publish, so the artifact a developer receives is the set, and
 * measuring one member against a registry state that will never exist measures nothing.
 *
 * The set is DERIVED, never hand-kept. `siblingsOf` walks the monorepo, reads each package's
 * real name off disk, and follows the dependency graph. A hand list cannot fail on a package
 * someone adds tomorrow, and that is exactly the failure mode.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = path.resolve(HERE, '..');
export const MONOREPO_ROOT = path.resolve(PKG_ROOT, '..');

/** Every package in the monorepo, keyed by the name it actually declares. */
export function monorepoPackages(root = MONOREPO_ROOT) {
    const found = new Map();
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const pkgJson = path.join(root, entry.name, 'package.json');
        if (!fs.existsSync(pkgJson)) continue;
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
        if (pkg.name) found.set(pkg.name, { dir: path.join(root, entry.name), pkg });
    }
    return found;
}

/**
 * The transitive set of monorepo siblings `startDir` depends on, itself excluded.
 * `includeOptionalPeers` decides whether the APP half is dragged in: a microservice-only
 * consumer never installs it, and that difference is the whole point of the install-size gate.
 */
export function siblingsOf(startDir, { includeOptionalPeers = false } = {}) {
    const all = monorepoPackages();
    const startPkg = JSON.parse(fs.readFileSync(path.join(startDir, 'package.json'), 'utf8'));

    const out = new Map();
    const seen = new Set();
    const queue = [startPkg];

    while (queue.length) {
        const pkg = queue.shift();
        if (seen.has(pkg.name)) continue;
        seen.add(pkg.name);

        const wanted = { ...(pkg.dependencies || {}) };
        if (includeOptionalPeers) Object.assign(wanted, pkg.peerDependencies || {});

        for (const dep of Object.keys(wanted)) {
            const hit = all.get(dep);
            if (!hit || dep === startPkg.name) continue;
            out.set(dep, hit.dir);
            queue.push(hit.pkg);
        }
    }
    return out;
}

/** `npm pack` a package directory into destDir; returns the absolute tarball path. */
export function pack(dir, destDir) {
    const out = execFileSync('npm', ['pack', '--pack-destination', destDir, '--silent'], {
        cwd: dir, encoding: 'utf8',
    });
    return path.join(destDir, out.trim().split('\n').pop().trim());
}

/**
 * Pack `PKG_ROOT` plus its monorepo siblings, install them into a FRESH EMPTY DIRECTORY
 * outside every checkout, and return { dir, tarballs, npmOutput, cleanup }.
 *
 * The empty directory is not a nicety. Measured today: a verifier's first grep for a symbol
 * matched three stale worktrees and would have "confirmed" a fix from a file that does not
 * ship. Nothing in this function may read the working tree.
 */
export function installPackedSet({ includeOptionalPeers = false, alsoInstall = [], label = 'set' } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `descix-${label}-`));
    const tarballs = [pack(PKG_ROOT, dir)];

    for (const [, sibDir] of siblingsOf(PKG_ROOT, { includeOptionalPeers })) {
        tarballs.push(pack(sibDir, dir));
    }

    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'gate-consumer', version: '1.0.0', private: true }) + '\n'
    );

    const args = ['install', ...tarballs, ...alsoInstall, '--no-audit', '--no-fund'];
    let npmOutput;
    try {
        npmOutput = execFileSync('npm', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
        // NEVER swallow this. An install that fails and is reported as anything other than a
        // failure is how a gate goes deaf: the phase-1 gate's crash here read as a stack trace
        // rather than RED, and a reader could not tell "the package is broken" from "the gate
        // is broken". Name both, and keep the directory so it can be inspected.
        throw new Error(
            `installPackedSet: npm install FAILED in ${dir}\n` +
            `  tarballs: ${tarballs.map((t) => path.basename(t)).join(' ')}\n` +
            `  ${(err.stderr || err.stdout || err.message).toString().trim().split('\n').slice(-6).join('\n  ')}`
        );
    }

    return { dir, tarballs, npmOutput, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

/** Packages npm reports installing, read from its own "added N packages" line. */
export function addedPackageCount(npmOutput) {
    const m = /added (\d+) packages?/.exec(npmOutput);
    if (!m) {
        throw new Error(
            `addedPackageCount: npm did not report an "added N packages" line. Refusing to ` +
            `guess a count — a gate that invents its measurement is not a gate.\n${npmOutput}`
        );
    }
    return Number(m[1]);
}

/** Installed bytes under node_modules, measured with du so it matches what a developer sees. */
export function installedBytes(dir) {
    const out = execFileSync('du', ['-sk', path.join(dir, 'node_modules')], { encoding: 'utf8' });
    return Number(out.trim().split(/\s+/)[0]) * 1024;
}
