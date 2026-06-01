# cryptoapis-sdk

In-repo client for the **CryptoAPIs v2** REST API. CryptoAPIs is DeSciX's critical
cross-chain infrastructure — it consolidates Bitcoin / Dogecoin / Solana / UTXO + multi-EVM
money movement (balances, deposit-address derivation, webhooks, tx-status, broadcast,
fee/gas estimation) behind ONE API. **ethers / direct RPC is EVM-only and CANNOT replace
it.** See `V2_docs/architecture/platform-must-know-briefer.md` §2.5.1 (CEO-D-2026-05-30-CRYPTOAPIS-IS-CRITICAL-KEEP-AND-FIX).

## This is a GENERATED, COMMITTED build — byte-reproducible from spec + command

This client is **true OpenAPI Generator output** (`typescript-node` profile), produced from
the committed spec (`spec/cryptoapis-openapi.json`, version `2024-12-12`). Both the generator
source (`api.ts`, `api/`, `model/`, `tsconfig.json`, `package.json`) **and** the compiled
`dist/` are committed to the repo (the repo-wide `.gitignore` `**/dist` exclusion is overridden
via `git add -f` for this package). This is the durable fix for the recurring SDK-link drift
(CEO-D-2026-06-01-CRYPTOAPIS-REGEN-RECONCILE-APPROVED): the artifact is **byte-reproducible**
from `spec/` + the pinned regen command, and `main` (`dist/api.js`) resolves with **zero
build-time dependency** at install. Consumers depend on it via a `file:` path
(`file:../../DeSciX_Core/cryptoapis-sdk`) — **never** `npm link` it to a personal path.

- **Entry point:** `dist/api.js` (`main`), `dist/api.d.ts` (`types`) — compiled by `tsc`
  (`npm run build`) from the generated TypeScript source at the package root.
- **HTTP transport:** generated `request` + `bluebird` runtime (the `typescript-node` profile
  runtime). These two runtime deps are pulled by `npm install` from `package.json` during the
  Cloud Run Docker build.
- **Base URL:** `https://rest.cryptoapis.io` (from the spec `servers[0]`; no `/v2` suffix).
- **Auth:** `setApiKey(0, key)` -> `x-api-key: <key>` header (single api-key security scheme;
  index `0` selects it, matching the generated `ApiKeyAuth`).
- **Response envelope:** every call resolves to `{ response, body }`; the payload is at
  `body.data.item` (single) or `body.data.items` (collection).

## API surface

The full generated client exposes 44 `*Api` classes (the entire CryptoAPIs Unified-Endpoints
surface). DeSciX consumes exactly the 10 listed below
(`DeSciX_Cloud/microservice/services/cryptoApisSdkService.js` and
`DeSciX_Powch/microservice/src/cryptoApisService.js`), enforced by the boot guard
`assertCryptoApisSdkResolves()` and `smoke.mjs`. Adding new endpoints is a deliberate refresh
(see below), not an ad-hoc edit.

| Class | Methods | Endpoint(s) |
|---|---|---|
| `CreateSubscriptionsForApi` | `newConfirmedCoinsTransactions`, `newConfirmedTokensTransactions` | `POST /blockchain-events/{blockchain}/{network}/subscriptions/{coins-transactions-confirmed,tokens-transfers-confirmed}` |
| `ManageSubscriptionsApi` | `listBlockchainEventsSubscriptions`, `deleteBlockchainEventSubscription` | `GET`/`DELETE /blockchain-events/{blockchain}/{network}/subscriptions[/{referenceId}]` |
| `ManageAddressesApi` | `syncAddress` | `POST /blockchain-data/{blockchain}/{network}/addresses/sync` |
| `AddressLatestEVMApi` | `getAddressBalanceEVM`, `getNextAvailableNonceEVM` | `GET /addresses-latest/evm/{blockchain}/{network}/{address}/{balance,next-available-nonce}` |
| `AddressHistoryEVMApi` | `listTokensByAddressSyncedEVM` | `GET /addresses-historical/evm/{blockchain}/{network}/{address}/tokens` |
| `TransactionsDataEVMApi` | `getTransactionDetailsByTransactionHashEVM` | `GET /transactions/evm/{blockchain}/{network}/{transactionHash}` |
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
| Generator version | `7.22.0` (pinned via `OPENAPI_GENERATOR_VERSION` + `openapitools.json`) |
| Base URL | `https://rest.cryptoapis.io` (spec `servers[0]`) |
| Spec source | https://developers.cryptoapis.io/download/175 (no portal login), committed at `spec/cryptoapis-openapi.json` |
| Client build | true OpenAPI Generator output, committed (regen branch `ws-cryptoapis-regen`, 2026-06-01) |

## Regenerating from the OpenAPI spec (byte-reproducible)

The committed `dist/` + generated source are reproducible from the committed spec with the
**exact** command below. The spec itself is committed at `spec/cryptoapis-openapi.json` so the
source is never lost again (the root cause of the prior drift). To refresh on an upstream bump,
re-download the spec from https://developers.cryptoapis.io/download/175, replace `spec/`, and
re-run:

```bash
# JDK 11 is required by the generator JAR. On macOS:
export JAVA_HOME=/opt/homebrew/opt/openjdk@11
export PATH="$JAVA_HOME/bin:$PATH"

cd DeSciX_Core/cryptoapis-sdk

# 1. Generate the typescript-node client (source) from the committed spec.
#    OPENAPI_GENERATOR_VERSION pins the generator JAR (NOT an npm tag — @...@7.22.0 does
#    not exist on npm). --skip-validate-spec is REQUIRED: the spec carries non-standard
#    schemas.max attrs on ~15 limit params and a duplicate "Transactions Data" tag that
#    hard-fail strict validation but are otherwise harmless.
OPENAPI_GENERATOR_VERSION=7.22.0 npx --yes @openapitools/openapi-generator-cli generate \
  -i spec/cryptoapis-openapi.json -g typescript-node -o . \
  --skip-validate-spec --additional-properties=supportsES6=false,npmName=cryptoapis-sdk

# 2. Compile TypeScript source -> dist/ (the consumer imports dist/api.js).
npm install
npm run build

# 3. Verify the 10 consumed classes + their methods resolve and the wire reaches CryptoAPIs.
npm run smoke

# 4. COMMIT spec + generated source + compiled dist (force; **/dist is gitignored):
git add -f dist/
git add spec/ api/ model/ api.ts tsconfig.json package.json package-lock.json
```

`openapitools.json` (committed) pins the generator-cli wrapper version. The compiled `dist/`
omits `.map` sourcemaps (build-artifact trimming; `tsconfig.json` is left verbatim).

## Verifying

```bash
# Smoke (resolution + wire reach): all 10 consumed classes import + instantiate + setApiKey,
# every consumed method resolves at its call-site class, the fabricated interim method is gone,
# and a fake key reaches rest.cryptoapis.io -> 401.
cd DeSciX_Core/cryptoapis-sdk && npm run smoke

# Live (network + real key): exercised through the Cloud microservice path —
# see DeSciX_Cloud/microservice/admin/tests/cryptoApisIsolatedTest.js
```

> **Subscription-plan note:** some endpoints return HTTP `400 uri_not_found` when the API
> key's CryptoAPIs subscription plan does not cover them (auth still succeeds — a bad key
> returns `401 invalid_api_key`). A live `uri_not_found` is a plan/billing issue, not a
> client bug. See `docs/design/ws-admin-b1-cryptoapis-live-verification.md`.
