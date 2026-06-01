import http from 'http';
import { GetAddressStatisticsEVMR } from '../model/getAddressStatisticsEVMR';
import { ListConfirmedTransactionsByAddressEVMHistoryR } from '../model/listConfirmedTransactionsByAddressEVMHistoryR';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR } from '../model/listConfirmedTransactionsByAddressFromTimestampEVMHistoryR';
import { ListSyncedAddressInternalTransactionsEVMR } from '../model/listSyncedAddressInternalTransactionsEVMR';
import { ListSyncedAddressTokensTransferEVMR } from '../model/listSyncedAddressTokensTransferEVMR';
import { ListTokensByAddressSyncedEVMR } from '../model/listTokensByAddressSyncedEVMR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressHistoryEVMApiApiKeys {
    ApiKey = 0
}
export declare class AddressHistoryEVMApi {
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
    setApiKey(key: AddressHistoryEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressStatisticsEVM(blockchain: 'ethereum' | 'ethereum-classic', network: 'sepolia' | 'mainnet' | 'mordor', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressStatisticsEVMR;
    }>;
    listConfirmedTransactionsByAddressEVMHistory(blockchain: 'ethereum-classic' | 'ethereum' | 'binance-smart-chain' | 'polygon' | 'tron', network: 'mordor' | 'mainnet' | 'testnet' | 'sepolia' | 'amoy' | 'nile', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressEVMHistoryR;
    }>;
    listConfirmedTransactionsByAddressFromTimestampEVMHistory(blockchain: 'ethereum' | 'ethereum-classic', network: 'mainnet' | 'sepolia' | 'mordor', address: string, timestamp: number, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR;
    }>;
    listSyncedAddressInternalTransactionsEVM(blockchain: 'ethereum' | 'polygon' | 'tron' | 'ethereum-classic' | 'binance-smart-chain', network: 'sepolia' | 'amoy' | 'mainnet' | 'nile' | 'mordor' | 'testnet', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressInternalTransactionsEVMR;
    }>;
    listSyncedAddressTokensTransferEVM(blockchain: 'ethereum' | 'polygon' | 'tron' | 'ethereum-classic' | 'binance-smart-chain', network: 'sepolia' | 'amoy' | 'mainnet' | 'nile' | 'mordor' | 'testnet', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressTokensTransferEVMR;
    }>;
    listTokensByAddressSyncedEVM(blockchain: 'polygon' | 'tron' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain', network: 'amoy' | 'mainnet' | 'nile' | 'sepolia' | 'mordor' | 'testnet', address: string, context?: string, limit?: number, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTokensByAddressSyncedEVMR;
    }>;
}
