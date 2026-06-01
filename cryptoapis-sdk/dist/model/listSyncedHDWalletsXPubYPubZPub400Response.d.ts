import { ListSyncedHDWalletsXPubYPubZPubE400 } from './listSyncedHDWalletsXPubYPubZPubE400';
export declare class ListSyncedHDWalletsXPubYPubZPub400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListSyncedHDWalletsXPubYPubZPubE400;
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
