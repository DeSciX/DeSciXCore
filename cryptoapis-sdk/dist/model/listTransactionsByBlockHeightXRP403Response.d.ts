import { ListTransactionsByBlockHeightXRPE403 } from './listTransactionsByBlockHeightXRPE403';
export declare class ListTransactionsByBlockHeightXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightXRPE403;
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
