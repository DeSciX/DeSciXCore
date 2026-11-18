/**
 * SiteWalker - Manifest-driven file walker for site deployment
 *
 * THE ONE OWNER of "which files does a site manifest name". Given a site manifest
 * (.descix/manifests/site.json, sources resolved by ManifestLoader.loadSiteManifest), it walks each
 * source entry, applies include/exclude glob patterns, and computes file hashes for delta-based
 * deployment to GCS.
 *
 * A deploy REPLACES the site, so an entry that names nothing is not a no-op: the server files it
 * supplied before would be removed. The walk therefore REFUSES (SiteSourcesMissingError), naming
 * every one, when:
 *  - a source path does not exist;
 *  - a LITERAL include entry matches no file. Literal = no glob magic by minimatch's own test,
 *    `new Minimatch(p, { dot: true, magicalBraces: true }).hasMagic() === false`: the magic is
 *    `*`, `?`, a `[...]` class, an extglob `@( ) *( ) +( ) ?( ) !( )` and a brace set `{a,b}` that
 *    expands to more than one pattern. An entry with a leading `./` or a backslash never matches a
 *    walked path, so it is refused when it matches nothing even if it also has magic;
 *  - a manifest source PATH that is itself a symbolic link (fs.lstat on the final component the
 *    manifest names; parent directories above it may be links), file or directory: the developer
 *    names the real file or directory as the source (a source may sit outside the app root);
 *  - a symbolic link met INSIDE a source (file or directory link, wherever it points, broken or
 *    not), unless an exclude pattern matches it (by name, path or `path/`). Everything uploaded is
 *    public, and the private-file check (SiteDenyLint) reads the DEPLOY path, so a link would
 *    publish what it reaches under an innocent name (`assets/config.txt -> ../../.env`). Links are
 *    never followed. An include list does not exempt a link: an include with no "/" matches by bare
 *    filename at any depth, so a directory link holding a matching file cannot be ruled out.
 * Not refused, but returned in `notes` for the caller to print (never silent):
 *  - an existing source that supplies no file (`empty`);
 *  - a GLOB include that matches no file (`unmatchedGlob`): a type filter shared by two sources or
 *    a pattern whose last file was deleted is a normal state.
 * A manifest whose sources supply no file at all is refused (SiteNothingToDeployError): a deploy of
 * zero files would remove the whole site. There is no flag that turns any refusal off.
 *
 * Architecture:
 * - Files stay in place — no copying or staging
 * - File hashes (SHA-256) enable delta uploads (skip unchanged files)
 * - Multiple source entries are flattened into a deploy tree preserving relative paths from each
 *   source root. Two sources supplying the same deploy path are both listed, in manifest order; the
 *   later one is uploaded last and is what the deploy manifest records (unchanged rule).
 * - include entries are minimatch globs (an exact relative path is the pattern that matches only
 *   itself), tried against the path relative to the source root and against the bare filename;
 *   they apply to directory sources only. An include entry counts as matched when it selects at
 *   least one file that no exclude pattern removes.
 * - A link is recognised from readdir's Dirent (lstat semantics: isSymbolicLink), and its target is
 *   named as fs.readlink gives it.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { minimatch, Minimatch } from 'minimatch';

/**
 * Check if a relative path matches any of the given glob patterns.
 *
 * @param {string} relativePath - Path relative to the source entry root
 * @param {string[]} patterns - Array of glob patterns
 * @returns {boolean} True if the path matches at least one pattern
 */
function matchesAny(relativePath, patterns) {
  return patterns.some((pattern) => matchesPattern(relativePath, pattern));
}

/** One pattern against the relative path, then against the bare filename (for "*.css"). */
function matchesPattern(relativePath, pattern) {
  return minimatch(relativePath, pattern, { dot: true }) ||
    minimatch(path.basename(relativePath), pattern, { dot: true });
}

/** An include entry with no glob magic, by the matcher's own test (braces count as magic). */
export function isLiteralInclude(pattern) {
  return !new Minimatch(pattern, { dot: true, magicalBraces: true }).hasMagic();
}

/** A leading "./" or a backslash: a spelling no walked path can ever match. */
function isMalformedInclude(pattern) {
  return pattern.startsWith('./') || pattern.includes('\\');
}

/**
 * Check if a directory name matches any exclude patterns that look like directory names.
 * Patterns ending with "/" are directory excludes (e.g., "node_modules/").
 *
 * @param {string} dirName - Directory name (not full path)
 * @param {string[]} excludePatterns - Exclude patterns
 * @returns {boolean} True if the directory should be skipped entirely
 */
function isDirExcluded(dirName, excludePatterns) {
  for (const pattern of excludePatterns) {
    // Pattern ending with / targets directories
    if (pattern.endsWith('/') && dirName === pattern.slice(0, -1)) {
      return true;
    }
    // Also match directory-style patterns without trailing slash
    if (dirName === pattern) {
      return true;
    }
  }
  return false;
}

