import { PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIFee } from './prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIFee';
import { PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIValue } from './prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIValue';
export declare class PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI {
    'derivationIndex': number;
    'fee': PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIFee;
    'gasLimit': number;
    'gasPrice': number;
    'inputData': string;
    'nonce': number;
    'recipient': string;
    'sender': string;
    'sigHash': string;
    'value': PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRIValue;
    'type': PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI.TypeEnum;
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
export declare namespace PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRI {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
