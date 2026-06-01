import { ListTransactionsByBlockHashXRPE400 } from './listTransactionsByBlockHashXRPE400';
export declare class ListTransactionsByBlockHashXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHashXRPE400;
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
