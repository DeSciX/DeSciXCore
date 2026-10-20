/**
 * share.json — THE owner of the site link-preview contract.
 *
 * A site bundle MAY ship `share.json` beside its index.html. When it is present and valid, the
 * edge worker (its SHARE-HEAD block) rewrites
 * the served shell head with the app's own title, description, icons and og:/twitter: tags.
 *
 * This module states exactly what the edge enforces, and nothing more:
 *   - the file is JSON and its top level is an object;
 *   - `title` and `description` are required non-empty strings (whitespace trimmed);
 *   - `icon`, `og_image`, `twitter_card` and `apple_touch_icon` are optional strings;
 *   - `twitter_card` defaults to "summary_large_image" when absent.
 * The edge checks no length, no image size and no path shape, so this table carries no limit.
 * One addition the edge does not make: a PRESENT optional field that is not a non-empty string
 * is refused by name here, where the edge silently drops that one field. An author who wrote
 * `"icon": 5` meant an icon; dropping it is a failure nobody would see.
 *
 * Pure module: no DOM, no Node-only imports, so the CLI (`descix site upload`) and the
 * Cloudflare edge worker can both import it.
 */

/** The file name, relative to the site bundle root. */
export const SHARE_JSON_FILE = 'share.json';

/**
 * The field table. Every field is a string; `limit` is a maximum character count (null: the
 * edge enforces none); `default` is what the normalized bag carries when the field is absent.
 */
export const SHARE_CONTRACT = Object.freeze([
  { name: 'title', type: 'string', required: true, limit: null, default: null },
  { name: 'description', type: 'string', required: true, limit: null, default: null },
  { name: 'icon', type: 'string', required: false, limit: null, default: null },
  { name: 'og_image', type: 'string', required: false, limit: null, default: null },
  { name: 'twitter_card', type: 'string', required: false, limit: null, default: 'summary_large_image' },
  { name: 'apple_touch_icon', type: 'string', required: false, limit: null, default: null },
].map(Object.freeze));

function describe(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return `a ${typeof v}`;
}

/**
 * Validate a parsed share.json value.
 * @param {unknown} obj
 * @returns {{title:string, description:string, icon:string|null, og_image:string|null,
 *   twitter_card:string, apple_touch_icon:string|null}} every contract field present, trimmed
 * @throws {Error} naming the field and the rule it broke
 */
export function validateShareJson(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error(`${SHARE_JSON_FILE}: the top level must be a JSON object; got ${describe(obj)}`);
  }
  const bag = {};
  for (const field of SHARE_CONTRACT) {
    const v = obj[field.name];
    if (v === undefined || v === null) {
      if (field.required) throw new Error(`${SHARE_JSON_FILE}: ${field.name} is required (a non-empty string)`);
      bag[field.name] = field.default;
      continue;
    }
    if (typeof v !== 'string') {
      throw new Error(`${SHARE_JSON_FILE}: ${field.name} must be a string; got ${describe(v)}`);
    }
    const s = v.trim();
    if (!s) throw new Error(`${SHARE_JSON_FILE}: ${field.name} is empty; it must be a non-empty string`);
    bag[field.name] = s;
  }
  return bag;
}

/**
 * Parse and validate a share.json body.
 * @param {string} text
 * @returns the normalized bag (see validateShareJson)
 * @throws {Error} on invalid JSON, or naming the field and the rule it broke
 */
export function parseShareJson(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    throw new Error(`${SHARE_JSON_FILE}: not valid JSON (${e.message})`, { cause: e });
  }
  return validateShareJson(obj);
}
