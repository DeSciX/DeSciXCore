/**
 * `descix app media-link <asset:ref>` — get a short-lived read link for ONE object in an app's
 * PRIVATE media space, over the same API surface the other media verbs use: `apiClient.invoke`
 * → POST /apifront, user-session authed.
 *
 * Backend contract (owned by the platform backend; the CLI only ferries and renders it):
 *   get_private_asset_link { ref } → { ref, url, expires_at }
 * `ref` is `asset:<app_id>/<path>` — what `media-upload --private` and `media-list --private`
 * print. The link EXPIRES (about 5 minutes); the caller must be an app admin or a user the app
 * owner granted access to.
 *
 * SERVER IS THE SOLE AUTHORITY: the ref grammar, access, the object's existence and the expiry
 * are the server's. The CLI passes the ref through UNCHANGED and checks only the `asset:` prefix,
 * so an obviously wrong argument (a URL, a gs:// URI, a public path) fails before a round trip.
 *
 * THE LINK IS A SHORT-LIVED CREDENTIAL: it is printed once and never cached, stored or written
 * to any file by this command.
 */

import chalk from 'chalk';
import { missingCommandOr } from './media-assets.js';

/**
 * Run `app media-link`.
 *
 * @param {import('../api-client.js').DeSciXApiClient} apiClient
 * @param {string} ref - `asset:<app_id>/<path>`
 * @param {{json?:boolean}} options
 * @returns {Promise<{ref:string, url:string, expires_at:string}>} the server object, unchanged
 */
export async function runMediaLink(apiClient, ref, options = {}) {
  if (typeof ref !== 'string' || !ref.startsWith('asset:')) {
    throw new Error(
      `media-link takes a private asset reference of the form asset:<app_id>/<path> ` +
      `(as \`media-upload --private\` and \`media-list --private\` print it); got ${JSON.stringify(ref)}.`);
  }

  let link;
  try {
    link = (await apiClient.invoke('get_private_asset_link', { ref }))?.message;
  } catch (err) {
    throw missingCommandOr(err, apiClient, 'media-link');
  }
  if (!link || typeof link.url !== 'string' || typeof link.expires_at !== 'string') {
    throw new Error(`get_private_asset_link returned an unexpected shape: ${JSON.stringify(link)}`);
  }

  if (options.json) {
    console.log(JSON.stringify(link, null, 2));
    return link;
  }
  console.log(link.url);
  console.log(chalk.gray(`expires: ${link.expires_at} (short-lived; not stored anywhere — ask again when you need it)`));
  return link;
}
