import { EstimateTransactionSmartFeeUTXOsRData } from './estimateTransactionSmartFeeUTXOsRData';
export declare class EstimateTransactionSmartFeeUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': EstimateTransactionSmartFeeUTXOsRData;
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
