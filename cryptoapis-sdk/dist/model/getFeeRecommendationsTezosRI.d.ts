export declare class GetFeeRecommendationsTezosRI {
    'minimalCostPerByte': string;
    'minimalCostPerGasUnit': string;
    'minimalFee': string;
    'storageCostPerByte': string;
    'unit': string;
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
