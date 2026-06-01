import { EstimateNativeCoinTransferGasLimitEVMRBData } from './estimateNativeCoinTransferGasLimitEVMRBData';
export declare class EstimateNativeCoinTransferGasLimitEVMRB {
    'context'?: string;
    'data': EstimateNativeCoinTransferGasLimitEVMRBData;
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
