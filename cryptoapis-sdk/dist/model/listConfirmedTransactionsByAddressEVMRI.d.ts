import { ListConfirmedTransactionsByAddressEVMRIBST } from './listConfirmedTransactionsByAddressEVMRIBST';
import { ListConfirmedTransactionsByAddressEVMRIFee } from './listConfirmedTransactionsByAddressEVMRIFee';
import { ListConfirmedTransactionsByAddressEVMRIGasPrice } from './listConfirmedTransactionsByAddressEVMRIGasPrice';
import { ListConfirmedTransactionsByAddressEVMRIMinedInBlock } from './listConfirmedTransactionsByAddressEVMRIMinedInBlock';
import { ListConfirmedTransactionsByAddressEVMRIValue } from './listConfirmedTransactionsByAddressEVMRIValue';
export declare class ListConfirmedTransactionsByAddressEVMRI {
    'contract': string;
    'fee': ListConfirmedTransactionsByAddressEVMRIFee;
    'gasLimit': number;
    'gasUsed': number;
    'hash': string;
    'inputData': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'gasPrice': ListConfirmedTransactionsByAddressEVMRIGasPrice;
    'minedInBlock': ListConfirmedTransactionsByAddressEVMRIMinedInBlock;
    'value': ListConfirmedTransactionsByAddressEVMRIValue;
    'blockchainSpecific'?: ListConfirmedTransactionsByAddressEVMRIBST;
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
