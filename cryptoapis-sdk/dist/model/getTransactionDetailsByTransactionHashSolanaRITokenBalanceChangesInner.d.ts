export declare class GetTransactionDetailsByTransactionHashSolanaRITokenBalanceChangesInner {
    'address'?: string;
    'after': string;
    'before': string;
    'change': string;
    'contractAddress': string;
    'tokenAddress': string;
    'type'?: string;
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
