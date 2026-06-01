import { EstimateContractInteractionGasLimitEVME403 } from './estimateContractInteractionGasLimitEVME403';
export declare class EstimateContractInteractionGasLimitEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateContractInteractionGasLimitEVME403;
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
