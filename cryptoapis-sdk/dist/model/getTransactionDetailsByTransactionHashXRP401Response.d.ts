import { GetTransactionDetailsByTransactionHashXRPE401 } from './getTransactionDetailsByTransactionHashXRPE401';
export declare class GetTransactionDetailsByTransactionHashXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashXRPE401;
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
