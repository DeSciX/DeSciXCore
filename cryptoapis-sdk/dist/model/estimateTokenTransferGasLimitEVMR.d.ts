import { EstimateTokenTransferGasLimitEVMRData } from './estimateTokenTransferGasLimitEVMRData';
export declare class EstimateTokenTransferGasLimitEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateTokenTransferGasLimitEVMRData;
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
