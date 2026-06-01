import { ListSyncedAddressInternalTransactionsEVMRIMinedInBlock } from './listSyncedAddressInternalTransactionsEVMRIMinedInBlock';
import { ListSyncedAddressInternalTransactionsEVMRIValue } from './listSyncedAddressInternalTransactionsEVMRIValue';
export declare class ListSyncedAddressInternalTransactionsEVMRI {
    'timestamp': number;
    'transactionHash': string;
    'minedInBlock': ListSyncedAddressInternalTransactionsEVMRIMinedInBlock;
    'operationId': string;
    'operationType': string;
    'recipient': string;
    'sender': string;
    'value': ListSyncedAddressInternalTransactionsEVMRIValue;
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
