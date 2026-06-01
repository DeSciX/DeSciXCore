import http from 'http';
import { ActivateBlockchainEventSubscriptionR } from '../model/activateBlockchainEventSubscriptionR';
import { ActivateBlockchainEventSubscriptionRB } from '../model/activateBlockchainEventSubscriptionRB';
import { DeleteBlockchainEventSubscriptionR } from '../model/deleteBlockchainEventSubscriptionR';
import { GetBlockchainEventSubscriptionDetailsByReferenceIDR } from '../model/getBlockchainEventSubscriptionDetailsByReferenceIDR';
import { ListBlockchainEventsSubscriptionsR } from '../model/listBlockchainEventsSubscriptionsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ManageSubscriptionsApiApiKeys {
    ApiKey = 0
}
export declare class ManageSubscriptionsApi {
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
    setApiKey(key: ManageSubscriptionsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    activateBlockchainEventSubscription(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base' | 'kaspa', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', referenceId: string, context?: string, activateBlockchainEventSubscriptionRB?: ActivateBlockchainEventSubscriptionRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ActivateBlockchainEventSubscriptionR;
    }>;
    deleteBlockchainEventSubscription(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base' | 'kaspa', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', referenceId: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeleteBlockchainEventSubscriptionR;
    }>;
    getBlockchainEventSubscriptionDetailsByReferenceID(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base' | 'kaspa', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', referenceId: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetBlockchainEventSubscriptionDetailsByReferenceIDR;
    }>;
    listBlockchainEventsSubscriptions(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'zcash' | 'polygon' | 'tron' | 'xrp' | 'tezos' | 'optimism' | 'arbitrum' | 'avalanche' | 'solana' | 'base' | 'kaspa', network: 'mainnet' | 'testnet' | 'sepolia' | 'mordor' | 'amoy' | 'nile' | 'shadownet' | 'fuji' | 'devnet', context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListBlockchainEventsSubscriptionsR;
    }>;
}
