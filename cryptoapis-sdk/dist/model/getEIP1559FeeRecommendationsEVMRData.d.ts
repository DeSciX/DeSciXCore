import { GetEIP1559FeeRecommendationsEVMRI } from './getEIP1559FeeRecommendationsEVMRI';
export declare class GetEIP1559FeeRecommendationsEVMRData {
    'item': GetEIP1559FeeRecommendationsEVMRI;
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
