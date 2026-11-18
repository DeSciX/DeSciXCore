/**
 * lib/core/SiteWalker.js walkSite is the one owner of "which files a site manifest names", and a
 * deploy REPLACES the site: an entry that names nothing would remove the server files it supplied.
 *  - refused, all named in one error: a missing source; a LITERAL include (no glob magic by
 *    minimatch's own hasMagic, braces counted) that matches no file, with what to write instead
 *    where the tree makes it knowable; every symbolic link met inside a source that the manifest
 *    does not exclude (never followed: what it reaches would be published under the link's name);
 *    a manifest that supplies no file at all;
 *  - allowed and returned as notes: an empty source, a GLOB include that matches nothing.
 *
 * Run: `node --test tests/site-walker-missing-source.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadSiteManifest } from '../lib/core/ManifestLoader.js';
import {
  walkSite, describeWalkNotes, isLiteralInclude, SiteSourcesMissingError, SiteNothingToDeployError,
  SITE_SOURCES_MISSING, SITE_NOTHING_TO_DEPLOY,
} from '../lib/core/SiteWalker.js';

/**
 * An app root (in a temp parent) with `files` (relative path → content; a key ending in "/" is a
 * directory; a value { link: target } is a symlink) and a site manifest `manifest`.
 */
async function withApp(files, manifest, fn) {
  const parent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'site-walker-')));
  const root = path.join(parent, 'app');
  fs.mkdirSync(root);
  try {
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(root, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      if (rel.endsWith('/')) { fs.mkdirSync(abs, { recursive: true }); continue; }
      if (content && typeof content === 'object') { fs.symlinkSync(content.link, abs); continue; }
      fs.writeFileSync(abs, content);
    }
    fs.mkdirSync(path.join(root, '.descix', 'manifests'), { recursive: true });
    fs.writeFileSync(path.join(root, '.descix', 'manifests', 'site.json'), JSON.stringify(manifest));
    return await fn(root, await loadSiteManifest(root), parent);
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

async function refusal(promise) {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  assert.fail('walkSite resolved; it was expected to refuse');
}

const deployPaths = (r) => r.files.map((f) => f.deployPath).sort();
const noteLines = (r) => describeWalkNotes(r.notes).join('\n');

// ── literal vs glob ──────────────────────────────────────────────────────────────────────────

test('literal = no glob magic by minimatch hasMagic (braces count): the classifier', () => {
  for (const p of ['index.html', 'assets/', 'assets', './index.html', 'img\\logo.png', '{a}.js', 'Index.html']) {
    assert.equal(isLiteralInclude(p), true, p);
  }
  for (const p of ['*.html', 'a?.js', '[ab].js', '{a,b}.js', '+(a|b).js', '.well-known/**', '**/*']) {
    assert.equal(isLiteralInclude(p), false, p);
  }
});

test('every source present: files are listed and there are no notes', async () => {
  await withApp({ 'a/index.html': 'a', 'b/x.css': 'b' }, { sources: [{ path: 'a' }, { path: 'b' }] }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['index.html', 'x.css']);
    assert.deepEqual(r.notes, []);
  });
});

test('a missing source is refused, naming the entry as written and its absolute path', async () => {
  await withApp({ 'a/index.html': 'a' }, { sources: [{ path: 'a' }, { path: 'site/gone' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err instanceof SiteSourcesMissingError);
    assert.equal(err.code, SITE_SOURCES_MISSING);
    assert.match(err.message, /^Site upload refused: the site manifest .*site\.json names 1 entry that cannot be uploaded\./);
    assert.ok(err.message.includes(`missing source: sources[1].path "site/gone" -> ${path.join(root, 'site', 'gone')} (does not exist)`), err.message);
    assert.match(err.message, /No deploy token was requested and nothing was uploaded\./);
  });
});

test('reviewer case: two missing LITERALS are refused; the unmatched glob beside them is not', async () => {
  await withApp({ 'site/index.html': 'i' }, {
    sources: [{ path: 'site', include: ['index.html', 'robots.txt', 'favicon.ico', '.well-known/**'] }],
  }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.match(err.message, /names 2 entries/);
    assert.ok(err.message.includes('sources[0].include[1] "robots.txt"'), err.message);
    assert.ok(err.message.includes('sources[0].include[2] "favicon.ico"'), err.message);
    assert.doesNotMatch(err.message, /well-known/);
  });
});

