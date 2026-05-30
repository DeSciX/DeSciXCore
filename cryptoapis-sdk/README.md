# cryptoapis-sdk

In-repo client for the **CryptoAPIs v2** REST API. CryptoAPIs is DeSciX's critical
cross-chain infrastructure — it consolidates Bitcoin / Dogecoin / Solana / UTXO + multi-EVM
money movement (balances, deposit-address derivation, webhooks, tx-status, broadcast,
fee/gas estimation) behind ONE API. **ethers / direct RPC is EVM-only and CANNOT replace
it.** See `V2_docs/architecture/platform-must-know-briefer.md` §2.5.1 (CEO-D-2026-05-30-CRYPTOAPIS-IS-CRITICAL-KEEP-AND-FIX).

## This is a COMMITTED build — no build step, no per-developer path

The generated client lives in `dist/` and **is committed to the repo** (the repo-wide
`.gitignore` `**/dist` exclusion is overridden via `git add -f` for this package).
This is the durable fix for the recurring SDK-link drift
(CEO-D-2026-05-30-CRYPTOAPIS-SDK-REGEN-COMMITTED): `main` (`dist/api.js`) resolves with
**zero build-time dependency**. Consumers depend on it via a `file:` path
(`file:../../DeSciX_Core/cryptoapis-sdk`) — **never** `npm link` it to a personal path.

- **Entry point:** `dist/api.js` (`main`), `dist/api.d.ts` (`types`)
- **HTTP transport:** `dist/http.js` — uses the bundled `request` + `bluebird` runtime
  deps (the OpenAPI Generator `typescript-node` profile runtime). These two deps are
  pulled by `npm install` from `package.json` during the Cloud Run Docker build; they are
  NOT committed (only `dist/` is).
- **Base URL:** `https://rest.cryptoapis.io/v2`
- **Auth:** `setApiKey(0, key)` -> `X-API-Key: <key>` header (single api-key security scheme;
  index `0` selects it, matching the official SDK signature).
- **Response envelope:** every call resolves to `{ response, body }`; the payload is at
  `body.data.item` (single) or `body.data.items` (collection).

## API surface

The client implements exactly the 10 `*Api` classes DeSciX consumes
(`DeSciX_Cloud/microservice/services/cryptoApisSdkService.js` and
`DeSciX_Powch/microservice/src/cryptoApisService.js`). Adding new endpoints is a
deliberate refresh (see below), not an ad-hoc edit.

| Class | Methods | Endpoint(s) |
|---|---|---|
| `CreateSubscriptionsForApi` | `newConfirmedCoinsTransactions`, `newConfirmedTokensTransactions` | `POST /blockchain-events/{blockchain}/{network}/subscriptions/{coins-transactions-confirmed,tokens-transfers-confirmed}` |
| `ManageSubscriptionsApi` | `listBlockchainEventsSubscriptions`, `deleteBlockchainEventSubscription` | `GET`/`DELETE /blockchain-events/{blockchain}/{network}/subscriptions[/{referenceId}]` |
| `ManageAddressesApi` | `syncAddress` | `POST /blockchain-data/{blockchain}/{network}/addresses/sync` |
| `AddressLatestEVMApi` | `getAddressBalanceEVM`, `getNextAvailableNonceEVM` | `GET /addresses-latest/evm/{blockchain}/{network}/{address}/{balance,next-available-nonce}` |
| `AddressHistoryEVMApi` | `listTokensByAddressSyncedEVM` | `GET /addresses-historical/evm/{blockchain}/{network}/{address}/tokens` |
| `TransactionsDataEVMApi` | `getTransactionDetailsByTransactionID`, `getTransactionDetailsByTransactionHashEVM` | `GET /blockchain-data/.../transactions/transactionId/{id}`, `GET /transactions/evm/{blockchain}/{network}/{hash}` |
| `HDWalletDataUTXOApi` | `deriveAndSyncNewReceivingAddressesUTXO` | `POST /hd-wallets/utxo/{blockchain}/{xpub}/{network}/derive-and-sync` |
| `AddressLatestUTXOsApi` | `getAddressBalanceUTXOs` | `GET /addresses-latest/utxo/{blockchain}/{network}/{address}/balance` |
| `BroadcastLocallySignTransactionsApi` | `broadcastLocallySignedTransaction` | `POST /broadcast-transactions/{blockchain}/{network}` |
| `BlockchainFeesEVMApi` | `getFeeRecommendationsEVM`, `getEIP1559FeeRecommendationsEVM`, `estimateContractInteractionGasLimitEVM` | `GET /blockchain-fees/evm/{blockchain}/{network}/{mempool,eip-1559}`, `POST .../estimate-contract-interaction-gas-limit` |

