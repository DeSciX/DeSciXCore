/**
 * Settles a Powch submit answer: only a confirmed transaction is a success.
 *
 * The Powch service answers `submit_transaction` and `submit_meta_transaction` with 200 for three
 * outcomes (the Powch submit-answer contract): `confirmed`, `failed` (mined and
 * reverted) and `pending` (accepted, not mined before Powch's deadline). Cloud's /apifront ferries
 * a 200 as `{ status: 'OK', message: <body> }`. This resolves with that answer only for
 * `message.status === 'confirmed'`; every other status rejects through the one refusal owner
 * (./requestError.js) with `err.data.tx_hash`. A non-2xx never reaches here: the shell's `Api.call`
 * already rejected it with `status`, `code` and `data`.
 */
import { powchRequestError } from './requestError.js';

const NOT_CONFIRMED = {
  failed: {
    code: 'TX_FAILED',
    error: 'The transaction was mined and reverted: the gas was spent and nothing else happened.',
  },
  pending: {
    code: 'TX_PENDING',
    error: 'The network accepted the transaction and it was not mined before Powch answered: poll err.data.tx_hash with get_transaction_receipt.',
  },
};

/**
 * @param {{ status: 'OK', message?: { status?: unknown, txHash?: string } }} answer - what `Api.call` resolved with
 * @returns {object} the answer, when the transaction is confirmed
 * @throws {Error} `TX_FAILED`, `TX_PENDING`, or `TX_ANSWER_UNRECOGNIZED` for any other status
 */
export function settleSubmitAnswer(answer) {
  const body = answer?.message;
  const status = body?.status;
  if (status === 'confirmed') return answer;
  const refusal = Object.hasOwn(NOT_CONFIRMED, status)
    ? NOT_CONFIRMED[status]
    : {
        code: 'TX_ANSWER_UNRECOGNIZED',
        error: `Powch answered the submit with status ${JSON.stringify(status)}, which is not confirmed, failed or pending: the outcome is unknown; look up err.data.tx_hash before signing again.`,
      };
  const err = powchRequestError(refusal);
  err.data = { tx_hash: body?.txHash ?? null };
  throw err;
}
