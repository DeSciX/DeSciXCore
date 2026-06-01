import { ListTransactionsByBlockHashUTXOsRData } from './listTransactionsByBlockHashUTXOsRData';
export declare class ListTransactionsByBlockHashUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByBlockHashUTXOsRData;
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
