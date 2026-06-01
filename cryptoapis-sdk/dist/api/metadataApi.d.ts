import http from 'http';
import { ListSupportedAssetsR } from '../model/listSupportedAssetsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum MetadataApiApiKeys {
    ApiKey = 0
}
export declare class MetadataApi {
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
    setApiKey(key: MetadataApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    listSupportedAssets(context?: string, limit?: number, offset?: number, type?: 'fiat' | 'crypto', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSupportedAssetsR;
    }>;
}
