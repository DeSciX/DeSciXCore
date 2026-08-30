#!/usr/bin/env node
/**
 * check-cli-self-reference.mjs
 *
 * EVERY COMMAND AND FLAG THE CLI NAMES IN ITS OWN OUTPUT MUST EXIST IN THE CLI.
 *
 * A string telling a developer to run something the CLI does not have is the CLI misreporting
 * itself — the same property as printing a version it is not or an origin nobody chose. Measured
 * 2026-08-30: two shipped strings in lib/commands/kb.js told developers to run
 * `descix setup --dev`. `descix setup` has never existed at any ref, and `--dev` was deleted
 * earlier the same night. Both shipped inside the packed tarball.
 *
 * TRUTH SET: the EXECUTING binary, not a hand-kept list. The command tree and each command's
 * flags are read by walking `descix --help` recursively, so the gate cannot drift from the CLI
 * it guards — add a command and it is known; delete one and every string naming it goes RED.
 *
 * CLAIMS: the PACKED TARBALL, because the product is what ships. A tree-scoped scan has already
 * been shown to miss shipped code on this package (vendored files outside lib/ and bin/).
 *
 * THE SCAN IS SELF-TESTED, AND THE ROW REQUIRES IT. A scan that finds nothing and finds no
 * known-present control is a broken scan, not a clean result — measured twice tonight, once by
 * a doer and once by an orchestrator, each reading `--dev` = 0 from a scan whose control also
 * read 0. So before reporting any verdict this gate asserts it found its controls: a flag that
 * must exist (`--env`) and at least one valid `descix <command>` reference. If either reads
 * zero it exits 2 and reports nothing.
 *
 * WHAT IS NOT A VIOLATION: naming no command at all. A remedy that describes required state
 * ("`driveConfig.base_folder_id` must be set in .descix/workspace.json") is compliant — the
 * property is that whatever IS named exists, never that a remedy must name a command.
 *
 * COVERAGE BOUNDARY, printed with the verdict:
 *   · It reads string-ish text in shipped .js. A command name assembled from variables is
 *     invisible to it.
 *   · Flags are checked against the command named on the SAME line plus the global set; a flag
 *     named far from its command is checked only against the global set.
 *   · The truth set comes from the repo binary (identical source to the tarball, which carries no
 *     node_modules to run). It is a claim about the code, and the packed side supplies the claims.
 *   · It does not check that the named command WORKS — only that it exists.
 *
 * USAGE:  node scripts/check-cli-self-reference.mjs
 * EXIT :  0 clean · 1 a named command or flag does not exist · 2 could not measure
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(CLI, 'bin/descix.js');
const die = (m) => { console.error(`check-cli-self-reference: ${m}`); process.exit(2); };

const help = (argv) => {
    try {
        return execFileSync(process.execPath, [BIN, ...argv, '--help'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
    } catch (e) { return String(e.stdout || ''); }
};

/** Parse a `--help` page: child command names and this command's own flags. */
function parseHelp(text) {
    const cmds = [], flags = new Set();
    let section = null;
    for (const line of text.split('\n')) {
        if (/^Commands:/.test(line)) { section = 'c'; continue; }
        if (/^Options:/.test(line)) { section = 'o'; continue; }
        if (/^\S/.test(line)) { section = null; continue; }
        // Only lines indented EXACTLY two spaces are entries; wrapped description lines are
        // indented to the description column and must not be read as names.
        const m = line.match(/^ {2}(\S.*)$/);
        if (!m) continue;
        if (section === 'c') {
            const name = m[1].split(/\s/)[0];
            if (name && name !== 'help') cmds.push(name);
        } else if (section === 'o') {
            for (const f of m[1].matchAll(/(--[a-z][a-z0-9-]*)/g)) flags.add(f[1]);
        }
    }
    return { cmds, flags };
}

// ── TRUTH SET from the executing binary ──────────────────────────────────────────────────────
const commandFlags = new Map();   // "app init" -> Set(flags)
const globalFlags = new Set();
(function walk(prefix, depth) {
    const { cmds, flags } = parseHelp(help(prefix));
    const key = prefix.join(' ');
    commandFlags.set(key, flags);
    if (key === '') for (const f of flags) globalFlags.add(f);
    if (depth >= 3) return;
    for (const c of cmds) walk([...prefix, c], depth + 1);
})([], 0);

const commandPaths = new Set([...commandFlags.keys()].filter((k) => k !== ''));

/**
 * Does a top-level token resolve to a command at all? The help tree misses HIDDEN registrations:
 * `descix sync` is registered so it can REFUSE loudly ("has been REMOVED"), and it is absent from
 * --help. A gate that judged only the help tree would call that string a violation and push an
 * author to delete a deliberate, correct refusal message. Probed with --help, and a command that
 * does not exist falls back to the ROOT usage banner.
 */
const probeCache = new Map();
function topLevelExists(tok) {
    if (commandPaths.has(tok)) return true;
    if (probeCache.has(tok)) return probeCache.get(tok);
    const out = help([tok]);
    const exists = !/^Usage: descix \[options\] \[command\]/m.test(out.trim().split('\n')[0] || '');
    probeCache.set(tok, exists);
    return exists;
}
if (commandPaths.size < 10) die(`the command tree read only ${commandPaths.size} commands from the binary — refusing to judge against an empty truth set`);
const allFlags = new Set();
for (const set of commandFlags.values()) for (const f of set) allFlags.add(f);
console.log(`  TRUTH SET  ${commandPaths.size} command paths, ${globalFlags.size} global flags, ${allFlags.size} distinct flags, from the executing binary`);

