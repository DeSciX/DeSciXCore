/**
 * A site upload that ships `share.json` validates it against the app-sdk's share contract
 * (@descix/app-sdk/share, the one owner) BEFORE anything is uploaded, dry run included. An
 * invalid file refuses the whole upload: the edge would silently serve the generic head, and
 * nobody would see why.
 */

import fs from 'fs/promises';
import { SHARE_JSON_FILE, parseShareJson } from '@descix/app-sdk/share';

/**
 * @param {Array<{ path: string, _absolutePath: string }>} fileList - the upload set, paths relative
 *   to the site root as they would be served
 * @returns {Promise<object|null>} the normalized share bag, or null when the set ships no share.json
 * @throws {Error} code SITE_SHARE_JSON_INVALID, naming the file and the contract's field-named error
 */
export async function assertShareJsonValid(fileList) {
  const file = fileList.find((f) => f.path === SHARE_JSON_FILE);
  if (!file) return null;
  const text = await fs.readFile(file._absolutePath, 'utf8');
  try {
    return parseShareJson(text);
  } catch (e) {
    const err = new Error(
      `site upload REFUSED: ${file._absolutePath} does not meet the share.json contract (@descix/app-sdk/share):\n` +
      `  ${e.message}\n` +
      'Nothing was uploaded. Fix share.json, or leave it out of the site, then upload again.',
      { cause: e });
    err.code = 'SITE_SHARE_JSON_INVALID';
    throw err;
  }
}
