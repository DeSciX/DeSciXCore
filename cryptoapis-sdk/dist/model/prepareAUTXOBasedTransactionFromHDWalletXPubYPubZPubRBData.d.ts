import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBData {
    'item': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem;
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
