/**
 * Chat session state — the owner module for the CLI's per-app conversation thread pointer.
 *
 * Conversation state itself lives SERVER-SIDE at the model provider; all the CLI keeps is an
 * opaque DeSciX interaction token per app in `~/.descix/sessions/{community_id}_{app_id}.json`.
 * This module owns reading, writing, and forgetting that pointer, plus the one rule for when a
 * dead pointer may be self-healed.
 *
 * Extracted out of `bin/descix.js` (ws-cli-stale-thread-selfheal) so the self-heal decision is
 * unit-testable in isolation — in particular so the 400-heals / 403-never-heals asymmetry can be
 * proven by a test rather than asserted in a comment.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Get interaction_id from session file
 * @param {string} communityId 
 * @param {string} appId 
 * @returns {Promise<string|null>}
 */
export async function getSessionInteractionId(communityId, appId) {
    const sessionPath = path.join(os.homedir(), '.descix', 'sessions', `${communityId}_${appId}.json`);
    try {
        const data = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
        return data.interaction_id || null;
    } catch {
        return null;
    }
}

/**
 * Save interaction_id to session file
 * @param {string} communityId 
 * @param {string} appId 
 * @param {string} interactionId 
 */
async function saveSessionInteractionId(communityId, appId, interactionId) {
    const sessionDir = path.join(os.homedir(), '.descix', 'sessions');
    await fs.mkdir(sessionDir, { recursive: true });
    const sessionPath = path.join(sessionDir, `${communityId}_${appId}.json`);
    await fs.writeFile(sessionPath, JSON.stringify({ 
        interaction_id: interactionId, 
        updated: Date.now() 
    }, null, 2));
}

/**
 * Clear session file
 * @param {string} communityId 
 * @param {string} appId 
 */
async function clearSession(communityId, appId) {
    const sessionPath = path.join(os.homedir(), '.descix', 'sessions', `${communityId}_${appId}.json`);
    try {
        await fs.unlink(sessionPath);
    } catch {
        // File doesn't exist, that's fine
    }
}

/**
 * WS-R7-PREREQS (CEO-D-2026-07-04-R7-PREREQS-RESCOPE ruling 3) session helpers.
 *
 * Session files are keyed {community_id}_{app_id}.json where community_id is the
 * SERVER-resolved value (returned by app-scoped commands). Before the server response
 * arrives the community may be unknown client-side — app_id is globally unique on the
 * platform (product_id === app_id), so `*_{appId}.json` identifies the app's sessions
 * unambiguously and the newest file is the current thread.
 */

/**
 * List existing session files for an app, newest first.
 * @param {string} appId
 * @returns {Promise<Array<{communityId: string, path: string, updated: number}>>}
 */
export async function findSessionsForApp(appId) {
    const sessionDir = path.join(os.homedir(), '.descix', 'sessions');
    const suffix = `_${appId}.json`;
    let entries = [];
    try {
        entries = await fs.readdir(sessionDir);
    } catch {
        return [];
    }
    const results = [];
    for (const name of entries) {
        if (!name.endsWith(suffix)) continue;
        const communityId = name.slice(0, name.length - suffix.length);
        if (!communityId) continue;
        const filePath = path.join(sessionDir, name);
        let updated = 0;
        try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            updated = data.updated || 0;
        } catch {
            continue; // unreadable session file — skip, do not guess
        }
        results.push({ communityId, path: filePath, updated });
    }
    results.sort((a, b) => b.updated - a.updated);
    return results;
}

/**
 * Save the session under the AUTHORITATIVE community key and self-heal: remove any
 * session files for the same app keyed under a DIFFERENT community (e.g. the legacy
 * hardcoded 'descix_*' mis-keys this fix removes). One app = one live session file.
 * @param {string} communityId - server-resolved community_id
 * @param {string} appId
 * @param {string} interactionId
 */
export async function saveSessionAuthoritative(communityId, appId, interactionId) {
    const stale = (await findSessionsForApp(appId)).filter(s => s.communityId !== communityId);
    await saveSessionInteractionId(communityId, appId, interactionId);
    for (const st of stale) {
        try { await fs.unlink(st.path); } catch { /* already gone */ }
    }
}

/**
 * Clear this app's chat session(s) — the ONE owner of "forget the current thread".
 *
 * Mirrors the read path: with a known community it clears the exact key; without one it
 * clears every session file for the app (app_id is globally unique, so `*_{appId}.json` is
 * unambiguous). Previously this logic was hand-copied at three call sites (`chat --new`,
 * `new-chat` with/without `-c`); the self-heal below would have made it four. One owner
 * means the heal can never diverge from what `--new` does.
 *
 * @param {string|null} communityId
 * @param {string} appId
 * @returns {Promise<number>} how many session files were removed
 */
export async function clearAppSessions(communityId, appId) {
    if (communityId) {
        const sessionPath = path.join(os.homedir(), '.descix', 'sessions', `${communityId}_${appId}.json`);
        let existed = false;
        try { await fs.access(sessionPath); existed = true; } catch { /* nothing to clear */ }
        await clearSession(communityId, appId);
        return existed ? 1 : 0;
    }
    const sessions = await findSessionsForApp(appId);
    for (const st of sessions) {
        try { await fs.unlink(st.path); } catch { /* already gone */ }
    }
    return sessions.length;
}

/**
 * ── Stale-thread self-heal (ws-cli-stale-thread-selfheal) ────────────────────────────────
 *
 * Conversation state lives server-side at the model provider; the CLI holds only an opaque
 * DeSciX interaction token in `~/.descix/sessions/{community}_{app}.json`. A stored token can
 * stop being resumable for reasons that are nobody's fault — the provider's retention window
 * (~55 days) elapsed, or the token predates the current token format. The backend correctly
 * refuses to answer statelessly and pretends nothing happened; it raises this typed 400. The
 * right client behaviour is to drop the dead pointer and start a fresh thread, telling the
 * user plainly that continuity was lost.
 *
 * ⚠️ THE ASYMMETRY IS THE WHOLE DESIGN. This constant is the ONLY interaction-thread error
 * code the CLI is allowed to know about, and it is deliberately the 400.
 *
 * Its 403 sibling — the one raised when a presented token was forged, tampered with, or
 * belongs to a DIFFERENT caller — must NEVER appear in this file. Self-healing a 403 would
 * clear the session and silently succeed on a fresh thread, converting a deliberate,
 * carefully-typed security denial into a no-op that the user never sees. A 403 must reach
 * the user loudly and untouched: no clear, no retry, no notice. A conformance test asserts
 * that the 403 code appears nowhere in this file's executable source.
 */
export const INTERACTION_THREAD_INVALID = 'INTERACTION_THREAD_INVALID';

/**
 * Should this failure trigger the single stale-thread retry?
 *
 * Narrow by construction: an exact typed-code match (never message-substring matching —
 * anti-pattern #6), and only when a stored token was actually sent, since with no thread to
 * heal there is nothing this could be about.
 *
 * @param {Error} error - the error thrown by apiClient.invoke
 * @param {string|null} sentInteractionId - the token that was presented, if any
 * @returns {boolean}
 */
export function isStaleThreadError(error, sentInteractionId) {
    return Boolean(sentInteractionId) && error?.code === INTERACTION_THREAD_INVALID;
}
