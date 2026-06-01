import { DeleteSyncedHDWalletXPubYPubZPubE400 } from './deleteSyncedHDWalletXPubYPubZPubE400';
export declare class DeleteSyncedHDWalletXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteSyncedHDWalletXPubYPubZPubE400;
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
