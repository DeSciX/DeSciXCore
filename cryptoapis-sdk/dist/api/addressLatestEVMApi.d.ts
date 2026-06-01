import http from 'http';
import { GetAddressBalanceEVMR } from '../model/getAddressBalanceEVMR';
import { GetNextAvailableNonceEVMR } from '../model/getNextAvailableNonceEVMR';
import { ListConfirmedTokensTransfersByAddressEVMR } from '../model/listConfirmedTokensTransfersByAddressEVMR';
import { ListConfirmedTransactionsByAddressEVMR } from '../model/listConfirmedTransactionsByAddressEVMR';
import { ListInternalTransactionsByAddressEVMR } from '../model/listInternalTransactionsByAddressEVMR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressLatestEVMApiApiKeys {
    ApiKey = 0
}
export declare class AddressLatestEVMApi {
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
    setApiKey(key: AddressLatestEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressBalanceEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron' | 'polygon' | 'avalanche' | 'arbitrum' | 'base' | 'optimism', network: 'mainnet' | 'mordor' | 'testnet' | 'nile' | 'sepolia' | 'amoy' | 'fuji', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressBalanceEVMR;
    }>;
    getNextAvailableNonceEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetNextAvailableNonceEVMR;
    }>;
    listConfirmedTokensTransfersByAddressEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron' | 'polygon' | 'avalanche' | 'arbitrum' | 'base' | 'optimism', network: 'mainnet' | 'mordor' | 'testnet' | 'nile' | 'sepolia' | 'amoy' | 'fuji', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTokensTransfersByAddressEVMR;
    }>;
    listConfirmedTransactionsByAddressEVM(blockchain: 'ethereum-classic' | 'ethereum' | 'binance-smart-chain' | 'arbitrum' | 'polygon' | 'avalanche' | 'base' | 'optimism' | 'tron', network: 'mordor' | 'mainnet' | 'testnet' | 'sepolia' | 'amoy' | 'fuji' | 'nile', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressEVMR;
    }>;
    listInternalTransactionsByAddressEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'avalanche' | 'arbitrum' | 'base' | 'optimism' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'amoy' | 'fuji' | 'nile', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListInternalTransactionsByAddressEVMR;
    }>;
}
