export declare class DeriveAndSyncNewReceivingAddressesXRPRI {
    'address': string;
    'derivationType': DeriveAndSyncNewReceivingAddressesXRPRI.DerivationTypeEnum;
    'format': string;
    'index': number;
    'type': DeriveAndSyncNewReceivingAddressesXRPRI.TypeEnum;
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
export declare namespace DeriveAndSyncNewReceivingAddressesXRPRI {
    enum DerivationTypeEnum {
        Account,
        Bip32
    }
    enum TypeEnum {
        Change
    }
}
