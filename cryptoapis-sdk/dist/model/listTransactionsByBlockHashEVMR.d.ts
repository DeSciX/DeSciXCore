import { ListTransactionsByBlockHashEVMRData } from './listTransactionsByBlockHashEVMRData';
export declare class ListTransactionsByBlockHashEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByBlockHashEVMRData;
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
