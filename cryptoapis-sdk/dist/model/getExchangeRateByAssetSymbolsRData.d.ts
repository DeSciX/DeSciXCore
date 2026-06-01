import { GetExchangeRateByAssetSymbolsRI } from './getExchangeRateByAssetSymbolsRI';
export declare class GetExchangeRateByAssetSymbolsRData {
    'item': GetExchangeRateByAssetSymbolsRI;
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
