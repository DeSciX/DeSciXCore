import http from 'http';
import { GetBlockDetailsByBlockHashUTXOsR } from '../model/getBlockDetailsByBlockHashUTXOsR';
import { GetBlockDetailsByBlockHeightUTXOsR } from '../model/getBlockDetailsByBlockHeightUTXOsR';
import { GetLastMinedBlockUTXOsR } from '../model/getLastMinedBlockUTXOsR';
import { ListLatestMinedBlocksUTXOsR } from '../model/listLatestMinedBlocksUTXOsR';
import { ListTransactionsByBlockHashUTXOsR } from '../model/listTransactionsByBlockHashUTXOsR';
import { ListTransactionsByBlockHeightUTXOsR } from '../model/listTransactionsByBlockHeightUTXOsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlocksUTXOsApiApiKeys {
    ApiKey = 0
}
export declare class BlocksUTXOsApi {
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
    setApiKey(key: BlocksUTXOsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getBlockDetailsByBlockHashUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', blockHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHashUTXOsR;
    }>;
    getBlockDetailsByBlockHeightUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', blockHeight: number, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHeightUTXOsR;
    }>;
    getLastMinedBlockUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetLastMinedBlockUTXOsR;
    }>;
    listLatestMinedBlocksUTXOs(network: 'testnet' | 'mainnet', blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dash' | 'dogecoin' | 'zcash', context?: string, count?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListLatestMinedBlocksUTXOsR;
    }>;
    listTransactionsByBlockHashUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'testnet' | 'mainnet', blockHash: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHashUTXOsR;
    }>;
    listTransactionsByBlockHeightUTXOs(blockchain: 'bitcoin' | 'dash' | 'dogecoin' | 'litecoin' | 'bitcoin-cash' | 'zcash', network: 'mainnet' | 'testnet', blockHeight: number, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHeightUTXOsR;
    }>;
}
