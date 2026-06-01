import { EstimateFA2TransferFeeTezosRBDataItem } from './estimateFA2TransferFeeTezosRBDataItem';
export declare class EstimateFA2TransferFeeTezosRBData {
    'item': EstimateFA2TransferFeeTezosRBDataItem;
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
