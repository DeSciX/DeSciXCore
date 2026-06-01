import { EstimateTokenTransferGasLimitEVME403 } from './estimateTokenTransferGasLimitEVME403';
export declare class EstimateTokenTransferGasLimitEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTokenTransferGasLimitEVME403;
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
