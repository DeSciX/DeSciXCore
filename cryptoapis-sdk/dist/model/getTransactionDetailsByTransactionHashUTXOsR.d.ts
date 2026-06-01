import { GetTransactionDetailsByTransactionHashUTXOsRData } from './getTransactionDetailsByTransactionHashUTXOsRData';
export declare class GetTransactionDetailsByTransactionHashUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetTransactionDetailsByTransactionHashUTXOsRData;
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
