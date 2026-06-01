import { EstimateFA12TransferFeeTezosRBData } from './estimateFA12TransferFeeTezosRBData';
export declare class EstimateFA12TransferFeeTezosRB {
    'context'?: string;
    'data': EstimateFA12TransferFeeTezosRBData;
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
