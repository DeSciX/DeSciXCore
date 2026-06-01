import http from 'http';
import { DeriveAndSyncNewReceivingAddressesEVMR } from '../model/deriveAndSyncNewReceivingAddressesEVMR';
import { DeriveAndSyncNewReceivingAddressesEVMRB } from '../model/deriveAndSyncNewReceivingAddressesEVMRB';
import { GetHDWalletXPubYPubZPubAssetsEVMR } from '../model/getHDWalletXPubYPubZPubAssetsEVMR';
import { GetHDWalletXPubYPubZPubDetailsEVMR } from '../model/getHDWalletXPubYPubZPubDetailsEVMR';
import { ListHDWalletXPubYPubZPubTransactionsEVMR } from '../model/listHDWalletXPubYPubZPubTransactionsEVMR';
import { ListSyncedAddressesEVMR } from '../model/listSyncedAddressesEVMR';
import { PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMR } from '../model/prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMR';
import { PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRB } from '../model/prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum HDWalletDataEVMApiApiKeys {
    ApiKey = 0
}
export declare class HDWalletDataEVMApi {
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
    setApiKey(key: HDWalletDataEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    deriveAndSyncNewReceivingAddressesEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'sepolia' | 'mordor' | 'testnet' | 'nile', extendedPublicKey: string, context?: string, deriveAndSyncNewReceivingAddressesEVMRB?: DeriveAndSyncNewReceivingAddressesEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeriveAndSyncNewReceivingAddressesEVMR;
    }>;
    getHDWalletXPubYPubZPubAssetsEVM(blockchain: 'tron' | 'ethereum-classic' | 'ethereum' | 'binance-smart-chain', network: 'nile' | 'mordor' | 'sepolia' | 'testnet' | 'mainnet', extendedPublicKey: string, context?: string, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubAssetsEVMR;
    }>;
    getHDWalletXPubYPubZPubDetailsEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'sepolia' | 'mordor' | 'testnet' | 'nile', extendedPublicKey: string, context?: string, derivation?: 'account', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubDetailsEVMR;
    }>;
    listHDWalletXPubYPubZPubTransactionsEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'sepolia' | 'mordor' | 'testnet' | 'nile', extendedPublicKey: string, context?: string, limit?: number, offset?: number, derivation?: 'account', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListHDWalletXPubYPubZPubTransactionsEVMR;
    }>;
    listSyncedAddressesEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'sepolia' | 'mordor' | 'testnet' | 'nile', extendedPublicKey: string, context?: string, addressFormat?: 'standard' | 'base58', isChangeAddress?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressesEVMR;
    }>;
    prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVM(blockchain: 'binance-smart-chain' | 'ethereum-classic' | 'ethereum', network: 'testnet' | 'mainnet' | 'mordor' | 'sepolia', extendedPublicKey: string, context?: string, prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRB?: PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMR;
    }>;
}
