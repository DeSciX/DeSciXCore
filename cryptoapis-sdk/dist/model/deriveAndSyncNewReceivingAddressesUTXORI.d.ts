export declare class DeriveAndSyncNewReceivingAddressesUTXORI {
    'address': string;
    'format': string;
    'index': number;
    'derivationType': DeriveAndSyncNewReceivingAddressesUTXORI.DerivationTypeEnum;
    'type': DeriveAndSyncNewReceivingAddressesUTXORI.TypeEnum;
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
export declare namespace DeriveAndSyncNewReceivingAddressesUTXORI {
    enum DerivationTypeEnum {
        Account,
        Bip32
    }
    enum TypeEnum {
        Change
    }
}
