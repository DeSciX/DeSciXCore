import { ListTransactionsByBlockHeightXRPRData } from './listTransactionsByBlockHeightXRPRData';
export declare class ListTransactionsByBlockHeightXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByBlockHeightXRPRData;
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
