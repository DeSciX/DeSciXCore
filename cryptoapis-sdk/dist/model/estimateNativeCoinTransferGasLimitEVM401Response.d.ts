import { EstimateNativeCoinTransferGasLimitEVME401 } from './estimateNativeCoinTransferGasLimitEVME401';
export declare class EstimateNativeCoinTransferGasLimitEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateNativeCoinTransferGasLimitEVME401;
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
