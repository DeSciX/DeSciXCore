import { GetEIP1559FeeRecommendationsEVMRIBaseFeePerGas } from './getEIP1559FeeRecommendationsEVMRIBaseFeePerGas';
import { GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas } from './getEIP1559FeeRecommendationsEVMRIMaxFeePerGas';
import { GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas } from './getEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas';
export declare class GetEIP1559FeeRecommendationsEVMRI {
    'lastBlock': number;
    'baseFeePerGas': GetEIP1559FeeRecommendationsEVMRIBaseFeePerGas;
    'maxFeePerGas': GetEIP1559FeeRecommendationsEVMRIMaxFeePerGas;
    'maxPriorityFeePerGas': GetEIP1559FeeRecommendationsEVMRIMaxPriorityFeePerGas;
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
