export declare class NewConfirmedInternalTransactionsRBDataItem {
    'address': string;
    'allowDuplicates'?: boolean;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
    'receiveCallbackOn'?: number;
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
