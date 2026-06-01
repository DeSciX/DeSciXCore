import { GetFeeRecommendationsUTXOsRI } from './getFeeRecommendationsUTXOsRI';
export declare class GetFeeRecommendationsUTXOsRData {
    'item': GetFeeRecommendationsUTXOsRI;
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
