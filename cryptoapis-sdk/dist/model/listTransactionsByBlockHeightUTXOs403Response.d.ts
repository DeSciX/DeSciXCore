import { ListTransactionsByBlockHeightUTXOsE403 } from './listTransactionsByBlockHeightUTXOsE403';
export declare class ListTransactionsByBlockHeightUTXOs403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightUTXOsE403;
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
