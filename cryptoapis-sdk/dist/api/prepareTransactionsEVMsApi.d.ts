import http from 'http';
import { PrepareAFungibleTokenTransferFromAddressEVMR } from '../model/prepareAFungibleTokenTransferFromAddressEVMR';
import { PrepareAFungibleTokenTransferFromAddressEVMRB } from '../model/prepareAFungibleTokenTransferFromAddressEVMRB';
import { PrepareANonFungibleTokenTransferFromAddressEVMR } from '../model/prepareANonFungibleTokenTransferFromAddressEVMR';
import { PrepareANonFungibleTokenTransferFromAddressEVMRB } from '../model/prepareANonFungibleTokenTransferFromAddressEVMRB';
import { PrepareTransactionFromAddressEVMR } from '../model/prepareTransactionFromAddressEVMR';
import { PrepareTransactionFromAddressEVMRB } from '../model/prepareTransactionFromAddressEVMRB';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum PrepareTransactionsEVMsApiApiKeys {
    ApiKey = 0
}
export declare class PrepareTransactionsEVMsApi {
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
    setApiKey(key: PrepareTransactionsEVMsApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    prepareAFungibleTokenTransferFromAddressEVM(blockchain: 'ethereum-classic' | 'binance-smart-chain' | 'ethereum', network: 'mordor' | 'testnet' | 'mainnet' | 'sepolia', context?: string, prepareAFungibleTokenTransferFromAddressEVMRB?: PrepareAFungibleTokenTransferFromAddressEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: PrepareAFungibleTokenTransferFromAddressEVMR;
    }>;
    prepareANonFungibleTokenTransferFromAddressEVM(blockchain: 'binance-smart-chain' | 'ethereum', network: 'testnet' | 'mainnet' | 'sepolia', context?: string, prepareANonFungibleTokenTransferFromAddressEVMRB?: PrepareANonFungibleTokenTransferFromAddressEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: PrepareANonFungibleTokenTransferFromAddressEVMR;
    }>;
    prepareTransactionFromAddressEVM(blockchain: 'binance-smart-chain' | 'ethereum-classic' | 'ethereum', network: 'testnet' | 'mordor' | 'mainnet' | 'sepolia', type: 'legacy-transaction', context?: string, prepareTransactionFromAddressEVMRB?: PrepareTransactionFromAddressEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: PrepareTransactionFromAddressEVMR;
    }>;
}
