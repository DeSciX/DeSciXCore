import { ListConfirmedTransactionsByAddressEVMHistoryRIBST } from './listConfirmedTransactionsByAddressEVMHistoryRIBST';
import { ListConfirmedTransactionsByAddressEVMHistoryRIFee } from './listConfirmedTransactionsByAddressEVMHistoryRIFee';
import { ListConfirmedTransactionsByAddressEVMHistoryRIValue } from './listConfirmedTransactionsByAddressEVMHistoryRIValue';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice';
import { ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock } from './listConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock';
export declare class ListConfirmedTransactionsByAddressEVMHistoryRI {
    'contract': string;
    'fee': ListConfirmedTransactionsByAddressEVMHistoryRIFee;
    'gasLimit': number;
    'gasUsed': number;
    'hash': string;
    'inputData': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'value': ListConfirmedTransactionsByAddressEVMHistoryRIValue;
    'gasPrice': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIGasPrice;
    'minedInBlock': ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRIMinedInBlock;
    'vallue': object;
    'blockchainSpecific'?: ListConfirmedTransactionsByAddressEVMHistoryRIBST;
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
