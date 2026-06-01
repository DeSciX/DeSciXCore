import http from 'http';
import { DeriveAndSyncNewChangeAddressesUTXOR } from '../model/deriveAndSyncNewChangeAddressesUTXOR';
import { DeriveAndSyncNewChangeAddressesUTXORB } from '../model/deriveAndSyncNewChangeAddressesUTXORB';
import { DeriveAndSyncNewReceivingAddressesUTXOR } from '../model/deriveAndSyncNewReceivingAddressesUTXOR';
import { DeriveAndSyncNewReceivingAddressesUTXORB } from '../model/deriveAndSyncNewReceivingAddressesUTXORB';
import { GetHDWalletXPubYPubZPubAssetsUTXOR } from '../model/getHDWalletXPubYPubZPubAssetsUTXOR';
import { GetHDWalletXPubYPubZPubDetailsUTXOR } from '../model/getHDWalletXPubYPubZPubDetailsUTXOR';
import { ListHDWalletXPubYPubZPubTransactionsUTXOR } from '../model/listHDWalletXPubYPubZPubTransactionsUTXOR';
import { ListHDWalletXPubYPubZPubUTXOsR } from '../model/listHDWalletXPubYPubZPubUTXOsR';
import { ListSyncedAddressesUTXOR } from '../model/listSyncedAddressesUTXOR';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR } from '../model/prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB } from '../model/prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum HDWalletDataUTXOApiApiKeys {
    ApiKey = 0
}
export declare class HDWalletDataUTXOApi {
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
    setApiKey(key: HDWalletDataUTXOApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    deriveAndSyncNewChangeAddressesUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', extendedPublicKey: string, context?: string, deriveAndSyncNewChangeAddressesUTXORB?: DeriveAndSyncNewChangeAddressesUTXORB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeriveAndSyncNewChangeAddressesUTXOR;
    }>;
    deriveAndSyncNewReceivingAddressesUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', extendedPublicKey: string, context?: string, deriveAndSyncNewReceivingAddressesUTXORB?: DeriveAndSyncNewReceivingAddressesUTXORB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeriveAndSyncNewReceivingAddressesUTXOR;
    }>;
    getHDWalletXPubYPubZPubAssetsUTXO(blockchain: 'bitcoin' | 'zcash' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin', network: 'testnet' | 'mainnet', extendedPublicKey: string, context?: string, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubAssetsUTXOR;
    }>;
    getHDWalletXPubYPubZPubDetailsUTXO(blockchain: 'bitcoin' | 'zcash' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin', network: 'testnet' | 'mainnet', extendedPublicKey: string, context?: string, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetHDWalletXPubYPubZPubDetailsUTXOR;
    }>;
    listHDWalletXPubYPubZPubTransactionsUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', extendedPublicKey: string, context?: string, limit?: number, offset?: number, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListHDWalletXPubYPubZPubTransactionsUTXOR;
    }>;
    listHDWalletXPubYPubZPubUTXOs(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', extendedPublicKey: string, context?: string, limit?: number, offset?: number, derivation?: 'account' | 'bip32', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListHDWalletXPubYPubZPubUTXOsR;
    }>;
    listSyncedAddressesUTXO(blockchain: 'bitcoin' | 'bitcoin-cash' | 'dash' | 'dogecoin' | 'litecoin' | 'zcash', network: 'mainnet' | 'testnet', extendedPublicKey: string, context?: string, addressFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2pkh-cash' | 'p2sh-cash', isChangeAddress?: string, limit?: number, offset?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListSyncedAddressesUTXOR;
    }>;
    prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'zcash', network: 'testnet' | 'mainnet', extendedPublicKey: string, context?: string, prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB?: PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR;
    }>;
}