// ── CLAIMS from the packed tarball ───────────────────────────────────────────────────────────
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'selfref-'));
execFileSync('npm', ['pack', '--pack-destination', out], { cwd: CLI, stdio: ['ignore', 'pipe', 'pipe'] });
const tgz = fs.readdirSync(out).find((f) => f.endsWith('.tgz'));
if (!tgz) die('npm pack produced no tarball');
execFileSync('tar', ['xzf', tgz], { cwd: out, stdio: ['ignore', 'pipe', 'pipe'] });
const pkg = path.join(out, 'package');

const violations = [];
let refCount = 0, envControl = 0, scanned = 0;
const walkFiles = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walkFiles(p); continue; }
        if (!e.name.endsWith('.js')) continue;
        scanned++;
        const rel = path.relative(pkg, p);
        fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
            // COMMENTS ARE NOT OUTPUT. The property is what the CLI SAYS TO A DEVELOPER; a
            // comment reaches no one at runtime. Skipping them is not leniency — judging them
            // would flag prose like "Write failure log to .descix if any batches failed" (which
            // matched `descix if`) and "Use direct descix command", turning a real gate into
            // noise its readers learn to skim.
            const t = line.trim();
            if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
            const lineFlags = [...line.matchAll(/(--[a-z][a-z0-9-]*)/g)].map((m) => m[1]);
            if (lineFlags.includes('--env')) envControl++;
            // The word boundary is load-bearing. Without it this matched `_descix context` inside
            // a variable name in a scaffold's console.warn, and `.descix if` in a path. `descix`
            // must not be preceded by a word character or a dot, so `@descix/cli`, `.descix/` and
            // `_descix` are not read as invocations. Measured: both were false positives here.
            for (const m of line.matchAll(/(?<![\w.@])descix((?:\s+[a-z][a-z0-9:-]*)+)/g)) {
                const toks = m[1].trim().split(/\s+/);
                // Longest known command path wins; a bare `descix` with no known verb is a claim
                // about the FIRST token, which is where a nonexistent command shows up.
                let best = '';
                for (let n = toks.length; n > 0; n--) {
                    const cand = toks.slice(0, n).join(' ');
                    if (commandPaths.has(cand)) { best = cand; break; }
                }
                refCount++;
                if (!best) {
                    if (topLevelExists(toks[0])) continue;   // hidden/retired but registered
                    violations.push(`${rel}:${i + 1}: names \`descix ${toks[0]}\` — no such command`);
                    continue;
                }
                // A flag is judged on whether it EXISTS IN THE CLI AT ALL, not on whether it
                // belongs to the command named on the same line. Attribution by proximity was
                // measured wrong twice here: init.js:71 names `descix login` while carrying
                // `--from-invite`, a flag of the ENCLOSING `init` command, and descix.js:4797
                // names `descix init` beside `--scope`, a flag of `tell-me-how`. Both strings are
                // correct English and neither is a misreport. What IS a misreport is a flag that
                // exists nowhere — `--dev`, deleted tonight, and `--setup`, which never existed.
                for (const f of lineFlags) {
                    if (!allFlags.has(f)) violations.push(`${rel}:${i + 1}: near \`descix ${best}\`, the flag ${f} does not exist on ANY command`);
                }
            }
        });
    }
};
walkFiles(pkg);

// ── SELF-TEST BEFORE ANY VERDICT ─────────────────────────────────────────────────────────────
if (scanned < 10) die(`scanned only ${scanned} shipped .js files — fixture invalid`);
if (envControl === 0) die('the scan found ZERO occurrences of the control flag `--env`, which certainly ships. That indicts the SCAN, not the artifact — refusing to report a verdict.');
if (refCount === 0) die('the scan found ZERO `descix <command>` references, which cannot be true of this package. Refusing to report a verdict.');
console.log(`  SCAN       ${scanned} shipped .js files, ${refCount} self-references, control \`--env\` seen ${envControl}x (non-zero: the scan works)`);

for (const v of violations) console.log(`  RED: ${v}`);
console.log(`\n${violations.length ? 'RED' : 'GREEN'} — commands or flags the CLI names but does not have: ${violations.length}`);
console.log(
    '\n  COVERAGE BOUNDARY: truth set walked from the EXECUTING binary (so it cannot drift from the\n' +
    '  CLI it guards); claims read from the PACKED tarball (so vendored shipped code is included).\n' +
    '  SELF-TESTED: a control flag and a valid reference must both read non-zero or it exits 2 —\n' +
    '  a scan that finds nothing AND finds no control is a broken scan, not a clean result.\n' +
    '  DOES NOT SEE: names assembled from variables, or anything in a COMMENT (a comment is not\n' +
    '  output). A flag is judged on whether it exists ANYWHERE in the CLI, not on the command\n' +
    '  named beside it — proximity attribution was measured wrong twice. Hidden-but-registered\n' +
    '  commands (the retired `descix sync` refusal) are probed, not assumed absent. Naming NO\n' +
    '  command is compliant. It does not check that a named command WORKS, only that it exists.');
process.exit(violations.length ? 1 : 0);
