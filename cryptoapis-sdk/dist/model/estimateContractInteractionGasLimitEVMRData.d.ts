import { EstimateContractInteractionGasLimitEVMRI } from './estimateContractInteractionGasLimitEVMRI';
export declare class EstimateContractInteractionGasLimitEVMRData {
    'item': EstimateContractInteractionGasLimitEVMRI;
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
