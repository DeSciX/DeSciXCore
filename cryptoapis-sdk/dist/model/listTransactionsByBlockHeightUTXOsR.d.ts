import { ListTransactionsByBlockHeightUTXOsRData } from './listTransactionsByBlockHeightUTXOsRData';
export declare class ListTransactionsByBlockHeightUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByBlockHeightUTXOsRData;
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
