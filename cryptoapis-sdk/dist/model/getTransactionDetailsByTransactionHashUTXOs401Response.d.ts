import { GetTransactionDetailsByTransactionHashUTXOsE401 } from './getTransactionDetailsByTransactionHashUTXOsE401';
export declare class GetTransactionDetailsByTransactionHashUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashUTXOsE401;
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
