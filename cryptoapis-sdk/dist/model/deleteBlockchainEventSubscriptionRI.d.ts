export declare class DeleteBlockchainEventSubscriptionRI {
    'callbackSecretKey': string;
    'callbackUrl': string;
    'createdTimestamp': number;
    'eventType': string;
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
