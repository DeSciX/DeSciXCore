import { GetFeeRecommendationsEVMRData } from './getFeeRecommendationsEVMRData';
export declare class GetFeeRecommendationsEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetFeeRecommendationsEVMRData;
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
