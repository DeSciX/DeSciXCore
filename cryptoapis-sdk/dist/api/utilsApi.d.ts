import http from 'http';
import { ConvertBitcoinCashAddressR } from '../model/convertBitcoinCashAddressR';
import { ConvertBitcoinCashAddressRB } from '../model/convertBitcoinCashAddressRB';
import { DecodeRawTransactionHexEVMR } from '../model/decodeRawTransactionHexEVMR';
import { DecodeRawTransactionHexEVMRB } from '../model/decodeRawTransactionHexEVMRB';
import { DecodeXAddressR } from '../model/decodeXAddressR';
import { EncodeXAddressR } from '../model/encodeXAddressR';
import { ValidateAddressEVMR } from '../model/validateAddressEVMR';
import { ValidateAddressEVMRB } from '../model/validateAddressEVMRB';
import { ValidateAddressXRPR } from '../model/validateAddressXRPR';
import { ValidateAddressXRPRB } from '../model/validateAddressXRPRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum UtilsApiApiKeys {
    ApiKey = 0
}
export declare class UtilsApi {
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
    setApiKey(key: UtilsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    convertBitcoinCashAddress(blockchain: 'bitcoin-cash', network: 'mainnet' | 'testnet', context?: string, convertBitcoinCashAddressRB?: ConvertBitcoinCashAddressRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ConvertBitcoinCashAddressR;
    }>;
    decodeRawTransactionHexEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain', network: string, context?: string, decodeRawTransactionHexEVMRB?: DecodeRawTransactionHexEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DecodeRawTransactionHexEVMR;
    }>;
    decodeXAddress(blockchain: 'xrp', network: 'mainnet' | 'testnet', xAddress: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: DecodeXAddressR;
    }>;
    encodeXAddress(addressTag: number, blockchain: 'xrp', classicAddress: string, network: 'mainnet' | 'testnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EncodeXAddressR;
    }>;
    validateAddressEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'tron', network: 'mainnet' | 'testnet' | 'mordor' | 'nile' | 'sepolia', context?: string, validateAddressEVMRB?: ValidateAddressEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ValidateAddressEVMR;
    }>;
    validateAddressXRP(blockchain: 'xrp', network: 'mainnet' | 'testnet', context?: string, validateAddressXRPRB?: ValidateAddressXRPRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ValidateAddressXRPR;
    }>;
}
