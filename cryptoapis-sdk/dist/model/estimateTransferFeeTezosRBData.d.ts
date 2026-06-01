import { EstimateTransferFeeTezosRBDataItem } from './estimateTransferFeeTezosRBDataItem';
export declare class EstimateTransferFeeTezosRBData {
    'item': EstimateTransferFeeTezosRBDataItem;
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
