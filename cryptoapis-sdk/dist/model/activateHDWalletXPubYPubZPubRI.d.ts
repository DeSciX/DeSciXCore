export declare class ActivateHDWalletXPubYPubZPubRI {
    'blockchain': string;
    'extendedPublicKey': string;
    'isActive': boolean;
    'network': string;
    'syncStatus': string;
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
