export declare class NewConfirmedInternalTransactionsRI {
    'address': string;
    'callbackSecretKey': string;
    'callbackUrl': string;
    'createdTimestamp': number;
    'eventType': string;
    'isActive': boolean;
    'receiveCallbackOn': number;
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