async function computeFileHash(absolutePath) {
  const content = await fs.readFile(absolutePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively walk a directory and collect file paths, applying include and exclude glob filters
 * and collecting every symlink it meets for refusal (see the header).
 *
 * @param {string} dir - Directory to walk (a path inside the source)
 * @param {string} baseDir - The source root; relative paths are taken from it
 * @param {Object} ctx - { include, exclude, matchedIncludes:Set, excludedMatches:Set, allFiles:[],
 *   allDirs:Set, badLinks:[] }
 * @returns {Promise<string[]>} absolute file paths (through the source tree) that pass the filters
 */
async function walkDir(dir, baseDir, ctx) {
  const results = [];

  // An unreadable directory is an error, never an empty one: an empty read here would drop its
  // files from the deploy and the confirm step would remove them from the server.
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isSymbolicLink()) {
      // Never followed. Refused unless an exclude pattern matches it (name, path or `path/`).
      const excluded = isDirExcluded(entry.name, ctx.exclude) ||
        matchesAny(relativePath, ctx.exclude) || matchesAny(relativePath + '/', ctx.exclude);
      if (!excluded) {
        ctx.badLinks.push({ relativePath, link: fullPath, target: await fs.readlink(fullPath) });
      }
      continue;
    }

    if (entry.isDirectory()) {
      // Skip excluded directories early (avoids walking into node_modules, etc.)
      if (isDirExcluded(entry.name, ctx.exclude)) {
        continue;
      }
      // Also check full relative path against exclude patterns
      if (matchesAny(relativePath + '/', ctx.exclude) || matchesAny(relativePath, ctx.exclude)) {
        continue;
      }
      ctx.allDirs.add(relativePath);
      results.push(...await walkDir(fullPath, baseDir, ctx));
    } else if (entry.isFile()) {
      ctx.allFiles.push(relativePath);
      // Check exclude first
      if (ctx.exclude.length > 0 && matchesAny(relativePath, ctx.exclude)) {
        ctx.include.forEach((pattern, i) => { if (matchesPattern(relativePath, pattern)) ctx.excludedMatches.add(i); });
        continue;
      }
      // Check include (empty include = match all)
      if (ctx.include.length === 0) {
        results.push(fullPath);
        continue;
      }
      let selected = false;
      ctx.include.forEach((pattern, i) => {
        if (matchesPattern(relativePath, pattern)) {
          ctx.matchedIncludes.add(i);
          selected = true;
        }
      });
      if (selected) results.push(fullPath);
    }
  }

  return results;
}

/** What to write instead of an unmatched include, when the tree makes it knowable; else null. */
function includeHint(pattern, ctx, includeIndex) {
  // A backslash before a path-like character is a Windows separator; before anything else it is a
  // glob escape (`\\[draft\\]*.md`), and the line names the pattern unchanged with no rewrite.
  // minimatch reads a leading "#" as a comment, which matches nothing.
  if (pattern.startsWith('#')) return `an entry beginning with "#" is a comment to the matcher; to name the file write "[#]${pattern.slice(1)}"`;
  if (/\\[A-Za-z0-9._-]/.test(pattern)) return `use "/" as the separator: "${pattern.replace(/\\(?=[A-Za-z0-9._-])/g, '/')}"`;
  if (pattern.includes('\\')) return null;
  if (pattern.startsWith('./')) return `drop the leading "./": "${pattern.slice(2)}"`;
  const asDir = pattern.replace(/\/+$/, '');
  if (pattern.endsWith('/') || ctx.allDirs.has(asDir)) {
    return `"${asDir}" is a directory; to include its files write "${asDir}/**"`;
  }
  if (ctx.excludedMatches.has(includeIndex)) return 'every file it names is removed by an exclude pattern of this source';
  const lower = pattern.toLowerCase();
  const near = ctx.allFiles.find((f) => f !== pattern && path.basename(f) !== pattern &&
    (f.toLowerCase() === lower || path.basename(f).toLowerCase() === lower));
  if (near) return `a file "${near}" exists; names are case-sensitive`;
  return null;
}

/**
 * The target of `absPath` when the path itself (its final component, by fs.lstat) is a symbolic
 * link; null when it is not; undefined when nothing exists there. Owner of the source-path link
 * rule for the manifest walk and the `-p` directory alike.
 */
