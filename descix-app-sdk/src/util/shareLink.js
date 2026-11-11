/**
 * shareLink.js — the Core client of the share-link contract: mint a link, capture `?ref=`, claim it.
 *
 * The server owns the contract (DeSciX_Cloud Promotion.mintForShare / process_deep_link):
 *   - MINT: generate_referral_code { target_type: 'WEB_PAGE', target_identifier: <https page on the
 *     platform domain>, channel, target_community_id? } answers { custom_id, created, share_url, … };
 *     share_url is `<page>?ref=<custom_id>`. Asking twice returns the same custom_id.
 *   - CLAIM: process_deep_link { custom_id } and nothing else. The claimant is the session user and the
 *     referrer is the promotion's minter; a caller-supplied referrer_id / new_user_id is refused
 *     (REFERRAL_PARAMS_REMOVED). Refusals are coded REFERRAL_*.
 *
 * Every Core surface that mints or claims consumes this module: the shell (AppContext captures `?ref` at
 * mount and claims once signed in; the Discord activity stores its launch custom_id here) and the CLI
 * (`descix referral create`). Pure module: no DOM, no Node-only imports — the CLI imports it.
 */

/** The one share-link parameter: `?ref=<custom_id>`. */
export const REF_PARAM = 'ref';
/** sessionStorage key holding the captured, not-yet-claimed custom_id (survives the Powch sign-in). */
export const PENDING_REF_KEY = 'descix.pending_ref';
export const MINT_COMMAND = 'generate_referral_code';
export const CLAIM_COMMAND = 'process_deep_link';
/** The promotion target whose reply carries share_url. */
export const WEB_PAGE_TARGET = 'WEB_PAGE';

/** The claim outcomes, one list. */
export const CLAIM_OUTCOMES = Object.freeze({
  NONE: 'none',       // nothing pending
  CLAIMED: 'claimed', // the server recorded the claim (cleared)
  REFUSED: 'refused', // a REFERRAL_* refusal (cleared: asking again cannot change the answer)
  RETRY: 'retry',     // anything else — network, 5xx, uncoded (kept for the next session)
});

/**
 * The generate_referral_code params for a share link to one page.
 * @param {{page: string, channel: string, communityId?: string, rewardType?: string}} args
 *   page — an absolute https URL on the platform domain (the server checks the host and drops the query);
 *   channel — how the link travels; the server owns the accepted values and names them on refusal.
 */
export function webPageMintParams({ page, channel, communityId, rewardType } = {}) {
  if (!page) throw new Error(`${MINT_COMMAND}: page is required (an https URL on the platform domain).`);
  if (!channel) throw new Error(`${MINT_COMMAND}: channel is required (how the link travels; the server names the accepted values).`);
  const params = { target_type: WEB_PAGE_TARGET, target_identifier: String(page), channel };
  if (communityId) params.target_community_id = communityId;
  if (rewardType) params.rewardType = rewardType;
  return params;
}

/**
 * The share_url of a WEB_PAGE mint reply. A reply without one, or whose link does not carry
 * `?ref=<custom_id>`, is refused: the caller would otherwise hand out a link nobody can claim.
 * @param {{custom_id?: string, share_url?: string}} reply - the reply's `message`
 * @returns {string}
 */
export function requireShareUrl(reply) {
  const shareUrl = reply?.share_url;
  if (typeof shareUrl !== 'string' || !shareUrl) {
    throw new Error(`${MINT_COMMAND} returned no share_url: ${JSON.stringify(reply)}`);
  }
  let carried;
  try { carried = new URL(shareUrl).searchParams.get(REF_PARAM); } catch {
    throw new Error(`${MINT_COMMAND} returned a share_url that is not a URL: ${JSON.stringify(shareUrl)}`);
  }
  if (!reply.custom_id || carried !== reply.custom_id) {
    throw new Error(`${MINT_COMMAND} returned a share_url whose ?${REF_PARAM}= (${JSON.stringify(carried)}) is not its custom_id (${JSON.stringify(reply.custom_id)}).`);
  }
  return shareUrl;
}

/** Hold a custom_id for the claim (the URL capture below, and the Discord activity's launch custom_id). */
export function storePendingRef(storage, customId) {
  if (!customId) throw new Error('storePendingRef: customId is required.');
  storage.setItem(PENDING_REF_KEY, String(customId));
}

/**
 * Read `?ref=` from a location, hold it, and return the URL to show without it (null when there was none).
 * The path, the other params and the fragment are kept. A later link overwrites an earlier one.
 * @param {{href: string}} location - window.location
 * @param {Storage} storage - sessionStorage
 * @returns {{ref: string|null, cleanUrl: string|null}}
 */
export function capturePendingRef(location, storage) {
  const url = new URL(location.href);
  const ref = url.searchParams.get(REF_PARAM);
  if (!ref) return { ref: null, cleanUrl: null };
  storePendingRef(storage, ref);
  url.searchParams.delete(REF_PARAM);
  return { ref, cleanUrl: url.toString() };
}

/**
 * Claim the held custom_id with the caller's session: process_deep_link { custom_id }.
 * `call` is the shell's command call (Api.call): it resolves the OK reply and THROWS on a refusal, with the
 * server's code on `error.code`. Cleared on OK or any REFERRAL_* code; kept on anything else.
 * @param {Storage} storage
 * @param {(command: string, params: object) => Promise<{status: string, code?: string, message?: any}>} call
 * @returns {Promise<{outcome: string, ref: string|null, detail: any}>}
 */
export async function claimPendingRef(storage, call) {
  const ref = storage.getItem(PENDING_REF_KEY);
  if (!ref) return { outcome: CLAIM_OUTCOMES.NONE, ref: null, detail: null };
  let response;
  try {
    response = await call(CLAIM_COMMAND, { custom_id: ref });
  } catch (error) {
    if (isReferralRefusal(error?.code)) {
      storage.removeItem(PENDING_REF_KEY);
      return { outcome: CLAIM_OUTCOMES.REFUSED, ref, detail: error.code };
    }
    return { outcome: CLAIM_OUTCOMES.RETRY, ref, detail: error?.message || String(error) };
  }
  if (response?.status === 'OK') {
    storage.removeItem(PENDING_REF_KEY);
    return { outcome: CLAIM_OUTCOMES.CLAIMED, ref, detail: response.message };
  }
  if (isReferralRefusal(response?.code)) {
    storage.removeItem(PENDING_REF_KEY);
    return { outcome: CLAIM_OUTCOMES.REFUSED, ref, detail: response.code };
  }
  return { outcome: CLAIM_OUTCOMES.RETRY, ref, detail: response?.message ?? null };
}

function isReferralRefusal(code) {
  return typeof code === 'string' && code.startsWith('REFERRAL_');
}
