import http from 'http';
import { BroadcastLocallySignedTransactionR } from '../model/broadcastLocallySignedTransactionR';
import { BroadcastLocallySignedTransactionRB } from '../model/broadcastLocallySignedTransactionRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BroadcastLocallySignTransactionsApiApiKeys {
    ApiKey = 0
}
export declare class BroadcastLocallySignTransactionsApi {
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
    setApiKey(key: BroadcastLocallySignTransactionsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    broadcastLocallySignedTransaction(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'ethereum' | 'ethereum-classic' | 'zcash' | 'binance-smart-chain' | 'xrp' | 'tron' | 'polygon' | 'arbitrum' | 'avalanche' | 'base' | 'optimism' | 'solana' | 'tezos', network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia' | 'fuji' | 'devnet' | 'shadownet' | 'amoy', context?: string, broadcastLocallySignedTransactionRB?: BroadcastLocallySignedTransactionRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: BroadcastLocallySignedTransactionR;
    }>;
}
