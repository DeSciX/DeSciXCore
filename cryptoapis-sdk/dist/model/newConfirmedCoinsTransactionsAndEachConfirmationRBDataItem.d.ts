export declare class NewConfirmedCoinsTransactionsAndEachConfirmationRBDataItem {
    'address': string;
    'allowDuplicates'?: boolean;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
    'confirmationsCount': number;
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
