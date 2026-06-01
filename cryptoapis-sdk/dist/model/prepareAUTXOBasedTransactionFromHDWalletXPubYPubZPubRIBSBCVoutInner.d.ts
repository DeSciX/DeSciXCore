export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIBSBCVoutInner {
    'address': string;
    'satoshis': number;
    'script': string;
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
