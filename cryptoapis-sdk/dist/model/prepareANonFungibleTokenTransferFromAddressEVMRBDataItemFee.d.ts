export declare class PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee {
    'exactAmount'?: string;
    'priority': PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee.PriorityEnum;
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
export declare namespace PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee {
    enum PriorityEnum {
        Slow,
        Standard,
        Fast
    }
}
