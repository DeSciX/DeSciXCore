import http from 'http';
import { GetAddressStatisticsUTXOsR } from '../model/getAddressStatisticsUTXOsR';
import { ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR } from '../model/listConfirmedTransactionsByAddressByTimestampUTXOHistoricalR';
import { ListConfirmedTransactionsByAddressUTXOHistoricalR } from '../model/listConfirmedTransactionsByAddressUTXOHistoricalR';
import { ListUnspentTransactionOutputsByAddressUTXOsR } from '../model/listUnspentTransactionOutputsByAddressUTXOsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressHistoryUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class AddressHistoryUTXOsApi {
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
    setApiKey(key: AddressHistoryUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressStatisticsUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash', network: 'testnet' | 'mainnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressStatisticsUTXOsR;
    }>;
    listConfirmedTransactionsByAddressByTimestampUTXOHistorical(blockchain: 'bitcoin' | 'bitcoin-cash', network: 'mainnet' | 'testnet', address: string, timestamp: number, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR;
    }>;
    listConfirmedTransactionsByAddressUTXOHistorical(blockchain: 'bitcoin' | 'zcash' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash', network: 'mainnet' | 'testnet', address: string, context?: string, limit?: number, startingAfter?: string, sortingOrder?: 'ascending' | 'descending', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressUTXOHistoricalR;
    }>;
    listUnspentTransactionOutputsByAddressUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dash' | 'dogecoin' | 'zcash', network: 'testnet' | 'mainnet', address: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListUnspentTransactionOutputsByAddressUTXOsR;
    }>;
}
