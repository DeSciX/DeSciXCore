export declare class ListHDWalletXPubYPubZPubTransactionsEVMRIRecipientInner {
    'address': string;
    'amount': string;
    'isMember': boolean;
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
