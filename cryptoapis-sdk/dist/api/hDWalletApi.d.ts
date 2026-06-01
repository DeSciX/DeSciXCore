import http from 'http';
import { GetHDWalletStatusXPubYPubZPubR } from '../model/getHDWalletStatusXPubYPubZPubR';
import { SyncHDWalletXPubYPubZPubR } from '../model/syncHDWalletXPubYPubZPubR';
import { SyncHDWalletXPubYPubZPubRB } from '../model/syncHDWalletXPubYPubZPubRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum HDWalletApiApiKeys {
    ApiKey = 0
}
export declare class HDWalletApi {
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
    setApiKey(key: HDWalletApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getHDWalletStatusXPubYPubZPub(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'ethereum' | 'zcash' | 'ethereum-classic' | 'binance-smart-chain' | 'xrp' | 'tron', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletStatusXPubYPubZPubR;
    }>;
    syncHDWalletXPubYPubZPub(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'ethereum' | 'zcash' | 'ethereum-classic' | 'binance-smart-chain' | 'xrp' | 'tron', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, syncHDWalletXPubYPubZPubRB?: SyncHDWalletXPubYPubZPubRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: SyncHDWalletXPubYPubZPubR;
    }>;
}
