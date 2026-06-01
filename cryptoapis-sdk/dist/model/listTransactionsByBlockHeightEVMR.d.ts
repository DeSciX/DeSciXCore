import { ListTransactionsByBlockHeightEVMRData } from './listTransactionsByBlockHeightEVMRData';
export declare class ListTransactionsByBlockHeightEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListTransactionsByBlockHeightEVMRData;
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
