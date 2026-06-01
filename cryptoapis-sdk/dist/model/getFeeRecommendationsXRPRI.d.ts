export declare class GetFeeRecommendationsXRPRI {
    'fast': string;
    'feeCushionMultiplier': string;
    'slow': string;
    'standard': string;
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
