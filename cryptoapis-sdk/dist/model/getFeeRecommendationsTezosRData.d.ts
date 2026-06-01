import { GetFeeRecommendationsTezosRI } from './getFeeRecommendationsTezosRI';
export declare class GetFeeRecommendationsTezosRData {
    'item': GetFeeRecommendationsTezosRI;
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
