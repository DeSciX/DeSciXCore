import { GetFeeRecommendationsUTXOsE401 } from './getFeeRecommendationsUTXOsE401';
export declare class GetFeeRecommendationsUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetFeeRecommendationsUTXOsE401;
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
