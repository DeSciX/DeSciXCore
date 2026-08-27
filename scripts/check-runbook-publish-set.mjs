#!/usr/bin/env node
/**
 * check-runbook-publish-set.mjs
 *
 * The publish set has ONE OWNER: .github/workflows/npm-publish.yml. The CEO-facing runbook
 * docs/runbooks/npm-trusted-publishing.md is a CONSUMER of that fact, and a consumer that
 * restates a fact drifts from it silently. This gate makes that drift a build failure.
 *
 * It reads the publishable set from the workflow (choice options MINUS the refusal case) and the
 * publishable set as STATED in the runbook (the `directory` column of its registry table, plus the
 * packages its "Not published, deliberately" paragraph names), and fails when they disagree.
 *
 * The package-name <-> directory mapping is DERIVED by reading each workspace package.json, never
 * hand-listed here: a hand list would be a third copy of a fact the tree already owns, which is the
 * same defect class this gate exists to catch.
 *
 *   node scripts/check-runbook-publish-set.mjs              # read the working tree
 *   node scripts/check-runbook-publish-set.mjs --ref <sha>  # read a git ref, touching no checkout
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_PATH = '.github/workflows/npm-publish.yml';
const RUNBOOK_PATH = 'docs/runbooks/npm-trusted-publishing.md';

const refIndex = process.argv.indexOf('--ref');
const REF = refIndex === -1 ? null : process.argv[refIndex + 1];
if (refIndex !== -1 && !REF) {
  console.error('--ref requires a git ref argument');
  process.exit(2);
}

const git = (args, quiet = false) =>
  execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    // Probing for a package.json that may not exist is expected; let the throw carry the signal
    // rather than printing "fatal:" noise that makes a working gate look broken.
    stdio: quiet ? ['ignore', 'pipe', 'ignore'] : ['ignore', 'pipe', 'inherit'],
  });

function readAt(path) {
  if (REF) return git(['show', `${REF}:${path}`]);
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

/** npm name -> directory, derived from the tree rather than declared here. */
function packageDirMap() {
  const map = new Map();
  let dirs;
  if (REF) {
    dirs = git(['ls-tree', '--name-only', `${REF}:`])
      .split('\n')
      .map((s) => s.replace(/\/$/, ''))
      .filter(Boolean);
  } else {
    dirs = readdirSync(REPO_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }
  for (const dir of dirs) {
    if (dir.startsWith('.') || dir === 'node_modules') continue;
    let raw;
    try {
      raw = REF
        ? git(['show', `${REF}:${dir}/package.json`], true)
        : existsSync(join(REPO_ROOT, dir, 'package.json'))
          ? readFileSync(join(REPO_ROOT, dir, 'package.json'), 'utf8')
          : null;
    } catch {
      raw = null;
    }
    if (!raw) continue;
    try {
      const name = JSON.parse(raw).name;
      if (name) map.set(name, dir);
    } catch {
      /* not a package we can read a name from */
    }
  }
  return map;
}

/** THE OWNER: what the workflow will actually let the CEO publish. */
function workflowSets(text) {
  const lines = text.split('\n');

  const optIdx = lines.findIndex((l) => /^\s*options:\s*$/.test(l));
  if (optIdx === -1) throw new Error(`${WORKFLOW_PATH}: no "options:" block found`);
  const options = [];
  for (let i = optIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;
    const m = line.match(/^\s*-\s+(\S+)\s*$/);
    if (!m) break;
    options.push(m[1]);
  }

  const caseIdx = lines.findIndex((l) => /case\s+"\$\{\{\s*inputs\.package\s*\}\}"\s+in/.test(l));
  if (caseIdx === -1) throw new Error(`${WORKFLOW_PATH}: no refusal "case" statement found`);
  let refused = [];
  for (let i = caseIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s*([A-Za-z0-9._|-]+)\)\s*$/);
    if (m) {
      refused = m[1].split('|').map((s) => s.trim()).filter((s) => s && s !== '.');
      break;
    }
    if (/^\s*esac\s*$/.test(lines[i])) break;
  }
  if (!refused.length) throw new Error(`${WORKFLOW_PATH}: refusal case parsed as empty`);

  const publishable = options.filter((o) => !refused.includes(o));
  return { options, refused, publishable };
}

/** THE CONSUMER: what the runbook tells the CEO is publishable. */
function runbookSets(text, nameToDir) {
  const lines = text.split('\n');
  const toDir = (tok) => {
    const t = tok.replace(/`/g, '').trim();
    if (nameToDir.has(t)) return nameToDir.get(t);
    return t; // already a directory name (e.g. cryptoapis-sdk, descix-vscode)
  };

  // The registry table: a header row carrying both "package" and "directory".
  const headIdx = lines.findIndex(
    (l) => /^\s*\|/.test(l) && /\|\s*package\s*\|/i.test(l) && /\|\s*directory\s*\|/i.test(l)
  );
  const stated = [];
  if (headIdx !== -1) {
    for (let i = headIdx + 2; i < lines.length; i++) {
      if (!/^\s*\|/.test(lines[i])) break;
      const cells = lines[i].split('|').map((c) => c.trim()).filter((c) => c.length);
      if (cells.length < 2) continue;
      stated.push(toDir(cells[1]));
    }
  }

  // The "Not published, deliberately" paragraph.
  const npIdx = lines.findIndex((l) => /Not published, deliberately/i.test(l));
  const notPublished = [];
  if (npIdx !== -1) {
    for (let i = npIdx; i < lines.length; i++) {
      if (i > npIdx && /^\s*$/.test(lines[i])) break;
      for (const m of lines[i].matchAll(/`([^`]+)`/g)) {
        const d = toDir(m[1]);
        if (!notPublished.includes(d)) notPublished.push(d);
      }
    }
  }

  return { tableFound: headIdx !== -1, stated, notPublishedFound: npIdx !== -1, notPublished };
}

