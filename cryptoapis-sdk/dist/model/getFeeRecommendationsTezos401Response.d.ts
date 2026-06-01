import { GetFeeRecommendationsTezosE401 } from './getFeeRecommendationsTezosE401';
export declare class GetFeeRecommendationsTezos401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsTezosE401;
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
