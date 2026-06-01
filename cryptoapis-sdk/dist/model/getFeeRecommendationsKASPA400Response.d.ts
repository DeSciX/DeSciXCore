import { GetFeeRecommendationsKASPAE400 } from './getFeeRecommendationsKASPAE400';
export declare class GetFeeRecommendationsKASPA400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsKASPAE400;
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
