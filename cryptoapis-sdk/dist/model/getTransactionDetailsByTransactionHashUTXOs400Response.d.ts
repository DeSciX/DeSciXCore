import { GetTransactionDetailsByTransactionHashUTXOsE400 } from './getTransactionDetailsByTransactionHashUTXOsE400';
export declare class GetTransactionDetailsByTransactionHashUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashUTXOsE400;
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