export async function sourcePathLinkTarget(absPath) {
  let st;
  try {
    st = await fs.lstat(absPath);
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
  return st.isSymbolicLink() ? fs.readlink(absPath) : null;
}

/** The refusal line for a source path that is a symbolic link. */
export function describeLinkedSourcePath(label, absPath, target) {
  return `source refused: ${label} -> ${absPath} is a symbolic link to ${target}; name the real directory or file ` +
    'as the source instead (a source may sit outside the app root), so what is published is what the source names';
}

export const SITE_SOURCES_MISSING = 'SITE_SOURCES_MISSING';
export const SITE_NOTHING_TO_DEPLOY = 'SITE_NOTHING_TO_DEPLOY';

/**
 * The refusal: every source path that does not exist, every literal include entry that matches no
 * file and every symlink met inside a source, each with the manifest entry as written and the
 * absolute path it resolved to.
 */
export class SiteSourcesMissingError extends Error {
  /**
   * @param {{ manifestPath: string, appRoot: string, buildCommand: string|null, buildSkipped: boolean,
   *   missingSources: Array<{ index: number, sourcePath: string, absolutePath: string }>,
   *   missingIncludes: Array<{ index, includeIndex, sourcePath, pattern, absolutePath, hint }>,
   *   badLinks: Array<{ index, sourcePath, relativePath, link, target }>,
   *   linkedSources: Array<{ index, sourcePath, absolutePath, target }> }} d
   */
  constructor(d) {
    const n = d.missingSources.length + d.missingIncludes.length + d.badLinks.length + d.linkedSources.length;
    const lines = [
      `Site upload refused: the site manifest ${d.manifestPath} names ${n} ` +
        `${n === 1 ? 'entry' : 'entries'} that cannot be uploaded. ` +
        'A deploy replaces the site, so uploading without them would remove every server file they supplied.',
      ...d.missingSources.map((m) =>
        `  missing source: sources[${m.index}].path "${m.sourcePath}" -> ${m.absolutePath} (does not exist)`),
      ...d.linkedSources.map((m) =>
        `  ${describeLinkedSourcePath(`sources[${m.index}].path "${m.sourcePath}"`, m.absolutePath, m.target)}`),
      ...d.missingIncludes.map((m) =>
        `  missing include: sources[${m.index}].include[${m.includeIndex}] "${m.pattern}" (source "${m.sourcePath}") -> ` +
        `no file matches ${m.absolutePath}${m.hint ? `; ${m.hint}` : ''}`),
      ...d.badLinks.map((m) =>
        `  symlink refused: sources[${m.index}] "${m.sourcePath}" entry "${m.relativePath}" (${m.link} -> ${m.target}): ` +
        'a site source may not contain a symbolic link (what it reaches would be published under the link\'s name); ' +
        'copy the files into the source, or add the target directory as its own manifest source (a source may sit outside the app root)'),
    ];
    if (d.missingSources.length > 0 && d.buildCommand && d.buildSkipped) {
      lines.push(
        `A dry run does not run the manifest's buildCommand (${d.buildCommand}), and a source the build ` +
        `produces exists only after it runs: build first (run \`${d.buildCommand}\` in ${d.appRoot}), then re-run the dry run.`
      );
    } else if (d.missingSources.length > 0 && d.buildCommand) {
      lines.push(`The manifest's buildCommand (${d.buildCommand}) ran and completed, and did not produce them.`);
    }
    lines.push('Fix the manifest or create the missing files, then re-run. No deploy token was requested and nothing was uploaded.');
    super(lines.join('\n'));
    this.name = 'SiteSourcesMissingError';
    this.code = SITE_SOURCES_MISSING;
    this.missingSources = d.missingSources;
    this.missingIncludes = d.missingIncludes;
    this.badLinks = d.badLinks;
    this.linkedSources = d.linkedSources;
  }
}

/**
 * Zero files to upload. A deploy of zero files would remove the whole site, so it is refused; the
 * message says the server was not changed. Used for the manifest walk and the -p directory alike.
 */
export class SiteNothingToDeployError extends Error {
  constructor(sourceLabel, noteLines = []) {
    super([
      `No files to deploy: ${sourceLabel} supplies no file. A deploy of zero files would remove every ` +
        'file of the site, so the upload stops here; the site on the server was not changed.',
      ...noteLines.map((l) => `  ${l}`),
    ].join('\n'));
    this.name = 'SiteNothingToDeployError';
    this.code = SITE_NOTHING_TO_DEPLOY;
  }
}

/**
 * The lines printed for what the walk allowed but must not keep quiet. `deploying: false` (the
 * zero-files refusal) drops the removal clause: that deploy does not happen, so nothing is removed.
 */
export function describeWalkNotes(notes, { deploying = true } = {}) {
  const removal = deploying ? ', so any server files it supplied before will be removed' : '';
  return notes.map((n) => {
    if (n.kind === 'empty') {
      return `Source sources[${n.index}].path "${n.sourcePath}" (${n.absolutePath}) is empty: it supplies no files ` +
        `to this deploy${removal}.`;
    }
    return `Include pattern sources[${n.index}].include[${n.includeIndex}] "${n.pattern}" of source "${n.sourcePath}" ` +
        `matches no file: it adds nothing to this deploy${removal}.`;
  });
}

/**
 * Walk a site manifest and return file entries with hashes for deployment.
 *
 * Throws SiteSourcesMissingError (see the header) naming every refused entry, and
 * SiteNothingToDeployError when the sources supply no file at all. The caller decides WHEN to walk:
 * after the manifest's buildCommand has run when it will run, and with `buildSkipped: true` when a
 * dry run skips it (the refusal then says to build first).
 *
 * @param {Object} manifest - Validated site manifest with _resolvedSources
 * @param {string} appRoot - Absolute path to the app root directory
 * @param {{ buildSkipped?: boolean }} [opts] - true when the manifest has a buildCommand this run did not run
 * @returns {Promise<Object>} { files: Array<SiteFileEntry>, totalSize: number, notes: Array<Object> }
 *   (render notes with describeWalkNotes)
 *
 * SiteFileEntry: { absolutePath, deployPath, hash, size, sourceEntry }
 */
export async function walkSite(manifest, appRoot, { buildSkipped = false } = {}) {
  const files = [];
  let totalSize = 0;
  const missingSources = [];
  const missingIncludes = [];
  const badLinks = [];
  const linkedSources = [];
  const notes = [];

  for (const [index, source] of manifest._resolvedSources.entries()) {
    const { absolutePath, include, exclude, sourcePath } = source;

    // The path the manifest names, by lstat: absent → missing; a symbolic link → refused (never
    // resolved, so `site/config.txt -> ../.env` or `site -> ..` cannot publish what it reaches).
    const linkTarget = await sourcePathLinkTarget(absolutePath);
    if (linkTarget === undefined) {
      missingSources.push({ index, sourcePath, absolutePath });
      continue;
    }
    if (linkTarget !== null) {
      linkedSources.push({ index, sourcePath, absolutePath, target: linkTarget });
      continue;
    }
    const stat = await fs.stat(absolutePath);

    if (stat.isFile()) {
      // Single file source entry — deploy at the filename level
      const hash = await computeFileHash(absolutePath);
      totalSize += stat.size;
      files.push({ absolutePath, deployPath: path.basename(absolutePath), hash, size: stat.size, sourceEntry: sourcePath });
    } else if (stat.isDirectory()) {
      const ctx = {
        include, exclude, matchedIncludes: new Set(), excludedMatches: new Set(), allFiles: [], allDirs: new Set(),
        badLinks: [],
      };
      const filePaths = await walkDir(absolutePath, absolutePath, ctx);

      badLinks.push(...ctx.badLinks.map((l) => ({ index, sourcePath, ...l })));
      include.forEach((pattern, includeIndex) => {
        if (ctx.matchedIncludes.has(includeIndex)) return;
        if (isLiteralInclude(pattern) || isMalformedInclude(pattern)) {
          missingIncludes.push({
            index, includeIndex, sourcePath, pattern,
            absolutePath: path.join(absolutePath, pattern), hint: includeHint(pattern, ctx, includeIndex),
          });
        } else {
          notes.push({ kind: 'unmatchedGlob', index, includeIndex, sourcePath, pattern });
        }
      });
      if (filePaths.length === 0 && include.length === 0) {
        notes.push({ kind: 'empty', index, sourcePath, absolutePath });
      }

      for (const filePath of filePaths) {
        const content = await fs.readFile(filePath);
        const size = content.length;
        totalSize += size;
        // Deploy path is relative to the source directory root (not the source entry label).
        const deployPath = path.relative(absolutePath, filePath).split(path.sep).join('/');
        files.push({
          absolutePath: filePath, deployPath, hash: createHash('sha256').update(content).digest('hex'),
          size, sourceEntry: sourcePath,
        });
      }
    }
  }

  if (missingSources.length > 0 || missingIncludes.length > 0 || badLinks.length > 0 || linkedSources.length > 0) {
    throw new SiteSourcesMissingError({
      manifestPath: manifest._manifestPath, appRoot, buildCommand: manifest.buildCommand || null, buildSkipped,
      missingSources, missingIncludes, badLinks, linkedSources,
    });
  }
  if (files.length === 0) {
    throw new SiteNothingToDeployError(`the site manifest ${manifest._manifestPath}`, describeWalkNotes(notes, { deploying: false }));
  }

  return { files, totalSize, notes };
}

export default {
  walkSite, describeWalkNotes, isLiteralInclude, sourcePathLinkTarget, describeLinkedSourcePath, SiteSourcesMissingError, SiteNothingToDeployError,
  SITE_SOURCES_MISSING, SITE_NOTHING_TO_DEPLOY,
};
