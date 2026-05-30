// cryptoapis-sdk smoke test (no network).
// Verifies all 10 *Api classes import, instantiate, and setApiKey(0,key) works.
// Run: node dist/smoke.mjs   (from the package root)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sdk = require(path.join(__dirname, 'api.js'));

const expected = [
  'CreateSubscriptionsForApi', 'ManageSubscriptionsApi', 'ManageAddressesApi',
  'AddressLatestEVMApi', 'AddressHistoryEVMApi', 'TransactionsDataEVMApi',
  'HDWalletDataUTXOApi', 'AddressLatestUTXOsApi', 'BroadcastLocallySignTransactionsApi',
  'BlockchainFeesEVMApi'
];

const methodsByClass = {
  CreateSubscriptionsForApi: ['newConfirmedCoinsTransactions', 'newConfirmedTokensTransactions'],
  ManageSubscriptionsApi: ['listBlockchainEventsSubscriptions', 'deleteBlockchainEventSubscription'],
  ManageAddressesApi: ['syncAddress'],
  AddressLatestEVMApi: ['getAddressBalanceEVM', 'getNextAvailableNonceEVM'],
  AddressHistoryEVMApi: ['listTokensByAddressSyncedEVM'],
  TransactionsDataEVMApi: ['getTransactionDetailsByTransactionID', 'getTransactionDetailsByTransactionHashEVM'],
  HDWalletDataUTXOApi: ['deriveAndSyncNewReceivingAddressesUTXO'],
  AddressLatestUTXOsApi: ['getAddressBalanceUTXOs'],
  BroadcastLocallySignTransactionsApi: ['broadcastLocallySignedTransaction'],
  BlockchainFeesEVMApi: ['getFeeRecommendationsEVM', 'getEIP1559FeeRecommendationsEVM', 'estimateContractInteractionGasLimitEVM']
};

let ok = true;
for (const name of expected) {
  const Cls = sdk[name];
  if (typeof Cls !== 'function') { console.log('MISSING class export:', name); ok = false; continue; }
  const inst = new Cls();
  inst.setApiKey(0, 'smoke-key');
  if (inst.authentications.ApiKeyAuth.apiKey !== 'smoke-key') { console.log('setApiKey failed:', name); ok = false; }
  for (const m of methodsByClass[name]) {
    if (typeof inst[m] !== 'function') { console.log(`MISSING method ${name}.${m}`); ok = false; }
  }
  console.log('OK', name, '(' + methodsByClass[name].length + ' methods) — basePath:', inst.basePath);
}
console.log(ok ? '\nSMOKE PASS: 10/10 classes, all methods present, setApiKey OK' : '\nSMOKE FAIL');
process.exit(ok ? 0 : 1);
