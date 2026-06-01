import { EstimateTransactionSmartFeeUTXOsE400 } from './estimateTransactionSmartFeeUTXOsE400';
export declare class EstimateTransactionSmartFeeUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransactionSmartFeeUTXOsE400;
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
