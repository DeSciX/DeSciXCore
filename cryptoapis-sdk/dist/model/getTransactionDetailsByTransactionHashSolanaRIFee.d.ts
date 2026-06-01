export declare class GetTransactionDetailsByTransactionHashSolanaRIFee {
    'amount': string;
    'unit': GetTransactionDetailsByTransactionHashSolanaRIFee.UnitEnum;
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
export declare namespace GetTransactionDetailsByTransactionHashSolanaRIFee {
    enum UnitEnum {
        Sol
    }
}
