import { ListTransactionsByBlockHeightUTXOsE401 } from './listTransactionsByBlockHeightUTXOsE401';
export declare class ListTransactionsByBlockHeightUTXOs401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightUTXOsE401;
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
