export declare class AddressTokensTransactionConfirmedEachConfirmationTrc20 {
    'name': string;
    'symbol': string;
    'decimals'?: string;
    'amount': string;
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
