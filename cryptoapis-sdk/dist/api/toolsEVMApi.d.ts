import http from 'http';
import { DecodeRawTransactionHexEVMR } from '../model/decodeRawTransactionHexEVMR';
import { DecodeRawTransactionHexEVMRB } from '../model/decodeRawTransactionHexEVMRB';
import { ValidateAddressEVMR } from '../model/validateAddressEVMR';
import { ValidateAddressEVMRB } from '../model/validateAddressEVMRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ToolsEVMApiApiKeys {
    ApiKey = 0
}
export declare class ToolsEVMApi {
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
    setApiKey(key: ToolsEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    decodeRawTransactionHexEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain', network: string, context?: string, decodeRawTransactionHexEVMRB?: DecodeRawTransactionHexEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DecodeRawTransactionHexEVMR;
    }>;
    validateAddressEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, validateAddressEVMRB?: ValidateAddressEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ValidateAddressEVMR;
    }>;
}
