/**
 * Process Management Utilities
 *
 * Provides utilities for managing processes in debug mode, including killing an
 * existing instance of THIS service to free up its port before a relaunch.
 *
 * SAFETY INVARIANT (CEO-D-2026-06-01-SCAFFOLD-DX-GAPS, gap #1):
 *   This utility MUST only ever terminate the prior instance of the SAME service
 *   (identified by the TCP port it binds). It must NEVER kill an unrelated
 *   `node app.js` (e.g. the daita Core :4000 backend). When the service's own
 *   identity/port cannot be determined, it FAILS SAFE — kills nothing — rather
 *   than failing broad. Port-based scoping is the canonical mechanism because it
 *   is robust to ANY repo layout (DeSciX_Cloud, DeSciX_Powch, apps/{app}/microservice).
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Resolve the TCP listen port a process should be scoped to.
 *
 * Priority:
 *   1. An explicit numeric `port` argument (the canonical, robust path — callers
 *      pass `utils.PORT`).
 *   2. Otherwise null — caller could not identify a port, so we fail safe.
 *
 * @param {number|string|undefined} port
 * @returns {number|null} a valid 1-65535 port, or null
 */
function normalizePort(port) {
    if (port === undefined || port === null || port === 'auto') return null;
    const n = Number(port);
    if (!Number.isInteger(n) || n < 1 || n > 65535) return null;
    return n;
}

/**
 * Find the PID(s) currently LISTENING on a TCP port (excluding the current process).
 *
 * @param {number} port
 * @returns {string[]} array of PID strings bound to that port (current pid removed)
 */
function findListenerPids(port) {
    const currentPid = process.pid.toString();
    let pids = [];
    try {
        // -t: terse (pids only), -i tcp:<port>, -sTCP:LISTEN: only the listening socket.
        // This binds the kill to whoever OWNS the port — never a sibling app.js.
        const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
            stdio: 'pipe',
            encoding: 'utf8',
        }).toString().trim();
        pids = out.split('\n').map(s => s.trim()).filter(Boolean);
    } catch (error) {
        // lsof exits non-zero when nothing is listening — expected, not an error.
        return [];
    }
    return pids.filter(pid => pid !== currentPid);
}

/**
 * Kills the existing instance of THIS service so its port is free for relaunch.
 * Only runs in debug mode — never executes in production.
 *
 * Scoping is by TCP listen port (the service's own identity). This is layout-agnostic
 * and fails safe: if no port can be determined, NOTHING is killed.
 *
 * @param {string} scriptUrl - The script URL from import.meta.url (used only for logging).
 * @param {boolean} isDebug - Whether running in debug mode (utils.isDebug / utils.DEBUG_LOCAL).
 * @param {number|string} [port] - The TCP port THIS service binds (e.g. utils.PORT).
 *                                  Strongly recommended; without it the function fails safe.
 */
export function killExistingProcess(scriptUrl, isDebug, port) {
    // Only run in debug mode
    if (!isDebug) {
        return;
    }

    let filename = 'app.js';
    try {
        filename = path.basename(fileURLToPath(scriptUrl));
    } catch {
        // scriptUrl unusable — fine, it is for logging only.
    }

    const scopedPort = normalizePort(port);

    // FAIL SAFE: without a port we cannot prove a process is THIS service, so we
    // refuse to kill anything. (Previous behavior fell through to killing every
    // `node app.js`, which took down the daita Core :4000 backend.)
    if (scopedPort === null) {
        console.warn(
            `[ProcessUtils] No identifiable port for ${filename}; ` +
            `skipping kill (fail-safe). Pass the service port (e.g. utils.PORT) to enable port-scoped cleanup.`
        );
        return;
    }

    console.log(`[ProcessUtils] Checking for an existing instance of ${filename} on port ${scopedPort}...`);

    try {
        const pids = findListenerPids(scopedPort);

        if (pids.length === 0) {
            console.log(`[ProcessUtils] No existing process listening on port ${scopedPort}.`);
            return;
        }

        let killedCount = 0;
        for (const pid of pids) {
            try {
                const cmd = execSync(`ps -p ${pid} -o command=`, {
                    stdio: 'pipe',
                    encoding: 'utf8',
                }).toString().trim();

                console.log(`[ProcessUtils] Killing process ${pid} on port ${scopedPort}: ${cmd.substring(0, 80)}...`);
                execSync(`kill -9 ${pid}`);
                killedCount++;
            } catch (error) {
                // Process may have already exited between lookup and kill — ignore.
            }
        }

        if (killedCount > 0) {
            console.log(`[ProcessUtils] Freed port ${scopedPort} (killed ${killedCount} process(es)).`);
        }
    } catch (error) {
        // Never block startup on a cleanup failure.
        console.warn(`[ProcessUtils] Warning: could not free port ${scopedPort}: ${error.message}`);
    }
}
