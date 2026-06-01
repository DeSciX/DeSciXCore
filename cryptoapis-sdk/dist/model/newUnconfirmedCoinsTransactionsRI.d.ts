export declare class NewUnconfirmedCoinsTransactionsRI {
    'address': string;
    'callbackSecretKey': string;
    'callbackUrl': string;
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
