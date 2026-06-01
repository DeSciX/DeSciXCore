import { DeleteSyncedAddressE400 } from './deleteSyncedAddressE400';
export declare class DeleteSyncedAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeleteSyncedAddressE400;
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
