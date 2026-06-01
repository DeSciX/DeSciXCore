import http from 'http';
import { GetTokenDetailsByContractAddressSolanaR } from '../model/getTokenDetailsByContractAddressSolanaR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ContractsSolanaApiApiKeys {
    ApiKey = 0
}
export declare class ContractsSolanaApi {
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
    setApiKey(key: ContractsSolanaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTokenDetailsByContractAddressSolana(network: 'mainnet' | 'devnet', contractAddress: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTokenDetailsByContractAddressSolanaR;
    }>;
}
