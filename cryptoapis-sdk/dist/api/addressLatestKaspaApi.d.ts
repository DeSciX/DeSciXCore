import http from 'http';
import { GetAddressBalanceKaspaR } from '../model/getAddressBalanceKaspaR';
import { ListConfirmedTransactionsByAddressKaspaR } from '../model/listConfirmedTransactionsByAddressKaspaR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressLatestKaspaApiApiKeys {
    ApiKey = 0
}
export declare class AddressLatestKaspaApi {
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
    setApiKey(key: AddressLatestKaspaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressBalanceKaspa(network: 'mainnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressBalanceKaspaR;
    }>;
    listConfirmedTransactionsByAddressKaspa(network: 'mainnet', address: string, context?: string, limit?: number, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListConfirmedTransactionsByAddressKaspaR;
    }>;
}
