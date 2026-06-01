import { EstimateFA2TransferFeeTezosRBData } from './estimateFA2TransferFeeTezosRBData';
export declare class EstimateFA2TransferFeeTezosRB {
    'context'?: string;
    'data': EstimateFA2TransferFeeTezosRBData;
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
