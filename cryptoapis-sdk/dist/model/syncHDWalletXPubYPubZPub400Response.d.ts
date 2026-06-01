import { SyncHDWalletXPubYPubZPubE400 } from './syncHDWalletXPubYPubZPubE400';
export declare class SyncHDWalletXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncHDWalletXPubYPubZPubE400;
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
