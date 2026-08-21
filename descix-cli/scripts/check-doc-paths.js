#!/usr/bin/env node
/**
 * check-doc-paths — fail the build when a shipped, corpus-vectorized doc names a
 * repository path that does not exist.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * On 2026-08-20 the EVP-DeSciX knowledge base told a working agent to look in
 * `DeSciX_ServiceSDK/templates/`. No such directory has ever existed. The KB was
 * not hallucinating freely: that path was written, as fact, in a table inside
 * agent-assets/reference/mcp-integration.md — a file this package SHIPS and the
 * corpus VECTORIZES. Retrieval served it with exactly the confidence of a true
 * path, and a seat burned a cycle chasing it.
 *
 * A sweep then found 16 dead paths across four reference docs. The dominant one
 * was a single missing segment repeated eleven times (`DeSciX_Cloud/services/*`
 * had become `DeSciX_Cloud/microservice/services/*`) — a directory rename that
 * simply never reached the docs, and then sat in the corpus.
 *
 * That is the whole point: a dead path in a vectorized doc is not a cosmetic nit,
 * it is a confabulation source, and nothing downstream can distinguish it from a
 * true one. It is also trivially machine-checkable, which is what this does.
 *
 * ── Contract ─────────────────────────────────────────────────────────────────
 * Exit 0 = every checked path resolves. Exit 1 = at least one does not, each
 * reported as file:line with the offending token. No warnings-only mode: a doc
 * that lies is a failure, not a note (house rule — fail loud, no fallbacks).
 *
 * Usage:
 *   node scripts/check-doc-paths.js [--root <repo-root>] [--docs <glob-dir> ...]
 *
 *   --root   Directory the paths are written relative to. Defaults to the
 *            grandparent of this package (the checkout that holds DeSciX_Core,
 *            DeSciX_Cloud, DeSciX_Powch side by side), because that is the frame
 *            these docs actually use.
 *   --docs   A directory to scan recursively for .md. Repeatable. Defaults to
 *            this package's shipped agent-read surfaces.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..');

// Extensions worth checking. A token without one of these is prose, not a path.
const CHECKED_EXT = ['.js', '.jsx', '.mjs', '.ts', '.json', '.md', '.sh', '.yaml', '.yml'];

/**
 * SCOPE, stated explicitly because a gate's blind spots must be known:
 * this checks CROSS-PACKAGE REPOSITORY REFERENCES only — tokens whose first
 * segment names a sibling package (`DeSciX_*`, `descix-*`).
 *
 * That is deliberate, not lazy. Cross-package paths are the class that ROTS on a
 * rename (nothing in this package's tests touches them) and the class the corpus
 * serves as authoritative — both defects found on 2026-08-20 were exactly this
 * shape. Out of scope, and NOT checked: HTTP routes (`/__descix/...`),
 * consumer-machine paths (`.claude/...`), gitignored per-checkout files
 * (`.descix/...`), bracketed or angled placeholders, and app-relative
 * illustrative examples (`kb/General/paper.md`). Widening the net to those
 * produces false positives, and a noisy gate gets switched off — which is worse
 * than no gate, because it looks like coverage.
 */
const REPO_SEGMENT = /^(DeSciX_[A-Za-z0-9_]+|descix-[a-z0-9-]+)$/;

function isCandidate(token) {
  if (!token.includes('/')) return false;                       // bare filename: too generic
  if (/\s/.test(token)) return false;                           // prose like "GET /x.json"
  if (/^(https?:|mailto:)/.test(token)) return false;           // URL
  if (/[<>{}*\[\]]/.test(token)) return false;                  // placeholder or glob
  if (token.startsWith('/')) return false;                      // absolute path or HTTP route
  if (token.includes('node_modules/')) return false;
  if (!CHECKED_EXT.some((e) => token.endsWith(e))) return false;
  return REPO_SEGMENT.test(token.split('/')[0]);                // cross-package reference only
}

/** Pull backticked tokens and markdown link targets out of one line. */
function tokensOnLine(line) {
  const out = [];
  for (const m of line.matchAll(/`([^`\n]+)`/g)) out.push(m[1].trim());
  for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) out.push(m[1].trim());
  return out;
}

/** Directories never worth walking. A gate that scans a thousand dependency READMEs is
 *  slow, and a slow gate is one somebody eventually switches off. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);

function walkMarkdown(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(p, acc);
    else if (entry.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

function parseArgs(argv) {
  const opts = { root: null, docs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') opts.root = argv[++i];
    else if (argv[i] === '--docs') opts.docs.push(argv[++i]);
    else throw new Error(`check-doc-paths: unknown argument "${argv[i]}"`);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const root = path.resolve(opts.root || path.resolve(PKG_ROOT, '..', '..'));
/**
 * THE GUARDED SET — one definition, in one place.
 *
 * A gate protects the set it was given, and a new shipped doc does not join that set by
 * being important. This list outgrew itself once already: it was written covering this
 * package's agent-assets and templates, and three package READMEs were added to the repo
 * afterwards with nothing watching them. If you ship a doc that names cross-package paths,
 * add it HERE.
 */
const CORE_ROOT = path.resolve(PKG_ROOT, '..');
const DEFAULT_DOC_TARGETS = [
  path.join(PKG_ROOT, 'agent-assets'),
  path.join(PKG_ROOT, 'templates'),
  path.join(CORE_ROOT, 'descix-app-sdk', 'README.md'),
  path.join(CORE_ROOT, 'descix-app-sdk', 'APP_SHELL_API.md'),
  path.join(CORE_ROOT, 'descix-cloud-core', 'README.md'),
  path.join(CORE_ROOT, 'descix-platform-api', 'README.md'),
  path.join(CORE_ROOT, 'descix-sdk', 'README.md'),
];

const docDirs = opts.docs.length
  ? opts.docs.map((d) => path.resolve(d))
  : DEFAULT_DOC_TARGETS;

if (!fs.existsSync(root)) {
  console.error(`check-doc-paths: --root does not exist: ${root}`);
  process.exit(2);
}

// Targets may be a directory to walk or a single file to check directly.
const files = docDirs.flatMap((d) => {
  if (fs.existsSync(d) && fs.statSync(d).isFile()) return d.endsWith('.md') ? [d] : [];
  return walkMarkdown(d);
});
if (files.length === 0) {
  // An empty scan silently "passing" is how a gate stops guarding anything.
  console.error(`check-doc-paths: no markdown found under: ${docDirs.join(', ')}`);
  process.exit(2);
}

const failures = [];
let checked = 0;

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const token of tokensOnLine(line)) {
      if (!isCandidate(token)) continue;
      checked++;
      // Repo-rooted by construction (see isCandidate), so resolve only against the
      // root. Falling back to a doc-relative resolution here would let a path that
      // happens to exist beside the doc mask a dead cross-package reference.
      const abs = path.resolve(root, token);
      if (!fs.existsSync(abs)) {
        failures.push({ file: path.relative(root, file), line: i + 1, token });
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`\ncheck-doc-paths: ${failures.length} dead path(s) in shipped docs`);
  console.error('These docs are vectorized into the corpus. A path that does not resolve');
  console.error('is served to agents with the same confidence as one that does.\n');
  for (const f of failures) console.error(`  ${f.file}:${f.line}  ->  ${f.token}`);
  console.error(`\nchecked ${checked} path token(s) across ${files.length} file(s); root=${root}\n`);
  process.exit(1);
}

console.log(`check-doc-paths: OK — ${checked} path token(s) across ${files.length} file(s) all resolve (root=${root})`);
