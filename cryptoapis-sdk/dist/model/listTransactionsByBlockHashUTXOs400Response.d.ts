import { ListTransactionsByBlockHashUTXOsE400 } from './listTransactionsByBlockHashUTXOsE400';
export declare class ListTransactionsByBlockHashUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHashUTXOsE400;
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
