import http from 'http';
import { EstimateContractInteractionGasLimitEVMR } from '../model/estimateContractInteractionGasLimitEVMR';
import { EstimateContractInteractionGasLimitEVMRB } from '../model/estimateContractInteractionGasLimitEVMRB';
import { EstimateNativeCoinTransferGasLimitEVMR } from '../model/estimateNativeCoinTransferGasLimitEVMR';
import { EstimateNativeCoinTransferGasLimitEVMRB } from '../model/estimateNativeCoinTransferGasLimitEVMRB';
import { EstimateTokenTransferGasLimitEVMR } from '../model/estimateTokenTransferGasLimitEVMR';
import { EstimateTokenTransferGasLimitEVMRB } from '../model/estimateTokenTransferGasLimitEVMRB';
import { GetEIP1559FeeRecommendationsEVMR } from '../model/getEIP1559FeeRecommendationsEVMR';
import { GetFeeRecommendationsEVMR } from '../model/getFeeRecommendationsEVMR';
import { GetFeeRecommendationsTRONR } from '../model/getFeeRecommendationsTRONR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum BlockchainFeesEVMApiApiKeys {
    ApiKey = 0
}
export declare class BlockchainFeesEVMApi {
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
    setApiKey(key: BlockchainFeesEVMApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    estimateContractInteractionGasLimitEVM(blockchain: 'arbitrum' | 'avalanche' | 'base' | 'optimism' | 'polygon' | 'tron', network: 'sepolia' | 'mainnet' | 'fuji' | 'amoy' | 'nile', context?: string, estimateContractInteractionGasLimitEVMRB?: EstimateContractInteractionGasLimitEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateContractInteractionGasLimitEVMR;
    }>;
    estimateNativeCoinTransferGasLimitEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'arbitrum' | 'avalanche' | 'base' | 'optimism' | 'polygon' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'fuji' | 'amoy' | 'nile', context?: string, estimateNativeCoinTransferGasLimitEVMRB?: EstimateNativeCoinTransferGasLimitEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateNativeCoinTransferGasLimitEVMR;
    }>;
    estimateTokenTransferGasLimitEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'arbitrum' | 'avalanche' | 'base' | 'optimism' | 'polygon' | 'tron', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'fuji' | 'amoy' | 'nile', context?: string, estimateTokenTransferGasLimitEVMRB?: EstimateTokenTransferGasLimitEVMRB, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: EstimateTokenTransferGasLimitEVMR;
    }>;
    getEIP1559FeeRecommendationsEVM(network: 'mainnet' | 'sepolia' | 'amoy', blockchain: 'ethereum' | 'polygon' | 'optimism' | 'arbitrum' | 'base', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetEIP1559FeeRecommendationsEVMR;
    }>;
    getFeeRecommendationsEVM(blockchain: 'ethereum' | 'ethereum-classic' | 'binance-smart-chain' | 'polygon' | 'optimism' | 'arbitrum' | 'base' | 'avalanche', network: 'mainnet' | 'mordor' | 'testnet' | 'sepolia' | 'amoy' | 'fuji', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsEVMR;
    }>;
    getFeeRecommendationsTRON(network: 'nile' | 'mainnet', context?: string, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetFeeRecommendationsTRONR;
    }>;
}
