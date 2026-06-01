export declare class GetHDWalletXPubYPubZPubDetailsUTXORI {
    'confirmedBalance': string;
    'totalReceived': string;
    'totalSpent': string;
    'unit': string;
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
