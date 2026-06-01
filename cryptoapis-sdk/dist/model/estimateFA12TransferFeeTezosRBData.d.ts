import { EstimateFA12TransferFeeTezosRBDataItem } from './estimateFA12TransferFeeTezosRBDataItem';
export declare class EstimateFA12TransferFeeTezosRBData {
    'item': EstimateFA12TransferFeeTezosRBDataItem;
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
