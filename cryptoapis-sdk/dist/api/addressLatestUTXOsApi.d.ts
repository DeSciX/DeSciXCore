import http from 'http';
import { GetAddressBalanceUTXOsR } from '../model/getAddressBalanceUTXOsR';
import { ListConfirmedTransactionsByAddressUTXOsR } from '../model/listConfirmedTransactionsByAddressUTXOsR';
import { ListUnconfirmedTransactionsByAddressUTXOsR } from '../model/listUnconfirmedTransactionsByAddressUTXOsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressLatestUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class AddressLatestUTXOsApi {
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
    setApiKey(key: AddressLatestUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressBalanceUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dash' | 'dogecoin' | 'zcash', network: 'mainnet' | 'testnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressBalanceUTXOsR;
    }>;
    listConfirmedTransactionsByAddressUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', address: string, context?: string, limit?: number, startingAfter?: string, sortingOrder?: 'ascending' | 'descending', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressUTXOsR;
    }>;
    listUnconfirmedTransactionsByAddressUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', address: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListUnconfirmedTransactionsByAddressUTXOsR;
    }>;
}
