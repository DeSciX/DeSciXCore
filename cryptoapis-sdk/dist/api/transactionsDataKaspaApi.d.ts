import http from 'http';
import { GetTransactionDetailsByTransactionIdKaspaR } from '../model/getTransactionDetailsByTransactionIdKaspaR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum TransactionsDataKaspaApiApiKeys {
    ApiKey = 0
}
export declare class TransactionsDataKaspaApi {
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
    setApiKey(key: TransactionsDataKaspaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTransactionDetailsByTransactionIdKaspa(network: 'mainnet', transactionId: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTransactionDetailsByTransactionIdKaspaR;
    }>;
}
