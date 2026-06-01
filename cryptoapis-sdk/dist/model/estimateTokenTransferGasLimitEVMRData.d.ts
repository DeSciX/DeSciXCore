import { EstimateTokenTransferGasLimitEVMRI } from './estimateTokenTransferGasLimitEVMRI';
export declare class EstimateTokenTransferGasLimitEVMRData {
    'item': EstimateTokenTransferGasLimitEVMRI;
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
