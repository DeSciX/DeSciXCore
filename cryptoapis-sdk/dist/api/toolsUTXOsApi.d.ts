import http from 'http';
import { DecodeRawTransactionHexUTXOR } from '../model/decodeRawTransactionHexUTXOR';
import { DecodeRawTransactionHexUTXORB } from '../model/decodeRawTransactionHexUTXORB';
import { ValidateAddressUTXOR } from '../model/validateAddressUTXOR';
import { ValidateAddressUTXORB } from '../model/validateAddressUTXORB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ToolsUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class ToolsUTXOsApi {
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
    setApiKey(key: ToolsUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    decodeRawTransactionHexUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: string, context?: string, decodeRawTransactionHexUTXORB?: DecodeRawTransactionHexUTXORB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DecodeRawTransactionHexUTXOR;
    }>;
    validateAddressUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', context?: string, validateAddressUTXORB?: ValidateAddressUTXORB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ValidateAddressUTXOR;
    }>;
}
