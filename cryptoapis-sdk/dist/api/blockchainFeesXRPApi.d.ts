import http from 'http';
import { GetFeeRecommendationsXRPR } from '../model/getFeeRecommendationsXRPR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlockchainFeesXRPApiApiKeys {
    ApiKey = 0
}
export declare class BlockchainFeesXRPApi {
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
    setApiKey(key: BlockchainFeesXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getFeeRecommendationsXRP(network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsXRPR;
    }>;
}
