import { EstimateNativeCoinTransferGasLimitEVME400 } from './estimateNativeCoinTransferGasLimitEVME400';
export declare class EstimateNativeCoinTransferGasLimitEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateNativeCoinTransferGasLimitEVME400;
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
