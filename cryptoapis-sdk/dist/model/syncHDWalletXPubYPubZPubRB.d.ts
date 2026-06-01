import { SyncHDWalletXPubYPubZPubRBData } from './syncHDWalletXPubYPubZPubRBData';
export declare class SyncHDWalletXPubYPubZPubRB {
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