> `getEIP1559FeeRecommendationsEVM(network, blockchain, ...)` takes its first two args in
> `(network, blockchain)` order to match the official SDK and both call sites.

## Pinned upstream

| Field | Value |
|---|---|
| API product | CryptoAPIs **Unified Endpoints / Blockchain Data v2** |
| API version header | `2024-12-12` (returned by live `/info`, verified 2026-04-20) |
| Generator profile | OpenAPI Generator `typescript-node` (`request` + `bluebird` runtime) |
| Base URL | `https://rest.cryptoapis.io/v2` |
| Client build | hand-maintained committed `dist/` (2026-05-30) — see note below |

**Why hand-maintained, not raw generator output (2026-05-30):** the upstream `typescript-node`
SDK build with these exact class names is no longer published on CryptoAPIs' public GitHub
(the surviving archived `Crypto_APIs_2.0_SDK_Node.js` uses a different `superagent` profile and
lacks 8/10 of the classes DeSciX uses), the full OpenAPI spec is gated behind the CryptoAPIs
developer portal, and `openapi-generator` requires a Java runtime not present in the deploy
environment. The committed `dist/` is therefore a faithful, minimal re-implementation of the
generator's `typescript-node` runtime + the 10 used classes — identical call surface, auth
model, and response envelope, so consuming services need zero changes. Endpoint URL templates
are sourced from the live CryptoAPIs `/info` route map
(`docs/design/ws-admin-b1-cryptoapis-live-verification.md`).

## Regenerating from the OpenAPI spec (deliberate refresh)

When the org needs additional endpoints or an upstream spec bump:

1. **Obtain the spec.** Export the OpenAPI 3 spec from the CryptoAPIs developer portal
   (https://developers.cryptoapis.io) for the **Unified Endpoints / Blockchain Data** product,
   or request it from CryptoAPIs support. Save it as `spec/cryptoapis-openapi.yaml` in this
   package and commit it (so the source is never lost again — the root cause of the prior drift).
2. **Install the generator** (needs a JDK):
   ```bash
   npm install -g @openapitools/openapi-generator-cli
   ```
3. **Generate the `typescript-node` client** into `dist/`:
   ```bash
   cd DeSciX_Core/cryptoapis-sdk
   openapi-generator-cli generate \
     -i spec/cryptoapis-openapi.yaml \
     -g typescript-node \
     -o dist \
     --additional-properties=supportsES6=false,npmName=cryptoapis-sdk
   # the typescript-node profile emits dist/api.js + dist/api.d.ts and uses request+bluebird
   ```
4. **Verify the call surface** still matches both consumers (the 10 `*Api` classes + their
   method names/arg order). Run the smoke + live verification (below).
5. **COMMIT the regenerated `dist/`** (force, since `**/dist` is gitignored):
   ```bash
   git add -f dist/
   ```

## Verifying

```bash
# Smoke (no network): all 10 classes import + instantiate + setApiKey works
cd DeSciX_Core/cryptoapis-sdk && node dist/smoke.mjs

# Live (network + real key): exercised through the Cloud microservice path —
# see DeSciX_Cloud/microservice/admin/tests/cryptoApisIsolatedTest.js
```

> **Subscription-plan note:** some endpoints return HTTP `400 uri_not_found` when the API
> key's CryptoAPIs subscription plan does not cover them (auth still succeeds — a bad key
> returns `401 invalid_api_key`). A live `uri_not_found` is a plan/billing issue, not a
> client bug. See `docs/design/ws-admin-b1-cryptoapis-live-verification.md`.
