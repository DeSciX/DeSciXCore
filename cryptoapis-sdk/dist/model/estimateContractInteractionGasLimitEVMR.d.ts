import { EstimateContractInteractionGasLimitEVMRData } from './estimateContractInteractionGasLimitEVMRData';
export declare class EstimateContractInteractionGasLimitEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateContractInteractionGasLimitEVMRData;
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
