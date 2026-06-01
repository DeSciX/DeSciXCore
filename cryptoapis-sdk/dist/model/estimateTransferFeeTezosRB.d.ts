import { EstimateTransferFeeTezosRBData } from './estimateTransferFeeTezosRBData';
export declare class EstimateTransferFeeTezosRB {
    'context'?: string;
    'data': EstimateTransferFeeTezosRBData;
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
