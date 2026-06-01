export declare class PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee {
    'exactAmount'?: string;
    'priority'?: PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee.PriorityEnum;
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
export declare namespace PrepareATransactionFromAnAddressInHDWalletXPubYPubZPubEVMRBDataItemFee {
    enum PriorityEnum {
        Slow,
        Standard,
        Fast
    }
}
