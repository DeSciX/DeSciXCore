import http from 'http';
import { GetTransactionDetailsByTransactionHashEVMR } from '../model/getTransactionDetailsByTransactionHashEVMR';
import { ListInternalTransactionDetailsByTransactionHashEVMR } from '../model/listInternalTransactionDetailsByTransactionHashEVMR';
import { ListLogsByTransactionHashEVMR } from '../model/listLogsByTransactionHashEVMR';
import { ListTokensTransfersByTransactionHashEVMR } from '../model/listTokensTransfersByTransactionHashEVMR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum TransactionsDataEVMApiApiKeys {
    ApiKey = 0
}
export declare class TransactionsDataEVMApi {
    protected _basePath: string;
    protected _defaultHeaders: any;
    protected _useQuerystring: boolean;
    protected authentications: {
        default: Authentication;
        ApiKey: ApiKeyAuth;
    };
    protected interceptors: Interceptor[];
    constructor(basePath?: string);
    set useQuerystring(value: boolean);
    set basePath(basePath: string);
    set defaultHeaders(defaultHeaders: any);
    get defaultHeaders(): any;
    get basePath(): string;
    setDefaultAuthentication(auth: Authentication): void;
    setApiKey(key: TransactionsDataEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTransactionDetailsByTransactionHashEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'avalanche' | 'arbitrum' | 'base' | 'optimism' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'amoy' | 'fuji' | 'nile', transactionHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTransactionDetailsByTransactionHashEVMR;
    }>;
    listInternalTransactionDetailsByTransactionHashEVM(blockchain: 'ethereum' | 'binance-smart-chain' | 'ethereum-classic' | 'polygon' | 'optimism' | 'arbitrum' | 'base' | 'avalanche' | 'tron', network: 'mainnet' | 'testnet' | 'mordor' | 'sepolia' | 'amoy' | 'fuji' | 'nile', transactionHash: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListInternalTransactionDetailsByTransactionHashEVMR;
    }>;
    listLogsByTransactionHashEVM(blockchain: 'ethereum', network: 'mainnet' | 'sepolia', transactionHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListLogsByTransactionHashEVMR;
    }>;
    listTokensTransfersByTransactionHashEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'optimism' | 'arbitrum' | 'base' | 'avalanche' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'amoy' | 'fuji' | 'nile', transactionHash: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTokensTransfersByTransactionHashEVMR;
    }>;
}
