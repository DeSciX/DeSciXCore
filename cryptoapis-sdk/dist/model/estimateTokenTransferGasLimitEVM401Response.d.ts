import { EstimateTokenTransferGasLimitEVME401 } from './estimateTokenTransferGasLimitEVME401';
export declare class EstimateTokenTransferGasLimitEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTokenTransferGasLimitEVME401;
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
