import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBCVoutInner } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBCVoutInner';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBC {
    'vout': Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBCVoutInner>;
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
