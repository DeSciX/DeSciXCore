export declare class AddressTokensTransactionConfirmedOmni {
    'name': string;
    'propertyId': string;
    'transactionType': string;
    'createdByTransactionId': string;
    'amount': string;
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
