import http from 'http';
import { GetTokenDetailsByContractAddressEVMR } from '../model/getTokenDetailsByContractAddressEVMR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ContractsEVMApiApiKeys {
    ApiKey = 0
}
export declare class ContractsEVMApi {
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
    setApiKey(key: ContractsEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getTokenDetailsByContractAddressEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia', contractAddress: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetTokenDetailsByContractAddressEVMR;
    }>;
}
