import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE403 } from './deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE403';
export declare class DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE403;
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
