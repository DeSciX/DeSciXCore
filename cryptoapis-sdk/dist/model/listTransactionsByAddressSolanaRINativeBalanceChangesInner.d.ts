export declare class ListTransactionsByAddressSolanaRINativeBalanceChangesInner {
    'address': string;
    'after': string;
    'before': string;
    'change': string;
    'type'?: ListTransactionsByAddressSolanaRINativeBalanceChangesInner.TypeEnum;
    'unit': ListTransactionsByAddressSolanaRINativeBalanceChangesInner.UnitEnum;
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
export declare namespace ListTransactionsByAddressSolanaRINativeBalanceChangesInner {
    enum TypeEnum {
        Native
    }
    enum UnitEnum {
        Sol
    }
}
