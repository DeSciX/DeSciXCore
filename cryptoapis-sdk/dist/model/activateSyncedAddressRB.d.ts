import { SyncHDWalletXPubYPubZPubRBData } from './syncHDWalletXPubYPubZPubRBData';
export declare class ActivateSyncedAddressRB {
    'context'?: string;
    'data': SyncHDWalletXPubYPubZPubRBData;
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
