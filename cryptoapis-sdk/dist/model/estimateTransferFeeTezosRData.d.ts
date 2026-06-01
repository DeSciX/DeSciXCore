import { EstimateTransferFeeTezosRI } from './estimateTransferFeeTezosRI';
export declare class EstimateTransferFeeTezosRData {
    'item': EstimateTransferFeeTezosRI;
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
