/**
 * powchBus — the `DeSciX.powch` member of the shell's bus, built from the shell's Powch bridge.
 *
 * Every member delegates to the bridge (postMessage protocol; no Powch internals). Sign-in state
 * is read from the bridge's one owner, `bridge.auth` (../powch/authEvent.js):
 * `isAuthenticated()` / `getAddress()` are its current value and `on('auth', cb)` / `off` subscribe
 * to it.
 *
 * @param {import('../util/PowchBridgeClient.js').PowchBridgeClient} bridge
 */
export function createPowchBus(bridge) {
  if (!bridge?.auth) {
    throw new Error('createPowchBus: the bridge carries no auth event (bridge.auth); DeSciX.powch cannot report sign-in');
  }
  return {
    login: (opts) => bridge.login(opts),
    logout: () => bridge.logout(),
    sign: (data) => bridge.sign(data),
    signTransaction: (tx, address) => bridge.signTransaction(tx, address),
    signMessage: (msg, address) => bridge.signMessage(msg, address),
    signTypedData: (domain, types, value, address) =>
      bridge.signTypedData(domain, types, value, address),
    receive: (params) => bridge.receive(params),
    send: (params) => bridge.send(params),
    open: (opts) => bridge.open(opts),
    isAuthenticated: () => bridge.auth.current.signedIn,
    getAddress: () => bridge.auth.current.address,
    on: (event, cb) => bridge.auth.on(event, cb),
    off: (event, cb) => bridge.auth.off(event, cb),
  };
}
