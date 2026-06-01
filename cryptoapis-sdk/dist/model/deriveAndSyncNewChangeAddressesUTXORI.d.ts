export declare class DeriveAndSyncNewChangeAddressesUTXORI {
    'address': string;
    'format': string;
    'index': number;
    'derivationType': DeriveAndSyncNewChangeAddressesUTXORI.DerivationTypeEnum;
    'type': DeriveAndSyncNewChangeAddressesUTXORI.TypeEnum;
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
export declare namespace DeriveAndSyncNewChangeAddressesUTXORI {
    enum DerivationTypeEnum {
        Account,
        Bip32
    }
    enum TypeEnum {
        Change
    }
}
