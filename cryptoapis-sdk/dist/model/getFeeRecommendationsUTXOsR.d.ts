import { GetFeeRecommendationsUTXOsRData } from './getFeeRecommendationsUTXOsRData';
export declare class GetFeeRecommendationsUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetFeeRecommendationsUTXOsRData;
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
