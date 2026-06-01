import { DeleteSyncedHDWalletXPubYPubZPubE401 } from './deleteSyncedHDWalletXPubYPubZPubE401';
export declare class DeleteSyncedHDWalletXPubYPubZPub401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteSyncedHDWalletXPubYPubZPubE401;
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
