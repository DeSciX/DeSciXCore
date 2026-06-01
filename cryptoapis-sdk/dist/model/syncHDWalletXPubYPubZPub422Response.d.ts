import { SyncHDWalletXPubYPubZPubE422 } from './syncHDWalletXPubYPubZPubE422';
export declare class SyncHDWalletXPubYPubZPub422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': SyncHDWalletXPubYPubZPubE422;
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
