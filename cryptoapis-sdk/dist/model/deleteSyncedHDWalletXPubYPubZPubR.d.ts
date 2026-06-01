import { DeleteSyncedHDWalletXPubYPubZPubRData } from './deleteSyncedHDWalletXPubYPubZPubRData';
export declare class DeleteSyncedHDWalletXPubYPubZPubR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeleteSyncedHDWalletXPubYPubZPubRData;
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
