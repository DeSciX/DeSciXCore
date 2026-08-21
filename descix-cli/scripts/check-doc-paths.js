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
 * reported as file:line with the offending token. Exit 2 = the gate could not
 * establish where to resolve FROM, which is refused rather than guessed. No
 * warnings-only mode: a doc that lies is a failure, not a note (house rule — fail
 * loud, no fallbacks).
 *
 * KNOWN BLIND SPOT, stated because a gate's limits must be: a worktree parked
 * OUTSIDE the workspace tree (e.g. /Users/<u>/Code/.agent-worktrees/DeSciX_Core/<branch>)
 * has no ancestor holding the sibling repos, so the workspace frame cannot be found
 * and the run exits 2 asking for --root. That is deliberate — the alternative is
 * resolving cross-repo paths against a directory that merely shares the repo's name.
 *
 * Usage:
 *   node scripts/check-doc-paths.js [--root <repo-root>] [--docs <glob-dir> ...]
 *
 *   --root   The WORKSPACE frame: the directory holding DeSciX_Core, DeSciX_Cloud
 *            and DeSciX_Powch side by side, which is the frame cross-repo tokens
 *            are written in. Defaults to the parent of this repo's MAIN worktree,
 *            asked of git. Own-repo tokens resolve against THIS checkout regardless,
 *            so a worktree validates its own branch.
 *   --docs   A directory to scan recursively for .md. Repeatable. Defaults to
 *            this package's shipped agent-read surfaces.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
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

/**
 * WHERE PATHS RESOLVE FROM — asked of git, never inferred from directory depth.
 *
 * This was `PKG_ROOT/../..`: correct in a canonical checkout, wrong in every git
 * WORKTREE. A worktree lives at DeSciX_Core/.claude/worktrees/<name>, so the
 * grandparent is `.claude/worktrees`, nothing resolves, and the gate reports every
 * cross-package token in every shipped doc as dead. It failed LOUD, so it never
 * passed a bad doc — but false positives send a reader to "fix" correct paths, and
 * worktrees are how this org does all of its work.
 *
 * Two frames, because the docs legitimately use both:
 *   REPO_ROOT       this checkout, worktree or canonical. Own-repo tokens resolve
 *                   here, so a file deleted ON THIS BRANCH is caught instead of
 *                   quietly validating against the canonical checkout next door.
 *   WORKSPACE_ROOT  the directory holding DeSciX_Core / DeSciX_Cloud / DeSciX_Powch
 *                   side by side. Sibling-repo tokens resolve here.
 */
function git(args) {
  return execFileSync('git', args, { cwd: PKG_ROOT, encoding: 'utf8' }).trim();
}

let REPO_ROOT;
let MAIN_WORKTREE;
try {
  REPO_ROOT = git(['rev-parse', '--show-toplevel']);
  const line = git(['worktree', 'list', '--porcelain'])
    .split('\n')
    .find((l) => l.startsWith('worktree '));
  // The FIRST entry is always the main worktree, whose basename is the repo's
  // canonical name — the name the docs write. A worktree's own directory is named
  // for the agent that made it, so it can never supply that.
  MAIN_WORKTREE = line ? line.slice('worktree '.length) : REPO_ROOT;
} catch (e) {
  console.error('check-doc-paths: cannot ask git where this checkout is rooted.');
  console.error('  This gate resolves doc paths against the repository, not against');
  console.error('  directory depth, and it will not guess. Run it inside the checkout.');
  console.error(`  git said: ${e.message}`);
  process.exit(2);
}

const SELF_REPO = path.basename(MAIN_WORKTREE);

/**
 * The workspace frame: the nearest ancestor that CONTAINS this repo by its canonical
 * name. Walking up for the name is used rather than `dirname(MAIN_WORKTREE)` because
 * when this repo is a git SUBMODULE, git reports its main worktree inside
 * `.git/modules/…` — the basename is still the repo's real name, but the parent is a
 * git internals directory, not the checkout that holds the sibling repos.
 *
 * From a worktree at DeSciX_Core/.claude/worktrees/<agent> this climbs past
 * `worktrees`, `.claude` and `DeSciX_Core` to the directory that holds DeSciX_Core —
 * the same answer the canonical checkout gives, which is the point.
 */
function findWorkspaceRoot(startDir) {
  let dir = path.dirname(startDir);
  for (;;) {
    const candidate = path.join(dir, SELF_REPO);
    // `.git` is what separates the real checkout from a look-alike. Worktrees are
    // commonly parked under a directory NAMED for the repo (…/.agent-worktrees/
    // DeSciX_Core/<branch>), and that parking directory holds no .git of its own —
    // matching on the name alone would resolve the workspace to it and then fail to
    // find a single sibling repo.
    if (fs.existsSync(path.join(candidate, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

const WORKSPACE_ROOT = opts.root
  ? path.resolve(opts.root)
  : findWorkspaceRoot(REPO_ROOT);

if (!WORKSPACE_ROOT) {
  console.error(`check-doc-paths: no ancestor of ${REPO_ROOT} contains a "${SELF_REPO}" directory,`);
  console.error('  so there is no workspace frame to resolve cross-repo paths against.');
  console.error('  Pass --root <dir holding DeSciX_Core, DeSciX_Cloud, DeSciX_Powch> explicitly.');
  process.exit(2);
}

const root = WORKSPACE_ROOT;
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

/**
 * Resolve one repo-rooted token against the two legal frames, own-repo FIRST.
 *
 * Order matters. `DeSciX_Core/descix-cli/x.js` read in a worktree must check THIS
 * branch's copy, not the canonical checkout's — otherwise the gate green-lights a
 * doc pointing at a file the branch deleted.
 *
 * @returns {string|null} the absolute path it resolved to, or null if nothing did
 */
function resolveToken(token) {
  const [first, ...rest] = token.split('/');

  // OWN-REPO TOKENS ARE ANSWERED BY THIS CHECKOUT AND NOWHERE ELSE.
  //
  // The single frame matters more than it looks. If an own-repo miss were allowed to
  // fall through to the workspace frame, a doc naming a file THIS BRANCH deleted would
  // resolve against the canonical checkout sitting next door and the gate would pass —
  // measured, on the first cut of this fix: hiding descix-cli/lib/commands/config.js in
  // the worktree still exited 0. A gate that reads a different tree than the one under
  // review is not a gate.
  if (first === SELF_REPO) {
    if (!rest.length) return null;
    const own = path.resolve(REPO_ROOT, rest.join('/'));
    return fs.existsSync(own) ? own : null;
  }
  // Same rule for the package form ("descix-cli/…"), which names this repo without
  // spelling the repo. `first` being a directory of this checkout is what identifies it.
  if (fs.existsSync(path.join(REPO_ROOT, first))) {
    const own = path.resolve(REPO_ROOT, token);
    return fs.existsSync(own) ? own : null;
  }

  // Genuinely a sibling repo: DeSciX_Cloud/…, DeSciX_Powch/….
  const sibling = path.resolve(WORKSPACE_ROOT, token);
  return fs.existsSync(sibling) ? sibling : null;
}

const failures = [];
let checked = 0;

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const token of tokensOnLine(line)) {
      if (!isCandidate(token)) continue;
      checked++;
      // Repo-rooted by construction (see isCandidate). Resolution never falls back to
      // a DOC-RELATIVE path — one that happened to exist beside the doc would mask a
      // dead cross-package reference, which is the whole class this gate exists for.
      if (!resolveToken(token)) {
        failures.push({ file: path.relative(REPO_ROOT, file), line: i + 1, token });
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
