import { EstimateNativeCoinTransferGasLimitEVME403 } from './estimateNativeCoinTransferGasLimitEVME403';
export declare class EstimateNativeCoinTransferGasLimitEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateNativeCoinTransferGasLimitEVME403;
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
