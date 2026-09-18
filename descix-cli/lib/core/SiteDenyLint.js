/**
 * What a site upload must never publish. Hard deny — the upload fails loud before any file
 * leaves the machine, dry-run included.
 *
 * WHY (measured, 2026-09-18): egpt-godsworld's DEV site had been publicly serving, as static
 * files, the app's persona (`assets/system_instructions.md`) and its whole backend source tree
 * (`microservice/app.js`, `Dockerfile`, `services/*`, config examples). An earlier upload used a
 * broad manifest, and `site upload` publishes whatever its manifest names. The KB sync already
 * refuses private content (CorpusDenyLint); the site upload had no equivalent.
 *
 * A DIFFERENT PATTERN SET from the corpus, on purpose: the corpus lint is about editorial
 * publishability (drafts, patents, test dumps), and a site legitimately ships some of those. This
 * set is about what is private at RUNTIME — backend source, an agent's persona, credentials,
 * workspace and tooling state. The MATCHER is shared (CorpusDenyLint.matchPathPattern), so there
 * is one definition of how a pattern meets a path.
 *
 * No exemption flag: every class here is repaired by not naming the file in the manifest, which
 * is always possible. An escape hatch would be the one path the next leak takes.
 */

import { matchPathPattern } from './CorpusDenyLint.js';

export const SITE_DENY_PATH_PATTERNS = [
    { id: 1, class: 'app-source', patterns: ['**/microservice/**', 'microservice'],
      reason: 'backend source — an app\'s microservice is deployed as a service, never served as files' },
    { id: 2, class: 'agent-persona', patterns: ['system_instructions.md'],
      reason: 'the agent\'s persona / system instructions — its prompt is not a public asset' },
    { id: 3, class: 'credential', caseFold: true,
      patterns: ['wallet*.json', '.env', '.env.*', 'dev-overrides*.json', 'secret*.json', '*.pem', '*.key',
                 'service-account*.json', 'credentials*.json', 'id_rsa*', '*.p12'],
      reason: 'credential or credential-shaped config (a placeholder copy teaches the real layout)' },
    { id: 4, class: 'workspace-state', patterns: ['**/.descix/**', '.descix'],
      reason: 'DeSciX workspace / session state' },
    { id: 5, class: 'tooling-state', patterns: ['**/.claude/**', '**/.git/**', '.claude', '.git'],
      reason: 'agent or VCS internals' },
];

/**
 * Every published path that matches a deny class.
 * @param {string[]} publishedPaths - paths relative to the site root, as they would be served
 * @returns {Array<{path:string, class:string, glob:string, reason:string}>}
 */
export function lintSiteFiles(publishedPaths) {
    const violations = [];
    for (const p of publishedPaths) {
        for (const pattern of SITE_DENY_PATH_PATTERNS) {
            const glob = matchPathPattern(p, pattern);
            if (glob) {
                violations.push({ path: p, class: pattern.class, glob, reason: pattern.reason });
                break;
            }
        }
    }
    return violations;
}

/** Throw, naming every offending file and the repair, when any path is denied. */
export function assertSitePublishable(publishedPaths) {
    const violations = lintSiteFiles(publishedPaths);
    if (violations.length === 0) return;
    const lines = violations.map((v) => `  - ${v.path}  [${v.class}] ${v.reason}`);
    const err = new Error(
        `site upload REFUSED: ${violations.length} file(s) must never be publicly served:\n${lines.join('\n')}\n` +
        'Nothing was uploaded. Remove these from the site manifest\'s sources (.descix/manifests/site.json) ' +
        'or from the build output, then upload again.');
    err.code = 'SITE_DENY_PATH';
    err.violations = violations;
    throw err;
}
