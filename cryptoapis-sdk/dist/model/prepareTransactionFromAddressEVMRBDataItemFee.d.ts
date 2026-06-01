export declare class PrepareTransactionFromAddressEVMRBDataItemFee {
    'exactAmount'?: string;
    'priority': PrepareTransactionFromAddressEVMRBDataItemFee.PriorityEnum;
    'substractFromAmount'?: boolean;
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
export declare namespace PrepareTransactionFromAddressEVMRBDataItemFee {
    enum PriorityEnum {
        Slow,
        Standard,
        Fast
    }
}
