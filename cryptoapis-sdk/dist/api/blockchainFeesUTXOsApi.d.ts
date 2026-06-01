import http from 'http';
import { EstimateTransactionSmartFeeUTXOsR } from '../model/estimateTransactionSmartFeeUTXOsR';
import { GetFeeRecommendationsUTXOsR } from '../model/getFeeRecommendationsUTXOsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlockchainFeesUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class BlockchainFeesUTXOsApi {
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
    setApiKey(key: BlockchainFeesUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    estimateTransactionSmartFeeUTXOs(blockchain: 'bitcoin' | 'litecoin' | 'dash', network: 'testnet' | 'mainnet', context?: string, confirmationTarget?: number, estimateMode?: 'economical' | 'conservative', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateTransactionSmartFeeUTXOsR;
    }>;
    getFeeRecommendationsUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dogecoin' | 'dash' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsUTXOsR;
    }>;
}
