import { ListLogsByTransactionHashEVME401 } from './listLogsByTransactionHashEVME401';
export declare class ListLogsByTransactionHashEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLogsByTransactionHashEVME401;
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
