/**
 * The DeSciX sign-in request a host sends Powch: the session and nothing else.
 *
 * It names no field (no `require`), so Powch shares no personal data with the host. Powch
 * registers the account's verified email and master wallet with DeSciX itself at ToS
 * acceptance. The session it hands the host carries no email; the signed-in account (id,
 * email, username, wallet_address, base_folder_id) is validate_session's `account`.
 * `registerDeSciX: true` routes the bridge as POWCH_LOGIN (PowchBridgeClient.request) and
 * makes Powch complete the DeSciX sign-in before it resolves.
 */
const PURPOSE = 'Sign in to DeSciX';

export function descixSessionRequest() {
  return { purpose: PURPOSE, registerDeSciX: true };
}
