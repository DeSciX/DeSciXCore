import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRIAddressesInner } from './deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRIAddressesInner';
export declare class DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRI {
    'addresses': Array<DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRIAddressesInner>;
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
