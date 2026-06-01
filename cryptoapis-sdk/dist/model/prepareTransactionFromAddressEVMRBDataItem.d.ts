import { PrepareTransactionFromAddressEVMRBDataItemFee } from './prepareTransactionFromAddressEVMRBDataItemFee';
export declare class PrepareTransactionFromAddressEVMRBDataItem {
    'additionalData'?: string;
    'amount': string;
    'nonce'?: string;
    'recipient': string;
    'sender': string;
    'fee': PrepareTransactionFromAddressEVMRBDataItemFee;
    'type'?: PrepareTransactionFromAddressEVMRBDataItem.TypeEnum;
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
export declare namespace PrepareTransactionFromAddressEVMRBDataItem {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
