import { GetFeeRecommendationsEVMRI } from './getFeeRecommendationsEVMRI';
export declare class GetFeeRecommendationsEVMRData {
    'item': GetFeeRecommendationsEVMRI;
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
