import { ListTransactionsByBlockHeightEVME403 } from './listTransactionsByBlockHeightEVME403';
export declare class ListTransactionsByBlockHeightEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByBlockHeightEVME403;
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
