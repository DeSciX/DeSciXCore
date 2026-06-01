import { SyncHDWalletXPubYPubZPubE409 } from './syncHDWalletXPubYPubZPubE409';
export declare class SyncHDWalletXPubYPubZPub409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncHDWalletXPubYPubZPubE409;
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
