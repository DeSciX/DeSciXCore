/**
 * Name the stale corpus files a sync would delete, so an operator sees WHICH documents go
 * before a real run — not just how many. (GODSWORLD-DEV, 2026-09-18: a dry run reported
 * "Would delete (stale-file): 3" on a KB where the three might matter, with no way to tell
 * which three.)
 *
 * A `corpus:` file_id IS a git blob SHA, so the corpus's own repositories can say which path
 * held that blob, and in which commit. No store round-trip and no server change. A blob that
 * no local history holds is reported as such rather than guessed at.
 */

import { execFileSync } from 'child_process';

/**
 * Parse `git log --all --no-abbrev --format=%h --raw --find-object=<sha>` output: the most
 * recent commit that added or removed that blob, and the path it lived at.
 * @returns {{commit:string, path:string} | null}
 */
export function parseFindObjectRaw(output, sha) {
    let commit = null;
    for (const line of String(output || '').split('\n')) {
        if (/^[0-9a-f]{7,40}$/.test(line.trim())) { commit = line.trim(); continue; }
        const m = line.match(/^:\d{6} \d{6} ([0-9a-f]{40}) ([0-9a-f]{40}) \S+\t(.+)$/);
        if (m && commit && (m[1] === sha || m[2] === sha)) {
            return { commit, path: m[3].split('\t').pop() };
        }
    }
    return null;
}

/**
 * Resolve each stale `corpus:<sha>` id to where that blob lived, searching each repo root.
 * @param {string[]} fileIds - `corpus:<sha>` ids
 * @param {string[]} repoRoots - the repositories that own this corpus's sources
 * @returns {Array<{file_id:string, repo:string|null, commit:string|null, path:string|null}>}
 */
export function describeStaleBlobs(fileIds, repoRoots) {
    return fileIds.map((file_id) => {
        const sha = file_id.replace(/^corpus:/, '');
        for (const repo of repoRoots) {
            let out = '';
            try {
                out = execFileSync('git', ['log', '--all', '--no-abbrev', '--format=%h', '--raw', `--find-object=${sha}`],
                    { cwd: repo, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 });
            } catch {
                continue;
            }
            const hit = parseFindObjectRaw(out, sha);
            if (hit) return { file_id, repo, commit: hit.commit, path: hit.path };
        }
        return { file_id, repo: null, commit: null, path: null };
    });
}