test('the same manifest with the literals present: passes, and the unmatched glob prints a line', async () => {
  await withApp({ 'site/index.html': 'i', 'site/robots.txt': 'r', 'site/favicon.ico': 'f' }, {
    sources: [{ path: 'site', include: ['index.html', 'robots.txt', 'favicon.ico', '.well-known/**'] }],
  }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['favicon.ico', 'index.html', 'robots.txt']);
    assert.equal(noteLines(r),
      'Include pattern sources[0].include[3] ".well-known/**" of source "site" matches no file: it adds nothing ' +
      'to this deploy, so any server files it supplied before will be removed.');
  });
});

test('a shared type-filter list across two sources: passes, one line for the css glob of the source with none', async () => {
  await withApp({ 'a/index.html': 'i', 'a/x.css': 'c', 'b/page.html': 'p' }, {
    sources: [{ path: 'a', include: ['*.html', '*.css'] }, { path: 'b', include: ['*.html', '*.css'] }],
  }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['index.html', 'page.html', 'x.css']);
    assert.equal(r.notes.length, 1);
    assert.match(noteLines(r), /sources\[1\]\.include\[1\] "\*\.css" of source "b" matches no file/);
  });
});

test('"**/*" with exclude "**/*.map" on a maps-only source: passes with a line (another source supplies files)', async () => {
  await withApp({ 'site/index.html': 'i', 'maps/app.js.map': 'm' }, {
    sources: [{ path: 'site' }, { path: 'maps', include: ['**/*'], exclude: ['**/*.map'] }],
  }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['index.html']);
    assert.match(noteLines(r), /sources\[1\]\.include\[0\] "\*\*\/\*" of source "maps" matches no file/);
  });
});

test('"*.svg" after the last SVG is deleted: passes with a line', async () => {
  await withApp({ 'site/index.html': 'i' }, { sources: [{ path: 'site', include: ['index.html', '*.svg'] }] }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['index.html']);
    assert.match(noteLines(r), /"\*\.svg" of source "site" matches no file/);
  });
});

for (const [name, files, entry, hint] of [
  ['a case-mismatched literal', { 'site/index.html': 'i' }, 'Index.html', 'a file "index.html" exists; names are case-sensitive'],
  ['a leading ./', { 'site/index.html': 'i' }, './index.html', 'drop the leading "./": "index.html"'],
  ['a directory named as a file', { 'site/index.html': 'i', 'site/assets/a.png': 'p' }, 'assets', '"assets" is a directory; to include its files write "assets/**"'],
  ['a directory with a trailing slash', { 'site/index.html': 'i', 'site/assets/a.png': 'p' }, 'assets/', '"assets" is a directory; to include its files write "assets/**"'],
  ['a backslash separator', { 'site/index.html': 'i', 'site/img/logo.png': 'p' }, 'img\\logo.png', 'use "/" as the separator: "img/logo.png"'],
  ['a Windows path with a glob', { 'site/index.html': 'i', 'site/img/logo.png': 'p' }, 'img\\logo\\*.png', 'use "/" as the separator: "img/logo\\*.png"'],
  ['a glob escape (no rewrite)', { 'site/index.html': 'i', 'site/notes.md': 'n' }, '\\[draft\\]*.md', null],
  ['a literal removed by an exclude', { 'site/index.html': 'i', 'site/secret.html': 's' }, 'secret.html', 'every file it names is removed by an exclude pattern of this source'],
  ['a literal with nothing like it', { 'site/index.html': 'i' }, 'about.html', null],
  ['a "#" entry (a comment to the matcher)', { 'site/index.html': 'i', 'site/#notes.md': 'n' }, '#notes.md', 'an entry beginning with "#" is a comment to the matcher; to name the file write "[#]notes.md"'],
]) {
  test(`refused: ${name} ("${entry}") — with what to write instead where knowable`, async () => {
    await withApp(files, { sources: [{ path: 'site', include: ['index.html', entry], exclude: ['secret.html'] }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      const line = err.message.split('\n').find((l) => l.includes('missing include:'));
      assert.ok(line.startsWith(`  missing include: sources[0].include[1] "${entry}" (source "site") -> no file matches ${path.join(root, 'site', entry)}`), line);
      if (hint) assert.ok(line.endsWith(`; ${hint}`), line);
      else assert.ok(line.endsWith(path.join(root, 'site', entry)), line);
    });
  });
}

test('glob includes that each match something pass (the README form **/* included)', async () => {
  await withApp({ 'a/index.html': 'a', 'a/assets/app.js': 'j' }, { sources: [{ path: 'a', include: ['**/*', '*.js'] }] }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['assets/app.js', 'index.html']);
    assert.deepEqual(r.notes, []);
  });
});

