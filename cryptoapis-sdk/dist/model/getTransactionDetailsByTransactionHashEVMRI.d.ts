import { GetTransactionDetailsByTransactionHashEVMRIBSE } from './getTransactionDetailsByTransactionHashEVMRIBSE';
import { GetTransactionDetailsByTransactionHashEVMRIFee } from './getTransactionDetailsByTransactionHashEVMRIFee';
import { GetTransactionDetailsByTransactionHashEVMRIGasPrice } from './getTransactionDetailsByTransactionHashEVMRIGasPrice';
import { GetTransactionDetailsByTransactionHashEVMRIMinedInBlock } from './getTransactionDetailsByTransactionHashEVMRIMinedInBlock';
import { GetTransactionDetailsByTransactionHashEVMRIValue } from './getTransactionDetailsByTransactionHashEVMRIValue';
export declare class GetTransactionDetailsByTransactionHashEVMRI {
    'contract'?: string;
    'fee': GetTransactionDetailsByTransactionHashEVMRIFee;
    'gasLimit': number;
    'gasUsed': number;
    'hash': string;
    'inputData': string;
    'nonce': number;
    'positionInBlock': number;
    'recipient': string;
    'sender': string;
    'status': string;
    'timestamp': number;
    'value': GetTransactionDetailsByTransactionHashEVMRIValue;
    'gasPrice': GetTransactionDetailsByTransactionHashEVMRIGasPrice;
    'minedInBlock': GetTransactionDetailsByTransactionHashEVMRIMinedInBlock;
    'blockchainSpecific'?: GetTransactionDetailsByTransactionHashEVMRIBSE;
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
