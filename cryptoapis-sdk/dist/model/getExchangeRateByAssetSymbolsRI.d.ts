export declare class GetExchangeRateByAssetSymbolsRI {
    'calculationTimestamp': number;
    'fromAssetId': string;
    'fromAssetSymbol': string;
    'rate': string;
    'toAssetId': string;
    'toAssetSymbol': string;
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
