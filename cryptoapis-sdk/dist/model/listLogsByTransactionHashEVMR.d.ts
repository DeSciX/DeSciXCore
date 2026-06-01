import { ListLogsByTransactionHashEVMRData } from './listLogsByTransactionHashEVMRData';
export declare class ListLogsByTransactionHashEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListLogsByTransactionHashEVMRData;
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
