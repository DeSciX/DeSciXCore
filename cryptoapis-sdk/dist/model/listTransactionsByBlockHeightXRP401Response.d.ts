import { ListTransactionsByBlockHeightXRPE401 } from './listTransactionsByBlockHeightXRPE401';
export declare class ListTransactionsByBlockHeightXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightXRPE401;
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
