/**
 * The Error a refused Powch request rejects with — the one shape for both clients
 * (util/PowchBridgeClient.js, powch/PowchClient.js).
 *
 * Powch's reply is `{ type, requestId, success: false, error, code }`: `error` is the text, `code`
 * the machine-readable refusal (USER_CANCELLED, FLOW_STILL_RUNNING, NETWORK_TIMEOUT, ...; null when
 * there is none). The text is kept as the message; the code rides on `err.code` so a caller
 * branches on it rather than on the wording.
 * @param {{ error?: string, code?: unknown }} data - the POWCH_RESPONSE
 * @returns {Error}
 */
export function powchRequestError(data) {
  const err = new Error(data?.error || 'Request failed');
  if (typeof data?.code === 'string' && data.code) err.code = data.code;
  return err;
}
