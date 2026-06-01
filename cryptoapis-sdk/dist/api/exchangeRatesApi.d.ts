import http from 'http';
import { GetExchangeRateByAssetSymbolsR } from '../model/getExchangeRateByAssetSymbolsR';
import { GetExchangeRateByAssetsIDsR } from '../model/getExchangeRateByAssetsIDsR';
import { Authentication, Interceptor } from '../model/models';
import { ApiKeyAuth } from '../model/models';
export declare enum ExchangeRatesApiApiKeys {
    ApiKey = 0
}
export declare class ExchangeRatesApi {
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
    setApiKey(key: ExchangeRatesApiApiKeys, value: string): void;
    addInterceptor(interceptor: Interceptor): void;
    getExchangeRateByAssetSymbols(fromAssetSymbol: string, toAssetSymbol: string, context?: string, calculationTimestamp?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetExchangeRateByAssetSymbolsR;
    }>;
    getExchangeRateByAssetsIDs(fromAssetId: string, toAssetId: string, context?: string, calculationTimestamp?: number, options?: {
        headers: {
            [name: string]: string;
        };
    }): Promise<{
        response: http.IncomingMessage;
        body: GetExchangeRateByAssetsIDsR;
    }>;
}
