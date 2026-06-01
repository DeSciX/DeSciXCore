import http from 'http';
import { GetBlockDetailsByBlockHashXRPR } from '../model/getBlockDetailsByBlockHashXRPR';
import { GetBlockDetailsByBlockHeightXRPR } from '../model/getBlockDetailsByBlockHeightXRPR';
import { GetLatestMinedBlockXRPR } from '../model/getLatestMinedBlockXRPR';
import { ListLatestMinedBlocksXRPR } from '../model/listLatestMinedBlocksXRPR';
import { ListTransactionsByBlockHashXRPR } from '../model/listTransactionsByBlockHashXRPR';
import { ListTransactionsByBlockHeightXRPR } from '../model/listTransactionsByBlockHeightXRPR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlocksXRPApiApiKeys {
    ApiKey = 0
}
export declare class BlocksXRPApi {
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
    setApiKey(key: BlocksXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getBlockDetailsByBlockHashXRP(network: 'mainnet' | 'testnet', blockHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHashXRPR;
    }>;
    getBlockDetailsByBlockHeightXRP(network: 'mainnet' | 'testnet', blockHeight: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHeightXRPR;
    }>;
    getLatestMinedBlockXRP(network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetLatestMinedBlockXRPR;
    }>;
    listLatestMinedBlocksXRP(network: 'mainnet' | 'testnet', context?: string, count?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListLatestMinedBlocksXRPR;
    }>;
    listTransactionsByBlockHashXRP(network: 'mainnet' | 'testnet', blockHash: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHashXRPR;
    }>;
    listTransactionsByBlockHeightXRP(network: 'mainnet' | 'testnet', blockHeight: number, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHeightXRPR;
    }>;
}
