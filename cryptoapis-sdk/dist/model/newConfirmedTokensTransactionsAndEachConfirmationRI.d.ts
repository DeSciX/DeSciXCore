export declare class NewConfirmedTokensTransactionsAndEachConfirmationRI {
    'address': string;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
    'confirmationsCount'?: number;
    'createdTimestamp': number;
    'eventType': string;
    'isActive': boolean;
    'referenceId': string;
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
