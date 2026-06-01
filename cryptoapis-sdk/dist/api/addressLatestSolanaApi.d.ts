import http from 'http';
import { GetAddressBalanceSolanaR } from '../model/getAddressBalanceSolanaR';
import { ListTokensByAddressSolanaR } from '../model/listTokensByAddressSolanaR';
import { ListTransactionsByAddressSolanaR } from '../model/listTransactionsByAddressSolanaR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressLatestSolanaApiApiKeys {
    ApiKey = 0
}
export declare class AddressLatestSolanaApi {
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
    setApiKey(key: AddressLatestSolanaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressBalanceSolana(network: 'mainnet' | 'devnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressBalanceSolanaR;
    }>;
    listTokensByAddressSolana(network: 'mainnet' | 'devnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTokensByAddressSolanaR;
    }>;
    listTransactionsByAddressSolana(network: 'mainnet' | 'devnet', address: string, context?: string, limit?: string, startingAfter?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByAddressSolanaR;
    }>;
}
