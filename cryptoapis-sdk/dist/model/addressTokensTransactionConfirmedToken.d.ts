export declare class AddressTokensTransactionConfirmedToken {
    'name': string;
    'symbol': string;
    'decimals'?: string;
    'amount': string;
    'contractAddress': string;
    'tokenId': string;
    'propertyId': string;
    'transactionType': string;
    'createdByTransactionId': string;
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
