/**
 * siteStatic — THE ONE OWNER of the site.static path rule.
 *
 * site.static is a directory relative to the workspace root (the repo root): "site",
 * "site/dist", "." (the root itself), "../scratch" (a sibling of the repo). The gateway
 * serves it at /p/{appId}/ from path.join(<repo root>, site.static).
 *
 * WHY (measured 2026-10-16): an absolute value was accepted by `descix app set-site --static`,
 * stored verbatim, and path.join silently re-rooted it under the workspace — the failure
 * surfaced only at request time as "Not found: <url>". The writer (CLI setStaticSite) and the
 * reader (resolveWorkspaceApps) both apply THIS rule, so the gateway's join never sees a value
 * that is not a plain relative path.
 *
 * Pure path logic, no other imports.
 */

import path from 'path';

/** The rule, spelled once; every refusal message carries it. */
export const SITE_STATIC_RULE =
  'takes a path relative to the workspace root (the repo root), e.g. site or ../scratch';

/**
 * Is `value` a plain relative path string? Refuses: a non-string or blank value, an absolute
 * path (POSIX or Windows, drive or UNC), a "~" home path (the shell did not expand it), and a
 * URL (scheme://). Returns null when the value is acceptable.
 *
 * @param {*} value
 * @returns {string|null} what is wrong, or null
 */
export function siteStaticViolation(value) {
  if (typeof value !== 'string' || value.trim() === '') return 'it is blank';
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return 'it is absolute';
  if (value === '~' || value.startsWith('~/') || value.startsWith('~\\')) return 'it is a home-directory path';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return 'it is a URL';
  return null;
}

/**
 * Throw if `value` breaks the rule. `subject` names what carries the value — the flag on the
 * write side ("--static"), the file and key on the read side — and `remedy` is appended verbatim.
 *
 * @param {*} value
 * @param {{ subject: string, remedy?: string }} where
 */
export function assertSiteStatic(value, { subject, remedy = '' }) {
  const violation = siteStaticViolation(value);
  if (!violation) return;
  throw new Error(
    `${subject} ${SITE_STATIC_RULE}; got ${JSON.stringify(value)} (${violation}).` +
    (remedy ? ` ${remedy}` : '')
  );
}
