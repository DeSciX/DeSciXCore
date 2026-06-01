import http from 'http';
import { ActivateHDWalletXPubYPubZPubR } from '../model/activateHDWalletXPubYPubZPubR';
import { ActivateHDWalletXPubYPubZPubRB } from '../model/activateHDWalletXPubYPubZPubRB';
import { DeleteSyncedHDWalletXPubYPubZPubR } from '../model/deleteSyncedHDWalletXPubYPubZPubR';
import { GetHDWalletStatusXPubYPubZPubR } from '../model/getHDWalletStatusXPubYPubZPubR';
import { ListSyncedHDWalletsXPubYPubZPubR } from '../model/listSyncedHDWalletsXPubYPubZPubR';
import { SyncHDWalletXPubYPubZPubR } from '../model/syncHDWalletXPubYPubZPubR';
import { SyncHDWalletXPubYPubZPubRB } from '../model/syncHDWalletXPubYPubZPubRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ManageHDWalletApiApiKeys {
    ApiKey = 0
}
export declare class ManageHDWalletApi {
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
    setApiKey(key: ManageHDWalletApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    activateHDWalletXPubYPubZPub(blockchain: 'binance-smart-chain' | 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'ethereum' | 'ethereum-classic' | 'litecoin' | 'tron' | 'xrp' | 'zcash', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, activateHDWalletXPubYPubZPubRB?: ActivateHDWalletXPubYPubZPubRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ActivateHDWalletXPubYPubZPubR;
    }>;
    deleteSyncedHDWalletXPubYPubZPub(blockchain: 'binance-smart-chain' | 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'ethereum' | 'ethereum-classic' | 'litecoin' | 'tron' | 'xrp' | 'zcash', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeleteSyncedHDWalletXPubYPubZPubR;
    }>;
    getHDWalletStatusXPubYPubZPub(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'ethereum' | 'zcash' | 'ethereum-classic' | 'binance-smart-chain' | 'xrp' | 'tron', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletStatusXPubYPubZPubR;
    }>;
    listSyncedHDWalletsXPubYPubZPub(blockchain: 'binance-smart-chain' | 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'ethereum' | 'ethereum-classic' | 'litecoin' | 'tron' | 'xrp' | 'zcash', network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedHDWalletsXPubYPubZPubR;
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
