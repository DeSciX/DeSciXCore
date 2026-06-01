import { ListTransactionsByBlockHeightEVMRIBlockchainSpecific } from './listTransactionsByBlockHeightEVMRIBlockchainSpecific';
import { ListTransactionsByBlockHeightEVMRIFee } from './listTransactionsByBlockHeightEVMRIFee';
import { ListTransactionsByBlockHeightEVMRIGasPrice } from './listTransactionsByBlockHeightEVMRIGasPrice';
import { ListTransactionsByBlockHeightEVMRIValue } from './listTransactionsByBlockHeightEVMRIValue';
export declare class ListTransactionsByBlockHeightEVMRI {
    'contract': string;
    'fee': ListTransactionsByBlockHeightEVMRIFee;
    'hash': string;
    'inputData': string;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'value': ListTransactionsByBlockHeightEVMRIValue;
    'gasLimit': number;
    'gasUsed': number;
    'gasPrice': ListTransactionsByBlockHeightEVMRIGasPrice;
    'blockchainSpecific': ListTransactionsByBlockHeightEVMRIBlockchainSpecific;
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
