export declare class AddressTokensTransactionConfirmedEachConfirmationTrc721 {
    'name': string;
    'symbol': string;
    'tokenId': string;
    'contractAddress': string;
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
