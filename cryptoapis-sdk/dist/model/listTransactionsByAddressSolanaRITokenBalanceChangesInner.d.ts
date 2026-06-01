export declare class ListTransactionsByAddressSolanaRITokenBalanceChangesInner {
    'address': string;
    'after': string;
    'before': string;
    'change': string;
    'contractAddress': string;
    'tokenAddress': string;
    'type'?: ListTransactionsByAddressSolanaRITokenBalanceChangesInner.TypeEnum;
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
export declare namespace ListTransactionsByAddressSolanaRITokenBalanceChangesInner {
    enum TypeEnum {
        Spl
    }
}
