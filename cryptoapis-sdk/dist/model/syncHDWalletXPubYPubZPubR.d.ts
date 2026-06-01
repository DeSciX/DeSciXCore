import { SyncHDWalletXPubYPubZPubRData } from './syncHDWalletXPubYPubZPubRData';
export declare class SyncHDWalletXPubYPubZPubR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': SyncHDWalletXPubYPubZPubRData;
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
