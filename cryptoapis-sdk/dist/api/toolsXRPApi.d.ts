import http from 'http';
import { DecodeXAddressR } from '../model/decodeXAddressR';
import { EncodeXAddressR } from '../model/encodeXAddressR';
import { ValidateAddressXRPR } from '../model/validateAddressXRPR';
import { ValidateAddressXRPRB } from '../model/validateAddressXRPRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ToolsXRPApiApiKeys {
    ApiKey = 0
}
export declare class ToolsXRPApi {
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
    setApiKey(key: ToolsXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    decodeXAddress(blockchain: 'xrp', network: 'mainnet' | 'testnet', xAddress: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DecodeXAddressR;
    }>;
    encodeXAddress(addressTag: number, blockchain: 'xrp', classicAddress: string, network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EncodeXAddressR;
    }>;
    validateAddressXRP(blockchain: 'xrp', network: 'mainnet' | 'testnet', context?: string, validateAddressXRPRB?: ValidateAddressXRPRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ValidateAddressXRPR;
    }>;
}
