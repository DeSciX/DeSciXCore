#!/usr/bin/env node
/**
 * check-cli-dead-verbs.mjs
 *
 * EVERY PLATFORM VERB THE PACKED CLI INVOKES MUST EXIST IN AN OWNER. Dead verbs = 0.
 *
 * WHY THE PACKED TARBALL AND NOT THE SOURCE TREE. The product is the published package, not the
 * checkout. And the difference is not theoretical: measured 2026-08-30, the tarball carries 75
 * distinct `invoke()` literals while `lib/` + `bin/` carry 74. The extra one is
 * `authenticate_by_signature`, in `vendor/mcp/transports/http-sse-transport.js` — VENDORED code
 * that SHIPS inside the package and sits outside both scanned source directories. Every
 * tree-scoped scan run against this package has been blind to it. A gate scoped to the source
 * tree cannot see vendored code that ships, so this one reads what `npm pack` produces.
 *
 * WHY IT RESOLVES AGAINST OWNERS AND KEEPS NO LIST. The obvious implementation is a file listing
 * the verbs known to be dead. That is a HAND-KEPT MIRROR of a server-side fact — the drift class
 * this contract exists to end — and it fails silently the moment a verb is retired without
 * anyone editing it. The alternative of asking the live platform makes the gate network-bound
 * and unrunnable in CI. So it does neither: it resolves each literal against the two IN-REPO
 * OWNERS, by IMPORTING them rather than re-parsing them:
 *
 *   · CORE SSOT   descix-platform-api/src/mcp-tools/nativeTools.js -> NATIVE_MCP_TOOLS
 *   · CLOUD       microservice/services/commandHandlers/registry.js -> commandRegistry
 *
 * A verb in neither is dead. Nothing is mirrored, so nothing can drift out of sync: if a verb is
 * retired from an owner, this gate starts failing on the next run by construction.
 *
 * COVERAGE BOUNDARY, printed with the verdict — read it before trusting a green:
 *   · IT IS ONLY AS CURRENT AS THE TREES IT RESOLVES AGAINST. Both owners are working-tree
 *     files. A Cloud checkout that predates a retirement will still bless a dead verb. This
 *     measures agreement between two checkouts, NOT agreement with the deployed platform.
 *   · It reads STRING LITERALS passed to `invoke(`. A verb built from a variable or a template
 *     is invisible to it.
 *   · It says nothing about whether a LIVE verb is called correctly — only that it exists.
 *   · Nothing runs it automatically.
 *
 * USAGE:  node scripts/check-cli-dead-verbs.mjs [--cloud <path-to-DeSciX_Cloud>]
 * EXIT :  0 no dead verbs · 1 dead verbs found · 2 an owner could not be read (never a pass)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(REPO, 'descix-cli');

/** FAIL LOUD, NEVER PASS QUIETLY: an owner we cannot read is exit 2, not "no dead verbs". */
function die(msg) {
    console.error(`check-cli-dead-verbs: ${msg}`);
    process.exit(2);
}

// ── Locate the Cloud checkout. Explicit flag wins; otherwise the known layouts; else say so. ──
function cloudRoot() {
    const i = process.argv.indexOf('--cloud');
    if (i !== -1) {
        const p = process.argv[i + 1];
        if (!p) die('--cloud given with no path');
        return p;
    }
    if (process.env.DESCIX_CLOUD_PATH) return process.env.DESCIX_CLOUD_PATH;
    const guesses = [
        path.resolve(REPO, '../DeSciX_Cloud'),
        path.resolve(REPO, '../../DeSciX/DeSciX_Cloud'),
        path.resolve(REPO, '../../../DeSciX/DeSciX_Cloud'),
    ];
    const hit = guesses.find((g) => fs.existsSync(path.join(g, 'microservice/services/commandHandlers/registry.js')));
    if (!hit) {
        die('cannot find the Cloud command registry. This gate resolves CLI verbs against BOTH\n' +
            '  owners and refuses to report a verdict from one. Pass --cloud <path-to-DeSciX_Cloud>\n' +
            `  or set DESCIX_CLOUD_PATH. Looked in:\n    ${guesses.join('\n    ')}`);
    }
    return hit;
}

