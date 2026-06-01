import { EstimateTokenTransferGasLimitEVMRBData } from './estimateTokenTransferGasLimitEVMRBData';
export declare class EstimateTokenTransferGasLimitEVMRB {
    'context'?: string;
    'data': EstimateTokenTransferGasLimitEVMRBData;
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
