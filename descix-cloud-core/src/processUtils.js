/**
 * Process Management Utilities
 *
 * Provides utilities for managing processes in debug mode, including
 * killing existing instances of the same service to free up ports.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Kills any existing processes matching the current service's script path.
 * Only runs in debug mode - never executes in production.
 *
 * @param {string} scriptUrl - The script URL from import.meta.url
 * @param {boolean} isDebug - Whether running in debug mode (utils.isDebug or utils.DEBUG_LOCAL)
 */
export function killExistingProcess(scriptUrl, isDebug) {
    // Only run in debug mode
    if (!isDebug) {
        return;
    }

    try {
        // Convert URL to file path
        const scriptPath = fileURLToPath(scriptUrl);

        // Extract the filename (app.js, index.js, etc.)
        const filename = path.basename(scriptPath);

        // Extract the service directory name (DeSciX_Cloud, DeSciX_ServiceSDK, DeSciX_Powch, etc.)
        const pathParts = scriptPath.split(path.sep);
        const serviceDirIndex = pathParts.findIndex(part => part.startsWith('DeSciX_'));

        let serviceDirName;
        if (serviceDirIndex !== -1) {
            serviceDirName = pathParts[serviceDirIndex];
        } else {
            // Fallback: try to extract from path or use filename only
            console.warn(`[ProcessUtils] Could not find service directory in path: ${scriptPath}`);
            serviceDirName = null;
        }

        console.log(`[ProcessUtils] Checking for existing processes with filename: ${filename}, service: ${serviceDirName || 'any'}...`);

        // Find all processes matching the filename
        // VS Code runs processes with just the filename (e.g., "node app.js")
        // because it sets the working directory to the service directory
        const filenamePattern = `node.*${filename}`;
        let pids = [];

        try {
            const pgrepOutput = execSync(`pgrep -f -i "${filenamePattern}"`, {
                stdio: 'pipe',
                encoding: 'utf8'
            }).toString().trim();
            pids = pgrepOutput.split('\n').filter(pid => pid.length > 0);
        } catch (error) {
            // pgrep returns status 1 if no matches - this is expected
            if (error.status !== 1) {
                throw error;
            }
        }

        // Filter by working directory if we have a service directory name
        // and filter out current process
        const currentPid = process.pid.toString();
        const otherPids = [];

        for (const pid of pids) {
            if (pid === currentPid) continue;

            // Check the working directory of this process
            if (serviceDirName) {
                try {
                    const cwdOutput = execSync(`lsof -p ${pid} | grep cwd`, {
                        stdio: 'pipe',
                        encoding: 'utf8'
                    }).toString().trim();

                    // Check if the working directory contains the service directory name
                    if (cwdOutput.includes(serviceDirName)) {
                        otherPids.push(pid);
                    }
                } catch (error) {
                    // Process may have terminated, or lsof failed - skip it
                    continue;
                }
            } else {
                // No service directory name, match all processes with this filename
                otherPids.push(pid);
            }
        }

        if (otherPids.length > 0) {
            console.log(`[ProcessUtils] Found ${otherPids.length} existing process(es): ${otherPids.join(', ')}`);

            let killedCount = 0;
            otherPids.forEach(pid => {
                try {
                    // Get process details for confirmation
                    const cmd = execSync(`ps -p ${pid} -o command=`, {
                        stdio: 'pipe',
                        encoding: 'utf8'
                    }).toString().trim();

                    console.log(`[ProcessUtils] Killing process ${pid}: ${cmd.substring(0, 80)}...`);
                    execSync(`kill -9 ${pid}`);
                    killedCount++;
                } catch (error) {
                    // Process may have already terminated, ignore
                }
            });

            if (killedCount > 0) {
                console.log(`[ProcessUtils] Successfully killed ${killedCount} existing process(es).`);
            }
        } else {
            console.log(`[ProcessUtils] No existing processes found.`);
        }
    } catch (error) {
        // pgrep returns status 1 if no process is found, which throws an error in execSync
        // This is expected when no processes match - not an error condition
        if (error.status === 1) {
            console.log(`[ProcessUtils] No existing processes found.`);
        } else {
            // Log unexpected errors but don't block startup
            console.warn(`[ProcessUtils] Warning: Could not check for existing processes: ${error.message}`);
        }
    }
}
