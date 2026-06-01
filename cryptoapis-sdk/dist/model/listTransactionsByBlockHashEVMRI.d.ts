import { ListTransactionsByBlockHashEVMRIBlockchainSpecific } from './listTransactionsByBlockHashEVMRIBlockchainSpecific';
import { ListTransactionsByBlockHashEVMRIFee } from './listTransactionsByBlockHashEVMRIFee';
import { ListTransactionsByBlockHashEVMRIGasPrice } from './listTransactionsByBlockHashEVMRIGasPrice';
import { ListTransactionsByBlockHashEVMRIValue } from './listTransactionsByBlockHashEVMRIValue';
export declare class ListTransactionsByBlockHashEVMRI {
    'contract': number;
    'fee': ListTransactionsByBlockHashEVMRIFee;
    'hash': string;
    'inputData': number;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'value': ListTransactionsByBlockHashEVMRIValue;
    'gasLimit': number;
    'gasUsed': number;
    'gasPrice': ListTransactionsByBlockHashEVMRIGasPrice;
    'blockchainSpecific': ListTransactionsByBlockHashEVMRIBlockchainSpecific;
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