/**
 * A static file must not assert mutable external state. A version number printed next to one of
 * our package names is a snapshot of the registry taken at write time, and it is wrong the moment
 * someone clicks publish.
 *
 * This catches the SUBSET of that class that carries a version literal, which is mechanical and
 * exact. It does NOT catch a claim with no number in it — "has never been published", "already
 * exists on the registry" — because separating those from legitimate prose needs a hand-maintained
 * phrase list, which would be its own drifting mirror. See the boundary printed on success.
 */
function versionAssertions(files, tokens) {
  const semver = /\b\d+\.\d+\.\d+\b/;
  const hits = [];
  for (const [path, text] of files) {
    text.split('\n').forEach((line, i) => {
      if (!semver.test(line)) return;
      const named = tokens.find((t) => line.includes(t));
      if (named) hits.push({ path, line: i + 1, named, text: line.trim() });
    });
  }
  return hits;
}

const eq = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
const show = (a) => (a.length ? [...a].sort().join(', ') : '(none)');

const nameToDir = packageDirMap();
const wf = workflowSets(readAt(WORKFLOW_PATH));
const rb = runbookSets(readAt(RUNBOOK_PATH), nameToDir);

const where = REF ? `at ${REF}` : 'in the working tree';
console.log(`check-runbook-publish-set ${where}`);
console.log(`  derived ${nameToDir.size} package name -> directory mappings from the tree`);
console.log(`  OWNER   ${WORKFLOW_PATH}`);
console.log(`          options:     ${show(wf.options)}`);
console.log(`          refused:     ${show(wf.refused)}`);
console.log(`          publishable: ${show(wf.publishable)}`);
console.log(`  CONSUMER ${RUNBOOK_PATH}`);
console.log(`          states publishable:     ${show(rb.stated)}`);
console.log(`          states NOT published:   ${show(rb.notPublished)}`);
console.log('');

const failures = [];

if (!rb.tableFound) {
  failures.push(
    'A0 the runbook states no publish set in a checkable form: no markdown table with both a ' +
      '"package" and a "directory" column was found, so its claim about what is publishable ' +
      'cannot be compared against the workflow at all.'
  );
}
if (!rb.notPublishedFound) {
  failures.push('A0 the runbook has no "Not published, deliberately" paragraph to check.');
}

const contradiction = rb.notPublished.filter((d) => wf.publishable.includes(d));
if (contradiction.length) {
  failures.push(
    `A1 the runbook says these are NOT published, but the workflow OFFERS them: ${show(contradiction)}. ` +
      `The workflow is the owner of this fact; the runbook is describing a publish set that changed under it.`
  );
}

if (rb.tableFound && !eq(rb.stated, wf.publishable)) {
  const missing = wf.publishable.filter((d) => !rb.stated.includes(d));
  const extra = rb.stated.filter((d) => !wf.publishable.includes(d));
  failures.push(
    `A2 the publishable set the runbook states does not match the workflow's. ` +
      `In the workflow but absent from the runbook: ${show(missing)}. ` +
      `In the runbook but not publishable by the workflow: ${show(extra)}.`
  );
}

const notActuallyRefused = rb.notPublished.filter(
  (d) => !wf.refused.includes(d) && !wf.publishable.includes(d)
);
if (notActuallyRefused.length) {
  failures.push(
    `A3 the runbook names these as refused, but the workflow's refusal case does not list them: ` +
      `${show(notActuallyRefused)}.`
  );
}

// B — a static file must not assert mutable external state.
const pkgTokens = [...nameToDir.keys(), ...nameToDir.values()];
const vHits = versionAssertions(
  [
    [WORKFLOW_PATH, readAt(WORKFLOW_PATH)],
    [RUNBOOK_PATH, readAt(RUNBOOK_PATH)],
  ],
  pkgTokens
);
if (vHits.length) {
  failures.push(
    'B a version literal appears next to a package name. These files are checked in; the registry ' +
      'is not, and a version written here is a snapshot that is wrong the moment someone publishes. ' +
      'State the command that answers it instead of answering it at write time:\n' +
      vHits.map((h) => `        ${h.path}:${h.line} (${h.named})  ${h.text}`).join('\n')
  );
}

if (failures.length) {
  console.error('RED — the runbook and the workflow disagree, or assert mutable state:\n');
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log('GREEN — the runbook states exactly the publish set the workflow implements,');
console.log('        and neither file pins a package version literal.');
console.log('');
console.log('        WHAT THIS DOES NOT LICENSE YOU TO BELIEVE: it compares the publish SET and');
console.log('        catches registry claims that carry a NUMBER. It does not read prose. A');
console.log('        sentence like "cloud-core has never been published" passes this gate, and so');
console.log('        does a wrong-but-well-formed version in a sentence with no package name.');
console.log('        Nothing runs this automatically; it checks only what someone runs it on.');
