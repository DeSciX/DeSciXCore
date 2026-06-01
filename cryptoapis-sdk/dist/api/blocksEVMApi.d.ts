import http from 'http';
import { GetBlockDetailsByBlockHashEVMR } from '../model/getBlockDetailsByBlockHashEVMR';
import { GetBlockDetailsByBlockHeightEVMR } from '../model/getBlockDetailsByBlockHeightEVMR';
import { GetLastMinedBlockEVMR } from '../model/getLastMinedBlockEVMR';
import { ListLatestMinedBlocksEVMR } from '../model/listLatestMinedBlocksEVMR';
import { ListTransactionsByBlockHashEVMR } from '../model/listTransactionsByBlockHashEVMR';
import { ListTransactionsByBlockHeightEVMR } from '../model/listTransactionsByBlockHeightEVMR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlocksEVMApiApiKeys {
    ApiKey = 0
}
export declare class BlocksEVMApi {
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
    setApiKey(key: BlocksEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getBlockDetailsByBlockHashEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'nile', blockHash: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHashEVMR;
    }>;
    getBlockDetailsByBlockHeightEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'nile', blockHeight: number, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockDetailsByBlockHeightEVMR;
    }>;
    getLastMinedBlockEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'tron' | 'binance-smart-chain', network: 'mainnet' | 'mordor' | 'nile' | 'testnet' | 'sepolia', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetLastMinedBlockEVMR;
    }>;
    listLatestMinedBlocksEVM(network: 'mordor' | 'mainnet' | 'testnet' | 'sepolia' | 'nile', blockchain: 'ethereum-classic' | 'ethereum' | 'binance-smart-chain' | 'tron', context?: string, count?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListLatestMinedBlocksEVMR;
    }>;
    listTransactionsByBlockHashEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'nile', blockHash: string, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHashEVMR;
    }>;
    listTransactionsByBlockHeightEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'nile', blockHeight: number, context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByBlockHeightEVMR;
    }>;
}
