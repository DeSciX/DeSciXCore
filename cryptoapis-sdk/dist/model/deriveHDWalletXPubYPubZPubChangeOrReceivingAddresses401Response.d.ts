import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE401 } from './deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE401';
export declare class DeriveHDWalletXPubYPubZPubChangeOrReceivingAddresses401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesE401;
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
