import { GetExchangeRateByAssetSymbolsE422 } from './getExchangeRateByAssetSymbolsE422';
export declare class GetExchangeRateByAssetSymbols422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetExchangeRateByAssetSymbolsE422;
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
