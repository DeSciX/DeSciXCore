import { GetFeeRecommendationsTRONE400 } from './getFeeRecommendationsTRONE400';
export declare class GetFeeRecommendationsTRON400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsTRONE400;
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
