import { GetFeeRecommendationsKASPAE401 } from './getFeeRecommendationsKASPAE401';
export declare class GetFeeRecommendationsKASPA401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsKASPAE401;
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
