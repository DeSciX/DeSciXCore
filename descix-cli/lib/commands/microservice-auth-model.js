/**
 * ONE OWNER for how an app microservice authenticates, as the CLI states it.
 *
 * CEO-D-2026-06-02-APP-DATA-PLANE: an app microservice writes on the INJECTED CALLER auth
 * (`params._descix`) with per-app_id isolation, never a per-service delegate SERVICE_KEY.
 * `descix microservice register-delegate`, which provisioned that key, is deleted; its name is
 * refused here and nowhere else, and `microservice register --help` prints the same text.
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

/**
 * Register the removed `register-delegate` name so every invocation exits non-zero naming the
 * auth model. Hidden from --help; accepts and ignores the old options so an old script fails
 * with this message rather than a commander parse error. helpOption(false) keeps `--help` from
 * exiting 0 before the action runs.
 *
 * @param {import('commander').Command} microserviceCommand
 * @param {(error: Error) => never} fail
 */
export function registerRemovedRegisterDelegate(microserviceCommand, fail) {
  return microserviceCommand
    .command('register-delegate', { hidden: true })
    .description('removed — see error text')
    .allowUnknownOption(true)
    .helpOption(false)
    .argument('[args...]', 'ignored')
    .action(() => {
      fail(new Error(
        '"descix microservice register-delegate" has been removed: there is no per-app microservice ' +
        'delegate key.\n' + MICROSERVICE_AUTH_MODEL
      ));
    });
}
