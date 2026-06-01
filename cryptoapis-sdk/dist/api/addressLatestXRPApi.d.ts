import http from 'http';
import { GetAddressBalanceXRPR } from '../model/getAddressBalanceXRPR';
import { ListTransactionsByAddressXRPR } from '../model/listTransactionsByAddressXRPR';
import { NextAvailableSequenceXRPR } from '../model/nextAvailableSequenceXRPR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum AddressLatestXRPApiApiKeys {
    ApiKey = 0
}
export declare class AddressLatestXRPApi {
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
    setApiKey(key: AddressLatestXRPApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getAddressBalanceXRP(network: 'mainnet' | 'testnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetAddressBalanceXRPR;
    }>;
    listTransactionsByAddressXRP(network: 'mainnet' | 'testnet', address: string, context?: string, limit?: number, sortingOrder?: string, startingAfter?: string, transactionType?: 'account-set' | 'account-delete' | 'check-cancel' | 'check-cash' | 'check-create' | 'deposit-preauth' | 'escrow-cancel' | 'escrow-create' | 'escrow-finish' | 'offer-cancel' | 'offer-create' | 'payment' | 'payment-channel-claim' | 'payment-channel-create' | 'payment-channel-fund' | 'set-regular-key' | 'signer-list-set' | 'ticket-create' | 'trust-set', options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: ListTransactionsByAddressXRPR;
    }>;
    nextAvailableSequenceXRP(network: 'mainnet' | 'testnet', address: string, context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: NextAvailableSequenceXRPR;
    }>;
}
