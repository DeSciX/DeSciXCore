import { EstimateTransactionSmartFeeUTXOsRI } from './estimateTransactionSmartFeeUTXOsRI';
export declare class EstimateTransactionSmartFeeUTXOsRData {
    'item': EstimateTransactionSmartFeeUTXOsRI;
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
