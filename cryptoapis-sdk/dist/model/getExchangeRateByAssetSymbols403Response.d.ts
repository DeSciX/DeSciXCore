import { GetExchangeRateByAssetSymbolsE403 } from './getExchangeRateByAssetSymbolsE403';
export declare class GetExchangeRateByAssetSymbols403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetSymbolsE403;
    static discriminator: string | undefined;
    static attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
    }[];
}
