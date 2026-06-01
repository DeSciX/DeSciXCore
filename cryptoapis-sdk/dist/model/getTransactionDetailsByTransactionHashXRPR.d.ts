import { GetTransactionDetailsByTransactionHashXRPRData } from './getTransactionDetailsByTransactionHashXRPRData';
export declare class GetTransactionDetailsByTransactionHashXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetTransactionDetailsByTransactionHashXRPRData;
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
