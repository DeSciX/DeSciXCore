import { EstimateNativeCoinTransferGasLimitEVMRI } from './estimateNativeCoinTransferGasLimitEVMRI';
export declare class EstimateNativeCoinTransferGasLimitEVMRData {
    'item': EstimateNativeCoinTransferGasLimitEVMRI;
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
