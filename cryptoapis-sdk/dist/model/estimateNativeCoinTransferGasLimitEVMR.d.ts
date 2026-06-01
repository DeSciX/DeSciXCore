import { EstimateNativeCoinTransferGasLimitEVMRData } from './estimateNativeCoinTransferGasLimitEVMRData';
export declare class EstimateNativeCoinTransferGasLimitEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateNativeCoinTransferGasLimitEVMRData;
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
