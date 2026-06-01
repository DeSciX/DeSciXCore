export declare class GetTransactionDetailsByTransactionHashSolanaRINativeBalanceChangesInner {
    'address': string;
    'after': string;
    'before': string;
    'change': string;
    'type'?: string;
    'unit': string;
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
