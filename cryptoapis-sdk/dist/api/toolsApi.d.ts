import http from 'http';
import { ConvertBitcoinCashAddressR } from '../model/convertBitcoinCashAddressR';
import { ConvertBitcoinCashAddressRB } from '../model/convertBitcoinCashAddressRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ToolsApiApiKeys {
    ApiKey = 0
}
export declare class ToolsApi {
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
    setApiKey(key: ToolsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    convertBitcoinCashAddress(blockchain: 'bitcoin-cash', network: 'mainnet' | 'testnet', context?: string, convertBitcoinCashAddressRB?: ConvertBitcoinCashAddressRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ConvertBitcoinCashAddressR;
    }>;
}
