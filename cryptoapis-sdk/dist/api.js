'use strict';
/**
 * cryptoapis-sdk — generated client surface (COMMITTED build)
 * ----------------------------------------------------------------------------
 * Entry point: `main` = dist/api.js (see package.json).
 *
 * Implements the 10 CryptoAPIs *Api classes consumed by DeSciX
 * (DeSciX_Cloud/microservice/services/cryptoApisSdkService.js and
 *  DeSciX_Powch/microservice/src/cryptoApisService.js). Each method's
 * argument order, the `setApiKey(0, key)` auth call, and the
 * `result.body.data.item(s)` return envelope match the official
 * OpenAPI-generated SDK so the consuming services require no changes.
 *
 * Endpoint URL templates are sourced from the CryptoAPIs `/info` route map
 * (captured live 2026-04-20, see docs/design/ws-admin-b1-cryptoapis-live-verification.md)
 * and the path map documented inline in the consuming services.
 *
 * To refresh from the upstream OpenAPI spec, see README →
 * "Regenerating from the OpenAPI spec".
 */

const { ApiBase, DEFAULT_BASE_PATH } = require('./http.js');

// ============================================================================
// Subscriptions / webhooks
// ============================================================================

class CreateSubscriptionsForApi extends ApiBase {
    /**
     * POST /blockchain-events/{blockchain}/{network}/subscriptions/coins-transactions-confirmed
     */
    newConfirmedCoinsTransactions(blockchain, network, context, body) {
        return this._request(
            'POST',
            '/blockchain-events/{blockchain}/{network}/subscriptions/coins-transactions-confirmed',
            { blockchain, network },
            { context, body }
        );
    }

    /**
     * POST /blockchain-events/{blockchain}/{network}/subscriptions/tokens-transfers-confirmed
     */
    newConfirmedTokensTransactions(blockchain, network, context, body) {
        return this._request(
            'POST',
            '/blockchain-events/{blockchain}/{network}/subscriptions/tokens-transfers-confirmed',
            { blockchain, network },
            { context, body }
        );
    }
}

class ManageSubscriptionsApi extends ApiBase {
    /**
     * GET /blockchain-events/{blockchain}/{network}/subscriptions
     * @param {string} context  optional context
     * @param {Object} opts  { limit, offset }
     */
    listBlockchainEventsSubscriptions(blockchain, network, context, opts) {
        opts = opts || {};
        return this._request(
            'GET',
            '/blockchain-events/{blockchain}/{network}/subscriptions',
            { blockchain, network },
            { context, query: { limit: opts.limit, offset: opts.offset } }
        );
    }

    /**
     * DELETE /blockchain-events/{blockchain}/{network}/subscriptions/{referenceId}
     */
    deleteBlockchainEventSubscription(blockchain, network, referenceId, context) {
        return this._request(
            'DELETE',
            '/blockchain-events/{blockchain}/{network}/subscriptions/{referenceId}',
            { blockchain, network, referenceId },
            { context }
        );
    }
}

// ============================================================================
// Address management (sync)
// ============================================================================

class ManageAddressesApi extends ApiBase {
    /**
     * POST /blockchain-data/{blockchain}/{network}/addresses/sync
     * @param {string} context
     * @param {Object} syncAddressRequestBody  { context, data: { item: { address } } }
     */
    syncAddress(blockchain, network, context, syncAddressRequestBody) {
        return this._request(
            'POST',
            '/blockchain-data/{blockchain}/{network}/addresses/sync',
            { blockchain, network },
            { context, body: syncAddressRequestBody }
        );
    }
}

// ============================================================================
// EVM — latest address state (balance, nonce)
// ============================================================================

class AddressLatestEVMApi extends ApiBase {
    /**
     * GET /addresses-latest/evm/{blockchain}/{network}/{address}/balance
     */
    getAddressBalanceEVM(blockchain, network, address, context) {
        return this._request(
            'GET',
            '/addresses-latest/evm/{blockchain}/{network}/{address}/balance',
            { blockchain, network, address },
            { context }
        );
    }

    /**
     * GET /addresses-latest/evm/{blockchain}/{network}/{address}/next-available-nonce
     */
    getNextAvailableNonceEVM(blockchain, network, address, context) {
        return this._request(
            'GET',
            '/addresses-latest/evm/{blockchain}/{network}/{address}/next-available-nonce',
            { blockchain, network, address },
            { context }
        );
    }
}

// ============================================================================
// EVM — address history (synced token holdings)
// ============================================================================

class AddressHistoryEVMApi extends ApiBase {
    /**
     * GET /addresses-historical/evm/{blockchain}/{network}/{address}/tokens
     * (List Tokens By Address — Synced)
     * @param {string} context
     * @param {number} limit
     * @param {string} startingAfter  cursor for pagination
     */
    listTokensByAddressSyncedEVM(blockchain, network, address, context, limit, startingAfter) {
        return this._request(
            'GET',
            '/addresses-historical/evm/{blockchain}/{network}/{address}/tokens',
            { blockchain, network, address },
            { context, query: { limit, startingAfter } }
        );
    }
}

