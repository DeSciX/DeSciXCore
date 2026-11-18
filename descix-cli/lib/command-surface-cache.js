/**
 * The command-surface cache: the server's per-command class ('public' | 'admin') for one API
 * base, kept on disk so `--help` can hide admin verbs WITHOUT touching the network.
 *
 * ONE OWNER of the file: where it lives, its shape and version, its key, reading it and writing it.
 *   - Read: by bin/descix.js only when commander is about to print help or name an unknown
 *     command, offline and synchronously. No file => no cache, said nowhere. A file that exists
 *     but is not a regular file, cannot be read, is over COMMAND_SURFACE_CACHE_MAX_BYTES, is not
 *     JSON, has the wrong version or shape, or holds a wrong-shaped entry for this API base =>
 *     no cache AND a `problem` line naming the file, which help prints on stderr. A valid file
 *     with no entry for this API base => no cache, said nowhere.
 *   - Written: only by `descix login` (after a successful sign-in) and `descix whoami`, which
 *     already hold a session and already call the server. A help, version, bare or unknown
 *     invocation never writes it.
 *
 * File: ~/.descix/command-surface-cache.json
 *   { "version": 1,
 *     "apiBases": { "<commandSurfaceCacheKey>": { "fetchedAt": "<ISO>", "manifest_hash": "<str|null>",
 *                                                 "commands": { "<command>": "public" | "admin" } } } }
 * Keyed by API base (commandSurfaceCacheKey: origin + path), so a DEV surface is never applied to
 * PROD help, and two gateways on one host under different paths never share an entry. Written
 * owner-only (0600) through a temp file with an unpredictable name, opened exclusively, then
 * renamed into place; the temp file is removed if the write or the rename fails.
 */
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const COMMAND_SURFACE_CACHE_VERSION = 1;

/** A file larger than this is not parsed: it is treated as no cache. */
export const COMMAND_SURFACE_CACHE_MAX_BYTES = 1024 * 1024;

/**
 * The cache key for an API base — the value the client posts `${base}/apifront/` to: the URL's
 * origin (lowercase scheme and host, default port dropped) plus its pathname with trailing
 * slashes removed; query and hash dropped. `https://descix.net/` -> `https://descix.net`,
 * `https://gw.test/team-a/` -> `https://gw.test/team-a`. The reader and the writer both key
 * through this. Null when it does not parse as an http(s) URL.
 *
 * @param {string} apiBase
 * @returns {string|null}
 */
