import http from 'http';
import { SimulateEthereumTransactionsR } from '../model/simulateEthereumTransactionsR';
import { SimulateEthereumTransactionsRB } from '../model/simulateEthereumTransactionsRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum SimulateTransactionsEVMApiApiKeys {
    ApiKey = 0
}
export declare class SimulateTransactionsEVMApi {
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
    setApiKey(key: SimulateTransactionsEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    simulateEthereumTransactions(network: 'sepolia' | 'mainnet', context?: string, simulateEthereumTransactionsRB?: SimulateEthereumTransactionsRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: SimulateEthereumTransactionsR;
    }>;
}