// ── THE OWNERS, IMPORTED (not re-parsed). ────────────────────────────────────────────────────
const CLOUD = cloudRoot();
let known;
try {
    const core = await import(path.join(REPO, 'descix-platform-api/src/mcp-tools/nativeTools.js'));
    const cloud = await import(path.join(CLOUD, 'microservice/services/commandHandlers/registry.js'));
    const nativeNames = (core.NATIVE_MCP_TOOLS || []).map((t) => t && t.name).filter(Boolean);
    const cloudNames = Object.keys(cloud.commandRegistry || {});
    if (!nativeNames.length) die('NATIVE_MCP_TOOLS imported but empty — refusing to judge against an empty owner');
    if (!cloudNames.length) die('commandRegistry imported but empty — refusing to judge against an empty owner');
    known = new Set([...nativeNames, ...cloudNames]);
    console.log(`  OWNERS  Core NATIVE_MCP_TOOLS: ${nativeNames.length}   Cloud commandRegistry: ${cloudNames.length}   union: ${known.size}`);
    console.log(`          Cloud checkout: ${CLOUD}`);
} catch (e) {
    die(`could not import an owner (${e.message}). An unreadable owner is exit 2, never a pass.`);
}

// ── THE ARTIFACT: what `npm pack` actually ships. ────────────────────────────────────────────
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'deadverb-'));
execFileSync('npm', ['pack', '--pack-destination', out], { cwd: CLI, stdio: ['ignore', 'pipe', 'pipe'] });
const tgz = fs.readdirSync(out).find((f) => f.endsWith('.tgz'));
if (!tgz) die('npm pack produced no tarball — nothing here would measure the artifact');
execFileSync('tar', ['xzf', tgz], { cwd: out, stdio: ['ignore', 'pipe', 'pipe'] });

const found = new Map(); // verb -> [files]
let scanned = 0;
const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!e.name.endsWith('.js')) continue;
        scanned++;
        const rel = path.relative(path.join(out, 'package'), p);
        for (const m of fs.readFileSync(p, 'utf8').matchAll(/invoke\(\s*'([a-z0-9_]+)'/g)) {
            if (!found.has(m[1])) found.set(m[1], []);
            if (!found.get(m[1]).includes(rel)) found.get(m[1]).push(rel);
        }
    }
};
walk(path.join(out, 'package'));

// ── FIXTURE PRECONDITION + PREDICATE SELF-TEST. A scan that read nothing measures nothing, and
// a predicate that cannot find a verb everyone knows is there is broken, not informative.
if (scanned < 10) die(`scanned only ${scanned} .js files in the tarball — fixture invalid`);
if (!found.has('validate_session')) {
    die(`the predicate did not find 'validate_session', which this CLI certainly invokes.\n` +
        '  That indicts the SCAN, not the artifact. Refusing to report a verdict.');
}

const dead = [...found.keys()].filter((v) => !known.has(v)).sort();

console.log(`  ARTIFACT ${scanned} shipped .js files, ${found.size} distinct invoke() literals`);
for (const v of dead) console.log(`  DEAD    ${v}  <- ${found.get(v).join(', ')}`);
console.log(`\n${dead.length === 0 ? 'GREEN' : 'RED'} — dead verbs: ${dead.length}`);
console.log(
    '\n  COVERAGE BOUNDARY: resolves the PACKED tarball (including vendored code outside lib/ and\n' +
    '  bin/, which tree-scoped scans miss) against two IN-REPO owners, imported not mirrored.\n' +
    '  It is only as current as those two checkouts — it measures agreement between trees, NOT\n' +
    '  with the deployed platform. It reads string literals only, says nothing about whether a\n' +
    '  live verb is called CORRECTLY, and nothing runs it automatically.');
process.exit(dead.length === 0 ? 0 : 1);
