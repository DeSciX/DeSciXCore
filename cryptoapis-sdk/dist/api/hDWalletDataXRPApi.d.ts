import http from 'http';
import { DeriveAndSyncNewReceivingAddressesXRPR } from '../model/deriveAndSyncNewReceivingAddressesXRPR';
import { DeriveAndSyncNewReceivingAddressesXRPRB } from '../model/deriveAndSyncNewReceivingAddressesXRPRB';
import { GetHDWalletXPubYPubZPubAssetsXRPR } from '../model/getHDWalletXPubYPubZPubAssetsXRPR';
import { GetHDWalletXPubYPubZPubDetailsXRPR } from '../model/getHDWalletXPubYPubZPubDetailsXRPR';
import { ListHDWalletXPubYPubZPubTransactionsXRPR } from '../model/listHDWalletXPubYPubZPubTransactionsXRPR';
import { ListSyncedAddressesXRPR } from '../model/listSyncedAddressesXRPR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum HDWalletDataXRPApiApiKeys {
    ApiKey = 0
}
export declare class HDWalletDataXRPApi {
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
    setApiKey(key: HDWalletDataXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    deriveAndSyncNewReceivingAddressesXRP(blockchain: 'xrp', extendedPublicKey: string, network: 'mainnet' | 'testnet', context?: string, deriveAndSyncNewReceivingAddressesXRPRB?: DeriveAndSyncNewReceivingAddressesXRPRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeriveAndSyncNewReceivingAddressesXRPR;
    }>;
    getHDWalletXPubYPubZPubAssetsXRP(blockchain: 'xrp', extendedPublicKey: string, network: 'mainnet' | 'testnet', context?: string, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubAssetsXRPR;
    }>;
    getHDWalletXPubYPubZPubDetailsXRP(blockchain: 'xrp', extendedPublicKey: string, network: 'mainnet' | 'testnet', context?: string, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubDetailsXRPR;
    }>;
    listHDWalletXPubYPubZPubTransactionsXRP(blockchain: 'xrp', extendedPublicKey: string, network: 'mainnet' | 'testnet', context?: string, derivation?: 'account' | 'bip32', limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListHDWalletXPubYPubZPubTransactionsXRPR;
    }>;
    listSyncedAddressesXRP(blockchain: 'xrp', extendedPublicKey: string, network: 'mainnet' | 'testnet', context?: string, addressFormat?: 'classic', isChangeAddress?: boolean, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressesXRPR;
    }>;
}
