/**
 * THE ONE OWNER of the limits claude.ai enforces when a Claude plugin syncs to it, and which
 * `claude plugin validate` does not check. claude.ai flags a violating item and drops or trims it.
 *
 * Every check in this module reads CLAUDE_PLUGIN_LIMITS; no limit is restated anywhere else. A
 * surface that generates or ships plugin files (the `app init` scaffold, any future gate) consumes
 * these validators rather than re-deriving a rule.
 *
 * A file whose description cannot be read (missing or unterminated frontmatter, a non-string or
 * non-scalar description, an unsupported YAML form) THROWS with code CLAUDE_PLUGIN_UNREADABLE: a
 * value this module cannot measure is never reported as passing.
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * The limits, one row per (surface, field). `check` selects the measurement:
 *   'max-length'      value.length (UTF-16 code units, the stricter count) must be <= limit
 *   'forbidden-chars' value must contain none of the characters in limit
 * Surfaces: 'plugin' = .claude-plugin/plugin.json, 'marketplace' = each entry of
 * .claude-plugin/marketplace.json `plugins`, 'skill' = skills/<name>/SKILL.md frontmatter,
 * 'agent' = agents/<name>.md frontmatter.
 */
export const CLAUDE_PLUGIN_LIMITS = Object.freeze([
  Object.freeze({
    id: 'plugin-description-max-length',
    surface: 'plugin',
    field: 'description',
    check: 'max-length',
    limit: 500,
    message: 'claude.ai flags a plugin description longer than the limit and drops or trims the plugin on sync',
  }),
  Object.freeze({
    id: 'marketplace-plugin-description-max-length',
    surface: 'marketplace',
    field: 'plugins[].description',
    check: 'max-length',
    limit: 500,
    message: 'claude.ai flags a marketplace plugin entry whose description is longer than the limit and drops or trims it on sync',
  }),
  Object.freeze({
    id: 'skill-description-no-angle-brackets',
    surface: 'skill',
    field: 'description',
    check: 'forbidden-chars',
    limit: Object.freeze(['<', '>']),
    message: 'claude.ai reads < or > in a SKILL.md description as an XML tag and drops the skill on sync',
  }),
  Object.freeze({
    id: 'agent-description-no-angle-brackets',
    surface: 'agent',
    field: 'description',
    check: 'forbidden-chars',
    limit: Object.freeze(['<', '>']),
    message: 'claude.ai reads < or > in an agent description as an XML tag and drops the agent on sync',
  }),
]);

const SURFACES = new Set(CLAUDE_PLUGIN_LIMITS.map((r) => r.surface));

function unreadable(file, detail) {
  const err = new Error(`${file}: ${detail} — the claude.ai plugin limits cannot be checked on a value that cannot be read.`);
  err.code = 'CLAUDE_PLUGIN_UNREADABLE';
  return err;
}

function rulesFor(surface) {
  if (!SURFACES.has(surface)) {
    throw new Error(`ClaudePluginLimits: unknown surface '${surface}'; known: ${[...SURFACES].join(', ')}.`);
  }
  return CLAUDE_PLUGIN_LIMITS.filter((r) => r.surface === surface);
}

/** Apply every rule of `surface` to one value. `field` is the concrete field path for the report. */
function applyRules(surface, value, { file, field }) {
  if (value === undefined || value === null) return [];
  if (typeof value !== 'string') {
    throw unreadable(file, `${field} is a ${Array.isArray(value) ? 'array' : typeof value}, not a string`);
  }
  const violations = [];
  for (const rule of rulesFor(surface)) {
    if (rule.check === 'max-length') {
      if (value.length > rule.limit) {
        violations.push({
          rule: rule.id, file, field, limit: rule.limit, length: value.length,
          message: `${file}: ${field} is ${value.length} characters; the limit is ${rule.limit} (${rule.message}).`,
        });
      }
    } else if (rule.check === 'forbidden-chars') {
      const offending = rule.limit.filter((c) => value.includes(c));
      if (offending.length) {
        violations.push({
          rule: rule.id, file, field, limit: rule.limit, offending,
          message: `${file}: ${field} contains ${offending.map((c) => `'${c}'`).join(' and ')}; ` +
            `none of ${rule.limit.map((c) => `'${c}'`).join(' ')} is allowed (${rule.message}).`,
        });
      }
    } else {
      throw new Error(`ClaudePluginLimits: rule ${rule.id} has unknown check '${rule.check}'.`);
    }
  }
  return violations;
}

