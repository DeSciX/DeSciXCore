import http from 'http';
import { EstimateFA12TransferFeeTezosR } from '../model/estimateFA12TransferFeeTezosR';
import { EstimateFA12TransferFeeTezosRB } from '../model/estimateFA12TransferFeeTezosRB';
import { EstimateFA2TransferFeeTezosR } from '../model/estimateFA2TransferFeeTezosR';
import { EstimateFA2TransferFeeTezosRB } from '../model/estimateFA2TransferFeeTezosRB';
import { EstimateTransferFeeTezosR } from '../model/estimateTransferFeeTezosR';
import { EstimateTransferFeeTezosRB } from '../model/estimateTransferFeeTezosRB';
import { GetFeeRecommendationsTezosR } from '../model/getFeeRecommendationsTezosR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlockchainFeesTezosApiApiKeys {
    ApiKey = 0
}
export declare class BlockchainFeesTezosApi {
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
    setApiKey(key: BlockchainFeesTezosApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    estimateFA12TransferFeeTezos(network: 'shadownet' | 'mainnet', context?: string, estimateFA12TransferFeeTezosRB?: EstimateFA12TransferFeeTezosRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateFA12TransferFeeTezosR;
    }>;
    estimateFA2TransferFeeTezos(network: 'shadownet' | 'mainnet', context?: string, estimateFA2TransferFeeTezosRB?: EstimateFA2TransferFeeTezosRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateFA2TransferFeeTezosR;
    }>;
    estimateTransferFeeTezos(network: 'shadownet' | 'mainnet', context?: string, estimateTransferFeeTezosRB?: EstimateTransferFeeTezosRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateTransferFeeTezosR;
    }>;
    getFeeRecommendationsTezos(network: 'shadownet' | 'mainnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsTezosR;
    }>;
}
