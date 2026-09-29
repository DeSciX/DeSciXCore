/**
 * ONE OWNER for how an app microservice authenticates, as the CLI states it.
 *
 * CEO-D-2026-06-02-APP-DATA-PLANE: an app microservice writes on the INJECTED CALLER auth
 * (`params._descix`) with per-app_id isolation, never a per-service delegate key.
 * `microservice register --help` prints this text, and the retired delegate-key verb's refusal
 * (lib/commands/retired-verbs.js) prints it too.
 */

export const MICROSERVICE_AUTH_RULING = 'CEO-D-2026-06-02-APP-DATA-PLANE';

/** The auth model, printed after `microservice register --help` and in the refusal. */
export const MICROSERVICE_AUTH_MODEL =
  `A microservice is issued no key of its own (${MICROSERVICE_AUTH_RULING}).\n` +
  `  Inbound:  /apifront forwards each call with the caller's identity injected as params._descix,\n` +
  `            isolated per app_id. Your handler acts on that caller.\n` +
  `  Outbound: calls from your service to /apifront authenticate as the developer through\n` +
  `            @descix/cli createServiceApiClient (DEVELOPER_WALLET_ADDRESS + DEVELOPER_SIGNATURE).\n` +
  `  HTTP 401 on an outbound call: those two developer-credential values are missing or wrong.`;
