import { GetFeeRecommendationsKASPAE403 } from './getFeeRecommendationsKASPAE403';
export declare class GetFeeRecommendationsKASPA403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsKASPAE403;
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
