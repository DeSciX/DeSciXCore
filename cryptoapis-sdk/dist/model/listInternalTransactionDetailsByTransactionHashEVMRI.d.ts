import { ListInternalTransactionDetailsByTransactionHashEVMRIValue } from './listInternalTransactionDetailsByTransactionHashEVMRIValue';
export declare class ListInternalTransactionDetailsByTransactionHashEVMRI {
    'operationId': string;
    'operationType': string;
    'recipient': string;
    'sender': string;
    'value': ListInternalTransactionDetailsByTransactionHashEVMRIValue;
    'timestamp': number;
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
