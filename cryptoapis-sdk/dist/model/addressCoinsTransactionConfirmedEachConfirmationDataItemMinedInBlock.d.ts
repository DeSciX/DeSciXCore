export declare class AddressCoinsTransactionConfirmedEachConfirmationDataItemMinedInBlock {
    'height': number;
    'hash': string;
    'timestamp': number;
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
