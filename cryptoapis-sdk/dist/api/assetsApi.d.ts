import http from 'http';
import { GetAssetDetailsByAssetIDR } from '../model/getAssetDetailsByAssetIDR';
import { GetAssetDetailsByAssetSymbolR } from '../model/getAssetDetailsByAssetSymbolR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AssetsApiApiKeys {
    ApiKey = 0
}
export declare class AssetsApi {
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
    setApiKey(key: AssetsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAssetDetailsByAssetID(assetId: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAssetDetailsByAssetIDR;
    }>;
    getAssetDetailsByAssetSymbol(assetSymbol: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAssetDetailsByAssetSymbolR;
    }>;
}
