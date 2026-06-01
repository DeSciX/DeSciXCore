import { GetFeeRecommendationsXRPRData } from './getFeeRecommendationsXRPRData';
export declare class GetFeeRecommendationsXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetFeeRecommendationsXRPRData;
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
