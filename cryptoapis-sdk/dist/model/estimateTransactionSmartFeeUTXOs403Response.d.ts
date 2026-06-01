import { EstimateTransactionSmartFeeUTXOsE403 } from './estimateTransactionSmartFeeUTXOsE403';
export declare class EstimateTransactionSmartFeeUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': EstimateTransactionSmartFeeUTXOsE403;
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