function assertObject(obj, file, what) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    throw unreadable(file, `${what} is not a JSON object`);
  }
}

/** @param {object} obj parsed .claude-plugin/plugin.json  @returns {object[]} violations */
export function validatePluginManifest(obj, { file }) {
  assertObject(obj, file, 'the plugin manifest');
  return applyRules('plugin', obj.description, { file, field: 'description' });
}

/** @param {object} obj parsed .claude-plugin/marketplace.json  @returns {object[]} violations */
export function validateMarketplace(obj, { file }) {
  assertObject(obj, file, 'the marketplace manifest');
  if (!Array.isArray(obj.plugins)) throw unreadable(file, 'plugins is not an array');
  const violations = [];
  obj.plugins.forEach((entry, i) => {
    assertObject(entry, file, `plugins[${i}]`);
    const label = typeof entry.name === 'string' ? ` (${entry.name})` : '';
    violations.push(...applyRules('marketplace', entry.description, { file, field: `plugins[${i}]${label}.description` }));
  });
  return violations;
}

/**
 * @param {string} text the whole markdown file (frontmatter + body)
 * @param {{file: string, kind: 'skill'|'agent'}} opts
 * @returns {object[]} violations
 */
export function validateFrontmatterDescription(text, { file, kind }) {
  if (kind !== 'skill' && kind !== 'agent') {
    throw new Error(`validateFrontmatterDescription: kind must be 'skill' or 'agent', got '${kind}'.`);
  }
  const fm = parseFrontmatter(text, { file });
  const entry = fm.get('description');
  if (entry === undefined) return [];
  if (entry.kind !== 'scalar') throw unreadable(file, `frontmatter description is not a scalar (${entry.reason})`);
  return applyRules(kind, entry.value, { file, field: 'description' });
}

// ---------------------------------------------------------------------------------------------
// Frontmatter: a YAML block-mapping reader for the top-level keys of a markdown frontmatter.
// Scalars are fully decoded (plain, single-quoted, double-quoted, literal `|` and folded `>` block
// scalars with chomping and indentation indicators, multi-line forms included). Sequences, nested
// mappings and flow collections are recorded as non-scalar; anchors, aliases and tags are recorded
// as unsupported. The CLI ships no YAML dependency; this reader is the CLI's one frontmatter parser.
// ---------------------------------------------------------------------------------------------

const KEY_LINE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s#'"\-?:,[\]{}&*!|>%@`][^:#]*?|-[^\s:][^:#]*?)\s*:(?:[ \t]+(.*))?$/;
const indentOf = (line) => line.length - line.trimStart().length;
const isBlank = (line) => line.trim() === '';

/**
 * @param {string} text the whole markdown file
 * @returns {Map<string, {kind:'scalar', value:string|null} | {kind:'nonscalar', reason:string}>}
 * @throws CLAUDE_PLUGIN_UNREADABLE on missing/unterminated frontmatter or malformed YAML
 */
