import { GetTransactionDetailsByTransactionHashUTXOsE403 } from './getTransactionDetailsByTransactionHashUTXOsE403';
export declare class GetTransactionDetailsByTransactionHashUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetTransactionDetailsByTransactionHashUTXOsE403;
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
