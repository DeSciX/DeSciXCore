import http from 'http';
import { GetFeeRecommendationsKASPAR } from '../model/getFeeRecommendationsKASPAR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlockchainFeesKaspaApiApiKeys {
    ApiKey = 0
}
export declare class BlockchainFeesKaspaApi {
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
    setApiKey(key: BlockchainFeesKaspaApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getFeeRecommendationsKASPA(network: 'mainnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsKASPAR;
    }>;
}