export function parseFrontmatter(text, { file }) {
  if (typeof text !== 'string') throw unreadable(file, 'file content is not text');
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  if (lines[0].trimEnd() !== '---') throw unreadable(file, 'no YAML frontmatter (the file does not open with ---)');
  const end = lines.findIndex((l, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(l));
  if (end < 0) throw unreadable(file, 'the YAML frontmatter is never closed (no closing ---)');
  const body = lines.slice(1, end);

  const out = new Map();
  let i = 0;
  while (i < body.length) {
    const line = body[i];
    if (isBlank(line) || /^#/.test(line)) { i++; continue; }
    if (indentOf(line) > 0) throw unreadable(file, `frontmatter line ${i + 2} is indented with no key above it`);
    const m = KEY_LINE.exec(line);
    if (!m) throw unreadable(file, `frontmatter line ${i + 2} is not a "key: value" entry: ${JSON.stringify(line)}`);
    const key = unquoteKey(m[1].trim());
    const rest = (m[2] ?? '').trim();
    const block = [];
    i++;
    // A key's block: following lines that are blank, indented, or (for an empty value) a
    // compact sequence item at column 0.
    while (i < body.length && (isBlank(body[i]) || indentOf(body[i]) > 0 || (rest === '' && /^- |^-$/.test(body[i])))) {
      block.push(body[i]);
      i++;
    }
    if (out.has(key)) throw unreadable(file, `frontmatter key '${key}' appears twice`);
    out.set(key, parseValue(rest, block, { file, key }));
  }
  return out;
}

function unquoteKey(k) {
  if (k.startsWith('"')) return JSON.parse(k);
  if (k.startsWith("'")) return k.slice(1, -1).replace(/''/g, "'");
  return k;
}

function stripComment(s) {
  const m = /(^|[ \t])#/.exec(s);
  return (m ? s.slice(0, m.index) : s).trim();
}

function parseValue(rest, block, { file, key }) {
  const content = block.filter((l) => !isBlank(l));
  if (rest === '' || rest.startsWith('#')) {
    if (content.length === 0) return { kind: 'scalar', value: null };
    return { kind: 'nonscalar', reason: /^\s*- |^\s*-$/.test(content[0]) ? 'a sequence' : 'a nested mapping' };
  }
  if (rest[0] === '[' || rest[0] === '{') return { kind: 'nonscalar', reason: 'a flow collection' };
  if (rest[0] === '&' || rest[0] === '*' || rest[0] === '!') {
    return { kind: 'nonscalar', reason: 'an anchor, alias or tag, which this reader does not resolve' };
  }
  if (rest[0] === '|' || rest[0] === '>') return { kind: 'scalar', value: blockScalar(rest, block, { file, key }) };
  if (rest[0] === '"') return { kind: 'scalar', value: doubleQuoted([rest, ...block].join('\n'), { file, key }) };
  if (rest[0] === "'") return { kind: 'scalar', value: singleQuoted([rest, ...block].join('\n'), { file, key }) };
  return { kind: 'scalar', value: plainScalar(rest, block) };
}

function blockScalar(header, block, { file, key }) {
  const h = /^([|>])(?:([+-])([1-9])?|([1-9])([+-])?)?\s*(?:#.*)?$/.exec(header);
  if (!h) throw unreadable(file, `frontmatter '${key}' has a malformed block scalar header ${JSON.stringify(header)}`);
  const style = h[1];
  const chomp = h[2] || h[5] || '';
  const explicit = h[3] || h[4];
  const firstContent = block.find((l) => !isBlank(l));
  const n = explicit ? Number(explicit) : (firstContent ? indentOf(firstContent) : 0);
  const lines = [];
  for (const l of block) {
    if (isBlank(l)) { lines.push(''); continue; }
    if (indentOf(l) < n) throw unreadable(file, `frontmatter '${key}' block scalar has a line indented less than its content`);
    lines.push(l.slice(n));
  }
  let trailing = 0;
  while (lines.length && lines[lines.length - 1] === '') { lines.pop(); trailing++; }
  let value;
  if (style === '|') {
    value = lines.join('\n');
  } else {
    value = '';
    let breaks = 0;
    let first = true;
    let prevMore = false;
    for (const l of lines) {
      if (l === '') { breaks++; continue; }
      const more = /^[ \t]/.test(l);
      if (first) value += '\n'.repeat(breaks);
      else if (more || prevMore) value += '\n'.repeat(breaks + 1);
      else value += breaks === 0 ? ' ' : '\n'.repeat(breaks);
      value += l;
      breaks = 0;
      first = false;
      prevMore = more;
    }
  }
  if (lines.length === 0) return chomp === '+' ? '\n'.repeat(trailing) : '';
  if (chomp === '-') return value;
  if (chomp === '+') return value + '\n' + '\n'.repeat(trailing);
  return value + '\n';
}

/** Fold the line breaks of a multi-line flow scalar: one break -> space, k empty lines -> k \n. */
function foldFlowLines(raw) {
  const parts = raw.split('\n');
  if (parts.length === 1) return raw;
  let out = parts[0].replace(/[ \t]+$/, '');
  let empties = 0;
  for (let j = 1; j < parts.length; j++) {
    const last = j === parts.length - 1;
    const p = last ? parts[j].replace(/^[ \t]+/, '') : parts[j].trim();
    if (!last && p === '') { empties++; continue; }
    out += empties ? '\n'.repeat(empties) : ' ';
    out += p;
    empties = 0;
  }
  return out;
}

function afterClose(raw, idx, { file, key }) {
  const tail = raw.slice(idx + 1);
  if (stripComment(tail.replace(/\n/g, ' ')) !== '') {
    throw unreadable(file, `frontmatter '${key}' has content after its closing quote`);
  }
}

const DQ_ESCAPES = { n: '\n', t: '\t', '\t': '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', 0: '\0', a: '\x07', b: '\b', e: '\x1b', f: '\f', v: '\v', ' ': ' ', N: '\u0085', _: ' ', L: ' ', P: ' ' };

function doubleQuoted(raw, { file, key }) {
  let value = '';
  let seg = '';
  for (let j = 1; j < raw.length; j++) {
    const c = raw[j];
    if (c === '"') {
      afterClose(raw, j, { file, key });
      return value + foldFlowLines(seg);
    }
    if (c !== '\\') { seg += c; continue; }
    const e = raw[++j];
    if (e === '\n') {
      // escaped line break: join with no space, drop the next line's leading whitespace
      value += foldFlowLines(seg);
      seg = '';
      while (raw[j + 1] === ' ' || raw[j + 1] === '\t') j++;
      continue;
    }
    let decoded;
    if (e in DQ_ESCAPES) decoded = DQ_ESCAPES[e];
    else if (e === 'x' || e === 'u' || e === 'U') {
      const len = { x: 2, u: 4, U: 8 }[e];
      const hex = raw.slice(j + 1, j + 1 + len);
      if (!new RegExp(`^[0-9a-fA-F]{${len}}$`).test(hex)) throw unreadable(file, `frontmatter '${key}' has a bad \\${e} escape`);
      decoded = String.fromCodePoint(parseInt(hex, 16));
      j += len;
    } else {
      throw unreadable(file, `frontmatter '${key}' has an unknown escape \\${e}`);
    }
    value += foldFlowLines(seg) + decoded;
    seg = '';
  }
  throw unreadable(file, `frontmatter '${key}' opens a double quote it never closes`);
}

function singleQuoted(raw, { file, key }) {
  let seg = '';
  for (let j = 1; j < raw.length; j++) {
    if (raw[j] !== "'") { seg += raw[j]; continue; }
    if (raw[j + 1] === "'") { seg += "'"; j++; continue; }
    afterClose(raw, j, { file, key });
    return foldFlowLines(seg);
  }
  throw unreadable(file, `frontmatter '${key}' opens a single quote it never closes`);
}

function plainScalar(rest, block) {
  let out = stripComment(rest);
  let empties = 0;
  for (const l of block) {
    if (isBlank(l)) { empties++; continue; }
    const t = stripComment(l);
    if (t === '') continue;
    out += empties ? '\n'.repeat(empties) : ' ';
    out += t;
    empties = 0;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Directory walk
// ---------------------------------------------------------------------------------------------

// Every filesystem call goes through osUnreadable: an OS error (EACCES, EISDIR, ENOTDIR, ENOENT
// where the file must exist, ...) becomes CLAUDE_PLUGIN_UNREADABLE naming the file and the OS code,
// so a file this module could not measure is never reported as anything but unreadable.
function osUnreadable(file, op, e) {
  if (typeof e?.code !== 'string' || e.code === 'CLAUDE_PLUGIN_UNREADABLE') return e;
  return unreadable(file, `${op} failed with ${e.code}`);
}

async function exists(p) {
  try { await fs.access(p); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw osUnreadable(p, 'access', e); }
}

async function readText(file) {
  try { return await fs.readFile(file, 'utf8'); } catch (e) { throw osUnreadable(file, 'read', e); }
}

async function readJson(file) {
  const text = await readText(file);
  try { return JSON.parse(text); } catch (e) { throw unreadable(file, `is not valid JSON (${e.message})`); }
}

async function listDir(dir) {
  try { return await fs.readdir(dir, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return null; throw osUnreadable(dir, 'readdir', e); }
}

async function walkSkills(dir, files, { declaredIn } = {}) {
  const entries = await listDir(dir);
  if (!entries) {
    if (declaredIn) throw unreadable(declaredIn, `declares skills path ${dir}, which does not exist`);
    return;
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!e.isDirectory()) continue;
    const skill = path.join(dir, e.name, 'SKILL.md');
    if (await exists(skill)) files.push([skill, 'skill']);
  }
}

async function walkAgents(target, files, { declaredIn } = {}) {
  if (declaredIn && !(await exists(target))) throw unreadable(declaredIn, `declares agents path ${target}, which does not exist`);
  if (target.endsWith('.md')) { files.push([target, 'agent']); return; }
  const entries = await listDir(target);
  if (!entries) return;
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isFile() && e.name.endsWith('.md')) files.push([path.join(target, e.name), 'agent']);
  }
}

function asPathList(v, { file, field }) {
  if (v === undefined) return [];
  const list = typeof v === 'string' ? [v] : v;
  if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) {
    throw unreadable(file, `${field} is neither a path string nor an array of path strings`);
  }
  return list;
}

/**
 * Walk a plugin (or marketplace) directory: .claude-plugin/plugin.json, .claude-plugin/marketplace.json,
 * skills/<name>/SKILL.md and agents/*.md, plus any custom `skills`/`agents` paths plugin.json declares,
 * and every plugin a marketplace lists by a relative `source` path.
 *
 * @param {string} dir
 * @returns {Promise<object[]>} violations (empty when the directory meets every limit)
 * @throws CLAUDE_PLUGIN_UNREADABLE when a file cannot be read or the directory holds no plugin surface
 */
export async function validatePluginDir(dir) {
  return walkPluginDir(path.resolve(dir), new Set());
}

async function walkPluginDir(root, seen) {
  if (seen.has(root)) return [];
  seen.add(root);
  const violations = [];
  let surfaces = 0;
  const mdFiles = [];

  const pluginFile = path.join(root, '.claude-plugin', 'plugin.json');
  if (await exists(pluginFile)) {
    surfaces++;
    const manifest = await readJson(pluginFile);
    violations.push(...validatePluginManifest(manifest, { file: pluginFile }));
    for (const p of asPathList(manifest.skills, { file: pluginFile, field: 'skills' })) {
      await walkSkills(path.resolve(root, p), mdFiles, { declaredIn: pluginFile });
    }
    for (const p of asPathList(manifest.agents, { file: pluginFile, field: 'agents' })) {
      await walkAgents(path.resolve(root, p), mdFiles, { declaredIn: pluginFile });
    }
  }

  const marketFile = path.join(root, '.claude-plugin', 'marketplace.json');
  const nested = [];
  if (await exists(marketFile)) {
    surfaces++;
    const market = await readJson(marketFile);
    violations.push(...validateMarketplace(market, { file: marketFile }));
    for (const entry of market.plugins) {
      if (typeof entry.source === 'string' && entry.source.startsWith('./')) nested.push(path.resolve(root, entry.source));
    }
  }

  await walkSkills(path.join(root, 'skills'), mdFiles);
  await walkAgents(path.join(root, 'agents'), mdFiles);
  const checked = new Set();
  for (const [file, kind] of mdFiles) {
    if (checked.has(file)) continue;
    checked.add(file);
    surfaces++;
    violations.push(...validateFrontmatterDescription(await readText(file), { file, kind }));
  }

  for (const sub of nested) {
    if (sub === root) continue;
    surfaces++;
    violations.push(...await walkPluginDir(sub, seen));
  }

  if (surfaces === 0) {
    throw unreadable(root, 'holds no .claude-plugin/plugin.json, .claude-plugin/marketplace.json, skills/*/SKILL.md or agents/*.md');
  }
  return violations;
}
