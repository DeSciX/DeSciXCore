import { GetFeeRecommendationsTezosE400 } from './getFeeRecommendationsTezosE400';
export declare class GetFeeRecommendationsTezos400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsTezosE400;
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
