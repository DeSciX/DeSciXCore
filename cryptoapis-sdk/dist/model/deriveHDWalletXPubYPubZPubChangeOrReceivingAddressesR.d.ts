import { DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRData } from './deriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRData';
export declare class DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeriveHDWalletXPubYPubZPubChangeOrReceivingAddressesRData;
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
