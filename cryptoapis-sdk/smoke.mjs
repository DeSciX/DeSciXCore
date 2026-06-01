#!/usr/bin/env node
/**
 * cryptoapis-sdk smoke test — verifies the COMPILED dist (dist/api.js) exposes
 * every API class + method the DeSciX_Cloud and DeSciX_Powch consumers import,
 * and that the client reaches the real CryptoAPIs wire.
 *
 * This dist is OpenAPI-generated (typescript-node, generator 7.22.0) from
 * spec/cryptoapis-openapi.json. To regenerate + recompile, see README.md.
 *
 * Run:  npm run smoke    (or: node smoke.mjs)
 * The boot guard in DeSciX_Cloud (assertCryptoApisSdkResolves) enforces the
 * same class list at service startup.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let fail = 0;
const ok = (cond, label) => { console.log((cond ? 'OK   ' : 'FAIL ') + label); if (!cond) fail++; };

const m = require('./dist/api.js');

// The 10 API classes the DeSciX_Cloud boot guard requires (Powch uses a subset of 4).
// Method lists mirror the ACTUAL call sites — class placement matters because the
// generator groups operations by tag.
const callMap = {
    CreateSubscriptionsForApi: ['newConfirmedCoinsTransactions', 'newConfirmedTokensTransactions'],
    ManageSubscriptionsApi: ['deleteBlockchainEventSubscription', 'listBlockchainEventsSubscriptions'],
    ManageAddressesApi: ['syncAddress'],
    AddressLatestEVMApi: ['getAddressBalanceEVM', 'getNextAvailableNonceEVM'],
    AddressHistoryEVMApi: ['listTokensByAddressSyncedEVM'],
    TransactionsDataEVMApi: ['getTransactionDetailsByTransactionHashEVM'],
    HDWalletDataUTXOApi: ['deriveAndSyncNewReceivingAddressesUTXO'],
    AddressLatestUTXOsApi: ['getAddressBalanceUTXOs'],
    BroadcastLocallySignTransactionsApi: ['broadcastLocallySignedTransaction'],
    BlockchainFeesEVMApi: ['estimateContractInteractionGasLimitEVM', 'getEIP1559FeeRecommendationsEVM', 'getFeeRecommendationsEVM']
};

console.log('=== API classes + setApiKey ===');
for (const cls of Object.keys(callMap)) {
    const Ctor = m[cls];
    ok(typeof Ctor === 'function' && typeof Ctor.prototype.setApiKey === 'function', `${cls} (+setApiKey)`);
}

console.log('=== methods (at consumer call sites) ===');
for (const [cls, methods] of Object.entries(callMap)) {
    const Ctor = m[cls];
    for (const meth of methods) {
        ok(Ctor && typeof Ctor.prototype[meth] === 'function', `${cls}.${meth}`);
    }
}

console.log('=== fabricated interim method must be ABSENT ===');
ok(typeof m.TransactionsDataEVMApi?.prototype?.getTransactionDetailsByTransactionID === 'undefined',
    'TransactionsDataEVMApi.getTransactionDetailsByTransactionID is gone');

const wire = async () => {
    // A fake key proves the client REACHES the real CryptoAPIs edge — the exact
    // rejection code varies (401 invalid_api_key, or 403/429 when the edge rate-limits
    // repeated bad-key requests from one IP). Any of these is a positive "wire reached"
    // signal; only a transport-level failure (no HTTP response) is a real failure.
    console.log('=== wire reach (fake key -> expect HTTP rejection from rest.cryptoapis.io) ===');
    const api = new m.TransactionsDataEVMApi();
    api.setApiKey(0, 'fake-key-smoke-test');
    try {
        await api.getTransactionDetailsByTransactionHashEVM('ethereum', 'mainnet', '0x' + '0'.repeat(64));
        ok(false, 'unexpected 2xx with fake key');
    } catch (e) {
        const code = e?.response?.statusCode || e?.statusCode;
        const host = e?.response?.request?.uri?.host || e?.response?.request?.host;
        const reached = host === 'rest.cryptoapis.io' && [401, 403, 429].includes(code);
        ok(reached, `wire reached ${host} -> ${code}${code === 401 ? ' (invalid_api_key)' : ' (edge rejection — still proves reach)'}`);
    }
};

await wire();

console.log(`\n${fail === 0 ? 'SMOKE PASS' : 'SMOKE FAIL'} — failures: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
