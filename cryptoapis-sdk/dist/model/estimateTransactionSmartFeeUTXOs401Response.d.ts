import { EstimateTransactionSmartFeeUTXOsE401 } from './estimateTransactionSmartFeeUTXOsE401';
export declare class EstimateTransactionSmartFeeUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransactionSmartFeeUTXOsE401;
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
