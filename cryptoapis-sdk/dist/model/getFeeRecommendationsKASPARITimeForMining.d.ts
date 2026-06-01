export declare class GetFeeRecommendationsKASPARITimeForMining {
    'fast': number;
    'slow': number;
    'standard': number;
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
