import { GetFeeRecommendationsKASPARData } from './getFeeRecommendationsKASPARData';
export declare class GetFeeRecommendationsKASPAR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetFeeRecommendationsKASPARData;
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
