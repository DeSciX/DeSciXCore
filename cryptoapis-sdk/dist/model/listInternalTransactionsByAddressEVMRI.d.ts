import { ListInternalTransactionsByAddressEVMRIMinedInBlock } from './listInternalTransactionsByAddressEVMRIMinedInBlock';
import { ListInternalTransactionsByAddressEVMRIValue } from './listInternalTransactionsByAddressEVMRIValue';
export declare class ListInternalTransactionsByAddressEVMRI {
    'transactionHash': string;
    'minedInBlock': ListInternalTransactionsByAddressEVMRIMinedInBlock;
    'operationId': string;
    'operationType': string;
    'recipient': string;
    'sender': string;
    'timestamp': number;
    'value': ListInternalTransactionsByAddressEVMRIValue;
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
