/**
 * share.json — THE owner of the site link-preview contract.
 *
 * A site bundle MAY ship `share.json` beside its index.html. When it is present and valid, the
 * edge worker (its SHARE-HEAD block) rewrites the served shell head with the app's own title,
 * description, icons and og:/twitter: tags, and copies `default_view` into the app binding.
 * The edge, `descix serve` and `descix site upload` all run THIS parser:
 *   - the file is JSON and its top level is an object;
 *   - `title` and `description` are required non-empty strings (whitespace trimmed);
 *   - `icon`, `og_image`, `twitter_card` and `apple_touch_icon` are optional strings; a PRESENT
 *     one that is not a non-empty string is refused by name;
 *   - `twitter_card` defaults to "summary_large_image" when absent;
 *   - `default_view` is optional, one of VIEW_MODES (appView.js, the one list of views): the
 *     shell view the app STARTS in. The edge copies it into the app binding (appBinding.js) and
 *     the shell paints it first. Absent is null here: the shell owns the default (DEFAULT_VIEW).
 * No length, image size or path shape is checked, so the table carries no limit.
 *
 * Pure module: no DOM, no Node-only imports (its one import, appView.js, touches no global at
 * load), so the CLI (`descix site upload`), `descix serve` and the Cloudflare edge worker all
 * import it.
 */

import { VIEW_MODES } from './appView.js';

/** The file name, relative to the site bundle root. */
export const SHARE_JSON_FILE = 'share.json';

const VIEWS = Object.freeze({ noun: 'a view', values: Object.freeze(Object.values(VIEW_MODES)) });

/**
 * The field table. Every field is a string; `limit` is a maximum character count (null: none);
 * `oneOf` is the closed set of accepted values, `{noun, values}` (null:
 * any non-empty string); `default` is what the normalized bag carries when the field is absent.
 */
export const SHARE_CONTRACT = Object.freeze([
  { name: 'title', type: 'string', required: true, limit: null, oneOf: null, default: null },
  { name: 'description', type: 'string', required: true, limit: null, oneOf: null, default: null },
  { name: 'icon', type: 'string', required: false, limit: null, oneOf: null, default: null },
  { name: 'og_image', type: 'string', required: false, limit: null, oneOf: null, default: null },
  { name: 'twitter_card', type: 'string', required: false, limit: null, oneOf: null, default: 'summary_large_image' },
  { name: 'apple_touch_icon', type: 'string', required: false, limit: null, oneOf: null, default: null },
  { name: 'default_view', type: 'string', required: false, limit: null, oneOf: VIEWS, default: null },
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
 *   twitter_card:string, apple_touch_icon:string|null, default_view:string|null}} every
 *   contract field present, trimmed
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
    if (field.oneOf && !field.oneOf.values.includes(s)) {
      throw new Error(`${SHARE_JSON_FILE}: ${field.name} '${s}' is not ${field.oneOf.noun}; one of ${field.oneOf.values.join(', ')}`);
    }
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
