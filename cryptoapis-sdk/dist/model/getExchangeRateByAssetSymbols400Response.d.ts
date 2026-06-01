import { GetExchangeRateByAssetSymbolsE400 } from './getExchangeRateByAssetSymbolsE400';
export declare class GetExchangeRateByAssetSymbols400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetSymbolsE400;
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
