/**
 * syncState — THE owner of where a KB's local sync state lives, and which ORIGIN it describes.
 *
 * ── The defect this closes (measured 2026-09-17, two apps) ───────────────────
 * State used to live at `.descix/sync-state/<KB>.json` — one file per KB NAME, with no
 * environment and no origin anywhere in the path or the payload. `corpus sync` skips a file
 * when its blob SHA appears in that state, and nothing asked WHICH ORIGIN had received those
 * SHAs. Syncing one KB to two environments therefore produced two failures from one cause:
 *
 *   UNDER-SYNC  the second origin skips files it never received, as "unchanged"
 *   BLINDING    the first origin's drift becomes invisible, because the second origin's
 *               commit was written over the shared state — a stale KB reporting healthy
 *
 * Measured: GodsWorld on DEV took 2 of 8 files and then reported PROD clean ("Drift: NONE")
 * over a PROD KB two files behind. Independently, daita/General's one state file described
 * DEV (886 chunks, matching DEV's 886 vectors) while PROD sat on a different corpus (2545
 * vectors, 2026-05-29); a PROD dry-run against it declared 43 files "Unchanged" that PROD had
 * never received at those SHAs.
 *
 * ── The fix ─────────────────────────────────────────────────────────────────
 * State is keyed by the ORIGIN the sync actually talked to — the same fact `lib/origin.js`
 * owns and that every MCP result is stamped with. The origin is used because it is the fact
 * that is ALWAYS available: an env NAME is not (a workspace `env.apiUrl` or a DESCIX_API_URL
 * carries no label), and keying on a name would also miss a repointed workspace — same label,
 * different origin — which is the same lie one level up. The full origin is recorded INSIDE
 * the file as well, so a slug collision is caught rather than trusted.
 *
 * ── Migration: an unkeyed file belongs to NOBODY ─────────────────────────────
 * A legacy `.descix/sync-state/<KB>.json` records a sync to an origin nobody wrote down.
 * Adopting it for whichever origin asks first would hard-code today's accident as tomorrow's
 * truth — exactly the bug, re-created by the fix. So it is reported as UNKNOWN-ORIGIN and
 * forces one full walk, for every origin, and is never read as state and never deleted: it is
 * the only surviving record of what was synced before keying existed.
 */

import path from 'path';
import fs from 'fs/promises';

/** Directory holding every origin's state for an app. */
export function syncStateRoot(appRoot) {
  return path.join(appRoot, '.descix', 'sync-state');
}

/**
 * A filename-safe token for an origin. ONE derivation, used for the directory name; the exact
 * origin is recorded in the file, so this only has to be stable and readable, not injective.
 *
 * `https://dev.descix.net` -> `dev.descix.net`
 * `https://localhost:4000` -> `localhost-4000`
 *
 * @param {string} origin an absolute http(s) origin, already normalized by lib/origin.js
 * @returns {string}
 * @throws {Error} on an empty or non-string origin — a state file keyed by "undefined" is
 *   exactly the unscoped file this module exists to abolish, so it must never be writable.
 */
export function originKey(origin) {
  if (typeof origin !== 'string' || origin.trim() === '') {
    throw new Error(
      'syncState: refusing to key sync state by an empty origin. The caller must pass the '
      + 'origin the sync actually talked to (apiClient.baseUrl) — an unkeyed state file is the '
      + 'defect this module exists to prevent.',
    );
  }
  return origin
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/[^A-Za-z0-9._-]/g, '-');
}

/** Where this origin's state for this KB lives. */
export function syncStatePath(appRoot, kbName, origin) {
  return path.join(syncStateRoot(appRoot), originKey(origin), `${kbName}.json`);
}

/**
 * Where a failed-batch log for this origin lives. Keyed for the same reason the state is: a
 * failure log named only by KB let a DEV run overwrite the record of which PROD batches failed,
 * so the surviving file described an environment nobody could identify from it.
 */
export function syncFailureLogPath(appRoot, kbName, origin) {
  return path.join(syncStateRoot(appRoot), originKey(origin), `${kbName}-failures.json`);
}

/** Where an unkeyed (pre-origin-keying) file would be. Read only to DETECT it. */
export function legacySyncStatePath(appRoot, kbName) {
  return path.join(syncStateRoot(appRoot), `${kbName}.json`);
}

/**
 * Load the state for THIS origin, or report why there is none.
 *
 * @returns {Promise<{state: Object|null, reason: 'loaded'|'first-sync'|'unkeyed-legacy'|'origin-mismatch', detail?: string}>}
 *   `state` is null for every reason but 'loaded'. A null state means a FULL walk, which is
 *   always safe: it re-upserts rather than purging, and it is self-correcting.
 */
export async function loadSyncState(appRoot, kbName, origin) {
  const statePath = syncStatePath(appRoot, kbName, origin);
  try {
    const parsed = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    // Defensive: the directory is a slug, the payload is exact. They can only disagree through
    // a slug collision, and trusting the slug in that case would resurrect the original bug.
    if (parsed.origin && parsed.origin !== origin) {
      return {
        state: null,
        reason: 'origin-mismatch',
        detail: `${statePath} records origin ${parsed.origin}, but this sync is talking to ${origin}. `
          + 'Treating it as no state and walking the full corpus.',
      };
    }
    return { state: parsed, reason: 'loaded' };
  } catch {
    // No state for this origin. Is there an unkeyed file from before keying existed?
    const legacy = legacySyncStatePath(appRoot, kbName);
    try {
      await fs.access(legacy);
      return {
        state: null,
        reason: 'unkeyed-legacy',
        detail: `${legacy} was written before sync state was keyed by origin, so it does not say `
          + `WHICH environment it describes. It is not being read — this sync walks the full corpus `
          + `once for ${origin}, and writes its own state at ${statePath}. The old file is left `
          + `alone as the only record of what came before.`,
      };
    } catch {
      return { state: null, reason: 'first-sync' };
    }
  }
}

/**
 * Persist state for THIS origin. The origin is written into the payload as well as the path.
 *
 * @param {string} appRoot
 * @param {string} kbName
 * @param {string} origin
 * @param {Object} state the same shape as before, minus provenance this function adds
 */
export async function saveSyncState(appRoot, kbName, origin, state) {
  const statePath = syncStatePath(appRoot, kbName, origin);
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify({ origin, ...state }, null, 2));
  return statePath;
}