// ============================================================================
// EVM — transactions data
// ============================================================================

class TransactionsDataEVMApi extends ApiBase {
    /**
     * GET /blockchain-data/{blockchain}/{network}/transactions/transactionId/{transactionId}
     */
    getTransactionDetailsByTransactionID(blockchain, network, transactionId, context) {
        return this._request(
            'GET',
            '/blockchain-data/{blockchain}/{network}/transactions/transactionId/{transactionId}',
            { blockchain, network, transactionId },
            { context }
        );
    }

    /**
     * GET /transactions/evm/{blockchain}/{network}/{transactionHash}
     */
    getTransactionDetailsByTransactionHashEVM(blockchain, network, transactionHash, context) {
        return this._request(
            'GET',
            '/transactions/evm/{blockchain}/{network}/{transactionHash}',
            { blockchain, network, transactionHash },
            { context }
        );
    }
}

// ============================================================================
// UTXO — HD wallet (derive + sync receiving addresses)
// ============================================================================

class HDWalletDataUTXOApi extends ApiBase {
    /**
     * POST /hd-wallets/utxo/{blockchain}/{extendedPublicKey}/{network}/derive-and-sync
     * (Derive And Sync New Receiving Addresses)
     * @param {string} blockchain
     * @param {string} extendedPublicKey  the xpub
     * @param {string} network
     * @param {string} context
     * @param {Object} body  { context, data: { item: { addressesCount } } }
     */
    deriveAndSyncNewReceivingAddressesUTXO(blockchain, extendedPublicKey, network, context, body) {
        return this._request(
            'POST',
            '/hd-wallets/utxo/{blockchain}/{extendedPublicKey}/{network}/derive-and-sync',
            { blockchain, extendedPublicKey, network },
            { context, body }
        );
    }
}

// ============================================================================
// UTXO — latest address state (balance)
// ============================================================================

class AddressLatestUTXOsApi extends ApiBase {
    /**
     * GET /addresses-latest/utxo/{blockchain}/{network}/{address}/balance
     */
    getAddressBalanceUTXOs(blockchain, network, address, context) {
        return this._request(
            'GET',
            '/addresses-latest/utxo/{blockchain}/{network}/{address}/balance',
            { blockchain, network, address },
            { context }
        );
    }
}

// ============================================================================
// Broadcast — locally-signed transactions
// ============================================================================

class BroadcastLocallySignTransactionsApi extends ApiBase {
    /**
     * POST /broadcast-transactions/{blockchain}/{network}
     * @param {string} context
     * @param {Object} body  { context, data: { item: { signedTransactionHex } } }
     */
    broadcastLocallySignedTransaction(blockchain, network, context, body) {
        return this._request(
            'POST',
            '/broadcast-transactions/{blockchain}/{network}',
            { blockchain, network },
            { context, body }
        );
    }
}

// ============================================================================
// EVM — blockchain fees (mempool, EIP-1559, gas estimate)
// ============================================================================

class BlockchainFeesEVMApi extends ApiBase {
    /**
     * GET /blockchain-fees/evm/{blockchain}/{network}/mempool
     */
    getFeeRecommendationsEVM(blockchain, network, context) {
        return this._request(
            'GET',
            '/blockchain-fees/evm/{blockchain}/{network}/mempool',
            { blockchain, network },
            { context }
        );
    }

    /**
     * GET /blockchain-fees/evm/{blockchain}/{network}/eip-1559
     * NOTE: the official SDK argument order for this method is (network, blockchain).
     * The two consuming services both call `getEIP1559FeeRecommendationsEVM(network, blockchain)`.
     */
    getEIP1559FeeRecommendationsEVM(network, blockchain, context) {
        return this._request(
            'GET',
            '/blockchain-fees/evm/{blockchain}/{network}/eip-1559',
            { blockchain, network },
            { context }
        );
    }

    /**
     * POST /blockchain-fees/evm/{blockchain}/{network}/estimate-contract-interaction-gas-limit
     * @param {string} context
     * @param {Object} body  { context, data: { item: { sender, recipient, amount, inputData } } }
     */
    estimateContractInteractionGasLimitEVM(blockchain, network, context, body) {
        return this._request(
            'POST',
            '/blockchain-fees/evm/{blockchain}/{network}/estimate-contract-interaction-gas-limit',
            { blockchain, network },
            { context, body }
        );
    }
}

module.exports = {
    DEFAULT_BASE_PATH,
    CreateSubscriptionsForApi,
    ManageSubscriptionsApi,
    ManageAddressesApi,
    AddressLatestEVMApi,
    AddressHistoryEVMApi,
    TransactionsDataEVMApi,
    HDWalletDataUTXOApi,
    AddressLatestUTXOsApi,
    BroadcastLocallySignTransactionsApi,
    BlockchainFeesEVMApi
};
