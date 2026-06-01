import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIFee } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIFee';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIValue } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIValue';
export declare class ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI {
    'contract': string;
    'fee': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIFee;
    'gasLimit': number;
    'gasUsed': number;
    'hash': string;
    'inputData': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'value': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIValue;
    'gasPrice': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice;
    'minedInBlock': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock;
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
