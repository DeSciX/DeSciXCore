export declare class PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee {
    'exactAmount': string;
    'priority': PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum;
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
export declare namespace PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee {
    enum PriorityEnum {
        Slow,
        Standard,
        Fast
    }
}
