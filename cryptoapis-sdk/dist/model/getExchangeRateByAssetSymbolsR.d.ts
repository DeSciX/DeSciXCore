import { GetExchangeRateByAssetSymbolsRData } from './getExchangeRateByAssetSymbolsRData';
export declare class GetExchangeRateByAssetSymbolsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetExchangeRateByAssetSymbolsRData;
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
