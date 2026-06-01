export declare class ActivateBlockchainEventSubscriptionRI {
    'address': string;
    'blockchain': string;
    'callbackSecretKey': string;
    'callbackUrl': string;
    'confirmationsCount': number;
    'createdTimestamp': number;
    'eventType': string;
    'isActive': boolean;
    'network': string;
    'referenceId': string;
    'transactionId': string;
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
