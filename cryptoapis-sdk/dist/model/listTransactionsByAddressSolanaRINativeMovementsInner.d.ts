export declare class ListTransactionsByAddressSolanaRINativeMovementsInner {
    'amount': string;
    'recipientAddress': string;
    'senderAddress': string;
    'unit': ListTransactionsByAddressSolanaRINativeMovementsInner.UnitEnum;
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
export declare namespace ListTransactionsByAddressSolanaRINativeMovementsInner {
    enum UnitEnum {
        Sol
    }
}
