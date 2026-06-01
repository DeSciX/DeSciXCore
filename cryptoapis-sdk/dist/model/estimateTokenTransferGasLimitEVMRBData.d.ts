import { EstimateTokenTransferGasLimitEVMRBDataItem } from './estimateTokenTransferGasLimitEVMRBDataItem';
export declare class EstimateTokenTransferGasLimitEVMRBData {
    'item': EstimateTokenTransferGasLimitEVMRBDataItem;
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
