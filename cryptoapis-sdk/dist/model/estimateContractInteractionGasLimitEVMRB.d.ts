import { EstimateContractInteractionGasLimitEVMRBData } from './estimateContractInteractionGasLimitEVMRBData';
export declare class EstimateContractInteractionGasLimitEVMRB {
    'context'?: string;
    'data': EstimateContractInteractionGasLimitEVMRBData;
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
