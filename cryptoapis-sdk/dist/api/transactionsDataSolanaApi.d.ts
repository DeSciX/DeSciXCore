import http from 'http';
import { GetTransactionDetailsByTransactionHashSolanaR } from '../model/getTransactionDetailsByTransactionHashSolanaR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum TransactionsDataSolanaApiApiKeys {
    ApiKey = 0
}
export declare class TransactionsDataSolanaApi {
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
    setApiKey(key: TransactionsDataSolanaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTransactionDetailsByTransactionHashSolana(network: 'mainnet' | 'devnet', signature: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTransactionDetailsByTransactionHashSolanaR;
    }>;
}
