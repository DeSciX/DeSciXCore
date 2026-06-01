import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFee } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFee';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFeePerByte } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFeePerByte';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIOutputsInner } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIOutputsInner';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRI {
    'additionalData': string;
    'locktime': number;
    'size': number;
    'version': number;
    'fee': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFee;
    'feePerByte': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIFeePerByte;
    'inputs': Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner>;
    'outputs': Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIOutputsInner>;
    'blockchainSpecific'?: PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBS;
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
