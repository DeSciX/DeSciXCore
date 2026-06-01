import { PrepareTransactionFromAddressEVMRIFee } from './prepareTransactionFromAddressEVMRIFee';
import { PrepareTransactionFromAddressEVMRIValue } from './prepareTransactionFromAddressEVMRIValue';
export declare class PrepareTransactionFromAddressEVMRI {
    'inputData': string;
    'nonce': number;
    'recipient': string;
    'sender': string;
    'sighash': string;
    'value': PrepareTransactionFromAddressEVMRIValue;
    'fee': PrepareTransactionFromAddressEVMRIFee;
    'gasLimit': number;
    'type': PrepareTransactionFromAddressEVMRI.TypeEnum;
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
export declare namespace PrepareTransactionFromAddressEVMRI {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
