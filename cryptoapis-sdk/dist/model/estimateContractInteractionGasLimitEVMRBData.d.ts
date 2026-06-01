import { EstimateContractInteractionGasLimitEVMRBDataItem } from './estimateContractInteractionGasLimitEVMRBDataItem';
export declare class EstimateContractInteractionGasLimitEVMRBData {
    'item': EstimateContractInteractionGasLimitEVMRBDataItem;
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
