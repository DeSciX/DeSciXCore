import { GetEIP1559FeeRecommendationsEVMRData } from './getEIP1559FeeRecommendationsEVMRData';
export declare class GetEIP1559FeeRecommendationsEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetEIP1559FeeRecommendationsEVMRData;
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
