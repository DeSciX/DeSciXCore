import { GetFeeRecommendationsTezosRData } from './getFeeRecommendationsTezosRData';
export declare class GetFeeRecommendationsTezosR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetFeeRecommendationsTezosRData;
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
