import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE400 } from './deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE400';
export declare class DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE400;
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
