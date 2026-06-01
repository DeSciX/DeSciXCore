export declare class NewUnconfirmedCoinsTransactionsRBDataItem {
    'address': string;
    'allowDuplicates'?: boolean;
    'callbackSecretKey'?: string;
    'callbackUrl': string;
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
