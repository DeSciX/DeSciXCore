import { SyncHDWalletXPubYPubZPubE403 } from './syncHDWalletXPubYPubZPubE403';
export declare class SyncHDWalletXPubYPubZPub403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncHDWalletXPubYPubZPubE403;
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
