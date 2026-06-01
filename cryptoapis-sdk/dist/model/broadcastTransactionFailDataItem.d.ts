export declare class BroadcastTransactionFailDataItem {
    'blockchain': string;
    'network': string;
    'transactionId': string;
    'errorMessage': string;
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
