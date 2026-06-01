import { ListTransactionsByBlockHeightUTXOsE400 } from './listTransactionsByBlockHeightUTXOsE400';
export declare class ListTransactionsByBlockHeightUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightUTXOsE400;
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
