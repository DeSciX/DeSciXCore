import { SyncHDWalletXPubYPubZPubE401 } from './syncHDWalletXPubYPubZPubE401';
export declare class SyncHDWalletXPubYPubZPub401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncHDWalletXPubYPubZPubE401;
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
