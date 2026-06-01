import http from 'http';
import { GetTransactionDetailsByTransactionHashXRPR } from '../model/getTransactionDetailsByTransactionHashXRPR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum TransactionsDataXRPApiApiKeys {
    ApiKey = 0
}
export declare class TransactionsDataXRPApi {
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
    setApiKey(key: TransactionsDataXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTransactionDetailsByTransactionHashXRP(network: 'mainnet' | 'testnet', transactionHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTransactionDetailsByTransactionHashXRPR;
    }>;
}
