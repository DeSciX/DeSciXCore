import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee';
import { PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemRecipientsInner } from './prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemRecipientsInner';
export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem {
    'additionalData'?: string;
    'locktime'?: number;
    'fee': PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee;
    'prepareStrategy'?: PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem.PrepareStrategyEnum;
    'recipients': Array<PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemRecipientsInner>;
    'replaceable'?: boolean;
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
export declare namespace PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItem {
    enum PrepareStrategyEnum {
        None,
        MinimizeDust,
        OptimizeSize
    }
}
