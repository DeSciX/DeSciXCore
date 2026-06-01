import { ListLogsByTransactionHashEVME400 } from './listLogsByTransactionHashEVME400';
export declare class ListLogsByTransactionHashEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListLogsByTransactionHashEVME400;
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