export function commandSurfaceCacheKey(apiBase) {
  try {
    const url = new URL(String(apiBase).trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}
const CLASSES = new Set(['public', 'admin']);

/** @returns {string} the cache file path for the current HOME */
export function commandSurfaceCachePath() {
  return path.join(os.homedir(), '.descix', 'command-surface-cache.json');
}

function validEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (typeof entry.fetchedAt !== 'string' || Number.isNaN(Date.parse(entry.fetchedAt))) return false;
  const c = entry.commands;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return false;
  return Object.values(c).every((v) => CLASSES.has(v));
}

/** The one line help prints when the file exists but is not usable. */
function problemLine(file, why) {
  return `descix: the command-surface cache ${file} ${why}; admin hiding is off for this listing. \`descix whoami\` rewrites it.`;
}

/**
 * Read the file through ONE opened descriptor: open non-blocking (a FIFO never blocks the open),
 * fstat that descriptor (so the check and the read are the same file), refuse anything that is not
 * a regular file (a FIFO, a device, a directory), and read at most MAX_BYTES + 1 bytes (so a file
 * that grows after the fstat never balloons the read). Never throws.
 *
 * @returns {{ file: object|null, problem: string|null }} file null + problem null: no file there
 */
function readFile() {
  const file = commandSurfaceCachePath();
  let fd;
  try {
    fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK ?? 0));
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { file: null, problem: null }; // no file there
    return { file: null, problem: problemLine(file, `cannot be opened (${e.code || e.message})`) };
  }
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) return { file: null, problem: problemLine(file, 'is not a regular file') };
    if (st.size > COMMAND_SURFACE_CACHE_MAX_BYTES) {
      return { file: null, problem: problemLine(file, `is over ${COMMAND_SURFACE_CACHE_MAX_BYTES} bytes`) };
    }
    const buf = Buffer.alloc(COMMAND_SURFACE_CACHE_MAX_BYTES + 1);
    let n = 0;
    for (let r; n < buf.length && (r = fs.readSync(fd, buf, n, buf.length - n, n)) > 0;) n += r;
    if (n > COMMAND_SURFACE_CACHE_MAX_BYTES) {
      return { file: null, problem: problemLine(file, `is over ${COMMAND_SURFACE_CACHE_MAX_BYTES} bytes`) };
    }
    let parsed;
    try {
      parsed = JSON.parse(buf.toString('utf8', 0, n));
    } catch {
      return { file: null, problem: problemLine(file, 'is not JSON') };
    }
    if (!parsed || typeof parsed !== 'object' || parsed.version !== COMMAND_SURFACE_CACHE_VERSION) {
      return { file: null, problem: problemLine(file, `is not version ${COMMAND_SURFACE_CACHE_VERSION}`) };
    }
    if (!parsed.apiBases || typeof parsed.apiBases !== 'object' || Array.isArray(parsed.apiBases)) {
      return { file: null, problem: problemLine(file, 'has no apiBases map') };
    }
    return { file: parsed, problem: null };
  } catch (e) {
    return { file: null, problem: problemLine(file, `cannot be read (${e.code || e.message})`) };
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * The cached surface for `apiBase`. Offline, synchronous, never throws.
 *
 * @param {string} apiBase
 * @returns {{ surface: { commands: Record<string,'public'|'admin'>, fetchedAt: string }|null,
 *             problem: string|null }} `problem` is the one stderr line for a file that exists but
 *   cannot be used; null when there is no file, or a valid file with no entry for this base
 */
export function readCommandSurface(apiBase) {
  const key = commandSurfaceCacheKey(apiBase);
  if (!key) return { surface: null, problem: null };
  const { file, problem } = readFile();
  if (!file) return { surface: null, problem };
  if (!Object.hasOwn(file.apiBases, key)) return { surface: null, problem: null };
  const entry = file.apiBases[key];
  if (!validEntry(entry)) return { surface: null, problem: problemLine(commandSurfaceCachePath(), `has a malformed entry for ${key}`) };
  return { surface: { commands: entry.commands, fetchedAt: entry.fetchedAt }, problem: null };
}

/**
 * Fetch `get_command_surface` from the client's API base and write it to the cache.
 *
 * @param {import('./api-client.js').DeSciXApiClient} apiClient - initialized, with a session
 * @returns {Promise<{ apiBase: string, fetchedAt: string, count: number }>}
 * @throws when the fetch fails, the answer has the wrong shape, or the file cannot be written
 */
export async function refreshCommandSurface(apiClient) {
  await apiClient.ensureInitialized();
  const apiBase = commandSurfaceCacheKey(apiClient.baseUrl);
  if (!apiBase) throw new Error(`the API base ${JSON.stringify(apiClient.baseUrl)} is not an http(s) URL`);
  // The writers call this right after their own server calls, on the session those already
  // ensured. skipSessionCheck + noAuthRecovery: this call never refreshes, reconnects or signs in;
  // a refusal is one line from refreshCommandSurfaceOrSay.
  const resp = await apiClient.invoke('get_command_surface', {}, { allowGuest: false, skipSessionCheck: true, noAuthRecovery: true });
  const msg = resp?.message || resp;
  const entry = { fetchedAt: new Date().toISOString(), manifest_hash: msg?.manifest_hash ?? null, commands: msg?.commands };
  if (!validEntry(entry)) {
    throw new Error(`get_command_surface returned an unexpected shape: ${JSON.stringify(resp).slice(0, 200)}`);
  }
  // An unusable file (readFile's problem) is replaced: this write is the repair the help line names.
  const file = readFile().file || { version: COMMAND_SURFACE_CACHE_VERSION, apiBases: {} };
  file.apiBases[apiBase] = entry;
  writeOwnerOnly(commandSurfaceCachePath(), JSON.stringify(file, null, 2));
  return { apiBase, fetchedAt: entry.fetchedAt, count: Object.keys(entry.commands).length };
}

/**
 * Write `text` to `target` owner-only (0600): a temp file beside it with a random name, created
 * exclusively ('wx', so an existing file or a planted symlink at that name is never followed),
 * then renamed over the target; a failed write or rename unlinks the temp file and rethrows. A
 * name collision is retried once with a new name.
 */
function writeOwnerOnly(target, text) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  for (let attempt = 0; ; attempt++) {
    const tmp = `${target}.${crypto.randomBytes(12).toString('hex')}.tmp`;
    let fd;
    try {
      fd = fs.openSync(tmp, 'wx', 0o600);
    } catch (e) {
      if (e.code === 'EEXIST' && attempt === 0) continue;
      throw e;
    }
    try {
      try {
        fs.writeFileSync(fd, text, 'utf8');
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(tmp, target);
    } catch (e) {
      // The temp file is ours (created exclusively above): never leave it behind.
      try { fs.unlinkSync(tmp); } catch { /* already gone */ }
      throw e;
    }
    fs.chmodSync(target, 0o600);
    return;
  }
}

/**
 * The writers' call: refresh, and on failure print ONE plain line and carry on — a stale help
 * listing never fails the command that tried to refresh it.
 *
 * @param {import('./api-client.js').DeSciXApiClient} apiClient
 * @param {(line: string) => void} [say]
 * @returns {Promise<{ apiBase: string, fetchedAt: string, count: number }|null>}
 */
export async function refreshCommandSurfaceOrSay(apiClient, say = (l) => console.error(l)) {
  try {
    return await refreshCommandSurface(apiClient);
  } catch (error) {
    say(`The help listing's command surface was not refreshed: ${error.message}`);
    return null;
  }
}
