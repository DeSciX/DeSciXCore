import { ListInternalTransactionDetailsByTransactionHashEVMRData } from './listInternalTransactionDetailsByTransactionHashEVMRData';
export declare class ListInternalTransactionDetailsByTransactionHashEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListInternalTransactionDetailsByTransactionHashEVMRData;
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
