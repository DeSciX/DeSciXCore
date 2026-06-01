import { ListSyncedHDWalletsXPubYPubZPubRData } from './listSyncedHDWalletsXPubYPubZPubRData';
export declare class ListSyncedHDWalletsXPubYPubZPubR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListSyncedHDWalletsXPubYPubZPubRData;
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
