export declare class DeriveAndSyncNewReceivingAddressesEVMRI {
    'address': string;
    'format': string;
    'index': number;
    'derivationType': DeriveAndSyncNewReceivingAddressesEVMRI.DerivationTypeEnum;
    'type': DeriveAndSyncNewReceivingAddressesEVMRI.TypeEnum;
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
export declare namespace DeriveAndSyncNewReceivingAddressesEVMRI {
    enum DerivationTypeEnum {
        Account,
        Bip32
    }
    enum TypeEnum {
        Change
    }
}
