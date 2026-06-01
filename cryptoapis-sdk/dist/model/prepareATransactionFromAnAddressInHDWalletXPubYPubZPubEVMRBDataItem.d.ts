import { PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee } from './prepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee';
export declare class PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem {
    'additionalData'?: string;
    'amount': string;
    'nonce'?: string;
    'recipient': string;
    'sender': string;
    'fee': PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee;
    'transactionType'?: PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem.TransactionTypeEnum;
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
export declare namespace PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItem {
    enum TransactionTypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
