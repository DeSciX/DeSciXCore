import { EstimateContractInteractionGasLimitEVME400 } from './estimateContractInteractionGasLimitEVME400';
export declare class EstimateContractInteractionGasLimitEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateContractInteractionGasLimitEVME400;
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
