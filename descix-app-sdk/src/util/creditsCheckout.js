/**
 * creditsCheckout — the one owner of an SDK component's AI-credits purchase.
 *
 * Buying is Powch's checkout ceremony: `create_checkout_session` is a Powch command that /apifront
 * proxies under the caller's identity; it returns a Stripe Checkout `url`, and the purchase settles
 * into the ledger when Powch confirms payment. The Powch Buy menu makes the same call.
 *
 * The amounts on offer are Cloud's: the ai_credits bundles of get_credit_balance.purchase_catalogue.
 * The SDK keeps no list of its own.
 */
import { makeCommandRequestJSON } from './AppData.jsx';

const AI_CREDITS = 'ai_credits';

/**
 * The listed ai_credits bundle amounts (USD) from a get_credit_balance bag.
 * @returns {number[]|null} null when the bag lists none — there is nothing to offer, and no fallback list.
 */
export function creditBundleAmounts(balance) {
  const catalogue = balance?.purchase_catalogue;
  const entry = Array.isArray(catalogue) ? catalogue.find((p) => p?.purchase_type === AI_CREDITS) : null;
  return Array.isArray(entry?.bundles) && entry.bundles.length ? entry.bundles.map((b) => b.amount_usd) : null;
}

/**
 * Start a checkout for one listed ai_credits bundle.
 * @param {number} amountUsd - a listed bundle amount
 * @returns {Promise<{session_id: string, url: string}>} the session; open `url` to pay
 */
export async function startCreditsCheckout(amountUsd) {
  const res = await makeCommandRequestJSON('create_checkout_session', { purchase_type: AI_CREDITS, amount_usd: amountUsd });
  const session = res?.message ?? res;
  if (!session?.url) {
    throw new Error(`create_checkout_session returned no checkout url (response keys: ${Object.keys(session || {}).join(', ') || 'none'})`);
  }
  return session;
}
