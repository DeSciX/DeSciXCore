import http from 'http';
import { NewBlockR } from '../model/newBlockR';
import { NewBlockRB } from '../model/newBlockRB';
import { NewConfirmedCoinsTransactionsAndEachConfirmationR } from '../model/newConfirmedCoinsTransactionsAndEachConfirmationR';
import { NewConfirmedCoinsTransactionsAndEachConfirmationRB } from '../model/newConfirmedCoinsTransactionsAndEachConfirmationRB';
import { NewConfirmedCoinsTransactionsR } from '../model/newConfirmedCoinsTransactionsR';
import { NewConfirmedCoinsTransactionsRB } from '../model/newConfirmedCoinsTransactionsRB';
import { NewConfirmedInternalTransactionsAndEachConfirmationR } from '../model/newConfirmedInternalTransactionsAndEachConfirmationR';
import { NewConfirmedInternalTransactionsAndEachConfirmationRB } from '../model/newConfirmedInternalTransactionsAndEachConfirmationRB';
import { NewConfirmedInternalTransactionsR } from '../model/newConfirmedInternalTransactionsR';
import { NewConfirmedInternalTransactionsRB } from '../model/newConfirmedInternalTransactionsRB';
import { NewConfirmedTokensTransactionsAndEachConfirmationR } from '../model/newConfirmedTokensTransactionsAndEachConfirmationR';
import { NewConfirmedTokensTransactionsAndEachConfirmationRB } from '../model/newConfirmedTokensTransactionsAndEachConfirmationRB';
import { NewConfirmedTokensTransactionsR } from '../model/newConfirmedTokensTransactionsR';
import { NewConfirmedTokensTransactionsRB } from '../model/newConfirmedTokensTransactionsRB';
import { NewUnconfirmedCoinsTransactionsR } from '../model/newUnconfirmedCoinsTransactionsR';
import { NewUnconfirmedCoinsTransactionsRB } from '../model/newUnconfirmedCoinsTransactionsRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum CreateSubscriptionsForApiApiKeys {
    ApiKey = 0
}
export declare class CreateSubscriptionsForApi {
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
    setApiKey(key: CreateSubscriptionsForApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    newBlock(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', context?: string, newBlockRB?: NewBlockRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewBlockR;
    }>;
    newConfirmedCoinsTransactions(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base' | 'kaspa', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', context?: string, newConfirmedCoinsTransactionsRB?: NewConfirmedCoinsTransactionsRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedCoinsTransactionsR;
    }>;
    newConfirmedCoinsTransactionsAndEachConfirmation(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji', context?: string, newConfirmedCoinsTransactionsAndEachConfirmationRB?: NewConfirmedCoinsTransactionsAndEachConfirmationRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedCoinsTransactionsAndEachConfirmationR;
    }>;
    newConfirmedInternalTransactions(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'tron' | 'optimism' | 'arbitrum' | 'avalanche' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'fuji', context?: string, newConfirmedInternalTransactionsRB?: NewConfirmedInternalTransactionsRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedInternalTransactionsR;
    }>;
    newConfirmedInternalTransactionsAndEachConfirmation(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'tron' | 'optimism' | 'arbitrum' | 'avalanche' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'fuji', context?: string, newConfirmedInternalTransactionsAndEachConfirmationRB?: NewConfirmedInternalTransactionsAndEachConfirmationRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedInternalTransactionsAndEachConfirmationR;
    }>;
    newConfirmedTokensTransactions(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'tron' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'fuji' | 'devnet', context?: string, newConfirmedTokensTransactionsRB?: NewConfirmedTokensTransactionsRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedTokensTransactionsR;
    }>;
    newConfirmedTokensTransactionsAndEachConfirmation(blockchain: 'bitcoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'tron' | 'optimism' | 'arbitrum' | 'avalanche' | 'base', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'fuji', context?: string, newConfirmedTokensTransactionsAndEachConfirmationRB?: NewConfirmedTokensTransactionsAndEachConfirmationRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewConfirmedTokensTransactionsAndEachConfirmationR;
    }>;
    newUnconfirmedCoinsTransactions(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', context?: string, newUnconfirmedCoinsTransactionsRB?: NewUnconfirmedCoinsTransactionsRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NewUnconfirmedCoinsTransactionsR;
    }>;
}
