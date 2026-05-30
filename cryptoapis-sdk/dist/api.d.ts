/**
 * cryptoapis-sdk — type declarations (COMMITTED build)
 *
 * Minimal types for the 10 CryptoAPIs *Api classes consumed by DeSciX.
 * Responses follow the CryptoAPIs envelope: `{ response, body }` where
 * `body.data.item` (single) or `body.data.items` (collection) carries the payload.
 */

export interface CryptoApisResponse {
  response: any;
  body: {
    apiVersion?: string;
    requestId?: string;
    context?: string;
    data?: {
      item?: any;
      items?: any[];
      limit?: number;
      offset?: number;
      total?: number;
    };
    error?: { code?: string; message?: string };
  };
}

export declare abstract class ApiBase {
  basePath: string;
  defaultHeaders: { [name: string]: string };
  authentications: { ApiKeyAuth: { apiKey: string | null } };
  constructor(basePath?: string);
  /** setApiKey(0, key) — selects the ApiKeyAuth scheme and sets the X-API-Key header. */
  setApiKey(enumIndex: number, value: string): void;
}

export declare class CreateSubscriptionsForApi extends ApiBase {
  newConfirmedCoinsTransactions(blockchain: string, network: string, context: string, body: any): Promise<CryptoApisResponse>;
  newConfirmedTokensTransactions(blockchain: string, network: string, context: string, body: any): Promise<CryptoApisResponse>;
}

export declare class ManageSubscriptionsApi extends ApiBase {
  listBlockchainEventsSubscriptions(blockchain: string, network: string, context?: string, opts?: { limit?: number; offset?: number }): Promise<CryptoApisResponse>;
  deleteBlockchainEventSubscription(blockchain: string, network: string, referenceId: string, context?: string): Promise<CryptoApisResponse>;
}

export declare class ManageAddressesApi extends ApiBase {
  syncAddress(blockchain: string, network: string, context: string, syncAddressRequestBody: any): Promise<CryptoApisResponse>;
}

export declare class AddressLatestEVMApi extends ApiBase {
  getAddressBalanceEVM(blockchain: string, network: string, address: string, context?: string): Promise<CryptoApisResponse>;
  getNextAvailableNonceEVM(blockchain: string, network: string, address: string, context?: string): Promise<CryptoApisResponse>;
}

export declare class AddressHistoryEVMApi extends ApiBase {
  listTokensByAddressSyncedEVM(blockchain: string, network: string, address: string, context?: string, limit?: number, startingAfter?: string): Promise<CryptoApisResponse>;
}

export declare class TransactionsDataEVMApi extends ApiBase {
  getTransactionDetailsByTransactionID(blockchain: string, network: string, transactionId: string, context?: string): Promise<CryptoApisResponse>;
  getTransactionDetailsByTransactionHashEVM(blockchain: string, network: string, transactionHash: string, context?: string): Promise<CryptoApisResponse>;
}

export declare class HDWalletDataUTXOApi extends ApiBase {
  deriveAndSyncNewReceivingAddressesUTXO(blockchain: string, extendedPublicKey: string, network: string, context: string, body: any): Promise<CryptoApisResponse>;
}

export declare class AddressLatestUTXOsApi extends ApiBase {
  getAddressBalanceUTXOs(blockchain: string, network: string, address: string, context?: string): Promise<CryptoApisResponse>;
}

export declare class BroadcastLocallySignTransactionsApi extends ApiBase {
  broadcastLocallySignedTransaction(blockchain: string, network: string, context: string, body: any): Promise<CryptoApisResponse>;
}

export declare class BlockchainFeesEVMApi extends ApiBase {
  getFeeRecommendationsEVM(blockchain: string, network: string, context?: string): Promise<CryptoApisResponse>;
  getEIP1559FeeRecommendationsEVM(network: string, blockchain: string, context?: string): Promise<CryptoApisResponse>;
  estimateContractInteractionGasLimitEVM(blockchain: string, network: string, context: string, body: any): Promise<CryptoApisResponse>;
}

export declare const DEFAULT_BASE_PATH: string;
