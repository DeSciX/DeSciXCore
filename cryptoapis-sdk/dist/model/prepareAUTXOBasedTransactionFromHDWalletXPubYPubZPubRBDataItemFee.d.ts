export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee {
    'address'?: string;
    'exactAmount'?: string;
    'priority'?: PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee.PriorityEnum;
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
export declare namespace PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRBDataItemFee {
    enum PriorityEnum {
        Slow,
        Standard,
        Fast
    }
}
