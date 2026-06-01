import http from 'http';
import { GetRawTransactionDataUTXOsR } from '../model/getRawTransactionDataUTXOsR';
import { GetTransactionDetailsByTransactionHashUTXOsR } from '../model/getTransactionDetailsByTransactionHashUTXOsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum TransactionsDataUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class TransactionsDataUTXOsApi {
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
    setApiKey(key: TransactionsDataUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getRawTransactionDataUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash', network: 'mainnet' | 'testnet', transactionHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetRawTransactionDataUTXOsR;
    }>;
    getTransactionDetailsByTransactionHashUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', transactionHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTransactionDetailsByTransactionHashUTXOsR;
    }>;
}
