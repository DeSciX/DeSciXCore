import http from 'http';
import { ActivateSyncedAddressR } from '../model/activateSyncedAddressR';
import { ActivateSyncedAddressRB } from '../model/activateSyncedAddressRB';
import { ListSyncedAddressesR } from '../model/listSyncedAddressesR';
import { SyncAddressR } from '../model/syncAddressR';
import { SyncAddressRB } from '../model/syncAddressRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressHistoryApiApiKeys {
    ApiKey = 0
}
export declare class AddressHistoryApi {
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
    setApiKey(key: AddressHistoryApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    activateSyncedAddress(address: string, blockchain: 'polygon' | 'ethereum' | 'dash' | 'tron' | 'dogecoin' | 'litecoin' | 'zcash' | 'bitcoin-cash' | 'bitcoin' | 'ethereum-classic' | 'binance-smart-chain', network: 'mainnet' | 'sepolia' | 'mumbai' | 'amoy' | 'testnet' | 'nile' | 'mordor', context?: string, activateSyncedAddressRB?: ActivateSyncedAddressRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ActivateSyncedAddressR;
    }>;
    listSyncedAddresses(blockchain: 'polygon' | 'ethereum' | 'dash' | 'tron' | 'dogecoin' | 'litecoin' | 'zcash' | 'bitcoin-cash' | 'bitcoin' | 'ethereum-classic' | 'binance-smart-chain', network: 'mainnet' | 'sepolia' | 'amoy' | 'testnet' | 'nile' | 'mordor', context?: string, limit?: number, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressesR;
    }>;
    syncAddress(blockchain: 'polygon' | 'ethereum' | 'dash' | 'tron' | 'dogecoin' | 'litecoin' | 'zcash' | 'bitcoin-cash' | 'bitcoin' | 'ethereum-classic' | 'binance-smart-chain', network: 'mainnet' | 'sepolia' | 'amoy' | 'testnet' | 'nile' | 'mordor', context?: string, syncAddressRB?: SyncAddressRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: SyncAddressR;
    }>;
}