// ── empty and zero ───────────────────────────────────────────────────────────────────────────

test('an EMPTY source is allowed and reported with a plain line', async () => {
  await withApp({ 'a/index.html': 'a', 'empty/': '' }, { sources: [{ path: 'a' }, { path: 'empty' }] }, async (root, m) => {
    const r = await walkSite(m, root);
    assert.deepEqual(deployPaths(r), ['index.html']);
    assert.equal(noteLines(r),
      `Source sources[1].path "empty" (${path.join(root, 'empty')}) is empty: it supplies no files to this deploy, ` +
      'so any server files it supplied before will be removed.');
  });
});

test('sources that supply NO file at all are refused; the message says the server was not changed, with no removal claim', async () => {
  await withApp({ 'a/notes.md': 'n', 'empty/': '' }, { sources: [{ path: 'a', exclude: ['*.md'] }, { path: 'empty' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err instanceof SiteNothingToDeployError);
    assert.equal(err.code, SITE_NOTHING_TO_DEPLOY);
    assert.ok(err.message.startsWith(`No files to deploy: the site manifest ${path.join(root, '.descix', 'manifests', 'site.json')} supplies no file. ` +
      'A deploy of zero files would remove every file of the site, so the upload stops here; the site on the server was not changed.'), err.message);
    assert.match(err.message, /sources\[0\]\.path "a" .* is empty: it supplies no files to this deploy\./);
    assert.doesNotMatch(err.message, /will be removed/);
  });
});

// ── build ────────────────────────────────────────────────────────────────────────────────────

test('a buildCommand the run SKIPPED (dry run): the refusal says to build first', async () => {
  await withApp({}, { sources: [{ path: 'site/dist' }], buildCommand: 'npm run build --prefix site' }, async (root, m) => {
    const err = await refusal(walkSite(m, root, { buildSkipped: true }));
    assert.ok(err.message.includes(
      'A dry run does not run the manifest\'s buildCommand (npm run build --prefix site), and a source the build ' +
      `produces exists only after it runs: build first (run \`npm run build --prefix site\` in ${root}), then re-run the dry run.`), err.message);
  });
});

test('a buildCommand that RAN and did not produce the source: the refusal says so', async () => {
  await withApp({}, { sources: [{ path: 'site/dist' }], buildCommand: 'true' }, async (root, m) => {
    const err = await refusal(walkSite(m, root, { buildSkipped: false }));
    assert.match(err.message, /The manifest's buildCommand \(true\) ran and completed, and did not produce them\./);
    assert.doesNotMatch(err.message, /build first/);
  });
});

test('no buildCommand: the refusal carries no build line', async () => {
  await withApp({}, { sources: [{ path: 'site' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root, { buildSkipped: false }));
    assert.doesNotMatch(err.message, /buildCommand/);
  });
});

test('a single-file source that exists is deployed at its filename; a missing one is refused', async () => {
  await withApp({ 'robots.txt': 'r' }, { sources: [{ path: 'robots.txt' }] }, async (root, m) => {
    assert.deepEqual(deployPaths(await walkSite(m, root)), ['robots.txt']);
  });
  await withApp({ 'x/i.html': 'i' }, { sources: [{ path: 'x' }, { path: 'robots.txt' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err.message.includes('sources[1].path "robots.txt"'), err.message);
  });
});

test('an unreadable subdirectory fails the walk instead of reading as empty', { skip: process.getuid?.() === 0 }, async () => {
  await withApp({ 'a/index.html': 'a', 'a/locked/x.html': 'x' }, { sources: [{ path: 'a' }] }, async (root, m) => {
    const locked = path.join(root, 'a', 'locked');
    fs.chmodSync(locked, 0o000);
    try {
      await assert.rejects(walkSite(m, root), /EACCES/);
    } finally {
      fs.chmodSync(locked, 0o755);
    }
  });
});

// ── symlinks: every link met inside a source is refused, never followed ─────────────────────

/** Lay out the reviewer's app: a secret .env, a .git, a .descix, node_modules and a sibling b/. */
function secretsTree() {
  return {
    '.env': 'SECRET=1', '.git/config': '[core]', 'node_modules/x/index.js': 'x', 'b/c-target/': '',
    'site/index.html': 'i', 'site/inside.html': 'in',
  };
}

for (const [name, rel, target] of [
  ['a link to a secret file', 'site/x', '../.env'],
  ['a secret under an innocent name', 'site/assets/config.txt', '../../.env'],
  ['a link to .git', 'site/g', '../.git'],
  ['a link to .descix', 'site/secrets', '../.descix'],
  ['a link to node_modules', 'site/nm', '../node_modules'],
  ['a link to the app root', 'site/all', '..'],
  ['a link to a file INSIDE the same source', 'site/copy.html', 'inside.html'],
  ['a broken link', 'site/gone.png', 'nowhere.png'],
]) {
  test(`symlink refused: ${name} (${rel} -> ${target}), naming the link, its path in the source and its readlink target`, async () => {
    await withApp({ ...secretsTree(), [rel]: { link: target } }, { sources: [{ path: 'site' }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      assert.ok(err instanceof SiteSourcesMissingError, err.message);
      const inSource = rel.slice('site/'.length);
      assert.ok(err.message.includes(
        `  symlink refused: sources[0] "site" entry "${inSource}" (${path.join(root, rel)} -> ${target}): ` +
        "a site source may not contain a symbolic link (what it reaches would be published under the link's name); " +
        'copy the files into the source, or add the target directory as its own manifest source (a source may sit outside the app root)'), err.message);
    });
  });
}

test('symlink refused: the two-hop site/a -> ../b with b/c -> ../.git is refused at the first hop, never followed', async () => {
  await withApp({ ...secretsTree(), 'site/a': { link: '../b' }, 'b/c': { link: '../.git' } }, { sources: [{ path: 'site' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err.message.includes(`entry "a" (${path.join(root, 'site', 'a')} -> ../b)`), err.message);
    assert.doesNotMatch(err.message, /entry "a\/c"/, 'the link was not followed to its own links');
  });
});

test('every link in a source is named in ONE refusal, beside the other missing entries', async () => {
  await withApp({ ...secretsTree(), 'site/x': { link: '../.env' }, 'site/g': { link: '../.git' } },
    { sources: [{ path: 'site', include: ['**/*', 'about.html'] }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      assert.match(err.message, /names 3 entries/);
      assert.match(err.message, /entry "x"/);
      assert.match(err.message, /entry "g"/);
      assert.match(err.message, /include\[1\] "about\.html"/);
    });
});

test('an EXCLUDED link is neither uploaded nor refused (exclude pattern, and a dir-style exclude)', async () => {
  await withApp({ ...secretsTree(), 'site/x': { link: '../.env' }, 'site/nm': { link: '../node_modules' } },
    { sources: [{ path: 'site', exclude: ['x', 'nm/'] }] }, async (root, m) => {
      const r = await walkSite(m, root);
      assert.deepEqual(deployPaths(r), ['index.html', 'inside.html']);
    });
});

test('an include list does not exempt a link: reviewer tree site/d -> ../other (other/p.html), include ["*.html"] → refused', async () => {
  await withApp({ 'site/index.html': 'i', 'other/p.html': 'p', 'site/d': { link: '../other' } },
    { sources: [{ path: 'site', include: ['*.html'] }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      assert.ok(err.message.includes(`symlink refused: sources[0] "site" entry "d" (${path.join(root, 'site', 'd')} -> ../other)`), err.message);
    });
});

test('a link an include cannot name (include ["index.html"], link g -> ../.git) is still refused', async () => {
  await withApp({ ...secretsTree(), 'site/g': { link: '../.git' } }, { sources: [{ path: 'site', include: ['index.html'] }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.match(err.message, /entry "g"/);
  });
});

test('a link an include entry could select under it IS refused (include "g/**" and link g)', async () => {
  await withApp({ ...secretsTree(), 'site/g': { link: '../.git' } },
    { sources: [{ path: 'site', include: ['index.html', 'g/**'] }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      assert.match(err.message, /symlink refused: sources\[0\] "site" entry "g"/);
    });
});

// ── a manifest source PATH that is itself a symbolic link (by lstat on the final component) ──

const linkedSourceLine = (root, idx, p, target) =>
  `  source refused: sources[${idx}].path "${p}" -> ${path.join(root, p)} is a symbolic link to ${target}; ` +
  'name the real directory or file as the source instead (a source may sit outside the app root), so what is published is what the source names';

test('a FILE source path that is a link (site/config.txt -> ../.env) is refused, naming entry and target', async () => {
  await withApp({ '.env': 'SECRET=1', 'site/index.html': 'i', 'site/config.txt': { link: '../.env' } },
    { sources: [{ path: 'site/index.html' }, { path: 'site/config.txt' }] }, async (root, m) => {
      const err = await refusal(walkSite(m, root));
      assert.ok(err.message.includes(linkedSourceLine(root, 1, 'site/config.txt', '../.env')), err.message);
    });
});

test('a DIRECTORY source path that is a link to OUTSIDE the app root (site -> ..) is refused', async () => {
  await withApp({ '.env': 'SECRET=1', 'site': { link: '..' } }, { sources: [{ path: 'site' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err.message.includes(linkedSourceLine(root, 0, 'site', '..')), err.message);
  });
});

test('a DIRECTORY source path that is a link to INSIDE the app root (site -> real) is refused too', async () => {
  await withApp({ 'real/index.html': 'i', 'site': { link: 'real' } }, { sources: [{ path: 'site' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.ok(err.message.includes(linkedSourceLine(root, 0, 'site', 'real')), err.message);
  });
});

test('a source path whose trailing "/" is written in the manifest is still checked by lstat on the link itself', async () => {
  await withApp({ 'real/index.html': 'i', 'site': { link: 'real' } }, { sources: [{ path: 'site/' }] }, async (root, m) => {
    const err = await refusal(walkSite(m, root));
    assert.match(err.message, /source refused: sources\[0\]\.path "site\/" .* is a symbolic link to real/);
  });
});

test('a normal source under a LINKED PARENT directory is allowed (only the final component is checked)', async () => {
  await withApp({ 'real/site/index.html': 'i', 'linked': { link: 'real' } }, { sources: [{ path: 'linked/site' }] }, async (root, m) => {
    assert.deepEqual(deployPaths(await walkSite(m, root)), ['index.html']);
  });
});

test('the app root itself reached through a link is allowed', async () => {
  await withApp({ 'site/index.html': 'i' }, { sources: [{ path: 'site' }] }, async (root, m, parent) => {
    fs.symlinkSync(root, path.join(parent, 'root-link'));
    const viaLink = path.join(parent, 'root-link');
    assert.deepEqual(deployPaths(await walkSite(await loadSiteManifest(viaLink), viaLink)), ['index.html']);
  });
});
