import { EstimateContractInteractionGasLimitEVME401 } from './estimateContractInteractionGasLimitEVME401';
export declare class EstimateContractInteractionGasLimitEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateContractInteractionGasLimitEVME401;
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
