import http from 'http';
import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesR } from '../model/deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum FeaturesApiApiKeys {
    ApiKey = 0
}
export declare class FeaturesApi {
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
    setApiKey(key: FeaturesApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    deriveHDWalletXPubYPubZPubChangeOrReceivingAddresses(blockchain: 'bitcoin' | 'bitcoin-cash' | 'litecoin' | 'dogecoin' | 'dash' | 'ethereum' | 'ethereum-classic' | 'xrp' | 'binance-smart-chain' | 'zcash' | 'tron', extendedPublicKey: string, network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, addressFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'standard' | 'p2sh-cash' | 'p2pkh-cash' | 'classic' | 'base58', addressesCount?: number, isChange?: boolean, startIndex?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesR;
    }>;
}
