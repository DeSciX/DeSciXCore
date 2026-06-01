export declare class PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRIInputsInner {
    'address': string;
    'change': number;
    'derivationIndex': number;
    'outputIndex': number;
    'satoshis': number;
    'script': string;
    'sighash': string;
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
