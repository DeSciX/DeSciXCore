import { ListLogsByTransactionHashEVME403 } from './listLogsByTransactionHashEVME403';
export declare class ListLogsByTransactionHashEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLogsByTransactionHashEVME403;
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
